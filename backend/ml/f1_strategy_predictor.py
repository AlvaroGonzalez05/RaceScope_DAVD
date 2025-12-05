import pandas as pd
import numpy as np
import joblib
import os
import fastf1
import json
import sys
import warnings
from itertools import product

# FIX MATPLOTLIB PARA SERVIDORES
import matplotlib
matplotlib.use('Agg') 
import matplotlib.pyplot as plt

# ==========================================
# ⚙️ CONFIGURACIÓN
# ==========================================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)

DIRS = {
    'models': os.path.join(BACKEND_DIR, 'models'),
    'cache': os.path.join(BACKEND_DIR, 'f1_cache'),
    'data': os.path.join(BACKEND_DIR, 'data'),
    'output': os.path.join(BACKEND_DIR, 'public', 'strategies'),
    'maps': os.path.join(BACKEND_DIR, 'public', 'maps')
}

for d in DIRS.values(): os.makedirs(d, exist_ok=True)

warnings.filterwarnings('ignore')
try: fastf1.Cache.enable_cache(DIRS['cache'])
except: pass

plt.style.use('dark_background')

# --- BASE DE DATOS TÉCNICA INTELIGENTE ---
CIRCUIT_DB = {
    'bahrain': {'deg': 'HIGH', 'downforce': 'MEDIUM', 'overtake': 'EASY'},
    'saudi':   {'deg': 'MEDIUM', 'downforce': 'LOW', 'overtake': 'MEDIUM'},
    'austral': {'deg': 'MEDIUM', 'downforce': 'HIGH', 'overtake': 'HARD'},
    'azerba':  {'deg': 'LOW', 'downforce': 'LOW', 'overtake': 'EASY'},
    'miami':   {'deg': 'MEDIUM', 'downforce': 'MEDIUM', 'overtake': 'MEDIUM'},
    'monaco':  {'deg': 'LOW', 'downforce': 'MAXIMUM', 'overtake': 'IMPOSSIBLE'},
    'spain':   {'deg': 'HIGH', 'downforce': 'HIGH', 'overtake': 'MEDIUM'},
    'spani':   {'deg': 'HIGH', 'downforce': 'HIGH', 'overtake': 'MEDIUM'},
    'canad':   {'deg': 'MEDIUM', 'downforce': 'LOW', 'overtake': 'EASY'},
    'austri':  {'deg': 'HIGH', 'downforce': 'MEDIUM', 'overtake': 'EASY'},
    'brit':    {'deg': 'HIGH', 'downforce': 'HIGH', 'overtake': 'HARD'},
    'silver':  {'deg': 'HIGH', 'downforce': 'HIGH', 'overtake': 'HARD'},
    'hungar':  {'deg': 'MEDIUM', 'downforce': 'MAXIMUM', 'overtake': 'HARD'},
    'belgi':   {'deg': 'HIGH', 'downforce': 'LOW', 'overtake': 'EASY'},
    'spa':     {'deg': 'HIGH', 'downforce': 'LOW', 'overtake': 'EASY'},
    'dutch':   {'deg': 'HIGH', 'downforce': 'HIGH', 'overtake': 'HARD'},
    'nether':  {'deg': 'HIGH', 'downforce': 'HIGH', 'overtake': 'HARD'},
    'ital':    {'deg': 'LOW', 'downforce': 'MINIMUM', 'overtake': 'EASY'},
    'monza':   {'deg': 'LOW', 'downforce': 'MINIMUM', 'overtake': 'EASY'},
    'singap':  {'deg': 'HIGH', 'downforce': 'MAXIMUM', 'overtake': 'HARD'},
    'japan':   {'deg': 'HIGH', 'downforce': 'HIGH', 'overtake': 'MEDIUM'},
    'suzuka':  {'deg': 'HIGH', 'downforce': 'HIGH', 'overtake': 'MEDIUM'},
    'qatar':   {'deg': 'HIGH', 'downforce': 'HIGH', 'overtake': 'MEDIUM'},
    'austin':  {'deg': 'MEDIUM', 'downforce': 'HIGH', 'overtake': 'EASY'},
    'united':  {'deg': 'MEDIUM', 'downforce': 'HIGH', 'overtake': 'EASY'},
    'mexic':   {'deg': 'MEDIUM', 'downforce': 'MAXIMUM', 'overtake': 'MEDIUM'},
    'brazil':  {'deg': 'MEDIUM', 'downforce': 'MEDIUM', 'overtake': 'EASY'},
    'paulo':   {'deg': 'MEDIUM', 'downforce': 'MEDIUM', 'overtake': 'EASY'},
    'vegas':   {'deg': 'LOW', 'downforce': 'LOW', 'overtake': 'EASY'},
    'dhabi':   {'deg': 'MEDIUM', 'downforce': 'MEDIUM', 'overtake': 'HARD'}
}

