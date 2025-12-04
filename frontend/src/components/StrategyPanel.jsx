const StrategyPanel = ({ data, loading, error }) => {
  return (
    <>
      <div className="panel-header">
        <h3>Estrategia Óptima (ML Prediction)</h3>
        {data && <span style={{color:'#00ff00', fontSize:'0.8em'}}>● LIVE</span>}
      </div>

      <div style={{ flex: 1, padding: '15px', overflow: 'hidden', position: 'relative' }}>
        
        {/* Loading Overlay */}
        {loading && (
          <div className="loading-overlay">
            <div style={{color:'white'}}>Simulando millones de escenarios...</div>
          </div>
        )}

        {/* Error State */}
        {error && <div style={{color:'var(--accent-red)', textAlign:'center', marginTop:'20px'}}>{error}</div>}

        {/* Empty State */}
        {!data && !loading && !error && (
          <div className="empty-state">
            <p>Selecciona parámetros y pulsa START para generar estrategia.</p>
          </div>
        )}

        {/* Data Content */}
        {data && !loading && (
          <div style={{height:'100%', display:'flex', flexDirection:'column'}}>
            
            {/* Imagen Generada */}
            <div style={{flex:1, background:'black', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #333'}}>
              <img 
                src={`http://localhost:5001${data.image_url}`} 
                alt="Strategy Chart" 
                style={{maxWidth:'100%', maxHeight:'100%', objectFit:'contain'}} 
              />
            </div>

            {/* Stats Rápidas */}
            <div style={{marginTop:'15px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
              <div style={{background:'#222', padding:'10px', borderRadius:'6px'}}>
                <div style={{color:'#888', fontSize:'0.8em'}}>Tiempo Total</div>
                <div style={{fontSize:'1.2em', fontWeight:'bold'}}>{data.strategies[0].formatted_time}</div>
              </div>
              <div style={{background:'#222', padding:'10px', borderRadius:'6px'}}>
                <div style={{color:'#888', fontSize:'0.8em'}}>Paradas</div>
                <div style={{fontSize:'1.2em', fontWeight:'bold'}}>
                   L{data.strategies[0].stop_laps.join(' & L')}
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