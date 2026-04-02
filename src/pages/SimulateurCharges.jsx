import { useState } from "react";
import { AE, SOCIETES, TRANCHES_IR, IS, SEUILS_FRANCHISE_TVA } from "../constants";
import Tooltip from '../components/Tooltip';
import { TIPS } from '../utils/tooltips';

const C = { blue:'#5BA3C7', purple:'#A85BC7', dark:'#EDE8DB', light:'rgba(237,232,219,0.4)', border:'rgba(255,255,255,0.08)', red:'#C75B4E', orange:'#D4A853', green:'#5BC78A' };
const iS = { width:'100%', padding:'10px 14px', borderRadius:9, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#EDE8DB', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
const lS = { fontSize:11, fontWeight:700, color:'rgba(237,232,219,0.5)', marginBottom:6, display:'flex', alignItems:'center', gap:6, textTransform:'uppercase', letterSpacing:'0.05em' };

function fmt(n) { return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(n||0); }
function fmtPct(n) { return `${n.toFixed(1)}%`; }

function calculerIR(revenuImposable) {
  let ir = 0;
  for (const t of TRANCHES_IR) {
    if (revenuImposable <= t.min) break;
    ir += (Math.min(revenuImposable, t.max) - t.min) * t.taux;
  }
  return Math.max(0, ir);
}

const TOUS_STATUTS = {
  ...Object.fromEntries(Object.entries(AE).map(([k,v]) => [`ae_${k}`, { ...v, isAE: true }])),
  ...Object.fromEntries(Object.entries(SOCIETES).map(([k,v]) => [k, { ...v, isAE: false }])),
};

function calculerAE(ca, statut) {
  const s = TOUS_STATUTS[statut];
  const cotisations = ca * s.cotisations;
  const revenuNet = ca - cotisations;
  const revenuImposable = ca * (1 - s.abattement);
  const ir = calculerIR(revenuImposable);
  const vlOption = ca * s.versement_liberatoire;
  const resteVivreBareme = revenuNet - ir;
  const resteVivreVL = revenuNet - vlOption;
  const txEffectif = (cotisations + ir) / ca * 100;
  return { ca, cotisations, cotisationsMensuelle:cotisations/12, irMensuel:ir/12, aMettreDeCote:(cotisations/12)+(ir/12), revenuNet, revenuImposable, ir, vlOption, resteVivreBareme, resteVivreVL, txEffectif, depassePlafond:ca>s.plafond_ca, plafond:s.plafond_ca };
}

function calculerSociete(remuneration, statut) {
  const s = TOUS_STATUTS[statut];
  const charges = remuneration * s.cotisations_base;
  const coutTotal = remuneration + charges;
  const ir = calculerIR(remuneration * 0.9);
  const resteVivre = remuneration - ir;
  const txEffectif = (charges + ir) / coutTotal * 100;
  return { remuneration, charges, chargesMensuelles:charges/12, irMensuel:ir/12, aMettreDeCote:(charges/12)+(ir/12), coutTotal, ir, resteVivre, txEffectif };
}

function Bloc({ label, value, color=C.dark, sub=false, highlight=false }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:sub?'6px 0':'10px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', background:highlight?'rgba(91,163,199,0.04)':'transparent', borderRadius:highlight?6:0, paddingLeft:highlight?8:0, paddingRight:highlight?8:0 }}>
      <span style={{ fontSize:sub?11:13, color:sub?C.light:'#5A6070' }}>{label}</span>
      <span style={{ fontSize:highlight?18:sub?12:14, fontWeight:highlight?800:sub?500:600, color }}>{value}</span>
    </div>
  );
}

