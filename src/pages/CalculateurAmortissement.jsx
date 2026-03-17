import { useState, useMemo } from 'react';
import Tooltip from '../components/Tooltip';
import { TIPS } from '../utils/tooltips';

const C = { blue:'#5BA3C7', green:'#5BC78A', orange:'#5BC78A', red:'#C75B4E', dark:'#1A1C20', light:'#9AA0AE', border:'#E8EAF0', bg:'#F8F9FB' };

const CATEGORIES = [
  { label:'Matériel informatique',  duree:3,  taux:33.33 },
  { label:'Véhicule utilitaire',    duree:5,  taux:20    },
  { label:'Véhicule de tourisme',   duree:5,  taux:20    },
  { label:'Mobilier de bureau',     duree:10, taux:10    },
  { label:'Outillage',              duree:5,  taux:20    },
  { label:'Machine industrielle',   duree:10, taux:10    },
  { label:'Bâtiment commercial',    duree:25, taux:4     },
  { label:'Logiciel',               duree:3,  taux:33.33 },
  { label:'Personnalisé',           duree:5,  taux:20    },
];

const METHODES = [
  { id:'lineaire',  label:'Linéaire',  description:'Même montant chaque année' },
  { id:'degressif', label:'Dégressif', description:'Plus fort les premières années' },
];

function getCoef(duree) {
  if (duree <= 4) return 1.25;
  if (duree <= 6) return 1.75;
  return 2.25;
}

function calculerLineaire(valeur, duree, dateAcquisition) {
  const taux = 1 / duree;
  const lignes = [];
  let vna = valeur;
  const dateAcq = new Date(dateAcquisition);
  const moisRestants = 12 - dateAcq.getMonth();
  for (let i = 0; i < duree; i++) {
    const annee = dateAcq.getFullYear() + i;
    const dotation = i === 0 ? valeur * taux * moisRestants / 12 : valeur * taux;
    const dotationReelle = Math.min(dotation, vna);
    vna = Math.max(0, vna - dotationReelle);
    lignes.push({ annee, dotation: dotationReelle, vna, taux: taux * 100 });
  }
  return lignes;
}

function calculerDegressif(valeur, duree, dateAcquisition) {
  const coef = getCoef(duree);
  const tauxDegressif = (1 / duree) * coef;
  const lignes = [];
  let vna = valeur;
  const dateAcq = new Date(dateAcquisition);
  const moisRestants = 12 - dateAcq.getMonth();
  for (let i = 0; i < duree; i++) {
    const annee = dateAcq.getFullYear() + i;
    const anneesRestantes = duree - i;
    const taux = Math.max(tauxDegressif, 1 / anneesRestantes);
    const dotation = i === 0 ? vna * tauxDegressif * moisRestants / 12 : vna * taux;
    const dotationReelle = Math.min(dotation, vna);
    vna = Math.max(0, vna - dotationReelle);
    lignes.push({ annee, dotation: dotationReelle, vna, taux: taux * 100 });
  }
  return lignes;
}

const euro = (n) => new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:2 }).format(n);
const pct  = (n) => `${n.toFixed(2)}%`;

