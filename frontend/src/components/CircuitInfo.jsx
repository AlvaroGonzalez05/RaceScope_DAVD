const CircuitInfo = ({ gp, year }) => {
  return (
    <>
      <div className="panel-header"><h3>Info del Circuito</h3></div>
      <div style={{flex:1, padding:'20px', display:'flex', flexDirection:'column', justifyContent:'center'}}>
        <h2 style={{margin:'0 0 5px 0', fontSize:'1.5rem', color:'white'}}>{gp || "---"}</h2>
        <p style={{margin:0, color:'#666'}}>{year}</p>
        <div style={{marginTop:'15px', padding:'10px', borderLeft:'3px solid #ff3333', background:'rgba(255,51,51,0.1)'}}>
          <p style={{margin:0, fontSize:'0.85rem', color:'#ccc', fontStyle:'italic'}}>
            "Circuito de alta degradación térmica. La posición en pista es clave."
          </p>
        </div>
      </div>
    </>
  );
};
export default CircuitInfo;
