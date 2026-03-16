import { useState, useMemo } from 'react';

const C = { blue:'#5BA3C7', green:'#5BC78A', orange:'#D4A853', red:'#C75B4E', purple:'#A85BC7', dark:'#1A1C20', light:'#9AA0AE', border:'#E8EAF0', bg:'#F8F9FB' };
const euro = (n) => new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(n ?? 0);
const pct  = (n) => `${Number(n).toFixed(1)}%`;

const iS = { width:'100%', padding:'10px 14px', borderRadius:9, background:'#fff', border:`1px solid #E8EAF0`, color:'#1A1C20', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
const lS = { fontSize:11, fontWeight:700, color:'#5A6070', marginBottom:6, display:'block', textTransform:'uppercase', letterSpacing:'0.05em' };

const EXEMPLES = [
  { label:'Consultant freelance', chargesFixes:2000,  tauxCV:15, prixVente:500,  qteVendues:12 },
  { label:'Boutique e-commerce',  chargesFixes:5000,  tauxCV:55, prixVente:80,   qteVendues:150 },
  { label:'Restaurant',           chargesFixes:12000, tauxCV:35, prixVente:25,   qteVendues:800 },
  { label:'SaaS / Abonnement',    chargesFixes:8000,  tauxCV:20, prixVente:49,   qteVendues:200 },
];

export default function CalculateurSeuilRentabilite() {
  const [chargesFixes, setChargesFixes] = useState('');
  const [tauxCV,       setTauxCV]       = useState('');
  const [prixVente,    setPrixVente]    = useState('');
  const [qteVendues,   setQteVendues]   = useState('');
  const [nom,          setNom]          = useState('');

  const appliquerExemple = (ex) => {
    setChargesFixes(String(ex.chargesFixes));
    setTauxCV(String(ex.tauxCV));
    setPrixVente(String(ex.prixVente));
    setQteVendues(String(ex.qteVendues));
    setNom(ex.label);
  };

  const result = useMemo(() => {
    const CF  = parseFloat(chargesFixes);
    const tCV = parseFloat(tauxCV) / 100;
    const PV  = parseFloat(prixVente);
    const QV  = parseFloat(qteVendues);

    if (!CF || !tCV || !PV || CF <= 0 || tCV <= 0 || tCV >= 1 || PV <= 0) return null;

    const CV_unitaire   = PV * tCV;
    const marge_sur_CV  = PV - CV_unitaire;
    const taux_marge    = marge_sur_CV / PV;

    // Seuil de rentabilité en CA
    const seuil_CA      = CF / taux_marge;
    // Seuil en quantités
    const seuil_qte     = Math.ceil(CF / marge_sur_CV);
    // Seuil en jours (base 365)
    const seuil_jours   = Math.ceil((seuil_CA / (seuil_CA * 12)) * 365);

    // Si quantités fournies
    const ca_reel       = QV ? PV * QV : null;
    const cv_total      = QV ? CV_unitaire * QV : null;
    const marge_totale  = QV ? marge_sur_CV * QV : null;
    const resultat_net  = QV ? marge_totale - CF : null;
    const marge_securite = QV ? ca_reel - seuil_CA : null;
    const indice_securite = QV ? (marge_securite / ca_reel) * 100 : null;
    const levier_operationnel = QV && resultat_net > 0 ? marge_totale / resultat_net : null;

    // Points pour le graphique (0 à 2× le seuil)
    const maxCA = seuil_CA * 2.2;
    const points = Array.from({ length: 50 }, (_, i) => {
      const ca = (i / 49) * maxCA;
      const qte = ca / PV;
      const charges_totales = CF + CV_unitaire * qte;
      const benefice = ca - charges_totales;
      return { ca, charges_totales, benefice };
    });

    return {
      CF, PV, CV_unitaire, marge_sur_CV, taux_marge,
      seuil_CA, seuil_qte, seuil_jours,
      ca_reel, cv_total, marge_totale, resultat_net,
      marge_securite, indice_securite, levier_operationnel,
      points, maxCA,
      enBenefice: resultat_net !== null && resultat_net > 0,
      atteint: ca_reel !== null && ca_reel >= seuil_CA,
    };
  }, [chargesFixes, tauxCV, prixVente, qteVendues]);

  // SVG graphique
  const svgW = 480, svgH = 180;
  const renderGraphique = () => {
    if (!result) return null;
    const { points, maxCA, seuil_CA, CF } = result;

    const xScale = (ca) => (ca / maxCA) * svgW;
    const yMax = maxCA * 1.1;
    const yScale = (v) => svgH - ((v + CF * 0.3) / (yMax + CF * 0.3)) * svgH;

    const caPath    = points.map((p, i) => `${i===0?'M':'L'}${xScale(p.ca).toFixed(1)},${yScale(p.ca).toFixed(1)}`).join(' ');
    const chPath    = points.map((p, i) => `${i===0?'M':'L'}${xScale(p.ca).toFixed(1)},${yScale(p.charges_totales).toFixed(1)}`).join(' ');
    const seuilX    = xScale(seuil_CA);

    return (
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH + 24}`} style={{ overflow:'visible' }}>
        {/* Zone bénéfice */}
        <defs>
          <linearGradient id="beneficeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.green} stopOpacity="0.15"/>
            <stop offset="100%" stopColor={C.green} stopOpacity="0.02"/>
          </linearGradient>
        </defs>

        {/* Grille */}
        {[0.25, 0.5, 0.75, 1].map(t => (
          <line key={t} x1={0} y1={svgH * t} x2={svgW} y2={svgH * t} stroke="#F0F2F5" strokeWidth={1}/>
        ))}

        {/* Courbe CA */}
        <path d={caPath} fill="none" stroke={C.blue} strokeWidth={2.5} strokeLinecap="round"/>

        {/* Courbe charges totales */}
        <path d={chPath} fill="none" stroke={C.red} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="6,3"/>

        {/* Ligne seuil */}
        <line x1={seuilX} y1={0} x2={seuilX} y2={svgH} stroke={C.orange} strokeWidth={2} strokeDasharray="4,3"/>
        <text x={seuilX + 4} y={16} fontSize={10} fill={C.orange} fontWeight="700">Seuil</text>

        {/* Point seuil */}
        <circle cx={seuilX} cy={yScale(seuil_CA)} r={5} fill={C.orange} stroke="#fff" strokeWidth={2}/>

        {/* Point CA réel */}
        {result.ca_reel && (
          <>
            <line x1={xScale(result.ca_reel)} y1={0} x2={xScale(result.ca_reel)} y2={svgH} stroke={result.atteint ? C.green : C.red} strokeWidth={1.5} strokeDasharray="4,3"/>
            <circle cx={xScale(result.ca_reel)} cy={yScale(result.ca_reel)} r={5} fill={result.atteint ? C.green : C.red} stroke="#fff" strokeWidth={2}/>
            <text x={xScale(result.ca_reel) + 4} y={svgH - 4} fontSize={9} fill={result.atteint ? C.green : C.red} fontWeight="700">CA réel</text>
          </>
        )}

        {/* Légende */}
        <g transform={`translate(0, ${svgH + 12})`}>
          <rect x={0} y={0} width={10} height={3} rx={1} fill={C.blue}/>
          <text x={14} y={8} fontSize={9} fill={C.light}>Chiffre d'affaires</text>
          <rect x={120} y={0} width={10} height={3} rx={1} fill={C.red}/>
          <text x={134} y={8} fontSize={9} fill={C.light}>Charges totales</text>
          <rect x={250} y={0} width={10} height={3} rx={1} fill={C.orange}/>
          <text x={264} y={8} fontSize={9} fill={C.light}>Seuil rentabilité</text>
        </g>
      </svg>
    );
  };

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:900, margin:'0 auto' }}>

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:C.dark, margin:0 }}>
          Calculateur de seuil de rentabilité
        </h1>
        <p style={{ fontSize:13, color:C.light, marginTop:4 }}>Point mort · Marge sur coût variable · Levier opérationnel</p>
      </div>

      {/* Exemples rapides */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
        <span style={{ fontSize:11, color:C.light, alignSelf:'center', fontWeight:600 }}>Exemples :</span>
        {EXEMPLES.map(ex => (
          <button key={ex.label} onClick={() => appliquerExemple(ex)} style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${C.border}`, background:'#fff', color:C.dark, fontSize:12, cursor:'pointer', fontFamily:'inherit', transition:'all 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=C.blue; e.currentTarget.style.color=C.blue; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.dark; }}>
            {ex.label}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* ── Colonne gauche — Paramètres ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:22, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>Nom du projet / activité</label>
            <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex : Mon activité de conseil" style={iS}/>
          </div>

          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:22, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>Charges fixes mensuelles (€)</label>
            <input type="number" value={chargesFixes} onChange={e => setChargesFixes(e.target.value)} placeholder="Ex : 3000 (loyer, salaires, abonnements…)" style={iS} min="0"/>
            <p style={{ fontSize:11, color:C.light, marginTop:6, marginBottom:0 }}>Loyer, salaires, assurances, abonnements, remboursements…</p>
          </div>

          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:22, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>Taux de charges variables (%)</label>
            <input type="number" value={tauxCV} onChange={e => setTauxCV(e.target.value)} placeholder="Ex : 30 (matières premières, commissions…)" style={iS} min="0" max="99"/>
            <p style={{ fontSize:11, color:C.light, marginTop:6, marginBottom:0 }}>Part des charges qui varient avec le CA (achats, sous-traitance…)</p>
          </div>

          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:22, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>Prix de vente unitaire (€)</label>
            <input type="number" value={prixVente} onChange={e => setPrixVente(e.target.value)} placeholder="Ex : 150" style={iS} min="0"/>
          </div>

          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:22, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>Quantités vendues / mois <span style={{ color:C.light, fontWeight:400, textTransform:'none' }}>(optionnel)</span></label>
            <input type="number" value={qteVendues} onChange={e => setQteVendues(e.target.value)} placeholder="Ex : 25" style={iS} min="0"/>
            <p style={{ fontSize:11, color:C.light, marginTop:6, marginBottom:0 }}>Permet de calculer si vous êtes en bénéfice ou en perte</p>
          </div>
        </div>

        {/* ── Colonne droite — Résultats ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {result ? (<>

            {/* Seuil principal */}
            <div style={{ background:`linear-gradient(135deg, rgba(212,168,83,0.1), rgba(212,168,83,0.04))`, border:`1px solid rgba(212,168,83,0.25)`, borderRadius:14, padding:22, textAlign:'center', boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:11, color:C.orange, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Seuil de rentabilité mensuel</div>
              <div style={{ fontSize:36, fontWeight:700, color:C.dark, fontFamily:"'Cormorant Garamond', serif" }}>{euro(result.seuil_CA)}</div>
              <div style={{ fontSize:13, color:C.light, marginTop:6 }}>= {result.seuil_qte} unités à vendre / mois</div>
            </div>

            {/* KPIs */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { label:'Marge sur CV unitaire', value:euro(result.marge_sur_CV),   color:C.blue   },
                { label:'Taux de marge',          value:pct(result.taux_marge*100),  color:C.blue   },
                { label:'Seuil annuel',            value:euro(result.seuil_CA * 12), color:C.orange },
                { label:'Taux charges variables', value:pct(parseFloat(tauxCV)),     color:C.light  },
              ].map(k => (
                <div key={k.label} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize:10, color:C.light, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>{k.label}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Résultat si quantités fournies */}
            {result.ca_reel !== null && (
              <div style={{ background:result.atteint ? 'rgba(91,199,138,0.07)' : 'rgba(199,91,78,0.07)', border:`1px solid ${result.atteint ? 'rgba(91,199,138,0.25)' : 'rgba(199,91,78,0.25)'}`, borderRadius:14, padding:18 }}>
                <div style={{ fontSize:13, fontWeight:700, color:result.atteint ? C.green : C.red, marginBottom:12 }}>
                  {result.atteint ? '✅ En bénéfice' : '❌ En perte'} — CA réel : {euro(result.ca_reel)}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    { label:'Résultat net',         value:euro(result.resultat_net),      color:result.enBenefice?C.green:C.red },
                    { label:'Marge de sécurité',    value:euro(result.marge_securite),    color:C.blue  },
                    { label:'Indice de sécurité',   value:pct(result.indice_securite),    color:C.blue  },
                    { label:'Levier opérationnel',  value:result.levier_operationnel ? `×${result.levier_operationnel.toFixed(2)}` : '—', color:C.orange },
                  ].map(k => (
                    <div key={k.label} style={{ background:'rgba(255,255,255,0.6)', borderRadius:9, padding:'10px 12px' }}>
                      <div style={{ fontSize:10, color:C.light, fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>{k.label}</div>
                      <div style={{ fontSize:16, fontWeight:700, color:k.color }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Graphique */}
            <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Graphique de rentabilité</div>
              {renderGraphique()}
            </div>

          </>) : (
            <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:40, textAlign:'center', color:C.light, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
              <div style={{ fontSize:14, fontWeight:600 }}>Renseignez vos charges fixes</div>
              <div style={{ fontSize:12, marginTop:6 }}>Le seuil de rentabilité apparaîtra ici</div>
              <div style={{ fontSize:11, color:C.border, marginTop:12 }}>Ou utilisez un exemple ci-dessus →</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