const iS = { width:'100%', padding:'10px 14px', borderRadius:9, background:'#fff', border:`1px solid ${C.border}`, color:C.dark, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
const lS = { fontSize:11, fontWeight:700, color:'#5A6070', marginBottom:6, display:'flex', alignItems:'center', gap:6, textTransform:'uppercase', letterSpacing:'0.05em' };

export default function CalculateurAmortissement() {
  const [valeur,      setValeur]      = useState('');
  const [categorie,   setCategorie]   = useState(0);
  const [dureeCustom, setDureeCustom] = useState('');
  const [methode,     setMethode]     = useState('lineaire');
  const [dateAcq,     setDateAcq]     = useState(new Date().toISOString().split('T')[0]);
  const [nom,         setNom]         = useState('');

  const cat = CATEGORIES[categorie];
  const duree = categorie === CATEGORIES.length - 1 && dureeCustom ? parseInt(dureeCustom) : cat.duree;

  const tableau = useMemo(() => {
    const v = parseFloat(valeur);
    if (!v || v <= 0 || !duree || duree <= 0 || !dateAcq) return [];
    return methode === 'lineaire' ? calculerLineaire(v, duree, dateAcq) : calculerDegressif(v, duree, dateAcq);
  }, [valeur, duree, methode, dateAcq]);

  const totalDotations = tableau.reduce((s, l) => s + l.dotation, 0);
  const maxDot = Math.max(...tableau.map(l => l.dotation), 1);
  const svgH = 120;
  const barW = tableau.length > 0 ? Math.min(40, (480 / tableau.length) - 8) : 40;

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:900, margin:'0 auto' }}>

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:C.dark, margin:0, display:'flex', alignItems:'center', gap:10 }}>
          Calculateur d'amortissement <Tooltip text={TIPS.amortissement} size={16}/>
        </h1>
        <p style={{ fontSize:13, color:C.light, marginTop:4 }}>Calcul linéaire ou dégressif · Tableau annuel · Conforme PCG français</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Colonne gauche */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:22, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>Désignation du bien</label>
            <input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Ex : MacBook Pro, Renault Kangoo…" style={iS}/>
          </div>

          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:22, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>
              Valeur d'acquisition <Tooltip text={TIPS.montant_ht}/>
              <span style={{ fontSize:9, fontWeight:400, color:C.light, textTransform:'none', marginLeft:4 }}>(HT, €)</span>
            </label>
            <input type="number" value={valeur} onChange={e=>setValeur(e.target.value)} placeholder="Ex : 2500" style={iS} min="0"/>
            <p style={{ fontSize:11, color:C.light, marginTop:6, marginBottom:0 }}>⚠️ Seuls les biens {'>'} 500 € HT sont amortissables (règle fiscale française)</p>
          </div>

          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:22, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>Catégorie de bien</label>
            <select value={categorie} onChange={e=>setCategorie(Number(e.target.value))} style={iS}>
              {CATEGORIES.map((c,i)=><option key={i} value={i}>{c.label} {i<CATEGORIES.length-1?`(${c.duree} ans)`:''}</option>)}
            </select>
            {categorie===CATEGORIES.length-1 && (
              <div style={{ marginTop:12 }}>
                <label style={lS}>Durée personnalisée (années)</label>
                <input type="number" value={dureeCustom} onChange={e=>setDureeCustom(e.target.value)} placeholder="Ex : 7" style={iS} min="1" max="50"/>
              </div>
            )}
          </div>

          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:22, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>Date d'acquisition</label>
            <input type="date" value={dateAcq} onChange={e=>setDateAcq(e.target.value)} style={{ ...iS, colorScheme:'light' }}/>
          </div>

          <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:22, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>Méthode d'amortissement <Tooltip text={TIPS.amortissement}/></label>
            {METHODES.map(m=>(
              <div key={m.id} onClick={()=>setMethode(m.id)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', borderRadius:10, border:`1px solid ${methode===m.id?C.blue:C.border}`, background:methode===m.id?`${C.blue}08`:C.bg, cursor:'pointer', marginBottom:8, transition:'all 150ms' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:methode===m.id?C.blue:C.dark }}>{m.label}</div>
                  <div style={{ fontSize:11, color:C.light }}>{m.description}</div>
                </div>
                <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${methode===m.id?C.blue:C.border}`, background:methode===m.id?C.blue:'#fff', flexShrink:0 }}/>
              </div>
            ))}
            {methode==='degressif' && (
              <div style={{ fontSize:11, color:C.orange, background:'rgba(212,168,83,0.08)', border:'1px solid rgba(212,168,83,0.2)', borderRadius:8, padding:'8px 12px', marginTop:4 }}>
                ⚠️ L'amortissement dégressif est réservé aux biens neufs et certaines catégories. Consultez votre expert-comptable.
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {tableau.length > 0 ? (<>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { label:'Valeur amortie',  value:euro(totalDotations), color:C.blue,   tip:TIPS.amortissement },
                { label:'Durée',           value:`${duree} ans`,       color:C.dark,   tip:null },
                { label:'Taux annuel',     value:pct(100/duree),       color:C.orange, tip:null },
                { label:'Coef. dégressif', value:methode==='degressif'?`×${getCoef(duree)}`:'—', color:C.green, tip:null },
              ].map(k=>(
                <div key={k.label} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize:11, color:C.light, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6, display:'flex', alignItems:'center', gap:4 }}>
                    {k.label} {k.tip && <Tooltip text={k.tip} size={10}/>}
                  </div>
                  <div style={{ fontSize:20, fontWeight:700, color:k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Dotations annuelles</div>
              <svg width="100%" viewBox={`0 0 480 ${svgH+30}`} style={{ overflow:'visible' }}>
                {tableau.map((l,i) => {
                  const barH=(l.dotation/maxDot)*svgH, x=i*(480/tableau.length)+(480/tableau.length-barW)/2, y=svgH-barH;
                  return (
                    <g key={i}>
                      <rect x={x} y={y} width={barW} height={barH} rx={4} fill={methode==='lineaire'?C.blue:C.orange} opacity={0.8}/>
                      <text x={x+barW/2} y={svgH+16} textAnchor="middle" fontSize={10} fill={C.light}>{l.annee}</text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Tableau d'amortissement {nom&&`— ${nom}`}
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:C.bg }}>
                      {[
                        'Année',
                        'Taux',
                        <span key="dot" style={{display:'flex',alignItems:'center',gap:4}}>Dotation <Tooltip text={TIPS.amortissement} size={10}/></span>,
                        <span key="vna" style={{display:'flex',alignItems:'center',gap:4}}>VNA <Tooltip text="VNA = Valeur Nette d'Amortissement. C'est la valeur comptable résiduelle du bien après déduction des dotations cumulées." size={10}/></span>,
                      ].map((h,i)=>(
                        <th key={i} style={{ padding:'10px 16px', fontSize:11, fontWeight:700, color:C.light, textAlign:'right', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:`1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableau.map((l,i)=>(
                      <tr key={i} style={{ borderBottom:`1px solid ${C.bg}`, background:i%2===0?'#fff':C.bg }}>
                        <td style={{ padding:'10px 16px', fontSize:13, fontWeight:700, color:C.dark, textAlign:'right' }}>{l.annee}</td>
                        <td style={{ padding:'10px 16px', fontSize:13, color:C.light, textAlign:'right' }}>{pct(l.taux)}</td>
                        <td style={{ padding:'10px 16px', fontSize:13, fontWeight:700, color:methode==='lineaire'?C.blue:C.orange, textAlign:'right' }}>{euro(l.dotation)}</td>
                        <td style={{ padding:'10px 16px', fontSize:13, color:l.vna<1?C.green:C.dark, fontWeight:l.vna<1?700:400, textAlign:'right' }}>{l.vna<1?'0,00 €':euro(l.vna)}</td>
                      </tr>
                    ))}
                    <tr style={{ background:`${C.blue}08`, borderTop:`2px solid ${C.border}` }}>
                      <td colSpan={2} style={{ padding:'10px 16px', fontSize:13, fontWeight:700, color:C.dark, textAlign:'right' }}>Total</td>
                      <td style={{ padding:'10px 16px', fontSize:13, fontWeight:700, color:C.blue, textAlign:'right' }}>{euro(totalDotations)}</td>
                      <td style={{ padding:'10px 16px', fontSize:13, fontWeight:700, color:C.green, textAlign:'right' }}>0,00 €</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ background:'rgba(212,168,83,0.06)', border:'1px solid rgba(212,168,83,0.2)', borderRadius:12, padding:'12px 16px', fontSize:12, color:'#92713A', lineHeight:1.6 }}>
              ⚠️ Ce calcul est fourni à titre indicatif. Consultez votre expert-comptable pour valider votre plan d'amortissement.
            </div>

          </>) : (
            <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:40, textAlign:'center', boxShadow:'0 1px 6px rgba(0,0,0,0.05)', color:C.light }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
              <div style={{ fontSize:14, fontWeight:600 }}>Renseignez la valeur du bien</div>
              <div style={{ fontSize:12, marginTop:6 }}>Le tableau d'amortissement apparaîtra ici</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
