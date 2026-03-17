import { useState, useEffect, useMemo } from 'react';
import { supabasePro } from '../lib/supabasePro';
import { TrendingUp, TrendingDown, FileText, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const C = { blue:'#5BA3C7', green:'#5BC78A', orange:'#D4A853', red:'#C75B4E', dark:'#1A1C20', light:'#9AA0AE', border:'#E8EAF0', bg:'#F8F9FB' };
const euro = (n) => new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(n ?? 0);
const pct  = (n) => `${Number(n).toFixed(1)}%`;

const ANNEES = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

// ── Barème IR 2025 ────────────────────────────────────────────────────
function calculerIR(revenuImposable) {
  const tranches = [
    { min: 0,      max: 11497,  taux: 0    },
    { min: 11497,  max: 29315,  taux: 0.11 },
    { min: 29315,  max: 83823,  taux: 0.30 },
    { min: 83823,  max: 180294, taux: 0.41 },
    { min: 180294, max: Infinity,taux: 0.45 },
  ];
  let ir = 0;
  for (const t of tranches) {
    if (revenuImposable <= t.min) break;
    ir += (Math.min(revenuImposable, t.max) - t.min) * t.taux;
  }
  return Math.max(0, ir);
}

// ── Taux IS 2025 ─────────────────────────────────────────────────────
function calculerIS(benefice) {
  if (benefice <= 0) return 0;
  const tauxReduit = 0.15; // jusqu'à 42 500€
  const tauxNormal = 0.25;
  const seuilReduit = 42500;
  if (benefice <= seuilReduit) return benefice * tauxReduit;
  return seuilReduit * tauxReduit + (benefice - seuilReduit) * tauxNormal;
}

// ── TVA estimée ───────────────────────────────────────────────────────
function calculerTVA(caHT, depensesHT) {
  const tvaCollectee  = caHT * 0.20;
  const tvaDeductible = depensesHT * 0.20;
  return Math.max(0, tvaCollectee - tvaDeductible);
}

// ── Cotisations AE ────────────────────────────────────────────────────
function calculerCotisationsAE(ca, activite = 'services') {
  const taux = activite === 'ventes' ? 0.121 : 0.214;
  return ca * taux;
}

const MOIS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

export default function TableauFiscal() {
  const [annee,     setAnnee]     = useState(new Date().getFullYear());
  const [regime,    setRegime]    = useState('ir'); // 'ir' | 'is' | 'ae'
  const [activite,  setActivite]  = useState('services');
  const [loading,   setLoading]   = useState(true);
  const [recettes,  setRecettes]  = useState([]);
  const [depenses,  setDepenses]  = useState([]);
  const [openSect,  setOpenSect]  = useState({ tva:true, impot:true, cotisations:true });

  useEffect(() => { fetchData(); }, [annee]);

  const fetchData = async () => {
    setLoading(true);
    const { data:{ user } } = await supabasePro.auth.getUser();
    if (!user) return;
    const debut = `${annee}-01-01`;
    const fin   = `${annee}-12-31`;
    const [{ data: rec }, { data: dep }] = await Promise.all([
      supabasePro.from('devis').select('montant_ht, montant_ttc, taux_tva, date, statut').eq('user_id', user.id).gte('date', debut).lte('date', fin).eq('statut','encaisse'),
      supabasePro.from('expenses').select('amount_ttc, montant_ht, date, type').eq('user_id', user.id).gte('date', debut).lte('date', fin),
    ]);
    setRecettes(rec || []);
    setDepenses(dep || []);
    setLoading(false);
  };

  const stats = useMemo(() => {
    const caHT       = recettes.reduce((s, r) => s + (r.montant_ht || r.montant_ttc / 1.2 || 0), 0);
    const caTTC      = recettes.reduce((s, r) => s + (r.montant_ttc || 0), 0);
    const depHT      = depenses.reduce((s, d) => s + (d.montant_ht || d.amount_ttc / 1.2 || 0), 0);
    const depTTC     = depenses.reduce((s, d) => s + (d.amount_ttc || 0), 0);
    const benefice   = caHT - depHT;
    const tvaAP      = calculerTVA(caHT, depHT);
    const ir         = calculerIR(benefice * 0.77); // abattement 23% BNC
    const is         = calculerIS(benefice);
    const cotisAE    = calculerCotisationsAE(caTTC, activite);
    const netAE      = caTTC - cotisAE;

    // Par mois
    const parMois = Array.from({ length:12 }, (_, m) => {
      const mois = String(m+1).padStart(2,'0');
      const ca   = recettes.filter(r => r.date?.startsWith(`${annee}-${mois}`)).reduce((s,r) => s+(r.montant_ht||r.montant_ttc/1.2||0),0);
      const dep  = depenses.filter(d => d.date?.startsWith(`${annee}-${mois}`)).reduce((s,d) => s+(d.montant_ht||d.amount_ttc/1.2||0),0);
      return { mois: MOIS_FR[m], ca, dep, benefice: ca - dep };
    });

    // Seuils franchise TVA
    const seuilTVA_services = 37500;
    const seuilTVA_ventes   = 85000;
    const seuil = activite === 'ventes' ? seuilTVA_ventes : seuilTVA_services;
    const franchiseTVA = caTTC <= seuil;

    // Seuil AE
    const seuilAE_services = 77700;
    const seuilAE_ventes   = 188700;
    const seuilAE = activite === 'ventes' ? seuilAE_ventes : seuilAE_services;
    const depasseAE = caTTC > seuilAE;

    return { caHT, caTTC, depHT, depTTC, benefice, tvaAP, ir, is, cotisAE, netAE, parMois, franchiseTVA, seuil, depasseAE, seuilAE };
  }, [recettes, depenses, regime, activite, annee]);

  const toggle = (k) => setOpenSect(s => ({ ...s, [k]: !s[k] }));

  const maxBar = Math.max(...stats.parMois.map(m => Math.max(m.ca, m.dep, 1)));

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:C.light, fontSize:14 }}>Chargement…</div>
  );

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:960, margin:'0 auto' }}>

      {/* En-tête */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:C.dark, margin:0 }}>Tableau de bord fiscal</h1>
        <p style={{ fontSize:13, color:C.light, marginTop:4 }}>Synthèse IS / Impôt sur le revenu · TVA · Cotisations · Année {annee}</p>
      </div>

      {/* Paramètres */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        <select value={annee} onChange={e => setAnnee(Number(e.target.value))} style={{ padding:'8px 14px', borderRadius:9, border:`1px solid ${C.border}`, background:'#fff', color:C.dark, fontSize:13, outline:'none', fontFamily:'inherit' }}>
          {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={regime} onChange={e => setRegime(e.target.value)} style={{ padding:'8px 14px', borderRadius:9, border:`1px solid ${C.border}`, background:'#fff', color:C.dark, fontSize:13, outline:'none', fontFamily:'inherit' }}>
          <option value="ae">Auto-entrepreneur</option>
          <option value="ir">IR (BNC/BIC)</option>
          <option value="is">IS (Société)</option>
        </select>
        <select value={activite} onChange={e => setActivite(e.target.value)} style={{ padding:'8px 14px', borderRadius:9, border:`1px solid ${C.border}`, background:'#fff', color:C.dark, fontSize:13, outline:'none', fontFamily:'inherit' }}>
          <option value="services">Prestations de services</option>
          <option value="ventes">Ventes de marchandises</option>
        </select>
      </div>

      {/* KPIs principaux */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'CA HT encaissé',   value:euro(stats.caHT),      color:C.green,  icon:TrendingUp   },
          { label:'Dépenses HT',      value:euro(stats.depHT),     color:C.red,    icon:TrendingDown },
          { label:'Bénéfice estimé',  value:euro(stats.benefice),  color:stats.benefice>=0?C.blue:C.red, icon:FileText },
          { label:'Marge nette',      value:stats.caHT>0?pct((stats.benefice/stats.caHT)*100):'—', color:C.orange, icon:TrendingUp },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:11, color:C.light, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{k.label}</span>
                <Icon size={14} color={k.color}/>
              </div>
              <div style={{ fontSize:22, fontWeight:700, color:k.color }}>{k.value}</div>
            </div>
          );
        })}
      </div>

      {/* Graphique mensuel */}
      <div style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, padding:22, marginBottom:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:16 }}>Évolution mensuelle {annee}</div>
        <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:100 }}>
          {stats.parMois.map((m, i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
              <div style={{ width:'100%', display:'flex', gap:1, alignItems:'flex-end', height:80 }}>
                <div style={{ flex:1, background:`${C.green}40`, borderRadius:'3px 3px 0 0', height:`${(m.ca/maxBar)*80}px`, minHeight: m.ca>0?2:0, transition:'height 0.5s ease' }}/>
                <div style={{ flex:1, background:`${C.red}40`, borderRadius:'3px 3px 0 0', height:`${(m.dep/maxBar)*80}px`, minHeight: m.dep>0?2:0, transition:'height 0.5s ease' }}/>
              </div>
              <span style={{ fontSize:9, color:C.light }}>{m.mois}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:16, marginTop:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:C.light }}>
            <div style={{ width:10, height:10, borderRadius:2, background:`${C.green}40` }}/> CA HT
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:C.light }}>
            <div style={{ width:10, height:10, borderRadius:2, background:`${C.red}40` }}/> Dépenses HT
          </div>
        </div>
      </div>

      {/* Sections fiscales */}
      {[
        {
          id: 'tva',
          titre: '🧾 TVA',
          couleur: C.blue,
          contenu: (
            <div>
              {stats.franchiseTVA ? (
                <div style={{ background:'rgba(91,199,138,0.08)', border:'1px solid rgba(91,199,138,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:12, fontSize:13, color:'#3a7a5a', fontWeight:600 }}>
                  ✅ Franchise en base de TVA — votre CA ({euro(stats.caTTC)}) est sous le seuil de {euro(stats.seuil)}. Vous n'êtes pas assujetti à la TVA.
                </div>
              ) : (
                <div style={{ background:'rgba(199,91,78,0.06)', border:'1px solid rgba(199,91,78,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:12, fontSize:13, color:C.red, fontWeight:600 }}>
                  ⚠️ Vous avez dépassé le seuil de franchise ({euro(stats.seuil)}). Vous êtes assujetti à la TVA.
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                {[
                  { label:'TVA collectée (20%)', value:euro(stats.caHT * 0.20),  color:C.red   },
                  { label:'TVA déductible',      value:euro(stats.depHT * 0.20), color:C.green },
                  { label:'TVA à payer estimée', value:euro(stats.tvaAP),        color:C.blue  },
                ].map(k => (
                  <div key={k.label} style={{ background:C.bg, borderRadius:10, padding:'14px', textAlign:'center' }}>
                    <div style={{ fontSize:11, color:C.light, marginBottom:6 }}>{k.label}</div>
                    <div style={{ fontSize:18, fontWeight:700, color:k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          id: 'impot',
          titre: regime === 'ae' ? '💰 Cotisations AE' : regime === 'ir' ? '💰 Impôt sur le revenu (IR — barème progressif)' : '💰 Impôt sur les sociétés (IS)',
          couleur: C.orange,
          contenu: (
            <div>
              {regime === 'ae' && (
                <>
                  {stats.depasseAE && (
                    <div style={{ background:'rgba(199,91,78,0.06)', border:'1px solid rgba(199,91,78,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:12, fontSize:13, color:C.red, fontWeight:600 }}>
                      ⚠️ Dépassement du plafond AE ({euro(stats.seuilAE)}). Vous devez changer de statut.
                    </div>
                  )}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                    {[
                      { label:'CA TTC',              value:euro(stats.caTTC),    color:C.green  },
                      { label:`Cotisations (${activite==='ventes'?'12.1%':'21.4%'})`, value:euro(stats.cotisAE), color:C.red },
                      { label:'Revenu net estimé',   value:euro(stats.netAE),    color:C.blue   },
                    ].map(k => (
                      <div key={k.label} style={{ background:C.bg, borderRadius:10, padding:'14px', textAlign:'center' }}>
                        <div style={{ fontSize:11, color:C.light, marginBottom:6 }}>{k.label}</div>
                        <div style={{ fontSize:18, fontWeight:700, color:k.color }}>{k.value}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {regime === 'ir' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                  {[
                    { label:'Bénéfice imposable',  value:euro(stats.benefice * 0.77), color:C.orange, info:'Après abattement 23% BNC' },
                    { label:'IR estimé',           value:euro(stats.ir),              color:C.red    },
                    { label:'Taux effectif',       value:stats.benefice>0?pct((stats.ir/stats.benefice)*100):'—', color:C.blue },
                  ].map(k => (
                    <div key={k.label} style={{ background:C.bg, borderRadius:10, padding:'14px', textAlign:'center' }}>
                      <div style={{ fontSize:11, color:C.light, marginBottom:4 }}>{k.label}</div>
                      {k.info && <div style={{ fontSize:9, color:C.light, marginBottom:4 }}>{k.info}</div>}
                      <div style={{ fontSize:18, fontWeight:700, color:k.color }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              )}
              {regime === 'is' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                  {[
                    { label:'Résultat fiscal',  value:euro(stats.benefice), color:C.orange },
                    { label:'IS estimé',        value:euro(stats.is),       color:C.red, info:'15% jusqu\'à 42 500€ · 25% au-delà' },
                    { label:'Résultat net',     value:euro(stats.benefice - stats.is), color:C.green },
                  ].map(k => (
                    <div key={k.label} style={{ background:C.bg, borderRadius:10, padding:'14px', textAlign:'center' }}>
                      <div style={{ fontSize:11, color:C.light, marginBottom:4 }}>{k.label}</div>
                      {k.info && <div style={{ fontSize:9, color:C.light, marginBottom:4 }}>{k.info}</div>}
                      <div style={{ fontSize:18, fontWeight:700, color:k.color }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ),
        },
      ].map(section => (
        <div key={section.id} style={{ background:'#fff', border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden', marginBottom:14, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
          <button onClick={() => toggle(section.id)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
            <span style={{ fontSize:14, fontWeight:700, color:C.dark }}>{section.titre}</span>
            {openSect[section.id] ? <ChevronUp size={16} color={C.light}/> : <ChevronDown size={16} color={C.light}/>}
          </button>
          {openSect[section.id] && <div style={{ padding:'0 20px 20px' }}>{section.contenu}</div>}
        </div>
      ))}

      {/* Avertissement */}
      <div style={{ background:'rgba(212,168,83,0.06)', border:'1px solid rgba(212,168,83,0.2)', borderRadius:12, padding:'14px 18px', fontSize:12, color:'#92713A', lineHeight:1.6, display:'flex', gap:10 }}>
        <AlertTriangle size={16} color={C.orange} style={{ flexShrink:0, marginTop:1 }}/>
        <div>Ces estimations sont calculées à titre indicatif sur la base des données saisies dans Vigie Pro. Elles ne constituent pas un avis fiscal. Consultez votre expert-comptable pour vos déclarations officielles.</div>
      </div>
    </div>
  );
}
