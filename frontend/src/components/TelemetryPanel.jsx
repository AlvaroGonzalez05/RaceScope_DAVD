import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const THEME = {
  SPEED: '#FF1801', 
  THROTTLE: '#00D800', 
  BRAKE: '#FFA500', 
  RPM: '#9467BD', 
  GEAR: '#1F77B4',
  BG_PLOT: '#1a1a1a', 
  BG_PANEL: '#0d0d0d', 
  GRID: '#444', 
  TEXT: '#e0e0e0'
};

const TelemetryPanel = ({ driverCode, gpName, year }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (driverCode && gpName && year) {
      fetchTelemetry();
    }
  }, [driverCode, gpName, year]);

  const fetchTelemetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('http://localhost:5001/api/telemetry', {
        driver: driverCode,
        gp: gpName,
        year: year
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError("Error cargando telemetría.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-overlay">📡 Analizando vuelta rápida...</div>;
  if (error) return <div className="loading-overlay" style={{color:'#ff4444'}}>{error}</div>;
  if (!data) return <div className="loading-overlay">Esperando datos...</div>;

  const { telemetry, corners, lap_time, eventName } = data;

  // --- CONFIGURACIÓN DE ALINEADO ---
  // 1. Márgenes idénticos para todos
  const CHART_MARGIN = { top: 5, right: 10, left: 0, bottom: 0 };
  // 2. Ancho fijo para el eje Y (suficiente para 5 dígitos de RPM)
  const Y_AXIS_WIDTH = 45; 

  const CommonGrid = () => <CartesianGrid strokeDasharray="3 3" stroke={THEME.GRID} opacity={0.3} />;
  
  // XAxis invisible pero PRESENTE para mantener la escala
  const CommonXAxis = ({ hide = true }) => (
    <XAxis 
      dataKey="Distance" 
      type="number" 
      domain={['dataMin', 'dataMax']} // Clave para sincronizar zoom/escala
      hide={hide} 
      tick={{ fill: '#888', fontSize: 10 }}
    />
  );

  const CornerLines = ({ showLabel }) => corners.map((c, i) => (
    <ReferenceLine key={i} x={c.Distance} stroke="yellow" strokeDasharray="2 2" opacity={0.4}
      label={showLabel ? { value: `T${c.Number}`, position: 'insideTop', fill: 'yellow', fontSize: 9 } : null} />
  ));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{background:'rgba(0,0,0,0.9)', border:'1px solid #444', padding:'5px', fontSize:'0.8rem', zIndex:100}}>
          <div style={{color:'#fff', marginBottom:3}}>Dist: {Math.round(payload[0].payload.Distance)}m</div>
          {payload.map((p,i)=><div key={i} style={{color:p.color}}>{p.name}: {p.value}</div>)}
        </div>
      );
    } return null;
  };

  const chartContainerStyle = { flex: 1, minHeight: 0, background: THEME.BG_PLOT, marginBottom: '2px', position: 'relative' };
  const labelStyle = (color) => ({ position: 'absolute', top: 5, left: 60, fontSize: '0.7rem', fontWeight:'bold', color: color, zIndex: 10, pointerEvents:'none' });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: THEME.BG_PANEL, padding: '5px' }}>
      <div className="panel-header" style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', padding:'5px 10px'}}>
        <div>
          <h3 style={{margin:0, fontSize:'0.9rem', color: THEME.SPEED}}>{driverCode} - FASTEST LAP</h3>
          <small style={{color:'#666'}}>{eventName}</small>
        </div>
        <span style={{color: THEME.TEXT, fontSize:'1.1rem', fontWeight:'bold', fontFamily:'monospace'}}>{lap_time}</span>
      </div>

      {/* 1. SPEED */}
      <div style={chartContainerStyle}>
        <span style={labelStyle(THEME.SPEED)}>SPEED</span>
        <ResponsiveContainer>
          <LineChart data={telemetry} syncId="f1" margin={CHART_MARGIN}>
            <CommonGrid />
            <CommonXAxis />
            <YAxis domain={[0, 360]} width={Y_AXIS_WIDTH} tick={{fill:THEME.SPEED, fontSize:10}} />
            <Tooltip content={<CustomTooltip />} />
            {CornerLines({ showLabel: true })}
            <Line type="monotone" dataKey="Speed" stroke={THEME.SPEED} dot={false} strokeWidth={2} isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 2. THROTTLE */}
      <div style={chartContainerStyle}>
        <span style={labelStyle(THEME.THROTTLE)}>THROTTLE</span>
        <ResponsiveContainer>
          <LineChart data={telemetry} syncId="f1" margin={CHART_MARGIN}>
            <CommonGrid />
            <CommonXAxis />
            <YAxis domain={[0, 110]} width={Y_AXIS_WIDTH} tick={{fill:THEME.THROTTLE, fontSize:10}} />
            <Tooltip content={<CustomTooltip />} />
            {CornerLines({})}
            <Line type="stepAfter" dataKey="Throttle" stroke={THEME.THROTTLE} dot={false} strokeWidth={2} isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 3. BRAKE */}
      <div style={chartContainerStyle}>
        <span style={labelStyle(THEME.BRAKE)}>BRAKE</span>
        <ResponsiveContainer>
          <LineChart data={telemetry} syncId="f1" margin={CHART_MARGIN}>
            <CommonGrid />
            <CommonXAxis />
            <YAxis domain={[0, 1.1]} ticks={[0, 1]} width={Y_AXIS_WIDTH} tick={{fill:THEME.BRAKE, fontSize:10}} />
            <Tooltip content={<CustomTooltip />} />
            {CornerLines({})}
            <Line type="stepAfter" dataKey="Brake" stroke={THEME.BRAKE} dot={false} strokeWidth={2} isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 4. RPM */}
      <div style={chartContainerStyle}>
        <span style={labelStyle(THEME.RPM)}>RPM</span>
        <ResponsiveContainer>
          <LineChart data={telemetry} syncId="f1" margin={CHART_MARGIN}>
            <CommonGrid />
            <CommonXAxis />
            <YAxis domain={['auto', 'auto']} width={Y_AXIS_WIDTH} tick={{fill:THEME.RPM, fontSize:10}} />
            <Tooltip content={<CustomTooltip />} />
            {CornerLines({})}
            <Line type="monotone" dataKey="RPM" stroke={THEME.RPM} dot={false} strokeWidth={1} isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 5. GEAR */}
      <div style={chartContainerStyle}>
        <span style={labelStyle(THEME.GEAR)}>GEAR</span>
        <ResponsiveContainer>
          <LineChart data={telemetry} syncId="f1" margin={CHART_MARGIN}>
            <CommonGrid />
            {/* El último gráfico sí muestra el eje X */}
            <CommonXAxis hide={false} />
            <YAxis domain={[0, 9]} tickCount={9} width={Y_AXIS_WIDTH} tick={{fill:THEME.GEAR, fontSize:10}} />
            <Tooltip content={<CustomTooltip />} />
            {CornerLines({})}
            <Line type="stepAfter" dataKey="nGear" stroke={THEME.GEAR} dot={false} strokeWidth={2} isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TelemetryPanel;