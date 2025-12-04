import fastf1
import pandas as pd
import numpy as np
import os
import joblib
import json
import logging
import time
from tqdm import tqdm
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
import warnings

# ==========================================
# ⚙️ CONFIGURACIÓN DE RUTAS (Backend Fix)
# ==========================================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR) # Subir a 'backend'
DIRS = {
    'cache': os.path.join(BACKEND_DIR, 'f1_cache'),
    'models': os.path.join(BACKEND_DIR, 'models'),
    'logs': os.path.join(BACKEND_DIR, 'logs'),
    'data': os.path.join(BACKEND_DIR, 'data'),
    'processed': os.path.join(BACKEND_DIR, 'data', 'processed')
}

for key, path in DIRS.items():
    os.makedirs(path, exist_ok=True)

# Configuración Logger
logger = logging.getLogger('F1_Pipeline')
logger.setLevel(logging.DEBUG)
fh = logging.FileHandler(os.path.join(DIRS['logs'], 'pipeline.log'), mode='w', encoding='utf-8')
fh.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(fh)

# Configuración FastF1
warnings.filterwarnings('ignore')
try:
    fastf1.Cache.enable_cache(DIRS['cache'])
except:
    pass
logging.getLogger('fastf1').setLevel(logging.ERROR)

# --- CONFIGURACIÓN DE AÑOS A FORZAR ---
# Ponemos 2023 y 2024 para rellenar lo que falta.
# Si quieres re-entrenar con todo luego, puedes poner 2022 aquí de nuevo.
START_YEAR = 2025 
END_YEAR = 2025

# ==========================================
# 📚 CLASES
# ==========================================

class DriverRegistry:
    def __init__(self):
        self.registry_path = os.path.join(DIRS['data'], 'drivers_metadata.json')
        self.drivers = {}
        if os.path.exists(self.registry_path):
            try:
                with open(self.registry_path, 'r', encoding='utf-8') as f:
                    self.drivers = json.load(f)
            except: self.drivers = {}

    def update(self, code, full_name, team_name, year):
        if code not in self.drivers:
            self.drivers[code] = {'id': code, 'name': full_name, 'current_team': team_name, 'last_seen': year}
        else:
            if year >= self.drivers[code].get('last_seen', 0):
                self.drivers[code]['current_team'] = team_name
                self.drivers[code]['last_seen'] = year

    def save(self):
        with open(self.registry_path, 'w', encoding='utf-8') as f:
            json.dump(self.drivers, f, indent=4)

class HistoricalIngestor:
    def __init__(self, registry):
        self.registry = registry

    def get_schedule_safe(self, year):
        """Intento robusto de descargar calendario."""
        for i in range(3):
            try: 
                return fastf1.get_event_schedule(year)
            except Exception as e: 
                logger.warning(f"Reintentando calendario {year} ({i+1}/3)...")
                time.sleep(5)
        return pd.DataFrame()

    def process_season(self, year):
        schedule = self.get_schedule_safe(year)
        if schedule.empty: 
            logger.error(f"No se pudo descargar calendario {year}")
            return

        try: 
            # Filtrar solo eventos que ya han ocurrido
            events = schedule[schedule['EventDate'] < pd.Timestamp.now()]
        except: 
            events = schedule

        if events.empty: return

        print(f"📥 Descargando Temporada {year} ({len(events)} carreras)...")
        
        # Iteramos por cada Gran Premio
        pbar = tqdm(events.iterrows(), total=len(events), desc=f"  🗓️  Temp {year}", unit="GP", leave=False)
        
        for _, event in pbar:
            pbar.set_postfix(GP=event['EventName'][:15])
            
            # --- PAUSA ANTI-BLOQUEO (CRÍTICO) ---
            # Esperamos 5 segundos entre cada GP para no saturar la API
            time.sleep(5) 

            # Metadata (Solo intentamos una vez con carrera)
            try:
                r_session = fastf1.get_session(year, event['EventName'], 'R')
                r_session.load(laps=False, telemetry=False, weather=False, messages=False)
                if hasattr(r_session, 'results'):
                    for _, row in r_session.results.iterrows():
                        self.registry.update(row['Abbreviation'], row['FullName'], row['TeamName'], year)
            except: pass

            # Datos de Sesiones (FP2, Sprint, R)
            for identifier in ['FP2', 'Sprint', 'R']:
                try:
                    session = fastf1.get_session(year, event['EventName'], identifier)
                    
                    # Carga completa
                    session.load(laps=True, telemetry=False, weather=True, messages=False)
                    
                    # Extracción segura de clima
                    track, air = 35.0, 25.0
                    try:
                        w = getattr(session, 'weather_data', getattr(session, 'weather', None))
                        if w is not None and not w.empty:
                            track = w['TrackTemp'].mean()
                            air = w['AirTemp'].mean()
                    except: pass

                    if not hasattr(session, 'laps'): continue

                    # Procesar cada piloto
                    for driver in session.laps['Driver'].unique():
                        try:
                            laps = session.laps.pick_driver(driver)
                            # Filtros de calidad
                            laps = laps[laps['IsAccurate'] == True]
                            laps = laps[~laps['Compound'].isin(['UNKNOWN', 'TEST', 'MIXED'])]
                            
                            if laps.empty: continue

                            # Crear DataFrame limpio
                            df_save = pd.DataFrame({
                                'LapTimeSec': laps['LapTime'].dt.total_seconds(),
                                'RaceLapNumber': laps['LapNumber'],
                                'TyreLife': laps['TyreLife'],
                                'Compound': laps['Compound'],
                                'Stint': laps['Stint'],
                                'Driver': driver,
                                'Year': year,
                                'Circuit': event['EventName'], 
                                'SessionType': identifier,
                                'TrackTemp': track,
                                'AirTemp': air,
                                'IsFreshTyre': laps['FreshTyre'].astype(bool).astype(int) if 'FreshTyre' in laps.columns else 1,
                                'TopSpeed': laps['SpeedST'].fillna(laps['SpeedST'].mean()) if 'SpeedST' in laps.columns else np.nan
                            })

                            # Guardar (Append mode)
                            filename = os.path.join(DIRS['processed'], f"{driver}.csv")
                            header = not os.path.exists(filename)
                            df_save.to_csv(filename, mode='a', header=header, index=False)
                        except: continue
                except Exception as e: 
                    logger.debug(f"Error sesión {identifier}: {e}")
                    continue

