import fastf1
import sys
import json
import os
import warnings

# Configuración de caché y rutas
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
CACHE_DIR = os.path.join(BACKEND_DIR, 'f1_cache')

warnings.filterwarnings('ignore')
try: fastf1.Cache.enable_cache(CACHE_DIR)
except: pass

def get_telemetry_data(driver_code, gp_name, year):
    try:
        # Cargar sesión de Carrera
        session = fastf1.get_session(int(year), gp_name, 'R')
        session.load(laps=True, telemetry=True, weather=False, messages=False)
        
        # Buscar piloto y vuelta rápida
        driver_laps = session.laps.pick_driver(driver_code)
        if driver_laps.empty:
            return {"error": f"No hay datos para {driver_code}"}
            
        fastest_lap = driver_laps.pick_fastest()
        car_data = fastest_lap.get_car_data().add_distance()
        
        # Info del circuito (Curvas)
        circuit_info = session.get_circuit_info()
        corners = []
        if circuit_info is not None:
            for _, row in circuit_info.corners.iterrows():
                corners.append({
                    "Number": str(row['Number']),
                    "Distance": float(row['Distance'])
                })

        # Reducir datos (1 de cada 3 puntos) para no saturar el navegador
        telemetry_points = []
        step = 3
        for i in range(0, len(car_data), step):
            point = car_data.iloc[i]
            telemetry_points.append({
                "Distance": round(float(point['Distance']), 1),
                "Speed": int(point['Speed']),
                "Throttle": int(point['Throttle']),
                "Brake": float(point['Brake']),
                "RPM": int(point['RPM']),
                "nGear": int(point['nGear'])
            })

        lap_time_str = str(fastest_lap['LapTime']).split('days ')[-1]

        return {
            "driver": driver_code,
            "lap_time": lap_time_str,
            "eventName": session.event['EventName'],
            "telemetry": telemetry_points,
            "corners": corners
        }

    except Exception as e:
        return {"error": f"Error FastF1: {str(e)}"}

if __name__ == "__main__":
    # Argumentos desde Node.js
    if len(sys.argv) >= 4:
        driver, gp, year = sys.argv[1], sys.argv[2], sys.argv[3]
        result = get_telemetry_data(driver, gp, year)
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "Faltan argumentos"}))