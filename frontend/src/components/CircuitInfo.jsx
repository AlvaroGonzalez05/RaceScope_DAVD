import React from 'react';

const CircuitInfo = ({ data }) => {
  // Si aún no hay datos del backend, mostramos estado neutro
  if (!data) {
    return (
      <>
        <div className="panel-header"><h3>Info del Circuito</h3></div>
        <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#444'}}>
          Esperando datos de carrera...
        </div>
      </>
    );
  }

  const { name, laps, track_temp, air_temp, map_url, tech } = data;

  // Función para asignar colores a los niveles (High = Rojo, Low = Verde)
  const getBadgeColor = (level, type) => {
    const l = level.toUpperCase();
    if (type === 'deg') {
      if (l === 'HIGH') return '#ff3333'; // Rojo
      if (l === 'MEDIUM') return '#ffaa00'; // Naranja
      return '#00cc44'; // Verde
    }
    // Para Overtake/Downforce
    if (l === 'HIGH' || l === 'MAXIMUM' || l === 'EASY') return '#00cc44';
    if (l === 'HARD' || l === 'IMPOSSIBLE') return '#ff3333';
    return '#ffaa00';
  };

  return (
    <>
      <div className="panel-header" style={{display:'flex', justifyContent:'space-between'}}>
        <h3>CIRCUIT INTEL</h3>
        <span style={{color: '#888', fontSize:'0.8rem'}}>Track Temp: <b style={{color:'white'}}>{track_temp}°C</b></span>
      </div>

      <div style={{flex:1, padding:'15px', display:'flex', gap:'20px'}}>
        
        {/* COLUMNA IZQUIERDA: Mapa */}
        <div style={{flex: 1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
          {map_url ? (
            <img 
              src={`http://localhost:5001${map_url}`} 
              alt="Circuit Layout" 
              style={{maxWidth:'100%', maxHeight:'140px', filter: 'drop-shadow(0 0 5px rgba(255,51,51,0.5))'}} 
            />
          ) : (
            <div style={{width:'100%', height:'100%', border:'1px dashed #333', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'#444'}}>
              Mapa no disponible
            </div>
          )}
          <h2 style={{margin:'10px 0 0 0', fontSize:'1.1rem', textAlign:'center'}}>{name}</h2>
          <span style={{fontSize:'0.8rem', color:'#666'}}>{laps} Laps</span>
        </div>

        {/* COLUMNA DERECHA: Stats */}
        <div style={{flex: 1, display:'flex', flexDirection:'column', justifyContent:'center', gap:'10px'}}>
          
          {/* Badge 1: Degradación */}
          <div style={{background:'#222', padding:'8px 12px', borderRadius:'6px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{fontSize:'0.8rem', color:'#aaa'}}>Tyre Stress</span>
            <span style={{fontWeight:'bold', color: getBadgeColor(tech.deg, 'deg'), fontSize:'0.9rem'}}>
              {tech.deg}
            </span>
          </div>

          {/* Badge 2: Carga Aero */}
          <div style={{background:'#222', padding:'8px 12px', borderRadius:'6px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{fontSize:'0.8rem', color:'#aaa'}}>Downforce</span>
            <span style={{fontWeight:'bold', color:'white', fontSize:'0.9rem'}}>
              {tech.downforce}
            </span>
          </div>

          {/* Badge 3: Adelantamiento */}
          <div style={{background:'#222', padding:'8px 12px', borderRadius:'6px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{fontSize:'0.8rem', color:'#aaa'}}>Overtaking</span>
            <span style={{fontWeight:'bold', color: getBadgeColor(tech.overtake, 'over'), fontSize:'0.9rem'}}>
              {tech.overtake}
            </span>
          </div>

        </div>
      </div>
    </>
  );
};

export default CircuitInfo;