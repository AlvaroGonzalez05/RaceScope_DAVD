import React from 'react';
import StrategyChart from './StrategyChart';

// AQUÍ FALTABA AÑADIR 'theme' 👇
const StrategyPanel = ({ data, loading, error, theme }) => {
  
  // Colores dinámicos para los textos del panel
  const textColor = theme === 'light' ? '#333' : 'white';
  const subTextColor = theme === 'light' ? '#666' : '#888';
  const statsBg = theme === 'light' ? '#f5f5f5' : '#222';

  return (
    <>
      <div className="panel-header">
        <h3>OPTIMAL STRATEGY (ML PREDICTION)</h3>
        {data && <span style={{color:'#00ff00', fontSize:'0.8em', fontWeight:'bold'}}>● LIVE RENDER</span>}
      </div>

      <div style={{ flex: 1, padding: '15px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {loading && <div className="loading-overlay">Simulating millions of scenarios...</div>}
        {error && <div style={{color:'red', textAlign:'center', marginTop:20}}>{error}</div>}
        
        {!data && !loading && !error && (
          <div className="loading-overlay">Select parameters and hit START</div>
        )}

        {data && !loading && (
          <div style={{height:'100%', display:'flex', flexDirection:'column', gap:'15px'}}>
            
            {/* Chart Area */}
            <div style={{
                flex: 1, 
                minHeight: 0, 
                // Aquí es donde daba el error antes porque no tenía 'theme'
                background: theme === 'light' ? '#ffffff' : '#0d0d0d', 
                borderRadius: '8px', 
                padding: '10px', 
                border: '1px solid var(--border-color)'
            }}>
              <StrategyChart strategies={data.strategies} theme={theme} />
            </div>

            {/* Stats Area */}
            <div style={{
                background: statsBg, 
                padding:'15px 20px', 
                borderRadius:'8px', 
                display:'flex', 
                justifyContent:'space-between', 
                alignItems: 'center'
            }}>
              <div>
                <div style={{color: subTextColor, fontSize:'0.9rem', marginBottom:'4px', textTransform:'uppercase'}}>Total Race Time</div>
                <div style={{fontSize:'1.6rem', fontWeight:'bold', color: textColor, fontFamily: 'JetBrains Mono, monospace'}}>
                  {data.strategies[0].formatted_time}
                </div>
              </div>

              <div style={{textAlign:'right'}}>
                <div style={{color: subTextColor, fontSize:'0.9rem', marginBottom:'4px', textTransform:'uppercase'}}>Suggested Stops</div>
                <div style={{fontSize:'1.3rem', fontWeight:'bold', color: '#ff3333'}}>
                   Lap {data.strategies[0].stop_laps.join(' & ')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StrategyPanel;