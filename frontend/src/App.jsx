import { useState } from 'react';
import axios from 'axios';
import './App.css';

// Importamos los componentes
import TelemetryPanel from './components/TelemetryPanel';
import StrategyPanel from './components/StrategyPanel';
import CircuitInfo from './components/CircuitInfo';

function App() {
  // Estado para los Inputs del formulario
  const [inputs, setInputs] = useState({ 
    driver: 'ALO', 
    gp: 'Bahrain', // Usa nombres cortos para ayudar a la búsqueda (ej: Bahrain, Monza)
    year: '2023' 
  });
  
  // Estado "Trigger": Guarda la configuración CONFIRMADA al dar Start
  const [activeConfig, setActiveConfig] = useState(null);
  
  // Estado para la Estrategia (que sí viene del Backend Python)
  const [strategyData, setStrategyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setInputs({ ...inputs, [e.target.name]: e.target.value });

  const handleStart = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // 1. Guardamos la configuración activa (Esto despierta al TelemetryPanel)
    // Importante: Convertimos driver a mayúsculas aquí
    setActiveConfig({
      driverCode: inputs.driver.toUpperCase(),
      gpName: inputs.gp,
      year: inputs.year
    });

    try {
      // 2. Pedimos SOLO la estrategia al Backend (Python)
      // La telemetría va por libre directamente a OpenF1 desde el componente
      const res = await axios.post('http://localhost:5001/api/predict-strategy', {
        driver: inputs.driver.toUpperCase(),
        gp: inputs.gp, 
        year: inputs.year
      });
      
      setStrategyData(res.data);
    } catch (err) {
      console.error(err);
      setError('Error al calcular estrategia. Revisa que el backend (puerto 5001) esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* BARRA SUPERIOR */}
      <header className="control-bar">
        <div className="logo"><h1>RACE<span>SCOPE</span></h1></div>
        
        <form className="controls" onSubmit={handleStart}>
          <div className="input-group">
            <input 
              name="driver" 
              placeholder="Piloto (ej: ALO)" 
              value={inputs.driver} 
              onChange={handleChange} 
              maxLength="3"
            />
          </div>
          <div className="input-group">
            <input 
              name="gp" 
              placeholder="Gran Premio (ej: Bahrain)" 
              value={inputs.gp} 
              onChange={handleChange} 
            />
          </div>
          <div className="input-group">
            <input 
              name="year" 
              type="number" 
              value={inputs.year} 
              onChange={handleChange} 
              style={{width:'80px'}}
            />
          </div>
          <button type="submit" className="btn-start" disabled={loading}>
            {loading ? 'ANALIZANDO...' : 'START'}
          </button>
        </form>
      </header>

      {/* DASHBOARD GRID */}
      <main className="dashboard-grid">
        
        {/* 1. PANEL TELEMETRÍA (Autónomo) */}
        <section className="panel area-telemetry">
          {activeConfig ? (
            /* AQUÍ ESTABA EL ERROR ANTES: Pasamos las props individuales */
            <TelemetryPanel 
              driverCode={activeConfig.driverCode}
              gpName={activeConfig.gpName}
              year={activeConfig.year}
            />
          ) : (
            <div className="empty-state">
              <p>Selecciona carrera y pulsa START para cargar datos.</p>
            </div>
          )}
        </section>

        {/* 2. PANEL ESTRATEGIA (Viene del Backend Python) */}
        <section className="panel area-strategy">
          <StrategyPanel 
            data={strategyData} 
            loading={loading} 
            error={error} 
          />
        </section>

        {/* 3. PANEL CIRCUITO (Info estática) */}
        <section className="panel area-circuit">
          <CircuitInfo 
            gp={activeConfig ? activeConfig.gpName : inputs.gp} 
            year={activeConfig ? activeConfig.year : inputs.year} 
          />
        </section>

      </main>
    </div>
  );
}

export default App;