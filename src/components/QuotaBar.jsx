export function QuotaBar({ label, used, max, unit = '' }) {
  const pct     = Math.min((used / max) * 100, 100);
  const isAlert = pct >= 90;
  const color   = isAlert ? '#C75B4E' : pct > 60 ? '#5BC78A' : '#5BC78A';

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{label}</span>
        <span style={{ fontSize:10, color, fontWeight:600 }}>
          {used}/{max}{unit} {isAlert && '⚠️'}
        </span>
      </div>
      <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden' }}>
        <div style={{
          height:'100%', width:`${pct}%`,
          background: color,
          borderRadius:2, transition:'width 0.5s',
        }} />
      </div>
    </div>
  );
}