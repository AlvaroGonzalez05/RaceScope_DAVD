import pandas as pd
import numpy as np
import joblib
import os
import fastf1
import json
import sys
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from itertools import product
import warnings

# ==========================================
# ⚙️ CONFIGURACIÓN DE RUTAS
# ==========================================
# Detectamos que estamos en backend/ml/, así que subimos un nivel para backend/
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)

DIRS = {
    'models': os.path.join(BACKEND_DIR, 'models'),
    'cache': os.path.join(BACKEND_DIR, 'f1_cache'),
    'data': os.path.join(BACKEND_DIR, 'data'),
    'output': os.path.join(BACKEND_DIR, 'public', 'strategies') # <--- CLAVE
}

# Crear carpetas si no existen
for d in DIRS.values():
    os.makedirs(d, exist_ok=True)

warnings.filterwarnings('ignore')
try: fastf1.Cache.enable_cache(DIRS['cache'])
except: pass

plt.style.use('dark_background')
COMPOUND_COLORS = {'SOFT': '#FF3333', 'MEDIUM': '#FFD700', 'HARD': '#F0F0F0'}

# --- REGLAS DE NEGOCIO ---
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
            try:
                with open(self.path, 'r') as f: return json.load(f)
            except: return {}
        return {}
    def save_context(self, gp_name, year, data):
        key = f"{year}_{gp_name}"
        self.data[key] = data
        try:
            with open(self.path, 'w') as f: json.dump(self.data, f, indent=4)
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
            raise FileNotFoundError(f"No existe modelo para {self.driver}. Entrénalo primero.")
        return joblib.load(path)

    def _get_race_context(self):
        cached = self.mgr.get_context(self.gp_name, self.year)
        if cached: return cached

        ctx = {'total_laps': 57, 'track_temp': 35.0, 'air_temp': 25.0, 
               'pit_loss': 22.5, 'circuit_name': self.gp_name, 'avg_top_speed': 300.0}
        try:
            session = fastf1.get_session(self.year, self.gp_name, 'R')
            session.load(laps=True, telemetry=False, weather=True, messages=False)
            
            try:
                w_data = getattr(session, 'weather_data', getattr(session, 'weather', None))
                if w_data is not None and not w_data.empty:
                    ctx['track_temp'] = round(w_data['TrackTemp'].mean(), 1)
                    ctx['air_temp'] = round(w_data['AirTemp'].mean(), 1)
            except: pass
            try: ctx['total_laps'] = int(session.laps['LapNumber'].max())
            except: pass
            try:
                pit_laps = session.laps[session.laps['PitOutTime'].notna()]
                if not pit_laps.empty: ctx['pit_loss'] = 22.5
            except: pass
            try: ctx['circuit_name'] = session.event['EventName']
            except: pass
            try: 
                spd = session.laps['SpeedST'].mean()
                if not pd.isna(spd): ctx['avg_top_speed'] = float(spd)
            except: pass

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

        # 1 Parada
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
                results.append({'type': '1 Stop', 'compounds': [c1, c2], 'laps': [stop, laps-stop], 
                                'stop_laps': [stop], 'total_time': t1+t2+self.ctx['pit_loss']+launch_cost})

        # 2 Paradas
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
                    results.append({'type': '2 Stops', 'compounds': [c1, c2, c3], 
                                    'laps': [s1, len2, len3], 'stop_laps': [s1, s1+len2], 'total_time': total})

        results.sort(key=lambda x: x['total_time'])
        return results[:5]

    def plot_strategies(self, strategies):
        fig, ax = plt.subplots(figsize=(14, 7))
        fig.patch.set_facecolor('#1e1e1e')
        ax.set_facecolor('#1e1e1e')

        for idx, strat in enumerate(strategies):
            y = len(strategies) - 1 - idx
            curr_lap = 0
            
            if idx == 0:
                m, s = divmod(strat['total_time'], 60)
                h, m = divmod(m, 60)
                time_lbl = f"{int(h)}h {int(m)}m {int(s)}s"
            else:
                delta = strat['total_time'] - strategies[0]['total_time']
                time_lbl = f"+{delta:.1f}s"
            
            ax.text(-2, y, f"Option {idx+1}\n{time_lbl}", va='center', ha='right', color='white', fontweight='bold')
            for i, (comp, length) in enumerate(zip(strat['compounds'], strat['laps'])):
                ax.barh(y, length, left=curr_lap, color=COMPOUND_COLORS.get(comp, '#fff'), height=0.5, edgecolor='black')
                mid = curr_lap + length/2
                ax.text(mid, y, comp[0], va='center', ha='center', color='black', fontweight='bold')
                if i < len(strat['laps']) - 1:
                    ax.text(curr_lap+length, y+0.35, f"L{curr_lap+length}", ha='center', color='white', fontsize=8)
                curr_lap += length

        ax.set_title(f"STRATEGY PREDICTION | {self.driver} | {self.gp_name} {self.year}", color='white', fontweight='bold')
        ax.set_xlabel("Lap", color='white')
        ax.set_yticks([]); ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False); ax.spines['left'].set_visible(False)
        ax.spines['bottom'].set_color('white'); ax.tick_params(colors='white')
        patches = [mpatches.Patch(color=v, label=k) for k, v in COMPOUND_COLORS.items()]
        ax.legend(handles=patches, loc='upper center', bbox_to_anchor=(0.5, -0.05), ncol=3, frameon=False, labelcolor='white')
        
        safe_gp = self.gp_name.replace(' ', '_')
        filename = f"{self.driver}_{safe_gp}_{self.year}_Strategy.png"
        path = os.path.join(DIRS['output'], filename)
        plt.tight_layout()
        plt.savefig(path, facecolor='#1e1e1e', dpi=150)
        return filename

# ==========================================
# 🚀 ZONA DE API PARA NODE.JS
# ==========================================
if __name__ == "__main__":
    try:
        # Leemos argumentos (Node.js enviará: driver, gp, year)
        if len(sys.argv) >= 4:
            DRIVER, GP, YEAR = sys.argv[1], sys.argv[2], sys.argv[3]
            
            sim = StrategySimulator(DRIVER, GP, YEAR)
            best = sim.find_best_strategies()
            img_name = sim.plot_strategies(best)
            
            # Construimos el JSON final
            response = {
                "driver": DRIVER,
                "gp": GP,
                "year": YEAR,
                # Esta ruta es relativa para que la web la lea: /strategies/imagen.png
                "image_url": f"/strategies/{img_name}",
                "strategies": []
            }
            
            for s in best:
                response["strategies"].append({
                    "type": s['type'],
                    "compounds": s['compounds'],
                    "laps": [int(x) for x in s['laps']], 
                    "stop_laps": [int(x) for x in s['stop_laps']],
                    "total_time": float(s['total_time']),
                    "formatted_time": f"{int(s['total_time']//3600)}h {int((s['total_time']%3600)//60)}m {int(s['total_time']%60)}s"
                })

            # IMPORTANTE: El único print del script es el JSON
            print(json.dumps(response))

        else:
            # Modo prueba si lo ejecutas a mano sin argumentos
            print(json.dumps({"error": "Faltan argumentos: python script.py DRIVER GP YEAR"}))

    except Exception as e:
        # Capturamos cualquier error y devolvemos JSON de error
        print(json.dumps({"error": str(e)}))
        