class BulkTrainer:
    def __init__(self):
        self.circuit_encoder = LabelEncoder()
        self.compound_encoder = LabelEncoder()

    def train_all(self):
        files = [f for f in os.listdir(DIRS['processed']) if f.endswith('.csv')]
        if not files:
            print(f"❌ No hay datos en {DIRS['processed']}")
            return

        print(f"🧠 Entrenando modelos para {len(files)} pilotos...")
        pbar = tqdm(files, desc="Training", unit="driver", colour='green')
        
        for file in pbar:
            driver_code = file.replace('.csv', '')
            pbar.set_postfix(Driver=driver_code)

            try:
                df = pd.read_csv(os.path.join(DIRS['processed'], file))
                df = df.dropna(subset=['LapTimeSec', 'TyreLife'])
                if len(df) < 50: continue

                # Extrapolación Hard
                if 'HARD' not in df['Compound'].unique() and 'MEDIUM' in df['Compound'].unique():
                    syn = df[df['Compound'] == 'MEDIUM'].copy()
                    syn['Compound'] = 'HARD'
                    syn['LapTimeSec'] += 0.8
                    syn['TyreLife'] = syn['TyreLife'] * 0.8
                    df = pd.concat([df, syn], ignore_index=True)

                # Pesos
                stint_meta = df.groupby(['Year', 'Circuit', 'SessionType', 'Stint'])['RaceLapNumber'].count().reset_index()
                stint_meta.rename(columns={'RaceLapNumber': 'StintLength'}, inplace=True)
                df = df.merge(stint_meta, on=['Year', 'Circuit', 'SessionType', 'Stint'], how='left')
                df['SampleWeight'] = df['StintLength'].apply(lambda x: x if x > 3 else 0.5)

                # Encoders
                df['TopSpeed'] = df['TopSpeed'].fillna(df['TopSpeed'].mean())
                df['Circuit'] = df['Circuit'].astype(str)
                df['Compound'] = df['Compound'].astype(str)
                
                df['Circuit_Enc'] = self.circuit_encoder.fit_transform(df['Circuit'])
                df['Compound_Enc'] = self.compound_encoder.fit_transform(df['Compound'])

                features = ['TyreLife', 'RaceLapNumber', 'Compound_Enc', 'Circuit_Enc', 
                            'TrackTemp', 'AirTemp', 'IsFreshTyre', 'TopSpeed']
                
                model = GradientBoostingRegressor(n_estimators=200, learning_rate=0.1, max_depth=4, random_state=42)
                model.fit(df[features], df['LapTimeSec'], sample_weight=df['SampleWeight'])

                pkg = {
                    'model': model,
                    'circuit_encoder': self.circuit_encoder,
                    'compound_encoder': self.compound_encoder,
                    'features': features,
                    'driver': driver_code
                }
                joblib.dump(pkg, os.path.join(DIRS['models'], f'{driver_code}_pkg.pkl'))

            except Exception as e:
                logger.error(f"Error entrenando {driver_code}: {e}")
                continue

if __name__ == "__main__":
    print(f"\n🏎️  F1 PIPELINE | FORCE UPDATE: {START_YEAR}-{END_YEAR} 🏎️")
    print(f"📂 Backend: {BACKEND_DIR}")
    
    registry = DriverRegistry()
    ingestor = HistoricalIngestor(registry)
    
    print("📡 Iniciando descarga forzada (Modo Seguro)...")
    
    # Bucle de años con pausa larga entre temporadas
    for year in range(START_YEAR, END_YEAR + 1):
        ingestor.process_season(year)
        print(f"⏸️  Pausa de seguridad de 10s entre temporadas...")
        time.sleep(10) # Pausa larga entre años
        
    registry.save()

    print("\n🧠 Re-entrenando modelos con los nuevos datos...")
    trainer = BulkTrainer()
    trainer.train_all()
    
    print(f"\n✨ Proceso finalizado. Modelos actualizados en: {DIRS['models']}")