function AlerteMiseDeCoté({ cotisations, ir, label="charges sociales" }) {
  const total = cotisations + ir;
  return (
    <div style={{ background:'rgba(199,91,78,0.06)', border:'1px solid rgba(199,91,78,0.2)', borderRadius:12, padding:'14px 16px', marginTop:8 }}>
      <div style={{ fontSize:12, fontWeight:700, color:C.red, marginBottom:8 }}>💰 À mettre de côté chaque mois</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
        <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'10px', textAlign:'center' }}>
          <div style={{ fontSize:10, color:C.light, marginBottom:4, textTransform:'uppercase' }}>{label}</div>
          <div style={{ fontSize:16, fontWeight:700, color:C.red }}>{fmt(cotisations)}/mois</div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'10px', textAlign:'center' }}>
          <div style={{ fontSize:10, color:C.light, marginBottom:4, textTransform:'uppercase' }}>Impôt sur le revenu</div>
          <div style={{ fontSize:16, fontWeight:700, color:C.orange }}>{fmt(ir)}/mois</div>
        </div>
        <div style={{ background:'rgba(199,91,78,0.08)', borderRadius:8, padding:'10px', textAlign:'center', border:'1px solid rgba(199,91,78,0.2)' }}>
          <div style={{ fontSize:10, color:C.red, marginBottom:4, textTransform:'uppercase', fontWeight:700 }}>Total à réserver</div>
          <div style={{ fontSize:16, fontWeight:800, color:C.red }}>{fmt(total)}/mois</div>
        </div>
      </div>
      <p style={{ fontSize:11, color:'rgba(199,91,78,0.7)', marginTop:8, marginBottom:0 }}>
        ⚠️ Ces sommes sont dues à l'État. Mettez-les de côté dès réception de vos revenus pour éviter les mauvaises surprises.
      </p>
    </div>
  );
}

