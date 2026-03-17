import { useState } from "react";

const C = { blue:'#5BA3C7', purple:'#A85BC7', dark:'#1A1C20', light:'#9AA0AE', border:'#E8EAF0', red:'#C75B4E', orange:'#5BC78A', green:'#5BC78A' };

const iS = { width:'100%', padding:'10px 14px', borderRadius:9, background:'#F8F9FB', border:'1px solid #E8EAF0', color:'#1A1C20', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
const lS = { fontSize:11, fontWeight:700, color:'#5A6070', marginBottom:6, display:'block', textTransform:'uppercase', letterSpacing:'0.05em' };
function fmt(n) { return new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(n||0); }
function fmtPct(n) { return `${n.toFixed(1)}%`; }

/* ══ TAUX DE CHARGES PAR STATUT (2025) ══════════════════════════════ */
const STATUTS = {
  ae_bic_vente: {
    label: 'Auto-entrepreneur — Vente de marchandises',
    cotisations: 0.122,  // 12,2%
    cfe: true,
    versement_liberatoire: 0.01, // 1%
    ir_bareme: true,
    abattement: 0.71,
    plafond_ca: 188700,
    desc: 'Commerce, vente, hébergement',
  },
  ae_bic_service: {
    label: 'Auto-entrepreneur — Prestations de services BIC',
    cotisations: 0.211,  // 21,1%
    cfe: true,
    versement_liberatoire: 0.017,
    ir_bareme: true,
    abattement: 0.50,
    plafond_ca: 77700,
    desc: 'Artisans, services commerciaux',
  },
  ae_bnc: {
    label: 'Auto-entrepreneur — Professions libérales (BNC)',
    cotisations: 0.231,  // 23,1%
    cfe: true,
    versement_liberatoire: 0.022,
    ir_bareme: true,
    abattement: 0.34,
    plafond_ca: 77700,
    desc: 'Consultants, freelances, libéraux',
  },
  eurl_is: {
    label: 'EURL / SASU — Gérant majoritaire (TNS)',
    cotisations_base: 0.45, // ~45% sur rémunération
    is_taux: 0.15,           // IS 15% jusqu'à 42500€
    is_taux_normal: 0.25,
    seuil_is_reduit: 42500,
    desc: 'Travailleur non salarié, société à l\'IS',
  },
  sas_sasu: {
    label: 'SAS / SASU — Président assimilé salarié',
    cotisations_base: 0.82, // ~82% du net (charges patronales + salariales)
    is_taux: 0.15,
    is_taux_normal: 0.25,
    seuil_is_reduit: 42500,
    desc: 'Assimilé salarié, cotisations élevées',
  },
};

const TRANCHES_IR = [
  { min: 0,      max: 11294,  taux: 0 },
  { min: 11294,  max: 28797,  taux: 0.11 },
  { min: 28797,  max: 82341,  taux: 0.30 },
  { min: 82341,  max: 177106, taux: 0.41 },
  { min: 177106, max: Infinity, taux: 0.45 },
];

function calculerIR(revenuImposable) {
  let ir = 0;
  for (const t of TRANCHES_IR) {
    if (revenuImposable <= t.min) break;
    const base = Math.min(revenuImposable, t.max) - t.min;
    ir += base * t.taux;
  }
  return ir;
}

function calculerAE(ca, statut) {
  const s = STATUTS[statut];
  const cotisations = ca * s.cotisations;
  const revenuNet   = ca - cotisations;
  const revenuImposable = ca * (1 - s.abattement);
  const ir = calculerIR(revenuImposable);
  const vlOption = ca * s.versement_liberatoire;
  const resteVivreBareme = revenuNet - ir;
  const resteVivreVL     = revenuNet - vlOption;
  const txEffectif = (cotisations + ir) / ca * 100;

  return {
    ca, cotisations, revenuNet, revenuImposable,
    ir, vlOption, resteVivreBareme, resteVivreVL,
    txEffectif,
    depassePlafond: ca > s.plafond_ca,
    plafond: s.plafond_ca,
  };
}

function calculerSociete(remuneration, statut) {
  const s = STATUTS[statut];
  const charges = remuneration * s.cotisations_base;
  const coutTotal = remuneration + charges;
  const netApresCharges = remuneration;
  const ir = calculerIR(remuneration * 0.9); // abattement 10% frais pro
  const resteVivre = remuneration - ir;
  const txEffectif = (charges + ir) / coutTotal * 100;

  return { remuneration, charges, coutTotal, ir, resteVivre, txEffectif };
}

function Bloc({ label, value, color=C.dark, sub=false, highlight=false }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding: sub?'6px 0':'10px 0', borderBottom:'1px solid #F0F2F5', background: highlight?'rgba(91,163,199,0.04)':'transparent', borderRadius: highlight?6:0, paddingLeft: highlight?8:0, paddingRight: highlight?8:0 }}>
      <span style={{ fontSize:sub?11:13, color:sub?C.light:'#5A6070' }}>{label}</span>
      <span style={{ fontSize:highlight?18:sub?12:14, fontWeight:highlight?800:sub?500:600, color }}>{value}</span>
    </div>
  );
}