# Reglas
LAUNCH_PENALTY = {'SOFT': 0.0, 'MEDIUM': 1.5, 'HARD': 4.0}
TYRE_LIMIT_PCT = {'SOFT': 0.35, 'MEDIUM': 0.60, 'HARD': 0.75}
COMPOUND_RANK = {'SOFT': 1, 'MEDIUM': 2, 'HARD': 3}
MULTI_STOP_BIAS = 4.0

class RaceContextManager:
    def __init__(self):
        self.path = os.path.join(DIRS['data'], 'race_contexts.json')
        self.data = self._load()
    def _load(self):
        if os.path.exists(self.path):
            try: return json.load(open(self.path, 'r'))
            except: return {}
        return {}
    def save_context(self, gp_name, year, data):
        key = f"{year}_{gp_name}"
        self.data[key] = data
        try: json.dump(self.data, open(self.path, 'w'), indent=4)
        except: pass
    def get_context(self, gp_name, year):
        return self.data.get(f"{year}_{gp_name}")

class StrategySimulator:
    def __init__(self, driver_code, gp_name, year):
        self.driver = driver_code
        self.gp_name = gp_name
        self.year = int(year)
        self.mgr = RaceContextManager()
        self.pkg = self._load_model()
        self.ctx = self._get_race_context()

    def _load_model(self):
        path = os.path.join(DIRS['models'], f'{self.driver}_pkg.pkl')
        if not os.path.exists(path):
            raise FileNotFoundError(f"No existe modelo para {self.driver}")
        return joblib.load(path)

    def _generate_track_map(self, session, safe_gp_name):
        filename = f"{self.year}_{safe_gp_name}_Map.png"
        filepath = os.path.join(DIRS['maps'], filename)
        if os.path.exists(filepath): return f"/maps/{filename}"

        try:
            lap = session.laps.pick_fastest()
            tel = lap.get_telemetry()
            fig, ax = plt.subplots(figsize=(6, 4))
            ax.plot(tel['X'], tel['Y'], color='#ff3333', linewidth=3)
            ax.axis('off')
            fig.patch.set_facecolor('#1e1e1e')
            ax.set_facecolor('#1e1e1e')
            plt.tight_layout()
            plt.savefig(filepath, facecolor='#1e1e1e', dpi=100, bbox_inches='tight', pad_inches=0)
            plt.close(fig)
            return f"/maps/{filename}"
        except: return None

    def _get_enrichment_data(self, gp_name):
        name_lower = gp_name.lower()
        for key, val in CIRCUIT_DB.items():
            if key in name_lower: return val
        return {'deg': 'UNKNOWN', 'downforce': 'UNKNOWN', 'overtake': 'UNKNOWN'}

    def _get_race_context(self):
        # 1. Intentar cargar caché
        cached = self.mgr.get_context(self.gp_name, self.year)
        
        # 2. VALIDACIÓN DE CACHÉ (El fix importante)
        # Si la caché existe pero es vieja (no tiene map_url), la ignoramos y regeneramos
        if cached and 'map_url' in cached and 'tech_info' in cached:
            return cached

        # 3. Si no es válida, generamos de cero
        ctx = {'total_laps': 57, 'track_temp': 35.0, 'air_temp': 25.0, 
               'pit_loss': 22.5, 'circuit_name': self.gp_name, 'avg_top_speed': 300.0,
               'map_url': None, 'tech_info': self._get_enrichment_data(self.gp_name)}
        try:
            session = fastf1.get_session(self.year, self.gp_name, 'R')
            session.load(laps=True, telemetry=True, weather=True, messages=False)
            
            try:
                w = getattr(session, 'weather_data', getattr(session, 'weather', None))
                if w is not None and not w.empty:
                    ctx['track_temp'] = round(w['TrackTemp'].mean(), 1)
                    ctx['air_temp'] = round(w['AirTemp'].mean(), 1)
            except: pass
            
            try: ctx['total_laps'] = int(session.laps['LapNumber'].max())
            except: pass
            
            try:
                pit_laps = session.laps[session.laps['PitOutTime'].notna()]
                if not pit_laps.empty: ctx['pit_loss'] = 22.5
            except: pass
            
            try: ctx['circuit_name'] = session.event['EventName']
            except: pass
            
            safe_gp = self.gp_name.replace(' ', '_')
            ctx['map_url'] = self._generate_track_map(session, safe_gp)
            ctx['tech_info'] = self._get_enrichment_data(session.event['EventName'])

            self.mgr.save_context(self.gp_name, self.year, ctx)
            return ctx
        except: return ctx

    def predict_stint_time(self, compound, start_lap, length):
        model = self.pkg['model']
        c_enc = self.pkg['compound_encoder']
        circ_enc = self.pkg['circuit_encoder']
        try: c_val = c_enc.transform([str(compound)])[0]
        except: c_val = 0 
        try: circ_val = circ_enc.transform([str(self.ctx['circuit_name'])])[0]
        except: circ_val = 0 
        input_matrix = np.zeros((length, 8))
        input_matrix[:, 0] = np.arange(1, length + 1)
        input_matrix[:, 1] = np.arange(start_lap, start_lap + length)
        input_matrix[:, 2] = c_val
        input_matrix[:, 3] = circ_val
        input_matrix[:, 4] = self.ctx['track_temp']
        input_matrix[:, 5] = self.ctx['air_temp']
        input_matrix[:, 6] = 1
        input_matrix[:, 7] = self.ctx.get('avg_top_speed', 300)
        return np.sum(model.predict(input_matrix))

    def find_best_strategies(self):
        laps = self.ctx['total_laps']
        compounds = ['SOFT', 'MEDIUM', 'HARD']
        results = []
        max_lives = {k: int(laps * pct) for k, pct in TYRE_LIMIT_PCT.items()}

        for c1, c2 in product(compounds, repeat=2):
            if c1 == c2: continue
            if COMPOUND_RANK[c1] > COMPOUND_RANK[c2]: continue
            if max_lives[c1] + max_lives[c2] < laps: continue
            launch_cost = LAUNCH_PENALTY.get(c1, 0)
            start, end = max(5, laps - max_lives[c2]), min(max_lives[c1], laps - 5)
            for stop in range(start, end, 2):
                if stop > max_lives[c1] or (laps-stop) > max_lives[c2]: continue
                t1 = self.predict_stint_time(c1, 1, stop)
                t2 = self.predict_stint_time(c2, stop+1, laps-stop)
                results.append({'type': '1 Stop', 'compounds': [c1, c2], 'laps': [stop, laps-stop], 'stop_laps': [stop], 'total_time': t1+t2+self.ctx['pit_loss']+launch_cost})

        for c1, c2, c3 in product(compounds, repeat=3):
            if len(set([c1, c2, c3])) < 2: continue
            softest = min(COMPOUND_RANK[c1], COMPOUND_RANK[c2], COMPOUND_RANK[c3])
            if COMPOUND_RANK[c1] != softest: continue 
            if max_lives[c1] + max_lives[c2] + max_lives[c3] < laps: continue
            launch_cost = LAUNCH_PENALTY.get(c1, 0)
            for s1 in range(10, min(max_lives[c1], int(laps*0.5)), 3):
                limit_s2 = min(max_lives[c2], laps - s1 - 10)
                for len2 in range(10, limit_s2, 3):
                    len3 = laps - (s1 + len2)
                    if len3 > max_lives[c3] or len3 < 5: continue
                    t1 = self.predict_stint_time(c1, 1, s1)
                    t2 = self.predict_stint_time(c2, s1+1, len2)
                    t3 = self.predict_stint_time(c3, s1+len2+1, len3)
                    total = t1+t2+t3+(self.ctx['pit_loss']*2)+launch_cost+MULTI_STOP_BIAS
                    results.append({'type': '2 Stops', 'compounds': [c1, c2, c3], 'laps': [s1, len2, len3], 'stop_laps': [s1, s1+len2], 'total_time': total})

        results.sort(key=lambda x: x['total_time'])
        return results[:5]

    def plot_strategies(self, strategies): return ""