export default function SimulateurCharges() {
  const [statut,  setStatut]  = useState('ae_bnc');
  const [montant, setMontant] = useState('');

  const isAE = TOUS_STATUTS[statut]?.isAE;
  const s    = TOUS_STATUTS[statut];
  const m    = parseFloat(montant) || 0;

  const resAE  = isAE && m > 0 ? calculerAE(m, statut) : null;
  const resSoc = !isAE && m > 0 ? calculerSociete(m, statut) : null;

  const groupes = [
    { label:'Auto-entrepreneurs', items:Object.entries(TOUS_STATUTS).filter(([k])=>k.startsWith('ae_')) },
    { label:'Sociétés',           items:Object.entries(TOUS_STATUTS).filter(([k])=>!k.startsWith('ae_')) },
  ];

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:900, margin:'0 auto' }}>

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:C.dark, margin:0, display:'flex', alignItems:'center', gap:10 }}>
          Simulateur de charges sociales <Tooltip text={TIPS.charges_sociales} size={16}/>
        </h1>
        <p style={{ fontSize:13, color:C.light, marginTop:4 }}>Estimation 2025 — à titre indicatif, consultez un expert-comptable pour validation</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Colonne gauche */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:24, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>Votre statut juridique</label>
            {groupes.map(g=>(
              <div key={g.label}>
                <div style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.08em', padding:'8px 0 4px', marginTop:4 }}>{g.label}</div>
                {g.items.map(([key,val])=>(
                  <div key={key} onClick={()=>setStatut(key)} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 12px', borderRadius:9, marginBottom:4, cursor:'pointer', background:statut===key?`${C.blue}10`:'transparent', border:`1px solid ${statut===key?C.blue:'transparent'}`, transition:'all 150ms' }}>
                    <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${statut===key?C.blue:'#D0D4DC'}`, background:statut===key?C.blue:'transparent', flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {statut===key&&<div style={{ width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>}
                    </div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:statut===key?700:500, color:statut===key?C.blue:C.dark, lineHeight:1.4 }}>{val.label}</div>
                      <div style={{ fontSize:11, color:C.light, marginTop:1 }}>{val.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:24, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>
              {isAE ? "Chiffre d'affaires annuel (€)" : "Rémunération annuelle souhaitée (€)"}
              <Tooltip text={TIPS.charges_sociales}/>
            </label>
            <input type="number" value={montant} onChange={e=>setMontant(e.target.value)} placeholder="0" min="0" step="100"
              style={{ ...iS, fontSize:22, fontWeight:700, textAlign:'right', color:C.blue }}/>
            {isAE && s.plafond_ca && (
              <div style={{ marginTop:10, fontSize:12, color:C.light }}>
                Plafond AE : <strong style={{ color:m>s.plafond_ca?C.red:C.green }}>{fmt(s.plafond_ca)}/an</strong>
                {m>s.plafond_ca&&<span style={{ color:C.red, fontWeight:700, marginLeft:8 }}>⚠️ DÉPASSÉ</span>}
              </div>
            )}
          </div>

          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
              Taux applicables 2025 <Tooltip text={TIPS.charges_sociales} size={11}/>
            </div>
            {isAE ? (<>
              <Bloc label="Cotisations sociales" value={fmtPct(s.cotisations*100)} sub/>
              <Bloc label="Abattement fiscal" value={fmtPct(s.abattement*100)} sub/>
              <Bloc label="Versement libératoire (option)" value={fmtPct(s.versement_liberatoire*100)} sub/>
            </>) : (<>
              <Bloc label="Charges sociales (sur rémunération)" value={fmtPct(s.cotisations_base*100)} sub/>
              <Bloc label="IS taux réduit (≤ 42 500€)" value="15%" sub/>
              <Bloc label="IS taux normal" value="25%" sub/>
            </>)}
          </div>
        </div>

        {/* Colonne droite */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {m===0 && (
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:40, boxShadow:'0 1px 6px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, flex:1 }}>
              <span style={{ fontSize:32 }}>🧮</span>
              <p style={{ color:C.light, fontSize:13, textAlign:'center', margin:0 }}>Saisissez un montant pour voir la simulation</p>
            </div>
          )}

          {resAE && (<>
            <div style={{ background:`linear-gradient(135deg, ${C.blue}08, ${C.purple}08)`, border:`1px solid ${C.blue}30`, borderRadius:14, padding:24, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Résumé auto-entrepreneur</div>
              <Bloc label="Chiffre d'affaires" value={fmt(resAE.ca)}/>
              <Bloc label={`Cotisations sociales (${fmtPct(s.cotisations*100)})`} value={`− ${fmt(resAE.cotisations)}`} color={C.red}/>
              <Bloc label="Revenu net avant impôt" value={fmt(resAE.revenuNet)} color={C.blue}/>
              <Bloc label={`Revenu imposable (abatt. ${fmtPct(s.abattement*100)})`} value={fmt(resAE.revenuImposable)} sub/>
              <Bloc label="Impôt sur le revenu (IR)" value={`− ${fmt(resAE.ir)}`} color={C.red}/>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:14, marginTop:4 }}>
                <span style={{ fontSize:15, fontWeight:700, color:C.dark }}>Reste à vivre net</span>
                <span style={{ fontSize:26, fontWeight:800, color:C.green }}>{fmt(resAE.resteVivreBareme)}</span>
              </div>
            </div>

            <AlerteMiseDeCoté cotisations={resAE.cotisationsMensuelle} ir={resAE.irMensuel} label="charges sociales"/>

            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Option versement libératoire</div>
              <Bloc label={`IR libératoire (${fmtPct(s.versement_liberatoire*100)} du CA)`} value={fmt(resAE.vlOption)} sub/>
              <Bloc label="Reste à vivre avec VL" value={fmt(resAE.resteVivreVL)} color={resAE.resteVivreVL>resAE.resteVivreBareme?C.green:C.orange}/>
              <div style={{ marginTop:10, background:resAE.resteVivreVL>resAE.resteVivreBareme?'rgba(91,188,138,0.08)':'rgba(212,168,83,0.08)', border:`1px solid ${resAE.resteVivreVL>resAE.resteVivreBareme?'rgba(91,188,138,0.3)':'rgba(212,168,83,0.15)'}`, borderRadius:9, padding:'10px 14px', fontSize:12, fontWeight:600, color:resAE.resteVivreVL>resAE.resteVivreBareme?C.green:C.orange }}>
                {resAE.resteVivreVL>resAE.resteVivreBareme?'✓ Le versement libératoire est avantageux pour vous':'Le barème progressif est plus avantageux pour vous'}
              </div>
            </div>

            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Taux global de prélèvement</div>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:8 }}>
                <div style={{ flex:1, height:12, background:'rgba(255,255,255,0.06)', borderRadius:6, overflow:'hidden' }}>
                  <div style={{ width:`${Math.min(resAE.txEffectif,100)}%`, height:'100%', background:`linear-gradient(90deg, ${C.blue}, ${C.purple})`, borderRadius:6, transition:'width 0.6s ease' }}/>
                </div>
                <span style={{ fontSize:20, fontWeight:800, color:C.purple, flexShrink:0 }}>{fmtPct(resAE.txEffectif)}</span>
              </div>
              <p style={{ fontSize:11, color:C.light, margin:0 }}>Cotisations + impôt sur le revenu / CA</p>
              {resAE.depassePlafond && (
                <div style={{ marginTop:10, background:'rgba(199,91,78,0.07)', border:'1px solid rgba(199,91,78,0.25)', borderRadius:9, padding:'10px 14px', fontSize:12, color:C.red, fontWeight:600 }}>
                  ⚠️ CA dépasse le plafond auto-entrepreneur ({fmt(resAE.plafond)}). Changement de statut obligatoire.
                </div>
              )}
            </div>
          </>)}

          {resSoc && (<>
            <div style={{ background:`linear-gradient(135deg, ${C.blue}08, ${C.purple}08)`, border:`1px solid ${C.blue}30`, borderRadius:14, padding:24, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Résumé {s.label.split('—')[0].trim()}</div>
              <Bloc label="Rémunération brute" value={fmt(resSoc.remuneration)}/>
              <Bloc label={`Charges sociales (${fmtPct(s.cotisations_base*100)})`} value={`+ ${fmt(resSoc.charges)}`} color={C.red}/>
              <Bloc label="Coût total employeur" value={fmt(resSoc.coutTotal)} color={C.orange}/>
              <Bloc label="Impôt sur le revenu (IR, abatt. 10%)" value={`− ${fmt(resSoc.ir)}`} color={C.red}/>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:14, marginTop:4 }}>
                <span style={{ fontSize:15, fontWeight:700, color:C.dark }}>Reste à vivre net</span>
                <span style={{ fontSize:26, fontWeight:800, color:C.green }}>{fmt(resSoc.resteVivre)}</span>
              </div>
            </div>

            <AlerteMiseDeCoté cotisations={resSoc.chargesMensuelles} ir={resSoc.irMensuel} label="charges sociales"/>

            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Taux global de prélèvement</div>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:8 }}>
                <div style={{ flex:1, height:12, background:'rgba(255,255,255,0.06)', borderRadius:6, overflow:'hidden' }}>
                  <div style={{ width:`${Math.min(resSoc.txEffectif,100)}%`, height:'100%', background:`linear-gradient(90deg, ${C.blue}, ${C.purple})`, borderRadius:6, transition:'width 0.6s ease' }}/>
                </div>
                <span style={{ fontSize:20, fontWeight:800, color:C.purple, flexShrink:0 }}>{fmtPct(resSoc.txEffectif)}</span>
              </div>
              <p style={{ fontSize:11, color:C.light, margin:0 }}>Charges sociales + impôt sur le revenu / coût total</p>
            </div>

            <div style={{ background:'rgba(212,168,83,0.06)', border:'1px solid rgba(212,168,83,0.25)', borderRadius:14, padding:16, fontSize:12, color:'#92400E' }}>
              💡 Pour optimiser : combiner rémunération réduite + dividendes peut être plus avantageux. Consultez un expert-comptable.
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}
