import { useState, useEffect } from 'react'; // Importar useEffect
import axios from 'axios';
import './App.css';
import { DRIVERS, CIRCUITS, YEARS } from './data';
import TelemetryPanel from './components/TelemetryPanel';
import StrategyPanel from './components/StrategyPanel';
import CircuitInfo from './components/CircuitInfo';

function App() {
  const [inputs, setInputs] = useState({ driver: 'ALO', gp: 'Bahrain Grand Prix', year: '2023' });
  const [activeConfig, setActiveConfig] = useState(null);
  const [strategyData, setStrategyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ESTADO DEL TEMA (Dark por defecto)
  const [theme, setTheme] = useState('dark');

  // Efecto para aplicar el tema al HTML
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleChange = (e) => setInputs({ ...inputs, [e.target.name]: e.target.value });

  const handleStart = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setActiveConfig({ driverCode: inputs.driver, gpName: inputs.gp, year: inputs.year });

    try {
      const res = await axios.post('http://localhost:5001/api/predict-strategy', {
        driver: inputs.driver, gp: inputs.gp, year: inputs.year
      });
      setStrategyData(res.data);
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* BARRA SUPERIOR */}
      <header className="control-bar">
        <div style={{display:'flex', alignItems:'center'}}>
          <div className="logo"><h1>RACE<span>SCOPE</span></h1></div>
          
          {/* BOTÓN TOGGLE (Sol / Luna) */}
          <button onClick={toggleTheme} className="theme-toggle" title="Cambiar Tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        
        <form className="controls" onSubmit={handleStart}>
          <div className="input-group">
            <select name="year" value={inputs.year} onChange={handleChange} className="select-box year-select">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="input-group">
            <select name="gp" value={inputs.gp} onChange={handleChange} className="select-box gp-select">
              {CIRCUITS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="input-group">
            <select name="driver" value={inputs.driver} onChange={handleChange} className="select-box driver-select">
              {DRIVERS.map(d => <option key={d.id} value={d.id}>{d.id} - {d.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-start" disabled={loading}>
            {loading ? 'ANALIZANDO...' : 'START'}
          </button>
        </form>
      </header>

      {/* DASHBOARD GRID */}
      <main className="dashboard-grid">
        
        <section className="panel area-telemetry">
          {activeConfig ? (
            <TelemetryPanel 
              driverCode={activeConfig.driverCode}
              gpName={activeConfig.gpName}
              year={activeConfig.year}
              theme={theme} // Pasamos el tema
            />
          ) : (
            <div className="empty-state"><p>Selecciona configuración y pulsa START</p></div>
          )}
        </section>

        <section className="panel area-strategy">
          <StrategyPanel 
            data={strategyData} 
            loading={loading} 
            error={error} 
            theme={theme} // Pasamos el tema
          />
        </section>

        <section className="panel area-circuit">
          <CircuitInfo 
            data={strategyData ? strategyData.circuit_info : null}
            theme={theme} // Pasamos el tema
          />
        </section>

      </main>
    </div>
  );
}

export default App;