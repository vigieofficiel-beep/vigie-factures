import { useState } from "react";
import Tooltip from '../components/Tooltip';
import { TIPS } from '../utils/tooltips';

const C = { blue:'#5BA3C7', purple:'#A85BC7', dark:'#EDE8DB', light:'rgba(237,232,219,0.4)', border:'rgba(255,255,255,0.08)', bg:'rgba(255,255,255,0.06)', red:'#C75B4E', orange:'#5BC78A', green:'#5BC78A' };

const TAUX_TVA = [
  { label:'20% — Taux normal',        value:20,  desc:'Biens et services courants' },
  { label:'10% — Taux intermédiaire', value:10,  desc:'Restauration, travaux, transport' },
  { label:'5,5% — Taux réduit',       value:5.5, desc:'Alimentation, livres, énergie' },
  { label:'2,1% — Taux super réduit', value:2.1, desc:'Médicaments remboursables, presse' },
  { label:'0% — Exonéré',             value:0,   desc:'Exportations, auto-entrepreneur sans TVA' },
];

const REGIMES = [
  { label:'Franchise en base (auto-entrepreneur)', seuils:{ services:37500, commerce:85000 } },
  { label:'Réel simplifié',   seuils:null },
  { label:'Réel normal',      seuils:null },
];

const iS = { width:'100%', padding:'10px 14px', borderRadius:9, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#EDE8DB', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
const lS = { fontSize:11, fontWeight:700, color:'rgba(237,232,219,0.5)', marginBottom:6, display:'flex', alignItems:'center', gap:6, textTransform:'uppercase', letterSpacing:'0.05em' };

function Card({ children, style={} }) {
  return <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:24, boxShadow:'0 1px 6px rgba(0,0,0,0.05)', ...style }}>{children}</div>;
}

function ResultLine({ label, value, big=false, color=C.dark, sub=false }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding: sub ? '6px 0' : '10px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ fontSize: sub ? 12 : 13, color: sub ? C.light : '#5A6070' }}>{label}</span>
      <span style={{ fontSize: big ? 20 : 14, fontWeight: big ? 800 : 600, color }}>{value}</span>
    </div>
  );
}

