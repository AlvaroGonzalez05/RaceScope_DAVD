const CircuitInfo = ({ gp, year, loading }) => {
  return (
    <>
      <div className="panel-header">
        <h3>Info del Circuito</h3>
      </div>
      <div style={{flex:1, padding:'20px', display:'flex', flexDirection:'column', justifyContent:'center'}}>
        {loading ? (
          <div style={{color:'#666'}}>Actualizando...</div>
        ) : (
          <>
            <h2 style={{margin:'0 0 10px 0', fontSize:'1.8rem', color:'white'}}>
              {gp || "---"}
            </h2>
            <div style={{display:'flex', gap:'15px', color:'#888', fontSize:'0.9rem'}}>
              <span>📅 {year}</span>
              <span>📍 Race Distance: 300km (aprox)</span>
            </div>
            
            <div style={{marginTop:'20px', padding:'15px', background:'rgba(255,255,255,0.05)', borderRadius:'8px', borderLeft:'3px solid var(--accent-red)'}}>
              <p style={{margin:0, fontStyle:'italic', color:'#ccc'}}>
                "La degradación en {gp} suele ser crítica debido a la abrasividad del asfalto."
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CircuitInfo;