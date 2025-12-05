const StrategyPanel = ({ data, loading, error }) => {
  return (
    <>
      <div className="panel-header">
        <h3>Estrategia Óptima (ML Prediction)</h3>
        {data && <span style={{color:'#00ff00', fontSize:'0.7em'}}>● LIVE</span>}
      </div>

      <div style={{ flex: 1, padding: '10px', position: 'relative', overflow: 'hidden' }}>
        {loading && <div className="loading-overlay">Simulando estrategia...</div>}
        {error && <div style={{color:'red', textAlign:'center', marginTop:20}}>{error}</div>}
        
        {!data && !loading && !error && (
          <div className="loading-overlay">Selecciona parámetros y pulsa START</div>
        )}

        {data && !loading && (
          <div style={{height:'100%', display:'flex', flexDirection:'column', gap:'10px'}}>
            {/* Imagen */}
            <div style={{flex:1, background:'black', borderRadius:'6px', display:'flex', justifyContent:'center', overflow:'hidden'}}>
              <img src={`http://localhost:5001${data.image_url}`} alt="Strategy" style={{maxWidth:'100%', maxHeight:'100%', objectFit:'contain'}} />
            </div>
            {/* Info */}
            <div style={{background:'#222', padding:'10px', borderRadius:'6px', display:'flex', justifyContent:'space-between'}}>
              <div style={{fontSize:'0.8rem', color:'#aaa'}}>Tiempo Total<br/><strong style={{color:'white', fontSize:'1.1rem'}}>{data.strategies[0].formatted_time}</strong></div>
              <div style={{textAlign:'right', fontSize:'0.8rem', color:'#aaa'}}>Paradas<br/><strong style={{color:'white'}}>L{data.strategies[0].stop_laps.join(', L')}</strong></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
export default StrategyPanel;
