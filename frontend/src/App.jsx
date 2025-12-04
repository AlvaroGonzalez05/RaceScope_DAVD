import { useState } from 'react';
import axios from 'axios';
import './App.css';

// Importamos los componentes (los crearemos abajo)
import TelemetryPanel from './components/TelemetryPanel';
import StrategyPanel from './components/StrategyPanel';
import CircuitInfo from './components/CircuitInfo';

// DATOS DE PRUEBA PARA TELEMETRÍA (Para visualizar mientras conectas datos reales)
const MOCK_TELEMETRY = Array.from({ length: 200 }, (_, i) => ({
  Distance: i * 20,
  Speed: 100 + Math.random() * 220 + Math.sin(i/20)*80,
  Throttle: Math.sin(i/20) > 0 ? 100 : 0,
  Brake: Math.sin(i/20) < 0 ? 1 : 0,
  RPM: 8000 + Math.random() * 4000,
  nGear: Math.floor(Math.random() * 8) + 1
}));

function App() {
  const [inputs, setInputs] = useState({ driver: 'ALO', gp: 'Bahrain Grand Prix', year: '2023' });
  const [data, setData] = useState({ strategy: null, loading: false, error: null });

  const handleChange = (e) => setInputs({ ...inputs, [e.target.name]: e.target.value });

  const handleStart = async (e) => {
    e.preventDefault();
    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // 1. Pedir Estrategia al Backend (Puerto 5001)
      const res = await axios.post('http://localhost:5001/api/predict-strategy', {
        driver: inputs.driver.toUpperCase(),
        gp: inputs.gp,
        year: inputs.year
      });

      setData({ strategy: res.data, loading: false, error: null });
    } catch (err) {
      console.error(err);
      setData(prev => ({ ...prev, loading: false, error: 'Error al conectar con RaceScope AI.' }));
    }
  };

  return (
    <div className="app-container">
      {/* BARRA SUPERIOR */}
      <header className="control-bar">
        <div className="logo"><h1>RACE<span>SCOPE</span></h1></div>
        <form className="controls" onSubmit={handleStart}>
          <div className="input-group"><input name="driver" placeholder="Piloto (ALO)" value={inputs.driver} onChange={handleChange} maxLength="3"/></div>
          <div className="input-group"><input name="gp" placeholder="Gran Premio" value={inputs.gp} onChange={handleChange} /></div>
          <div className="input-group"><input name="year" type="number" value={inputs.year} onChange={handleChange} style={{width:'80px'}}/></div>
          <button type="submit" className="btn-start" disabled={data.loading}>{data.loading ? '...' : 'START'}</button>
        </form>
      </header>

      {/* DASHBOARD GRID */}
      <main className="dashboard-grid">
        <section className="panel area-telemetry">
          {/* Pasamos datos mockeados para que veas los gráficos ya */}
          <TelemetryPanel data={{ telemetry: MOCK_TELEMETRY }} />
        </section>

        <section className="panel area-strategy">
          <StrategyPanel data={data.strategy} loading={data.loading} error={data.error} />
        </section>

        <section className="panel area-circuit">
          <CircuitInfo gp={inputs.gp} year={inputs.year} />
        </section>
      </main>
    </div>
  );
}

export default App;