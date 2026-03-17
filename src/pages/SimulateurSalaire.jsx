import { useState, useMemo } from 'react';

const C = { blue:'#5BA3C7', green:'#5BC78A', orange:'#5BC78A', red:'#C75B4E', purple:'#A85BC7', dark:'#1A1C20', light:'#9AA0AE', border:'#E8EAF0', bg:'#F8F9FB' };

const euro = (n) => new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:2 }).format(n ?? 0);
const pct  = (n) => `${Number(n).toFixed(2)}%`;

// ── Barèmes cotisations 2025 ──────────────────────────────────────────
const PLAFOND_SS_MENSUEL = 3925; // PASS mensuel 2025

const COTISATIONS_SALARIALES = [
  { nom:'Sécurité sociale maladie',        taux:0,      base:'brut',    plafond:null,              info:'Exonérée pour le salarié' },
  { nom:'Assurance vieillesse plafonnée',   taux:6.90,   base:'brut',    plafond:'plafond_ss',      info:'Dans la limite du PASS' },
  { nom:'Assurance vieillesse déplafonnée', taux:0.40,   base:'brut',    plafond:null,              info:'Sur la totalité du salaire' },
  { nom:'Allocations familiales',           taux:0,      base:'brut',    plafond:null,              info:'À la charge de l\'employeur' },
  { nom:'Chômage (AGS)',                    taux:0,      base:'brut',    plafond:null,              info:'À la charge de l\'employeur' },
  { nom:'Retraite complémentaire T1',       taux:3.15,   base:'brut',    plafond:'plafond_ss',      info:'Tranche 1 (AGIRC-ARRCO)' },
  { nom:'Retraite complémentaire T2',       taux:8.64,   base:'brut',    plafond:'t2',              info:'Tranche 2 : 1x à 8x PASS' },
  { nom:'CEG T1',                           taux:0.86,   base:'brut',    plafond:'plafond_ss',      info:'Contribution équilibre général' },
  { nom:'CEG T2',                           taux:1.08,   base:'brut',    plafond:'t2',              info:'Contribution équilibre général T2' },
  { nom:'CSG déductible',                   taux:6.80,   base:'csg',     plafond:null,              info:'98.25% du brut' },
  { nom:'CSG/CRDS non déductible',          taux:2.90,   base:'csg',     plafond:null,              info:'0.5% CRDS + 2.4% CSG non déd.' },
  { nom:'Prévoyance (estimation)',          taux:0.78,   base:'brut',    plafond:'plafond_ss',      info:'Variable selon convention' },
];

const COTISATIONS_PATRONALES = [
  { nom:'Sécurité sociale maladie',         taux:7.00,   base:'brut',    plafond:null              },
  { nom:'Accidents du travail',             taux:1.50,   base:'brut',    plafond:null              },
  { nom:'Allocations familiales',           taux:3.45,   base:'brut',    plafond:null              },
  { nom:'Assurance vieillesse plafonnée',   taux:8.55,   base:'brut',    plafond:'plafond_ss'      },
  { nom:'Assurance vieillesse déplafonnée', taux:1.90,   base:'brut',    plafond:null              },
  { nom:'Chômage',                          taux:4.05,   base:'brut',    plafond:null              },
  { nom:'AGS (garantie salaires)',          taux:0.15,   base:'brut',    plafond:null              },
  { nom:'Retraite complémentaire T1',       taux:4.72,   base:'brut',    plafond:'plafond_ss'      },
  { nom:'Retraite complémentaire T2',       taux:12.95,  base:'brut',    plafond:'t2'              },
  { nom:'CEG T1',                           taux:1.29,   base:'brut',    plafond:'plafond_ss'      },
  { nom:'CEG T2',                           taux:1.62,   base:'brut',    plafond:'t2'              },
  { nom:'FNAL',                             taux:0.50,   base:'brut',    plafond:null              },
  { nom:'Formation professionnelle',        taux:1.00,   base:'brut',    plafond:null              },
  { nom:'Taxe d\'apprentissage',            taux:0.68,   base:'brut',    plafond:null              },
  { nom:'Prévoyance (estimation)',          taux:1.50,   base:'brut',    plafond:'plafond_ss'      },
];