export default function SimulateurCharges() {
  const [statut,  setStatut]  = useState('ae_bnc');
  const [montant, setMontant] = useState('');
  const isAE = statut.startsWith('ae_');
  const s    = STATUTS[statut];
  const m    = parseFloat(montant) || 0;

  const resAE  = isAE && m > 0 ? calculerAE(m, statut) : null;
  const resSoc = !isAE && m > 0 ? calculerSociete(m, statut) : null;

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:900, margin:'0 auto' }}>

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:C.dark, margin:0 }}>Simulateur de charges sociales</h1>
        <p style={{ fontSize:13, color:C.light, marginTop:4 }}>Estimation 2025 — à titre indicatif, consultez un comptable pour validation</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Colonne gauche — Saisie */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Statut */}
          <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:24, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>Votre statut juridique</label>
            {Object.entries(STATUTS).map(([key, val]) => (
              <div key={key} onClick={() => setStatut(key)} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'11px 12px', borderRadius:9, marginBottom:6, cursor:'pointer', background:statut===key?`${C.blue}10`:'transparent', border:`1px solid ${statut===key?C.blue:'transparent'}`, transition:'all 150ms' }}>
                <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${statut===key?C.blue:'#D0D4DC'}`, background:statut===key?C.blue:'transparent', flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {statut===key && <div style={{ width:7, height:7, borderRadius:'50%', background:'#fff' }}/>}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:statut===key?700:500, color:statut===key?C.blue:C.dark, lineHeight:1.4 }}>{val.label}</div>
                  <div style={{ fontSize:11, color:C.light, marginTop:2 }}>{val.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Montant */}
          <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:24, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>{isAE ? "Chiffre d'affaires annuel (€)" : "Rémunération annuelle souhaitée (€)"}</label>
            <input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="0" min="0" step="100"
              style={{ ...iS, fontSize:22, fontWeight:700, textAlign:'right', color:C.blue }} />
            {isAE && s.plafond_ca && (
              <div style={{ marginTop:10, fontSize:12, color:C.light }}>
                Plafond franchise TVA : <strong style={{ color: m > s.plafond_ca ? C.red : C.green }}>{fmt(s.plafond_ca)}/an</strong>
                {m > s.plafond_ca && <span style={{ color:C.red, fontWeight:700, marginLeft:8 }}>⚠️ DÉPASSÉ</span>}
              </div>
            )}
          </div>

          {/* Info taux */}
          <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Taux applicables 2025</div>
            {isAE ? (
              <>
                <Bloc label="Cotisations sociales" value={fmtPct(s.cotisations * 100)} sub />
                <Bloc label="Abattement fiscal" value={fmtPct(s.abattement * 100)} sub />
                <Bloc label="Versement libératoire (option)" value={fmtPct(s.versement_liberatoire * 100)} sub />
              </>
            ) : (
              <>
                <Bloc label="Charges sociales (sur rémunération)" value={fmtPct(s.cotisations_base * 100)} sub />
                <Bloc label="IS taux réduit (≤ 42 500€)" value="15%" sub />
                <Bloc label="IS taux normal" value="25%" sub />
              </>
            )}
          </div>
        </div>

        {/* Colonne droite — Résultats */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {m === 0 && (
            <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:40, boxShadow:'0 1px 6px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, flex:1 }}>
              <span style={{ fontSize:32 }}>🧮</span>
              <p style={{ color:C.light, fontSize:13, textAlign:'center', margin:0 }}>Saisissez un montant pour voir la simulation</p>
            </div>
          )}

          {/* Résultats AE */}
          {resAE && (<>
            <div style={{ background:`linear-gradient(135deg, ${C.blue}08, ${C.purple}08)`, border:`1px solid ${C.blue}30`, borderRadius:14, padding:24, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Résumé auto-entrepreneur</div>
              <Bloc label="Chiffre d'affaires" value={fmt(resAE.ca)} />
              <Bloc label={`Cotisations sociales (${fmtPct(s.cotisations*100)})`} value={`− ${fmt(resAE.cotisations)}`} color={C.red} />
              <Bloc label="Revenu net avant impôt" value={fmt(resAE.revenuNet)} color={C.orange} />
              <Bloc label={`Revenu imposable (abatt. ${fmtPct(s.abattement*100)})`} value={fmt(resAE.revenuImposable)} sub />
              <Bloc label="IR au barème progressif" value={`− ${fmt(resAE.ir)}`} color={C.red} />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:14, marginTop:4 }}>
                <span style={{ fontSize:15, fontWeight:700, color:C.dark }}>Reste à vivre net</span>
                <span style={{ fontSize:26, fontWeight:800, color:C.green }}>{fmt(resAE.resteVivreBareme)}</span>
              </div>
            </div>

            {/* Option versement libératoire */}
            <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Option versement libératoire</div>
              <Bloc label={`IR libératoire (${fmtPct(s.versement_liberatoire*100)} du CA)`} value={fmt(resAE.vlOption)} sub />
              <Bloc label="Reste à vivre avec VL" value={fmt(resAE.resteVivreVL)} color={resAE.resteVivreVL > resAE.resteVivreBareme ? C.green : C.orange} />
              <div style={{ marginTop:10, background: resAE.resteVivreVL > resAE.resteVivreBareme ? 'rgba(91,188,138,0.08)' : 'rgba(212,168,83,0.08)', border:`1px solid ${resAE.resteVivreVL > resAE.resteVivreBareme ? 'rgba(91,188,138,0.3)' : 'rgba(212,168,83,0.3)'}`, borderRadius:9, padding:'10px 14px', fontSize:12, fontWeight:600, color: resAE.resteVivreVL > resAE.resteVivreBareme ? C.green : C.orange }}>
                {resAE.resteVivreVL > resAE.resteVivreBareme ? '✓ Le versement libératoire est avantageux pour vous' : 'Le barème progressif est plus avantageux pour vous'}
              </div>
            </div>

            {/* Taux effectif */}
            <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Taux global de prélèvement</div>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:12 }}>
                <div style={{ flex:1, height:12, background:'#F0F2F5', borderRadius:6, overflow:'hidden' }}>
                  <div style={{ width:`${Math.min(resAE.txEffectif, 100)}%`, height:'100%', background:`linear-gradient(90deg, ${C.blue}, ${C.purple})`, borderRadius:6, transition:'width 0.6s ease' }}/>
                </div>
                <span style={{ fontSize:20, fontWeight:800, color:C.purple, flexShrink:0 }}>{fmtPct(resAE.txEffectif)}</span>
              </div>
              <p style={{ fontSize:11, color:C.light, margin:0 }}>Cotisations + IR / Chiffre d'affaires</p>
              {resAE.depassePlafond && (
                <div style={{ marginTop:10, background:'rgba(199,91,78,0.07)', border:'1px solid rgba(199,91,78,0.25)', borderRadius:9, padding:'10px 14px', fontSize:12, color:C.red, fontWeight:600 }}>
                  ⚠️ CA dépasse le plafond auto-entrepreneur ({fmt(resAE.plafond)}). Changement de statut obligatoire.
                </div>
              )}
            </div>
          </>)}

          {/* Résultats Société */}
          {resSoc && (<>
            <div style={{ background:`linear-gradient(135deg, ${C.blue}08, ${C.purple}08)`, border:`1px solid ${C.blue}30`, borderRadius:14, padding:24, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Résumé {s.label.split('—')[0].trim()}</div>
              <Bloc label="Rémunération brute" value={fmt(resSoc.remuneration)} />
              <Bloc label={`Charges sociales (${fmtPct(s.cotisations_base*100)})`} value={`+ ${fmt(resSoc.charges)}`} color={C.red} />
              <Bloc label="Coût total employeur" value={fmt(resSoc.coutTotal)} color={C.orange} />
              <Bloc label="IR estimé (abatt. 10%)" value={`− ${fmt(resSoc.ir)}`} color={C.red} />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:14, marginTop:4 }}>
                <span style={{ fontSize:15, fontWeight:700, color:C.dark }}>Reste à vivre net</span>
                <span style={{ fontSize:26, fontWeight:800, color:C.green }}>{fmt(resSoc.resteVivre)}</span>
              </div>
            </div>

            <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Taux global de prélèvement</div>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:8 }}>
                <div style={{ flex:1, height:12, background:'#F0F2F5', borderRadius:6, overflow:'hidden' }}>
                  <div style={{ width:`${Math.min(resSoc.txEffectif, 100)}%`, height:'100%', background:`linear-gradient(90deg, ${C.blue}, ${C.purple})`, borderRadius:6, transition:'width 0.6s ease' }}/>
                </div>
                <span style={{ fontSize:20, fontWeight:800, color:C.purple, flexShrink:0 }}>{fmtPct(resSoc.txEffectif)}</span>
              </div>
              <p style={{ fontSize:11, color:C.light, margin:0 }}>Charges + IR / coût total</p>
            </div>

            <div style={{ background:'rgba(212,168,83,0.06)', border:'1px solid rgba(212,168,83,0.25)', borderRadius:14, padding:16, fontSize:12, color:'#92400E' }}>
              💡 Pour optimiser : combiner rémunération réduite + dividendes peut être plus avantageux selon votre situation. Consultez un expert-comptable.
            </div>
          </>)}

        </div>
      </div>
    </div>
  );
}
