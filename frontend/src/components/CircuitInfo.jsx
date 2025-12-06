import React from 'react';

const CircuitInfo = ({ data, theme }) => {
  // Ajuste de colores según tema
  const textColor = theme === 'light' ? '#333' : 'white';
  const subTextColor = theme === 'light' ? '#666' : '#aaa';
  const cardBg = theme === 'light' ? '#f0f2f5' : '#222';

  if (!data) {
    return (
      <>
        <div className="panel-header"><h3>CIRCUIT INTEL</h3></div>
        <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', color: subTextColor}}>
          Waiting for circuit data...
        </div>
      </>
    );
  }

  const { name, laps, track_temp, air_temp, map_url, tech } = data;

  const getBadgeColor = (level, type) => {
    const l = level ? level.toUpperCase() : 'UNKNOWN';
    if (type === 'deg') {
      if (l === 'HIGH') return '#ff3333';
      if (l === 'MEDIUM') return '#ffaa00';
      return '#00cc44';
    }
    if (l === 'HIGH' || l === 'MAXIMUM' || l === 'EASY') return '#00cc44';
    if (l === 'HARD' || l === 'IMPOSSIBLE') return '#ff3333';
    return '#ffaa00';
  };

  return (
    <>
      <div className="panel-header" style={{display:'flex', justifyContent:'space-between'}}>
        <h3>CIRCUIT INTEL</h3>
        <span style={{color: subTextColor, fontSize:'0.9rem'}}>Track Temp: <b style={{color: textColor, fontSize:'1.1rem'}}>{track_temp}°C</b></span>
      </div>

      <div style={{flex:1, padding:'20px', display:'flex', gap:'30px', alignItems: 'center'}}>
        
        {/* Left: Map */}
        <div style={{flex: 1.2, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
          {map_url ? (
            <img 
              src={`http://localhost:5001${map_url}`} 
              alt="Circuit Layout" 
              // CLAVE: Aplicamos la clase 'inverted' si el tema es light
              className={`circuit-map-img ${theme === 'light' ? 'inverted' : ''}`}
              // IMPORTANTE: Quitamos el 'filter' del style inline para evitar conflictos
            />
          ) : (
            <div style={{width:'100%', height:'150px', border:`1px dashed ${subTextColor}`, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color: subTextColor}}>
              Map Unavailable
            </div>
          )}
          <h2 style={{margin:'15px 0 5px 0', fontSize:'1.4rem', textAlign:'center', lineHeight:'1.2', color: textColor}}>{name}</h2>
          <span style={{fontSize:'1rem', color: subTextColor, fontWeight:'bold'}}>{laps} Laps</span>
        </div>

        {/* Right: Technical Stats */}
        <div style={{flex: 1, display:'flex', flexDirection:'column', justifyContent:'center', gap:'12px'}}>
          
          <div style={{background: cardBg, padding:'12px 15px', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{fontSize:'0.9rem', color: subTextColor, fontWeight:'500'}}>Tyre Stress</span>
            <span style={{fontWeight:'800', color: getBadgeColor(tech.deg, 'deg'), fontSize:'1.1rem', letterSpacing:'1px'}}>
              {tech.deg}
            </span>
          </div>

          <div style={{background: cardBg, padding:'12px 15px', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{fontSize:'0.9rem', color: subTextColor, fontWeight:'500'}}>Downforce</span>
            <span style={{fontWeight:'800', color: textColor, fontSize:'1.1rem', letterSpacing:'1px'}}>
              {tech.downforce}
            </span>
          </div>

          <div style={{background: cardBg, padding:'12px 15px', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{fontSize:'0.9rem', color: subTextColor, fontWeight:'500'}}>Overtaking</span>
            <span style={{fontWeight:'800', color: getBadgeColor(tech.overtake, 'over'), fontSize:'1.1rem', letterSpacing:'1px'}}>
              {tech.overtake}
            </span>
          </div>

        </div>
      </div>
    </>
  );
};

export default CircuitInfo;