function calculerBase(brut, type, plafond) {
  const mensuel = brut;
  if (type === 'csg') return mensuel * 0.9825;
  if (!plafond) return mensuel;
  if (plafond === 'plafond_ss') return Math.min(mensuel, PLAFOND_SS_MENSUEL);
  if (plafond === 't2') return Math.max(0, Math.min(mensuel, PLAFOND_SS_MENSUEL * 8) - PLAFOND_SS_MENSUEL);
  return mensuel;
}

function calculer(brut) {
  const totSal = COTISATIONS_SALARIALES.reduce((s, c) => {
    const base = calculerBase(brut, c.base, c.plafond);
    return s + base * c.taux / 100;
  }, 0);

  const totPat = COTISATIONS_PATRONALES.reduce((s, c) => {
    const base = calculerBase(brut, c.base, c.plafond);
    return s + base * c.taux / 100;
  }, 0);

  const net = brut - totSal;
  const coutTotal = brut + totPat;

  return {
    brut, net, totSal, totPat, coutTotal,
    tauxSal: (totSal / brut) * 100,
    tauxPat: (totPat / brut) * 100,
    tauxGlobal: ((totSal + totPat) / brut) * 100,
    lignesSal: COTISATIONS_SALARIALES.map(c => ({
      ...c,
      montant: calculerBase(brut, c.base, c.plafond) * c.taux / 100,
    })),
    lignesPat: COTISATIONS_PATRONALES.map(c => ({
      ...c,
      montant: calculerBase(brut, c.base, c.plafond) * c.taux / 100,
    })),
  };
}