function fmt(n) { return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR' }).format(n || 0); }

export default function CalculateurTVA() {
  const [mode,     setMode]     = useState('ht_vers_ttc');
  const [montant,  setMontant]  = useState('');
  const [taux,     setTaux]     = useState(20);
  const [regime,   setRegime]   = useState(0);
  const [caAnnuel, setCaAnnuel] = useState('');

  const m  = parseFloat(montant) || 0;
  const tx = parseFloat(taux) / 100;

  const ht  = mode === 'ht_vers_ttc' ? m : m / (1 + tx);
  const tva = ht * tx;
  const ttc = ht + tva;

  const ca = parseFloat(caAnnuel) || 0;
  const seuils = REGIMES[regime].seuils;
  const depasseServices = seuils && ca > seuils.services;
  const depasseCommerce = seuils && ca > seuils.commerce;

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:900, margin:'0 auto' }}>

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:C.dark, margin:0, display:'flex', alignItems:'center', gap:10 }}>
          Calculateur TVA <Tooltip text={TIPS.tva} size={16}/>
        </h1>
        <p style={{ fontSize:13, color:C.light, marginTop:4 }}>Calcul HT / TTC et vérification de régime</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Colonne gauche — Saisie */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          <Card>
            <label style={lS}>Mode de calcul</label>
            <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.06)', borderRadius:10, padding:4 }}>
              {[['ht_vers_ttc','HT → TTC'],['ttc_vers_ht','TTC → HT']].map(([val,lab])=>(
                <button key={val} onClick={()=>setMode(val)} style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:mode===val?'rgba(91,163,199,0.15)':'transparent', color:mode===val?C.dark:C.light, fontSize:13, fontWeight:mode===val?700:500, cursor:'pointer', boxShadow:mode===val?'0 1px 3px rgba(0,0,0,0.08)':'none', transition:'all 150ms' }}>
                  {lab}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <label style={lS}>
              Montant {mode === 'ht_vers_ttc' ? <><span style={{display:'flex',alignItems:'center',gap:4}}>HT (€) <Tooltip text={TIPS.ht}/></span></> : <><span style={{display:'flex',alignItems:'center',gap:4}}>TTC (€) <Tooltip text={TIPS.ttc}/></span></>}
            </label>
            <input type="number" value={montant} onChange={e=>setMontant(e.target.value)} placeholder="0,00" min="0" step="0.01" style={{ ...iS, fontSize:22, fontWeight:700, textAlign:'right', color:C.blue }} />
          </Card>

          <Card>
            <label style={lS}>Taux de TVA <Tooltip text={TIPS.taux_tva}/></label>
            {TAUX_TVA.map(t=>(
              <div key={t.value} onClick={()=>setTaux(t.value)} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:9, marginBottom:4, cursor:'pointer', background:taux===t.value?`${C.blue}10`:'transparent', border:`1px solid ${taux===t.value?C.blue:'transparent'}`, transition:'all 150ms' }}>
                <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${taux===t.value?C.blue:'#D0D4DC'}`, background:taux===t.value?C.blue:'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {taux===t.value&&<div style={{ width:7, height:7, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:taux===t.value?700:500, color:taux===t.value?C.blue:C.dark }}>{t.label}</div>
                  <div style={{ fontSize:11, color:C.light }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Colonne droite — Résultats */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          <Card style={{ background:`linear-gradient(135deg, ${C.blue}08, ${C.purple}08)`, border:`1px solid ${C.blue}30` }}>
            <h2 style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 16px' }}>Résultat</h2>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize:13, color:'rgba(237,232,219,0.5)', display:'flex', alignItems:'center', gap:5 }}>Montant HT <Tooltip text={TIPS.ht} size={12}/></span>
              <span style={{ fontSize:14, fontWeight:600, color:C.dark }}>{fmt(ht)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize:13, color:'rgba(237,232,219,0.5)', display:'flex', alignItems:'center', gap:5 }}>TVA ({taux}%) <Tooltip text={TIPS.taux_tva} size={12}/></span>
              <span style={{ fontSize:14, fontWeight:600, color:C.orange }}>{fmt(tva)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:14, marginTop:4 }}>
              <span style={{ fontSize:15, fontWeight:700, color:C.dark, display:'flex', alignItems:'center', gap:6 }}>
                Montant TTC <Tooltip text={TIPS.ttc} size={13}/>
              </span>
              <span style={{ fontSize:28, fontWeight:800, color:C.blue }}>{fmt(ttc)}</span>
            </div>
          </Card>

          {taux > 0 && m > 0 && (
            <Card>
              <h2 style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 14px', display:'flex', alignItems:'center', gap:6 }}>
                TVA à déclarer <Tooltip text={TIPS.tva} size={12}/>
              </h2>
              <ResultLine label="TVA collectée (vente)"  value={fmt(tva)} color={C.red} sub />
              <ResultLine label="TVA déductible (achat)" value="À saisir dans vos dépenses" sub />
              <div style={{ marginTop:12, background:'#F0FDF4', border:'1px solid rgba(91,199,138,0.3)', borderRadius:9, padding:'10px 14px', fontSize:12, color:'#5BC78A' }}>
                💡 TVA nette = TVA collectée − TVA déductible
              </div>
            </Card>
          )}

          <Card>
            <h2 style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 14px' }}>Vérification franchise TVA</h2>
            <div style={{ marginBottom:14 }}>
              <label style={lS}>Votre régime TVA</label>
              <select value={regime} onChange={e=>setRegime(Number(e.target.value))} style={{ ...iS, cursor:'pointer' }}>
                {REGIMES.map((r,i)=><option key={i} value={i}>{r.label}</option>)}
              </select>
            </div>
            {seuils && (
              <>
                <div style={{ marginBottom:12 }}>
                  <label style={lS}>Chiffre d'affaires annuel (€)</label>
                  <input type="number" value={caAnnuel} onChange={e=>setCaAnnuel(e.target.value)} placeholder="0" style={iS}/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background: depasseServices?'rgba(199,91,78,0.07)':'rgba(91,188,138,0.07)', border:`1px solid ${depasseServices?'rgba(199,91,78,0.25)':'rgba(91,188,138,0.25)'}`, borderRadius:9, padding:'10px 14px' }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color: depasseServices?C.red:C.green }}>Seuil services</div>
                      <div style={{ fontSize:11, color:C.light }}>{fmt(seuils.services)}/an</div>
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color: depasseServices?C.red:C.green }}>{depasseServices?'⚠️ DÉPASSÉ':'✓ OK'}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background: depasseCommerce?'rgba(199,91,78,0.07)':'rgba(91,188,138,0.07)', border:`1px solid ${depasseCommerce?'rgba(199,91,78,0.25)':'rgba(91,188,138,0.25)'}`, borderRadius:9, padding:'10px 14px' }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color: depasseCommerce?C.red:C.green }}>Seuil commerce/hébergement</div>
                      <div style={{ fontSize:11, color:C.light }}>{fmt(seuils.commerce)}/an</div>
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color: depasseCommerce?C.red:C.green }}>{depasseCommerce?'⚠️ DÉPASSÉ':'✓ OK'}</span>
                  </div>
                  {(depasseServices||depasseCommerce)&&(
                    <div style={{ background:'rgba(199,91,78,0.06)', border:'1px solid rgba(199,91,78,0.2)', borderRadius:9, padding:'10px 14px', fontSize:12, color:C.red, fontWeight:600 }}>
                      ⚠️ Vous devez facturer la TVA. Consultez un comptable pour changer de régime.
                    </div>
                  )}
                </div>
              </>
            )}
            {!seuils && (
              <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:9, padding:'12px 14px', fontSize:13, color:C.light, textAlign:'center' }}>
                Régime au réel — TVA obligatoire sur toutes les factures.
              </div>
            )}
          </Card>

          <Card>
            <h2 style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 12px', display:'flex', alignItems:'center', gap:6 }}>
              Rappel des taux français <Tooltip text={TIPS.taux_tva} size={12}/>
            </h2>
            {TAUX_TVA.filter(t=>t.value>0).map(t=>(
              <div key={t.value} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize:12, color:'rgba(237,232,219,0.5)' }}>{t.desc}</span>
                <span style={{ fontSize:12, fontWeight:700, color:C.blue }}>{t.value}%</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