if __name__ == "__main__":
    try:
        if len(sys.argv) >= 4:
            DRIVER, GP, YEAR = sys.argv[1], sys.argv[2], sys.argv[3]
            sim = StrategySimulator(DRIVER, GP, YEAR)
            best = sim.find_best_strategies()
            response = {
                "driver": DRIVER, "gp": sim.ctx['circuit_name'], "year": YEAR,
                "circuit_info": {
                    "name": sim.ctx['circuit_name'], "location": GP,
                    "laps": sim.ctx['total_laps'], "track_temp": sim.ctx['track_temp'],
                    "air_temp": sim.ctx['air_temp'],
                    # Usamos .get() por seguridad para evitar KeyError si falló la generación
                    "map_url": sim.ctx.get('map_url'),
                    "tech": sim.ctx.get('tech_info', {'deg': 'UNK', 'downforce': 'UNK', 'overtake': 'UNK'})
                },
                "image_url": "", "strategies": []
            }
            for s in best:
                response["strategies"].append({
                    "type": s['type'], "compounds": s['compounds'], "laps": [int(x) for x in s['laps']], 
                    "stop_laps": [int(x) for x in s['stop_laps']], "total_time": float(s['total_time']),
                    "formatted_time": f"{int(s['total_time']//3600)}h {int((s['total_time']%3600)//60)}m {int(s['total_time']%60)}s"
                })
            print(json.dumps(response))
        else: print(json.dumps({"error": "Missing Args"}))
    except Exception as e: print(json.dumps({"error": str(e)}))