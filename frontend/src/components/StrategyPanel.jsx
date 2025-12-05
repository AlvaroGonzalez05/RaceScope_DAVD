import React from 'react';
import StrategyChart from './StrategyChart'; // Import the new component

const StrategyPanel = ({ data, loading, error }) => {
  return (
    <>
      <div className="panel-header">
        <h3>Estrategia Óptima (ML Prediction)</h3>
        {data && <span style={{color:'#00ff00', fontSize:'0.7em'}}>● LIVE REACt RENDER</span>}
      </div>

      <div style={{ flex: 1, padding: '10px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {/* Loading State */}
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <div style={{marginTop: 10}}>Simulando millones de escenarios...</div>
          </div>
        )}
        
        {/* Error State */}
        {error && <div style={{color:'red', textAlign:'center', marginTop:20}}>{error}</div>}
        
        {/* Empty State */}
        {!data && !loading && !error && (
          <div className="loading-overlay">Selecciona parámetros y pulsa START</div>
        )}

        {/* Data Content */}
        {data && !loading && (
          <div style={{height:'100%', display:'flex', flexDirection:'column', gap:'10px'}}>
            
            {/* 1. CHART AREA */}
            {/* flex: 3 da más prioridad de altura al gráfico frente al texto de abajo */}
            <div style={{flex: 3, minHeight: 0, background: '#0d0d0d', borderRadius: '6px', padding: '5px', border: '1px solid #333'}}>
              <StrategyChart strategies={data.strategies} />
            </div>

            {/* 2. TEXT DETAILS */}
            {/* flex: 0 mantiene el texto compacto */}
            <div style={{flex: 0, marginTop: '10px', background:'#222', padding:'15px', borderRadius:'6px', display:'flex', justifyContent:'space-between', alignItems: 'center'}}>
              {/* ... contenido del texto ... */}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StrategyPanel;