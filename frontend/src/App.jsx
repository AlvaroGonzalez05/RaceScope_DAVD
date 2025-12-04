import { useState } from 'react';
import axios from 'axios';
import './App.css';

// Importamos los componentes (que crearemos a continuación)
import TelemetryPanel from './components/TelemetryPanel';
import StrategyPanel from './components/StrategyPanel';
import CircuitInfo from './components/CircuitInfo';

function App() {
  // Estado del Formulario
  const [inputs, setInputs] = useState({
    driver: 'ALO',
    gp: 'Bahrain Grand Prix',
    year: '2023'
  });

  // Estado de los Datos
  const [data, setData] = useState({
    strategy: null,
    telemetry: null, // Aquí podrías conectar la telemetría real más adelante
    loading: false,
    error: null
  });

  // Manejador de Inputs
  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  // Acción de Start
  const handleStart = async (e) => {
    e.preventDefault();
    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // 1. Petición al Backend (Python ML)
      const res = await axios.post('http://localhost:5001/api/predict-strategy', {
        driver: inputs.driver.toUpperCase(),
        gp: inputs.gp,
        year: inputs.year
      });

      // 2. Guardar respuesta
      setData({
        strategy: res.data,
        telemetry: { driver: inputs.driver, gp: inputs.gp }, // Placeholder para metadata
        loading: false,
        error: null
      });

    } catch (err) {
      console.error(err);
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Error al calcular estrategia. Revisa que el piloto/GP sean correctos.' 
      }));
    }
  };

  return (
    <div className="app-container">
      
      {/* 1. BARRA DE CONTROL SUPERIOR */}
      <header className="control-bar">
        <div className="logo">
          <h1>RACE<span>SCOPE</span></h1>
        </div>

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
              placeholder="Gran Premio" 
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
              style={{width: '80px'}}
            />
          </div>
          <button type="submit" className="btn-start" disabled={data.loading}>
            {data.loading ? 'ANALIZANDO...' : 'START'}
          </button>
        </form>
      </header>

      {/* 2. GRID DASHBOARD */}
      <main className="dashboard-grid">
        
        {/* PANEL TELEMETRÍA (IZQUIERDA) */}
        <section className="panel area-telemetry">
            <TelemetryPanel 
                data={data.telemetry} // Debe contener { telemetry: [...] }
                circuitInfo={data.circuit_info} // Debe contener [{Distance: 100, Number: 1}, ...]
            />
        </section>

        {/* PANEL ESTRATEGIA (DERECHA ARRIBA) */}
        <section className="panel area-strategy">
          <StrategyPanel data={data.strategy} loading={data.loading} error={data.error} />
        </section>

        {/* PANEL CIRCUITO (DERECHA ABAJO) */}
        <section className="panel area-circuit">
          <CircuitInfo gp={inputs.gp} year={inputs.year} loading={data.loading} />
        </section>

      </main>
    </div>
  );
}

export default App;