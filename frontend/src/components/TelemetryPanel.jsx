import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// Colores extraídos de tu script Python
const COLORS = {
  SPEED: '#FF1801',
  THROTTLE: '#00D800',
  BRAKE: '#FFA500',
  RPM: '#9467BD',
  GEAR: '#1F77B4',
  BG: '#1a1a1a',
  GRID: '#444',
  TEXT: '#e0e0e0'
};

const TelemetryPanel = ({ data, circuitInfo }) => {
  if (!data || !data.telemetry) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#666',
        backgroundColor: '#0d0d0d'
      }}>
        Esperando datos de telemetría...
      </div>
    );
  }

  // Desestructuramos para facilitar uso
  const telemetry = data.telemetry; // Array de objetos { Distance, Speed, etc. }
  const corners = circuitInfo || []; // Array de objetos { Distance, Number }

  // Configuración común para todos los gráficos
  const CommonXAxis = ({ showLabel = false }) => (
    <XAxis 
      dataKey="Distance" 
      type="number" 
      domain={['dataMin', 'dataMax']} 
      tick={showLabel ? { fill: COLORS.TEXT, fontSize: 12 } : false}
      height={showLabel ? 30 : 0}
      stroke={COLORS.GRID}
    />
  );

  const CommonCartesianGrid = () => (
    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.GRID} opacity={0.3} />
  );

  // Tooltip personalizado oscuro
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid #333', padding: '10px' }}>
          <p style={{ color: '#fff', margin: 0 }}>Dist: {Math.round(label)}m</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: 0 }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Generador de Líneas de Curva (Verticales)
  const renderCornerLines = (showLabel) => {
    return corners.map((corner, i) => (
      <ReferenceLine
        key={i}
        x={corner.Distance}
        stroke="yellow"
        strokeDasharray="2 2"
        opacity={0.4}
        label={showLabel ? { 
          value: `T${corner.Number}`, 
          position: 'insideTopLeft', 
          fill: 'yellow', 
          fontSize: 10,
          opacity: 0.8
        } : null}
      />
    ));
  };

  return (
    <div className="telemetry-container" style={{ backgroundColor: '#0d0d0d', height: '100%', padding: '10px', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. SPEED CHART */}
      <div style={{ flex: 1, minHeight: 0, backgroundColor: COLORS.BG, marginBottom: '2px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={telemetry} syncId="f1Sync" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CommonCartesianGrid />
            <CommonXAxis />
            <YAxis domain={[0, 360]} tick={{ fill: COLORS.SPEED, fontSize: 11 }} width={40} />
            <Tooltip content={<CustomTooltip />} />
            {renderCornerLines(true)} {/* Solo mostramos etiquetas T1, T2 aquí */}
            <Line type="monotone" dataKey="Speed" stroke={COLORS.SPEED} dot={false} strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 2. THROTTLE CHART */}
      <div style={{ flex: 1, minHeight: 0, backgroundColor: COLORS.BG, marginBottom: '2px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={telemetry} syncId="f1Sync" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CommonCartesianGrid />
            <CommonXAxis />
            <YAxis domain={[0, 105]} tick={{ fill: COLORS.THROTTLE, fontSize: 11 }} width={40} />
            <Tooltip content={<CustomTooltip />} />
            {renderCornerLines(false)}
            <Line type="stepAfter" dataKey="Throttle" stroke={COLORS.THROTTLE} dot={false} strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 3. BRAKE CHART */}
      <div style={{ flex: 1, minHeight: 0, backgroundColor: COLORS.BG, marginBottom: '2px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={telemetry} syncId="f1Sync" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CommonCartesianGrid />
            <CommonXAxis />
            {/* Brake suele ser 0 o 1 (o 0-100), ajustamos domain */}
            <YAxis domain={[0, 1.1]} tick={{ fill: COLORS.BRAKE, fontSize: 11 }} width={40} />
            <Tooltip content={<CustomTooltip />} />
            {renderCornerLines(false)}
            <Line type="stepAfter" dataKey="Brake" stroke={COLORS.BRAKE} dot={false} strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 4. RPM CHART */}
      <div style={{ flex: 1, minHeight: 0, backgroundColor: COLORS.BG, marginBottom: '2px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={telemetry} syncId="f1Sync" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CommonCartesianGrid />
            <CommonXAxis />
            <YAxis domain={['auto', 'auto']} tick={{ fill: COLORS.RPM, fontSize: 11 }} width={40} />
            <Tooltip content={<CustomTooltip />} />
            {renderCornerLines(false)}
            <Line type="monotone" dataKey="RPM" stroke={COLORS.RPM} dot={false} strokeWidth={1.5} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 5. GEAR CHART */}
      <div style={{ flex: 1, minHeight: 0, backgroundColor: COLORS.BG }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={telemetry} syncId="f1Sync" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CommonCartesianGrid />
            {/* Solo el último gráfico muestra etiquetas en X */}
            <CommonXAxis showLabel={true} />
            <YAxis domain={[1, 8]} tick={{ fill: COLORS.GEAR, fontSize: 11 }} width={40} interval={0} />
            <Tooltip content={<CustomTooltip />} />
            {renderCornerLines(false)}
            <Line type="stepAfter" dataKey="nGear" stroke={COLORS.GEAR} dot={false} strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default TelemetryPanel;