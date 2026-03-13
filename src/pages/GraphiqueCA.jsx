/**
 * GraphiqueCA — Courbe évolution CA mensuel
 * Utilisable en composant standalone ET dans ProHome
 * Props: compact=false (page dédiée) | compact=true (widget dashboard)
 */
import { useState, useEffect, useRef } from "react";
import { supabasePro } from "../lib/supabasePro";

const C = { blue:'#5BA3C7', purple:'#A85BC7', dark:'#1A1C20', light:'#9AA0AE', border:'#E8EAF0', red:'#C75B4E', orange:'#D4A853', green:'#5BC78A' };

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function fmt(n) {
  if (n >= 1000) return `${(n/1000).toFixed(1)}k€`;
  return `${Math.round(n)}€`;
}

function buildDonnees(devis, annee) {
  const parMois = Array(12).fill(0);
  for (const d of devis) {
    const date = new Date(d.date_emission);
    if (date.getFullYear() !== annee) continue;
    parMois[date.getMonth()] += d.montant_ht || 0;
  }
  return parMois;
}

function CourbeSVG({ data, width, height, color, compact }) {
  if (!data || data.every(v => v === 0)) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height, color:C.light, fontSize:13 }}>
      Aucune donnée pour cette période
    </div>
  );

  const padL = compact ? 40 : 52;
  const padR = 20;
  const padT = 20;
  const padB = compact ? 28 : 36;
  const W = width - padL - padR;
  const H = height - padT - padB;

  const max   = Math.max(...data, 1);
  const nbPts = data.length;

  const pts = data.map((v, i) => ({
    x: padL + (i / (nbPts - 1)) * W,
    y: padT + H - (v / max) * H,
    v,
  }));

  // Courbe lissée avec bezier
  const path = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i-1];
    const cx = (prev.x + p.x) / 2;
    return `C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }).join(' ');

  // Zone remplie
  const fill = `${path} L ${pts[pts.length-1].x} ${padT+H} L ${pts[0].x} ${padT+H} Z`;

  // Lignes horizontales guide
  const guides = [0.25, 0.5, 0.75, 1].map(f => ({
    y: padT + H - f * H,
    val: max * f,
  }));

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow:'visible' }}>
      {/* Grille */}
      {guides.map((g, i) => (
        <g key={i}>
          <line x1={padL} y1={g.y} x2={padL+W} y2={g.y} stroke="#F0F2F5" strokeWidth="1"/>
          <text x={padL-6} y={g.y+4} textAnchor="end" fontSize={compact?9:10} fill={C.light}>{fmt(g.val)}</text>
        </g>
      ))}

      {/* Zone remplie */}
      <defs>
        <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.01"/>
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#gradCA)"/>

      {/* Courbe */}
      <path d={path} fill="none" stroke={color} strokeWidth={compact?2:2.5} strokeLinecap="round"/>

      {/* Points */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={compact?3:4} fill="#fff" stroke={color} strokeWidth={1.5}/>
          {!compact && p.v > 0 && (
            <text x={p.x} y={p.y-10} textAnchor="middle" fontSize={9} fill={C.light} fontWeight="600">{fmt(p.v)}</text>
          )}
        </g>
      ))}

      {/* Labels mois */}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={padT+H+18} textAnchor="middle" fontSize={compact?9:10} fill={C.light}>
          {MOIS[i]}
        </text>
      ))}
    </svg>
  );
}

export default function GraphiqueCA({ compact = false }) {
  const [devis,    setDevis]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [annee,    setAnnee]    = useState(new Date().getFullYear());
  const containerRef = useRef(null);
  const [width,    setWidth]    = useState(600);

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      if (entries[0]) setWidth(entries[0].contentRect.width);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabasePro.auth.getUser();
      if (!user) return;
      const { data } = await supabasePro
        .from('devis')
        .select('montant_ht, date_emission')
        .eq('user_id', user.id)
        .eq('statut', 'accepté');
      setDevis(data || []);
      setLoading(false);
    })();
  }, []);

  const data     = buildDonnees(devis, annee);
  const total    = data.reduce((s, v) => s + v, 0);
  const meilleur = MOIS[data.indexOf(Math.max(...data))];
  const moisActif= data.filter(v => v > 0).length;
  const hauteur  = compact ? 160 : 260;
  const annees   = [new Date().getFullYear(), new Date().getFullYear()-1, new Date().getFullYear()-2];

  if (compact) return (
    <div ref={containerRef} style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div>
          <p style={{ fontSize:11, color:C.light, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>Évolution CA</p>
          <p style={{ fontSize:18, fontWeight:800, color:C.blue, margin:'4px 0 0' }}>{fmt(total)}</p>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {annees.map(a => (
            <button key={a} onClick={() => setAnnee(a)} style={{ padding:'4px 8px', borderRadius:6, border:'none', background:annee===a?C.blue:'#F0F2F5', color:annee===a?'#fff':C.light, fontSize:10, fontWeight:700, cursor:'pointer' }}>{a}</button>
          ))}
        </div>
      </div>
      {loading ? <div style={{ height:hauteur, display:'flex', alignItems:'center', justifyContent:'center', color:C.light, fontSize:12 }}>Chargement...</div>
               : <CourbeSVG data={data} width={width||400} height={hauteur} color={C.blue} compact={true}/>}
    </div>
  );

  // Mode page dédiée
  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:1000, margin:'0 auto' }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:C.dark, margin:0 }}>Graphiques</h1>
        <p style={{ fontSize:13, color:C.light, marginTop:4 }}>Évolution de votre chiffre d'affaires</p>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'CA annuel', value:fmt(total), color:C.blue },
          { label:'Meilleur mois', value:meilleur || '—', color:C.green },
          { label:'Mois actifs', value:`${moisActif} / 12`, color:C.purple },
          { label:'Moyenne mensuelle', value:moisActif > 0 ? fmt(total/moisActif) : '—', color:C.orange },
        ].map(k => (
          <div key={k.label} style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize:11, color:C.light, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>{k.label}</p>
            <p style={{ fontSize:22, fontWeight:700, color:k.color, margin:0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Graphique principal */}
      <div ref={containerRef} style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:'24px 28px', boxShadow:'0 1px 6px rgba(0,0,0,0.06)', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:C.dark, margin:0 }}>CA mensuel {annee}</h2>
          <div style={{ display:'flex', gap:6 }}>
            {annees.map(a => (
              <button key={a} onClick={() => setAnnee(a)} style={{ padding:'6px 12px', borderRadius:8, border:'none', background:annee===a?C.blue:'#F0F2F5', color:annee===a?'#fff':C.light, fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 150ms' }}>{a}</button>
            ))}
          </div>
        </div>
        {loading
          ? <div style={{ height:hauteur, display:'flex', alignItems:'center', justifyContent:'center', color:C.light }}>Chargement...</div>
          : <CourbeSVG data={data} width={width||700} height={hauteur} color={C.blue} compact={false}/>}
      </div>

      {/* Tableau mensuel */}
      <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #F0F2F5' }}>
              {['Mois','CA HT','Part annuelle','Barre'].map(h => (
                <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((v, i) => {
              const pct = total > 0 ? (v / total) * 100 : 0;
              const isBest = v === Math.max(...data) && v > 0;
              return (
                <tr key={i} style={{ borderBottom:'1px solid #F8F9FB', background: isBest ? `${C.green}05` : 'transparent' }}>
                  <td style={{ padding:'10px 16px', fontSize:13, color:C.dark, fontWeight: isBest ? 700 : 400 }}>
                    {MOIS[i]} {isBest && <span style={{ fontSize:10, background:`${C.green}15`, color:C.green, padding:'1px 6px', borderRadius:10, marginLeft:4 }}>Meilleur</span>}
                  </td>
                  <td style={{ padding:'10px 16px', fontSize:13, fontWeight:600, color: v > 0 ? C.blue : C.light }}>{v > 0 ? fmt(v) : '—'}</td>
                  <td style={{ padding:'10px 16px', fontSize:12, color:C.light }}>{v > 0 ? `${pct.toFixed(1)}%` : '—'}</td>
                  <td style={{ padding:'10px 16px', width:160 }}>
                    <div style={{ height:6, background:'#F0F2F5', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ width:`${pct}%`, height:'100%', background:`linear-gradient(90deg,${C.blue},${C.purple})`, borderRadius:3, transition:'width 0.4s ease' }}/>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