const iS = { width:'100%', padding:'10px 14px', borderRadius:9, background:'#fff', border:`1px solid #E8EAF0`, color:'#1A1C20', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
const lS = { fontSize:11, fontWeight:700, color:'#5A6070', marginBottom:6, display:'block', textTransform:'uppercase', letterSpacing:'0.05em' };

export default function SimulateurSalaire() {
  const [mode,   setMode]   = useState('brut'); // 'brut' | 'net'
  const [valeur, setValeur] = useState('');
  const [periode, setPeriode] = useState('mensuel');
  const [onglet,  setOnglet]  = useState('synthese');

  const brut = useMemo(() => {
    const v = parseFloat(valeur);
    if (!v || v <= 0) return 0;
    const mensuel = periode === 'annuel' ? v / 12 : v;
    if (mode === 'brut') return mensuel;
    // Net → Brut : approximation par itération
    let b = mensuel / 0.78;
    for (let i = 0; i < 20; i++) {
      const { net } = calculer(b);
      b = b + (mensuel - net) * 0.5;
    }
    return b;
  }, [valeur, mode, periode]);

  const result = useMemo(() => brut > 0 ? calculer(brut) : null, [brut]);

  const smic2025Mensuel = 1801.80;
  const rapportSmic = brut > 0 ? (brut / smic2025Mensuel) : 0;

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:900, margin:'0 auto' }}>

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:C.dark, margin:0 }}>
          Simulateur salaire net / brut
        </h1>
        <p style={{ fontSize:13, color:C.light, marginTop:4 }}>Barèmes 2025 · Secteur privé · Cadre ou non-cadre</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* ── Colonne gauche ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Mode */}
          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:22, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>Je saisis un salaire</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
              {[['brut','Brut → Net'],['net','Net → Brut']].map(([v,l]) => (
                <button key={v} onClick={() => setMode(v)} style={{ padding:'10px', borderRadius:9, border:'1px solid', borderColor:mode===v?C.blue:C.border, background:mode===v?`${C.blue}10`:'#F8F9FB', color:mode===v?C.blue:C.dark, fontSize:13, fontWeight:mode===v?700:400, cursor:'pointer', transition:'all 150ms', fontFamily:'inherit' }}>
                  {l}
                </button>
              ))}
            </div>

            <label style={lS}>Période</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
              {[['mensuel','Mensuel'],['annuel','Annuel']].map(([v,l]) => (
                <button key={v} onClick={() => setPeriode(v)} style={{ padding:'10px', borderRadius:9, border:'1px solid', borderColor:periode===v?C.blue:C.border, background:periode===v?`${C.blue}10`:'#F8F9FB', color:periode===v?C.blue:C.dark, fontSize:13, fontWeight:periode===v?700:400, cursor:'pointer', transition:'all 150ms', fontFamily:'inherit' }}>
                  {l}
                </button>
              ))}
            </div>

            <label style={lS}>Salaire {mode === 'brut' ? 'brut' : 'net'} {periode === 'mensuel' ? 'mensuel' : 'annuel'} (€)</label>
            <input type="number" value={valeur} onChange={e => setValeur(e.target.value)} placeholder={mode==='brut' ? 'Ex : 2500' : 'Ex : 1950'} style={iS} min="0"/>

            {brut > 0 && (
              <div style={{ marginTop:12, padding:'10px 14px', background:C.bg, borderRadius:9, border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:11, color:C.light, marginBottom:4 }}>Rapport au SMIC 2025 ({euro(smic2025Mensuel)}/mois brut)</div>
                <div style={{ height:6, background:'#E8EAF0', borderRadius:3, overflow:'hidden', marginBottom:4 }}>
                  <div style={{ width:`${Math.min(rapportSmic * 50, 100)}%`, height:'100%', background:rapportSmic < 1 ? C.red : rapportSmic < 2 ? C.orange : C.green, borderRadius:3, transition:'width 0.4s ease' }}/>
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:rapportSmic < 1 ? C.red : C.dark }}>
                  {rapportSmic < 1 ? '⚠️ En dessous du SMIC' : `${rapportSmic.toFixed(1)}× le SMIC`}
                </div>
              </div>
            )}
          </div>

          {/* Infos légales */}
          <div style={{ background:'rgba(91,163,199,0.06)', border:'1px solid rgba(91,163,199,0.15)', borderRadius:14, padding:18 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.blue, marginBottom:10 }}>ℹ️ Informations</div>
            {[
              'SMIC 2025 : 1 801,80 € brut/mois',
              'PASS 2025 : 47 100 € / an (3 925 €/mois)',
              'Taux moyen de cotisations salariales : ~22%',
              'Taux moyen de cotisations patronales : ~42%',
              'Ces calculs sont des estimations — ils varient selon la convention collective',
            ].map((info, i) => (
              <div key={i} style={{ fontSize:12, color:'#5A6070', padding:'3px 0', display:'flex', gap:6 }}>
                <span style={{ color:C.blue }}>→</span> {info}
              </div>
            ))}
          </div>
        </div>

        {/* ── Colonne droite ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {result ? (<>

            {/* KPIs principaux */}
            <div style={{ background:'linear-gradient(135deg, rgba(91,163,199,0.08), rgba(91,163,199,0.03))', border:`1px solid rgba(91,163,199,0.2)`, borderRadius:14, padding:22, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:11, color:C.light, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Salaire brut mensuel</div>
                  <div style={{ fontSize:24, fontWeight:700, color:C.dark }}>{euro(result.brut)}</div>
                  <div style={{ fontSize:11, color:C.light }}>Annuel : {euro(result.brut * 12)}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:C.light, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Salaire net mensuel</div>
                  <div style={{ fontSize:24, fontWeight:700, color:C.green }}>{euro(result.net)}</div>
                  <div style={{ fontSize:11, color:C.light }}>Annuel : {euro(result.net * 12)}</div>
                </div>
              </div>
              <div style={{ padding:'12px 16px', background:'rgba(199,91,78,0.06)', border:'1px solid rgba(199,91,78,0.15)', borderRadius:10 }}>
                <div style={{ fontSize:11, color:C.light, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Coût total employeur mensuel</div>
                <div style={{ fontSize:22, fontWeight:700, color:C.red }}>{euro(result.coutTotal)}</div>
                <div style={{ fontSize:11, color:C.light }}>Annuel : {euro(result.coutTotal * 12)}</div>
              </div>
            </div>

            {/* Répartition visuelle */}
            <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Répartition du coût total</div>
              {[
                { label:'Net salarié',          montant:result.net,    color:C.green,  pct:(result.net/result.coutTotal)*100 },
                { label:'Cotis. salariales',    montant:result.totSal, color:C.blue,   pct:(result.totSal/result.coutTotal)*100 },
                { label:'Cotis. patronales',    montant:result.totPat, color:C.red,    pct:(result.totPat/result.coutTotal)*100 },
              ].map(r => (
                <div key={r.label} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, color:'#5A6070', fontWeight:600 }}>{r.label}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:r.color }}>{euro(r.montant)} ({r.pct.toFixed(1)}%)</span>
                  </div>
                  <div style={{ height:8, background:'#F0F2F5', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${r.pct}%`, height:'100%', background:r.color, borderRadius:4, transition:'width 0.5s ease' }}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Onglets détail */}
            <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ display:'flex', borderBottom:`1px solid ${C.border}` }}>
                {[['synthese','Synthèse'],['salariales','Part salariale'],['patronales','Part patronale']].map(([id,label]) => (
                  <button key={id} onClick={() => setOnglet(id)} style={{ flex:1, padding:'11px 8px', border:'none', background:onglet===id?`${C.blue}08`:'#fff', color:onglet===id?C.blue:C.light, fontSize:12, fontWeight:onglet===id?700:500, cursor:'pointer', borderBottom:onglet===id?`2px solid ${C.blue}`:'2px solid transparent', fontFamily:'inherit', transition:'all 150ms' }}>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ maxHeight:260, overflowY:'auto' }}>
                {onglet === 'synthese' && (
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <tbody>
                      {[
                        { label:'Salaire brut',         value:euro(result.brut),      color:C.dark,   bold:true },
                        { label:'− Cotis. salariales',  value:`−${euro(result.totSal)}`,color:C.red  },
                        { label:'= Salaire net',        value:euro(result.net),       color:C.green,  bold:true },
                        { label:'+ Cotis. patronales',  value:`+${euro(result.totPat)}`,color:C.orange},
                        { label:'= Coût total employeur',value:euro(result.coutTotal), color:C.red,   bold:true },
                      ].map((r, i) => (
                        <tr key={i} style={{ borderBottom:`1px solid ${C.bg}` }}>
                          <td style={{ padding:'10px 16px', fontSize:13, color:'#5A6070' }}>{r.label}</td>
                          <td style={{ padding:'10px 16px', fontSize:13, fontWeight:r.bold?700:500, color:r.color, textAlign:'right' }}>{r.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {(onglet === 'salariales' || onglet === 'patronales') && (
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:C.bg }}>
                        <th style={{ padding:'8px 14px', fontSize:10, fontWeight:700, color:C.light, textAlign:'left', textTransform:'uppercase' }}>Cotisation</th>
                        <th style={{ padding:'8px 14px', fontSize:10, fontWeight:700, color:C.light, textAlign:'right', textTransform:'uppercase' }}>Taux</th>
                        <th style={{ padding:'8px 14px', fontSize:10, fontWeight:700, color:C.light, textAlign:'right', textTransform:'uppercase' }}>Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(onglet==='salariales' ? result.lignesSal : result.lignesPat)
                        .filter(l => l.montant > 0)
                        .map((l, i) => (
                          <tr key={i} style={{ borderBottom:`1px solid ${C.bg}`, background:i%2===0?'#fff':C.bg }}>
                            <td style={{ padding:'8px 14px', fontSize:11, color:C.dark }}>{l.nom}</td>
                            <td style={{ padding:'8px 14px', fontSize:11, color:C.light, textAlign:'right' }}>{pct(l.taux)}</td>
                            <td style={{ padding:'8px 14px', fontSize:12, fontWeight:600, color:onglet==='salariales'?C.blue:C.orange, textAlign:'right' }}>{euro(l.montant)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </>) : (
            <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:40, textAlign:'center', color:C.light, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>💼</div>
              <div style={{ fontSize:14, fontWeight:600 }}>Saisissez un salaire</div>
              <div style={{ fontSize:12, marginTop:6 }}>La simulation apparaîtra ici</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop:20, background:'rgba(212,168,83,0.06)', border:'1px solid rgba(212,168,83,0.2)', borderRadius:12, padding:'12px 16px', fontSize:12, color:'#92713A', lineHeight:1.6 }}>
        ⚠️ Simulation indicative basée sur les barèmes 2025. Les montants réels peuvent varier selon la convention collective, les accords d'entreprise et votre situation. Consultez votre expert-comptable ou DRH.
      </div>
    </div>
  );
}
