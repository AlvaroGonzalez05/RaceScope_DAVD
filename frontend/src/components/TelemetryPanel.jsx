import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const COLORS = { SPEED: '#FF1801', THROTTLE: '#00D800', BRAKE: '#FFA500', RPM: '#9467BD', GEAR: '#1F77B4', GRID: '#444' };

const TelemetryPanel = ({ data }) => {
  if (!data || !data.telemetry) return <div style={{padding:20, color:'#666'}}>Sin datos de telemetría</div>;
  const tdata = data.telemetry;

  const CommonGrid = () => <CartesianGrid strokeDasharray="3 3" stroke={COLORS.GRID} opacity={0.2} />;
  const CommonX = ({ hide=true }) => <XAxis dataKey="Distance" type="number" hide={hide} domain={['dataMin','dataMax']} />;
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{background:'rgba(0,0,0,0.9)', border:'1px solid #333', padding:'5px 10px', fontSize:'0.8rem'}}>
          {payload.map((p, i) => <div key={i} style={{color:p.color}}>{p.name}: {Math.round(p.value)}</div>)}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column', background:'#0d0d0d'}}>
      <div className="panel-header"><h3>Telemetría (Fastest Lap)</h3></div>
      
      {/* 1. SPEED */}
      <div style={{flex:1, minHeight:0}}>
        <ResponsiveContainer>
          <LineChart data={tdata} syncId="f1" margin={{top:5, right:10, left:-20, bottom:0}}>
            <CommonGrid /><CommonX />
            <YAxis domain={[0, 360]} tick={{fontSize:10, fill:COLORS.SPEED}} width={35}/>
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="Speed" stroke={COLORS.SPEED} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 2. THROTTLE */}
      <div style={{flex:1, minHeight:0}}>
        <ResponsiveContainer>
          <LineChart data={tdata} syncId="f1" margin={{top:5, right:10, left:-20, bottom:0}}>
            <CommonGrid /><CommonX />
            <YAxis domain={[0, 110]} tick={{fontSize:10, fill:COLORS.THROTTLE}} width={35}/>
            <Tooltip content={<CustomTooltip />} />
            <Line type="stepAfter" dataKey="Throttle" stroke={COLORS.THROTTLE} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 3. BRAKE */}
      <div style={{flex:1, minHeight:0}}>
        <ResponsiveContainer>
          <LineChart data={tdata} syncId="f1" margin={{top:5, right:10, left:-20, bottom:0}}>
            <CommonGrid /><CommonX />
            <YAxis domain={[0, 1.2]} tick={{fontSize:10, fill:COLORS.BRAKE}} width={35}/>
            <Tooltip content={<CustomTooltip />} />
            <Line type="stepAfter" dataKey="Brake" stroke={COLORS.BRAKE} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 4. RPM */}
      <div style={{flex:1, minHeight:0}}>
        <ResponsiveContainer>
          <LineChart data={tdata} syncId="f1" margin={{top:5, right:10, left:-20, bottom:0}}>
            <CommonGrid /><CommonX />
            <YAxis domain={['auto','auto']} tick={{fontSize:10, fill:COLORS.RPM}} width={35}/>
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="RPM" stroke={COLORS.RPM} dot={false} strokeWidth={1} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 5. GEAR */}
      <div style={{flex:1, minHeight:0}}>
        <ResponsiveContainer>
          <LineChart data={tdata} syncId="f1" margin={{top:5, right:10, left:-20, bottom:0}}>
            <CommonGrid />
            <XAxis dataKey="Distance" type="number" tick={{fontSize:10, fill:'#666'}} height={20}/>
            <YAxis domain={[0, 9]} tick={{fontSize:10, fill:COLORS.GEAR}} width={35}/>
            <Tooltip content={<CustomTooltip />} />
            <Line type="stepAfter" dataKey="nGear" stroke={COLORS.GEAR} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default TelemetryPanel;
