import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

// 1. DEFINIMOS LAS DOS PALETAS (Oscuro y Claro)
const PALETTES = {
  dark: {
    SPEED: '#FF1801', 
    THROTTLE: '#00D800', 
    BRAKE: '#FFA500', 
    RPM: '#9467BD', 
    GEAR: '#1F77B4',
    BG_PLOT: '#1a1a1a', 
    BG_PANEL: '#0d0d0d', 
    GRID: '#444', 
    TEXT: '#e0e0e0',
    TOOLTIP_BG: 'rgba(0,0,0,0.9)'
  },
  light: {
    SPEED: '#D90400', 
    THROTTLE: '#008F00', 
    BRAKE: '#E08E00', 
    RPM: '#7B54A8', 
    GEAR: '#176091',
    BG_PLOT: '#f7f7f7', 
    BG_PANEL: '#ffffff', 
    GRID: '#ccc', 
    TEXT: '#333333',
    TOOLTIP_BG: 'rgba(255,255,255,0.95)'
  }
};

const TelemetryPanel = ({ driverCode, gpName, year, theme }) => {
  // 2. SELECCIONAMOS LA PALETA ACTIVA
  const COLORS = PALETTES[theme] || PALETTES.dark; 

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

  if (loading) return <div className="loading-overlay" style={{color: COLORS.TEXT}}>📡 Analyzing fastest lap...</div>;
  if (error) return <div className="loading-overlay" style={{color:'#ff4444'}}>{error}</div>;
  if (!data) return <div className="loading-overlay" style={{color: COLORS.TEXT}}>Waiting for data...</div>;

  const { telemetry, corners, lap_time, eventName } = data;

  // --- CONFIGURACIÓN DE ALINEADO ---
  const CHART_MARGIN = { top: 5, right: 10, left: 0, bottom: 0 };
  const Y_AXIS_WIDTH = 45; 

  // Usamos COLORS en lugar de THEME
  const CommonGrid = () => <CartesianGrid strokeDasharray="3 3" stroke={COLORS.GRID} opacity={0.3} />;
  
  const CommonXAxis = ({ hide = true }) => (
    <XAxis 
      dataKey="Distance" 
      type="number" 
      domain={['dataMin', 'dataMax']} 
      hide={hide} 
      tick={{ fill: '#888', fontSize: 10 }} // Gris neutro para el eje X
    />
  );

  const CornerLines = ({ showLabel }) => corners.map((c, i) => (
    <ReferenceLine key={i} x={c.Distance} stroke="#cccc00" strokeDasharray="2 2" opacity={0.5}
      label={showLabel ? { value: `T${c.Number}`, position: 'insideTop', fill: '#cccc00', fontSize: 9 } : null} />
  ));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{background: COLORS.TOOLTIP_BG, border:`1px solid ${COLORS.GRID}`, padding:'5px', fontSize:'0.8rem', zIndex:100}}>
          <div style={{color: COLORS.TEXT, marginBottom:3}}>Dist: {Math.round(payload[0].payload.Distance)}m</div>
          {payload.map((p,i)=><div key={i} style={{color:p.color}}>{p.name}: {p.value}</div>)}
        </div>
      );
    } return null;
  };

  const chartContainerStyle = { flex: 1, minHeight: 0, background: COLORS.BG_PLOT, marginBottom: '2px', position: 'relative' };
  const labelStyle = (color) => ({ position: 'absolute', top: 5, left: 60, fontSize: '0.7rem', fontWeight:'bold', color: color, zIndex: 10, pointerEvents:'none' });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: COLORS.BG_PANEL, padding: '5px' }}>
      <div className="panel-header" style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', padding:'5px 10px'}}>
        <div>
          <h3 style={{margin:0, fontSize:'0.9rem', color: COLORS.SPEED}}>{driverCode} - FASTEST LAP</h3>
          <small style={{color: COLORS.TEXT, opacity: 0.7}}>{eventName}</small>
        </div>
        <span style={{color: COLORS.TEXT, fontSize:'1.1rem', fontWeight:'bold', fontFamily:'monospace'}}>{lap_time}</span>
      </div>

      {/* 1. SPEED */}
      <div style={chartContainerStyle}>
        <span style={labelStyle(COLORS.SPEED)}>SPEED</span>
        <ResponsiveContainer>
          <LineChart data={telemetry} syncId="f1" margin={CHART_MARGIN}>
            <CommonGrid />
            <CommonXAxis />
            <YAxis domain={[0, 360]} width={Y_AXIS_WIDTH} tick={{fill: COLORS.SPEED, fontSize:10}} />
            <Tooltip content={<CustomTooltip />} />
            {CornerLines({ showLabel: true })}
            <Line type="monotone" dataKey="Speed" stroke={COLORS.SPEED} dot={false} strokeWidth={2} isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 2. THROTTLE */}
      <div style={chartContainerStyle}>
        <span style={labelStyle(COLORS.THROTTLE)}>THROTTLE</span>
        <ResponsiveContainer>
          <LineChart data={telemetry} syncId="f1" margin={CHART_MARGIN}>
            <CommonGrid />
            <CommonXAxis />
            <YAxis domain={[0, 110]} width={Y_AXIS_WIDTH} tick={{fill: COLORS.THROTTLE, fontSize:10}} />
            <Tooltip content={<CustomTooltip />} />
            {CornerLines({})}
            <Line type="stepAfter" dataKey="Throttle" stroke={COLORS.THROTTLE} dot={false} strokeWidth={2} isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 3. BRAKE */}
      <div style={chartContainerStyle}>
        <span style={labelStyle(COLORS.BRAKE)}>BRAKE</span>
        <ResponsiveContainer>
          <LineChart data={telemetry} syncId="f1" margin={CHART_MARGIN}>
            <CommonGrid />
            <CommonXAxis />
            <YAxis domain={[0, 1.1]} ticks={[0, 1]} width={Y_AXIS_WIDTH} tick={{fill: COLORS.BRAKE, fontSize:10}} />
            <Tooltip content={<CustomTooltip />} />
            {CornerLines({})}
            <Line type="stepAfter" dataKey="Brake" stroke={COLORS.BRAKE} dot={false} strokeWidth={2} isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 4. RPM */}
      <div style={chartContainerStyle}>
        <span style={labelStyle(COLORS.RPM)}>RPM</span>
        <ResponsiveContainer>
          <LineChart data={telemetry} syncId="f1" margin={CHART_MARGIN}>
            <CommonGrid />
            <CommonXAxis />
            <YAxis domain={['auto', 'auto']} width={Y_AXIS_WIDTH} tick={{fill: COLORS.RPM, fontSize:10}} />
            <Tooltip content={<CustomTooltip />} />
            {CornerLines({})}
            <Line type="monotone" dataKey="RPM" stroke={COLORS.RPM} dot={false} strokeWidth={1} isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 5. GEAR */}
      <div style={chartContainerStyle}>
        <span style={labelStyle(COLORS.GEAR)}>GEAR</span>
        <ResponsiveContainer>
          <LineChart data={telemetry} syncId="f1" margin={CHART_MARGIN}>
            <CommonGrid />
            <CommonXAxis hide={false} />
            <YAxis domain={[0, 9]} tickCount={9} width={Y_AXIS_WIDTH} tick={{fill: COLORS.GEAR, fontSize:10}} />
            <Tooltip content={<CustomTooltip />} />
            {CornerLines({})}
            <Line type="stepAfter" dataKey="nGear" stroke={COLORS.GEAR} dot={false} strokeWidth={2} isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TelemetryPanel;