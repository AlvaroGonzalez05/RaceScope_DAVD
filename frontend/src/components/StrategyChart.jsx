import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';

const COMPOUND_COLORS = {
  'SOFT': '#FF3333',
  'MEDIUM': '#FFD700',
  'HARD': '#F0F0F0',
  'INTERMEDIATE': '#39B54A',
  'WET': '#00AEEF'
};

const COMPOUND_SHORTHAND = {
  'SOFT': 'S',
  'MEDIUM': 'M',
  'HARD': 'H',
  'INTERMEDIATE': 'I',
  'WET': 'W'
};

const StrategyChart = ({ strategies }) => {
  // 1. Calcular Vueltas Totales (para fijar el Eje X)
  const totalRaceLaps = strategies.length > 0 
    ? strategies[0].laps.reduce((a, b) => a + b, 0) 
    : 60;

  // 2. Transformar Datos
  const chartData = strategies.map((strat, index) => {
    // Calculamos la diferencia aquí mismo para ponerla en la etiqueta
    const diffSeconds = strat.total_time - strategies[0].total_time;
    const diffText = index === 0 ? 'Fastest' : `+${diffSeconds.toFixed(1)}s`;

    const dataPoint = {
      name: `Option ${index + 1}`,
      // Esta es la clave: combinamos nombre + diferencia para el Eje Y
      yLabel: `Opt ${index + 1} (${diffText})`,
      totalTime: strat.formatted_time,
      diff: diffText,
    };

    let currentLap = 0;
    strat.laps.forEach((lapLength, i) => {
      currentLap += lapLength;
      
      dataPoint[`stint_${i}`] = lapLength; 
      dataPoint[`compound_${i}`] = strat.compounds[i];
      
      // Etiqueta de vuelta de parada (L18)
      const isLastStint = i === strat.laps.length - 1;
      dataPoint[`stop_label_${i}`] = isLastStint ? null : `L${currentLap}`;
    });

    return dataPoint;
  });

  const maxStints = Math.max(...strategies.map(s => s.laps.length));

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid #444', padding: '10px', zIndex: 100 }}>
          {/* Usamos el nombre original para el tooltip */}
          <p style={{ margin: 0, fontWeight: 'bold', color: '#fff' }}>{data.name}</p>
          <p style={{ margin: '5px 0', color: '#ccc', fontSize: '0.9rem' }}>
            Time: <span style={{ color: '#fff' }}>{data.totalTime}</span> ({data.diff})
          </p>
          <div style={{ marginTop: '5px', fontSize: '0.8rem' }}>
            {payload.map((entry, index) => {
              if (!entry.dataKey.startsWith('stint_')) return null;
              const stintIndex = entry.dataKey.split('_')[1];
              const compound = data[`compound_${stintIndex}`];
              if (!compound) return null;
              return (
                <div key={index} style={{ color: COMPOUND_COLORS[compound] }}>
                  Stint {parseInt(stintIndex) + 1}: {compound} ({entry.value} laps)
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '0' }}>
      <ResponsiveContainer>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#444" opacity={0.3} />
          
          <XAxis 
            type="number" 
            domain={[0, totalRaceLaps]} 
            stroke="#888" 
            tick={{ fill: '#888', fontSize: 10 }}
            tickCount={8} 
          />
          
          <YAxis 
            type="category" 
            dataKey="yLabel" // <--- CAMBIO: Usamos la etiqueta compuesta
            stroke="#fff" 
            tick={{ fill: '#fff', fontWeight: 'bold', fontSize: 11 }} 
            width={110} // <--- CAMBIO: Más espacio para el texto "(+3.5s)"
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />

          {Array.from({ length: maxStints }).map((_, i) => (
            <Bar 
              key={i} 
              dataKey={`stint_${i}`} 
              stackId="a" 
              isAnimationActive={true}
              barSize={35}
            >
              {
                chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COMPOUND_COLORS[entry[`compound_${i}`]] || '#333'} 
                    stroke="black"
                  />
                ))
              }
              
              {/* Etiqueta 1: Compuesto (S, M, H) */}
              <LabelList 
                dataKey={`compound_${i}`} 
                position="center" 
                formatter={(value) => COMPOUND_SHORTHAND[value]}
                style={{ fill: 'black', fontWeight: '900', fontSize: '14px', opacity: 0.7 }}
              />

              {/* Etiqueta 2: Vuelta de Parada (L18) */}
              <LabelList 
                dataKey={`stop_label_${i}`} 
                position="insideRight" 
                offset={5}
                style={{ fill: 'black', fontWeight: 'bold', fontSize: '11px' }}
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StrategyChart;