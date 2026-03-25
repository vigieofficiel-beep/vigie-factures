import { useState, useEffect } from "react";
import { supabasePro } from "../lib/supabasePro";
import { Plus, Trash2, Edit2, Download, Search, AlertTriangle, TrendingUp, X, ChevronDown, ChevronUp, ShoppingCart, BarChart2, RefreshCw } from "lucide-react";
import ExportButton from '../components/ExportButton';

/* ══ AGENT 6 — Détecteur prix surélevés + INSEE ══════════════════════ */
async function fetchInflationINSEE(categorie) {
  try {
    const res = await fetch(`/api/insee-proxy?categorie=${encodeURIComponent(categorie)}`);
    if (!res.ok) return { inflation12m: 2.5, source: 'estimation' };
    return await res.json();
  } catch {
    return { inflation12m: 2.5, source: 'estimation' };
  }
}

function analyserPrixFournisseurs(fournisseurs, expenses, inflationData = {}) {
  const alertes = [];
  if (!fournisseurs.length || !expenses.length) return alertes;

  // Grouper dépenses par fournisseur + chronologie
  const parFournisseur = {};
  for (const e of expenses) {
    const nom = e.etablissement?.toLowerCase().trim();
    if (!nom) continue;
    if (!parFournisseur[nom]) parFournisseur[nom] = [];
    parFournisseur[nom].push({ montant: e.amount_ttc, date: e.date });
  }

  // 1. Détecter hausses vs inflation INSEE
  for (const f of fournisseurs) {
    const nom = f.nom?.toLowerCase().trim();
    const ops = parFournisseur[nom] || [];
    if (ops.length < 2) continue;

    const sorted   = [...ops].sort((a, b) => new Date(a.date) - new Date(b.date));
    const anciens   = sorted.slice(0, -1);
    const dernier   = sorted[sorted.length - 1];
    const moyenne   = anciens.reduce((s, o) => s + o.montant, 0) / anciens.length;
    const haussePct = ((dernier.montant - moyenne) / moyenne) * 100;

    // Récupérer inflation sectorielle pour cette catégorie
    const cat = f.categorie || 'Autre';
    const inflation = inflationData[cat]?.inflation12m ?? 2.5;
    const source    = inflationData[cat]?.source ?? 'estimation';

    // Alerte si hausse > inflation + 20 points
    const seuilAlerte = inflation + 20;
    if (haussePct >= seuilAlerte) {
      alertes.push({
        id      : `hausse-${nom}`,
        type    : 'hausse',
        niveau  : haussePct >= inflation + 50 ? 'critique' : 'attention',
        titre   : `Hausse anormale : ${f.nom}`,
        detail  : `+${Math.round(haussePct)}% vs votre historique · inflation ${cat} : +${inflation}% (${source})`,
        fournisseur: f.nom,
        hausse  : Math.round(haussePct),
        inflation,
        surcoût : Math.round(haussePct - inflation),
        categorie: cat,
      });
    }
  }

  // 2. Comparer fournisseurs de la même catégorie
  const parCategorie = {};
  for (const f of fournisseurs) {
    const cat = f.categorie || 'Autre';
    const ops = parFournisseur[f.nom?.toLowerCase().trim()] || [];
    if (ops.length === 0) continue;
    const moy = ops.reduce((s, o) => s + o.montant, 0) / ops.length;
    if (!parCategorie[cat]) parCategorie[cat] = [];
    parCategorie[cat].push({ nom: f.nom, moyenne: moy });
  }

  for (const [cat, liste] of Object.entries(parCategorie)) {
    if (liste.length < 2) continue;
    const moyGlobale = liste.reduce((s, f) => s + f.moyenne, 0) / liste.length;
    for (const f of liste) {
      const ecart = ((f.moyenne - moyGlobale) / moyGlobale) * 100;
      if (ecart >= 40) {
        alertes.push({
          id      : `cher-${f.nom}`,
          type    : 'comparaison',
          niveau  : 'attention',
          titre   : `${f.nom} plus cher que sa catégorie`,
          detail  : `+${Math.round(ecart)}% vs moyenne ${cat} (${moyGlobale.toFixed(0)}€ → ${f.moyenne.toFixed(0)}€)`,
          fournisseur: f.nom,
          ecart   : Math.round(ecart),
          categorie: cat,
        });
      }
    }
  }

  const ordre = { critique: 0, attention: 1 };
  return alertes.sort((a, b) => ordre[a.niveau] - ordre[b.niveau]);
}

/* ══ STYLES ══════════════════════════════════════════════════════════ */
const C = { blue:'#5BA3C7', purple:'#A85BC7', dark:'#EDE8DB', light:'rgba(237,232,219,0.4)', border:'rgba(255,255,255,0.08)', bg:'rgba(255,255,255,0.06)', red:'#C75B4E', orange:'#5BC78A', green:'#5BC78A' };
const CATEGORIES = ["Toutes","Informatique","Fournitures","Loyer","Transport","Alimentation","Communication","Énergie","Assurance","Comptabilité","Juridique","Marketing","RH","Autre"];
const iS = { width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#EDE8DB', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
const lS = { fontSize:11, fontWeight:600, color:'rgba(237,232,219,0.5)', marginBottom:5, display:'block', textTransform:'uppercase', letterSpacing:'0.05em' };

/* ══ FORMULAIRE FOURNISSEUR ══════════════════════════════════════════ */
function FournisseurForm({ onSave, onCancel, editData=null }) {
  const [form, setForm] = useState(editData || { nom:'', siret:'', categorie:'Autre', email:'', telephone:'', site_web:'', adresse:'', code_postal:'', ville:'', contact_nom:'', conditions_paiement:'30 jours', notes:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async ev => {
    ev.preventDefault(); setLoading(true);
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      if (editData?.id) { const { error: err } = await supabasePro.from('fournisseurs').update({ ...form }).eq('id', editData.id); if (err) throw err; }
      else { const { error: err } = await supabasePro.from('fournisseurs').insert({ ...form, user_id: user.id }); if (err) throw err; }
      onSave();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:24, marginBottom:24, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
      <h3 style={{ fontSize:15, fontWeight:700, color:C.dark, marginBottom:20 }}>{editData ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div><label style={lS}>Nom *</label><input value={form.nom} onChange={set('nom')} required style={iS} placeholder="SARL Dupont"/></div>
        <div><label style={lS}>SIRET</label><input value={form.siret} onChange={set('siret')} style={iS} placeholder="000 000 000 00000"/></div>
        <div><label style={lS}>Catégorie</label><select value={form.categorie} onChange={set('categorie')} style={{ ...iS, cursor:'pointer' }}>{CATEGORIES.filter(c=>c!=='Toutes').map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label style={lS}>Email</label><input type="email" value={form.email} onChange={set('email')} style={iS} placeholder="contact@fournisseur.fr"/></div>
        <div><label style={lS}>Téléphone</label><input value={form.telephone} onChange={set('telephone')} style={iS} placeholder="01 00 00 00 00"/></div>
        <div><label style={lS}>Site web</label><input value={form.site_web} onChange={set('site_web')} style={iS} placeholder="https://..."/></div>
        <div><label style={lS}>Contact</label><input value={form.contact_nom} onChange={set('contact_nom')} style={iS} placeholder="Jean Dupont"/></div>
        <div><label style={lS}>Conditions paiement</label><select value={form.conditions_paiement} onChange={set('conditions_paiement')} style={{ ...iS, cursor:'pointer' }}>{['Comptant','15 jours','30 jours','45 jours','60 jours'].map(c=><option key={c}>{c}</option>)}</select></div>
      </div>
      <div style={{ marginBottom:14 }}><label style={lS}>Adresse</label><input value={form.adresse} onChange={set('adresse')} style={iS} placeholder="1 rue de la Paix"/></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:14, marginBottom:14 }}>
        <div><label style={lS}>Code postal</label><input value={form.code_postal} onChange={set('code_postal')} style={iS} placeholder="75001"/></div>
        <div><label style={lS}>Ville</label><input value={form.ville} onChange={set('ville')} style={iS} placeholder="Paris"/></div>
      </div>
      <div style={{ marginBottom:18 }}><label style={lS}>Notes</label><textarea value={form.notes} onChange={set('notes')} rows={2} style={{ ...iS, resize:'vertical' }} placeholder="Informations complémentaires..."/></div>
      {error && <div style={{ color:C.red, fontSize:12, marginBottom:12 }}>{error}</div>}
      <div style={{ display:'flex', gap:10 }}>
        <button type="submit" disabled={loading} style={{ flex:1, padding:'11px', borderRadius:9, border:'none', background:C.blue, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>{loading?'Enregistrement...':'✓ Enregistrer'}</button>
        <button type="button" onClick={onCancel} style={{ padding:'11px 18px', borderRadius:9, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:'rgba(237,232,219,0.5)', fontSize:13, cursor:'pointer' }}>Annuler</button>
      </div>
    </form>
  );
}

/* ══ BANDEAU ALERTES AGENT 6 ════════════════════════════════════════ */
function BandeauAgent6({ alertes, loadingINSEE }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState([]);
  const visibles = alertes.filter(a => !dismissed.includes(a.id));
  if (visibles.length === 0 && !loadingINSEE) return null;
  const critiques = visibles.filter(a => a.niveau === 'critique').length;

  return (
    <div style={{ background: critiques > 0 ? 'rgba(199,91,78,0.06)' : 'rgba(212,168,83,0.06)', border:`1px solid ${critiques > 0 ? 'rgba(199,91,78,0.25)' : 'rgba(212,168,83,0.25)'}`, borderRadius:14, marginBottom:24, overflow:'hidden' }}>
      <div onClick={() => setCollapsed(c => !c)} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', cursor:'pointer' }}>
        <TrendingUp size={15} color={critiques > 0 ? C.red : C.orange}/>
        <span style={{ fontSize:13, fontWeight:700, color: critiques > 0 ? C.red : C.orange, flex:1 }}>
          {loadingINSEE ? 'Analyse des prix en cours…' : `${visibles.length} alerte${visibles.length > 1 ? 's' : ''} prix surélevés`}
          {!loadingINSEE && critiques > 0 && <span style={{ fontSize:11, marginLeft:8, background:'rgba(199,91,78,0.15)', color:C.red, padding:'2px 7px', borderRadius:20 }}>{critiques} urgente{critiques > 1 ? 's' : ''}</span>}
        </span>
        {!loadingINSEE && <button onClick={e => { e.stopPropagation(); setDismissed(alertes.map(a=>a.id)); }} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(237,232,219,0.4)', fontSize:11, padding:'3px 8px', borderRadius:6 }}><X size={11}/> Tout ignorer</button>}
        {collapsed ? <ChevronDown size={14} color="#94A3B8"/> : <ChevronUp size={14} color="#94A3B8"/>}
      </div>

      {!collapsed && !loadingINSEE && (
        <div style={{ padding:'8px 16px 12px' }}>
          {visibles.map(a => {
            const color = a.niveau === 'critique' ? C.red : C.orange;
            return (
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, background:`${color}08`, border:`1px solid ${color}25`, borderRadius:9, padding:'9px 12px', marginBottom:6 }}>
                <span style={{ fontSize:16 }}>{a.type === 'hausse' ? '📈' : '⚖️'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color }}>{a.titre}</div>
                  <div style={{ fontSize:11, color:'rgba(237,232,219,0.4)', marginTop:1 }}>{a.detail}</div>
                  {a.surcoût != null && (
                    <div style={{ fontSize:11, color, marginTop:2, fontWeight:600 }}>
                      Surcoût estimé vs inflation : +{a.surcoût}%
                    </div>
                  )}
                </div>
                <span style={{ fontSize:10, fontWeight:700, color, background:`${color}15`, padding:'2px 8px', borderRadius:20, flexShrink:0 }}>
                  {a.type === 'hausse' ? `+${a.hausse}%` : `+${a.ecart}%`}
                </span>
                <button onClick={() => setDismissed(d => [...d, a.id])} style={{ background:'none', border:'none', cursor:'pointer', color:'#CBD5E1', padding:2 }}><X size={11}/></button>
              </div>
            );
          })}
          <div style={{ fontSize:11, color:'rgba(237,232,219,0.4)', marginTop:6, textAlign:'right' }}>
            📊 Comparé aux indices de prix INSEE
          </div>
        </div>
      )}
    </div>
  );
}

/* ══ PAGE PRINCIPALE ════════════════════════════════════════════════ */
export default function FournisseursPro() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [expenses,     setExpenses]     = useState([]);
  const [alertes,      setAlertes]      = useState([]);
  const [inflationData, setInflationData] = useState({});
  const [loadingINSEE, setLoadingINSEE] = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState('fournisseurs');
  const [showForm,     setShowForm]     = useState(false);
  const [editData,     setEditData]     = useState(null);
  const [search,       setSearch]       = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('Toutes');
  const [selected,     setSelected]     = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabasePro.auth.getUser();
    if (!user) return;
    const [{ data: f }, { data: e }] = await Promise.all([
      supabasePro.from('fournisseurs').select('*').eq('user_id', user.id).order('nom'),
      supabasePro.from('expenses').select('amount_ttc, etablissement, date, type').eq('user_id', user.id),
    ]);
    const fData = f || []; const eData = e || [];
    setFournisseurs(fData);
    setExpenses(eData);

    // Alertes sans INSEE d'abord (instantané)
    setAlertes(analyserPrixFournisseurs(fData, eData, {}));

    // Puis enrichir avec INSEE en arrière-plan
    enrichirAvecINSEE(fData, eData);
    setLoading(false);
  };

  const enrichirAvecINSEE = async (fData, eData) => {
    setLoadingINSEE(true);
    // Récupérer les catégories uniques
    const categories = [...new Set(fData.map(f => f.categorie || 'Autre'))];
    const inflation = {};
    await Promise.all(categories.map(async cat => {
      const data = await fetchInflationINSEE(cat);
      inflation[cat] = data;
    }));
    setInflationData(inflation);
    setAlertes(analyserPrixFournisseurs(fData, eData, inflation));
    setLoadingINSEE(false);
  };

  const deleteFournisseur = async id => {
    if (!confirm('Supprimer ce fournisseur ?')) return;
    await supabasePro.from('fournisseurs').delete().eq('id', id);
    fetchAll();
  };

  const exportCSV = () => {
    const h = ['Nom','SIRET','Catégorie','Email','Téléphone','Ville','Contact','Délai paiement'];
    const r = filtered.map(f => [f.nom,f.siret,f.categorie,f.email,f.telephone,f.ville,f.contact_nom,f.conditions_paiement]);
    const csv = [h,...r].map(row => row.map(v=>`"${v??''}"`).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'})); a.download='fournisseurs.csv'; a.click();
  };

  const statsCategorie = fournisseurs.reduce((acc, f) => {
    const cat = f.categorie || 'Autre';
    const ops = expenses.filter(e => e.etablissement?.toLowerCase().trim() === f.nom?.toLowerCase().trim());
    const total = ops.reduce((s, e) => s + (e.amount_ttc || 0), 0);
    if (!acc[cat]) acc[cat] = { count:0, total:0, inflation: inflationData[cat]?.inflation12m };
    acc[cat].count++; acc[cat].total += total;
    return acc;
  }, {});

  const filtered = fournisseurs.filter(f => {
    const q = search.toLowerCase();
    return (!search || `${f.nom} ${f.email} ${f.ville} ${f.categorie}`.toLowerCase().includes(q))
        && (filtreCategorie === 'Toutes' || f.categorie === filtreCategorie);
  });

  const totalDepenses = expenses.reduce((s, e) => s + (e.amount_ttc || 0), 0);

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:1000, margin:'0 auto' }}>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:C.dark, margin:0 }}>Fournisseurs</h1>
          <p style={{ fontSize:13, color:C.light, marginTop:4 }}>Gestion et analyse · indices de prix INSEE</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => enrichirAvecINSEE(fournisseurs, expenses)} title="Actualiser les indices INSEE" style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:'rgba(237,232,219,0.5)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            <RefreshCw size={13}/> INSEE
          </button>
          <ExportButton
  data={filtered}
  filename="fournisseurs"
  color="#5BA3C7"
  columns={[
    { key:'nom',                 label:'Nom' },
    { key:'siret',               label:'SIRET' },
    { key:'categorie',           label:'Catégorie' },
    { key:'email',               label:'Email' },
    { key:'telephone',           label:'Téléphone' },
    { key:'ville',               label:'Ville' },
    { key:'contact_nom',         label:'Contact' },
    { key:'conditions_paiement', label:'Délai paiement' },
  ]}
/>
          <button onClick={() => { setShowForm(true); setEditData(null); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, border:'none', background:C.blue, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            <Plus size={13}/> Nouveau fournisseur
          </button>
        </div>
      </div>

      <BandeauAgent6 alertes={alertes} loadingINSEE={loadingINSEE}/>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Fournisseurs', value:fournisseurs.length, color:C.blue, icon:ShoppingCart },
          { label:'Alertes prix', value:alertes.length, color:alertes.length>0?C.red:C.green, icon:TrendingUp },
          { label:'Total dépenses', value:new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(totalDepenses), color:C.purple, icon:BarChart2 },
        ].map(s => { const Icon = s.icon; return (
          <div key={s.label} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${alertes.length>0&&s.label==='Alertes prix'?'rgba(199,91,78,0.3)':'rgba(255,255,255,0.08)'}`, borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <p style={{ fontSize:11, color:C.light, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>{s.label}</p>
              <Icon size={14} color={s.color}/>
            </div>
            <p style={{ fontSize:22, fontWeight:700, color:s.color, margin:0 }}>{s.value}</p>
          </div>
        );})}
      </div>

      {(showForm||editData) && <FournisseurForm editData={editData} onSave={()=>{setShowForm(false);setEditData(null);fetchAll();}} onCancel={()=>{setShowForm(false);setEditData(null);}}/>}

      <div style={{ display:'flex', gap:4, marginBottom:18, background:'rgba(255,255,255,0.06)', borderRadius:10, padding:4, width:'fit-content' }}>
        {[{id:'fournisseurs',label:'Fournisseurs'},{id:'analyse',label:'Analyse par catégorie'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'7px 16px', borderRadius:8, border:'none', background:tab===t.id?'rgba(91,163,199,0.15)':'transparent', color:tab===t.id?'#5BA3C7':'rgba(237,232,219,0.4)', fontSize:13, fontWeight:tab===t.id?700:500, cursor:'pointer', boxShadow:tab===t.id?'0 1px 3px rgba(0,0,0,0.08)':'none', transition:'all 150ms ease' }}>{t.label}</button>
        ))}
      </div>

      {tab==='fournisseurs'&&(<>
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:C.light }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." style={{ ...iS, paddingLeft:32 }}/>
          </div>
          <select value={filtreCategorie} onChange={e=>setFiltreCategorie(e.target.value)} style={{ ...iS, width:'auto', cursor:'pointer' }}>
            {CATEGORIES.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          {loading?<div style={{ padding:40, textAlign:'center', color:C.light, fontSize:13 }}>Chargement...</div>
          :filtered.length===0?<div style={{ padding:48, textAlign:'center' }}><ShoppingCart size={32} color="#E8EAF0" style={{ marginBottom:12 }}/><p style={{ color:C.light, fontSize:13, margin:0 }}>{fournisseurs.length===0?'Aucun fournisseur — cliquez sur "Nouveau fournisseur"':'Aucun résultat'}</p></div>
          :<table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{['Nom','Catégorie','Email','Téléphone','Conditions',''].map(h=>(<th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>))}</tr></thead>
            <tbody>
              {filtered.map((f,i)=>{
                const aAlerte=alertes.some(a=>a.fournisseur?.toLowerCase()===f.nom?.toLowerCase());
                return(<tr key={f.id||i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background:aAlerte?'rgba(212,168,83,0.03)':'transparent', cursor:'pointer' }}
                  onMouseEnter={ev=>ev.currentTarget.style.background=aAlerte?'rgba(212,168,83,0.06)':'#FAFBFC'}
                  onMouseLeave={ev=>ev.currentTarget.style.background=aAlerte?'rgba(212,168,83,0.03)':'transparent'}
                  onClick={()=>setSelected(selected?.id===f.id?null:f)}>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{f.nom}</span>
                      {aAlerte&&<span style={{ fontSize:9, background:'rgba(212,168,83,0.15)', color:C.orange, padding:'1px 6px', borderRadius:10, fontWeight:700 }}>⚠️ PRIX</span>}
                    </div>
                    {f.ville&&<div style={{ fontSize:11, color:C.light, marginTop:1 }}>{f.ville}</div>}
                  </td>
                  <td style={{ padding:'11px 14px' }}><span style={{ fontSize:11, fontWeight:600, background:`${C.blue}12`, color:C.blue, padding:'3px 8px', borderRadius:20 }}>{f.categorie||'—'}</span></td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'rgba(237,232,219,0.5)' }}>{f.email||'—'}</td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'rgba(237,232,219,0.5)' }}>{f.telephone||'—'}</td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'rgba(237,232,219,0.5)' }}>{f.conditions_paiement||'—'}</td>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ display:'flex', gap:4 }} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>{setEditData(f);setShowForm(false);}} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:C.light }} onMouseEnter={e=>e.currentTarget.style.color=C.blue} onMouseLeave={e=>e.currentTarget.style.color=C.light}><Edit2 size={13}/></button>
                      <button onClick={()=>deleteFournisseur(f.id)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'rgba(237,232,219,0.2)' }} onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color='#D0D4DC'}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>);
              })}
            </tbody>
          </table>}
        </div>

        {selected&&(
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:22, marginTop:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:C.dark, margin:0 }}>{selected.nom}</h3>
              <button onClick={()=>setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer', color:C.light }}><X size={16}/></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
              {[['Catégorie',selected.categorie],['SIRET',selected.siret],['Email',selected.email],['Téléphone',selected.telephone],['Site web',selected.site_web],['Contact',selected.contact_nom],['Adresse',selected.adresse?`${selected.adresse}, ${selected.code_postal} ${selected.ville}`:null],['Conditions',selected.conditions_paiement]].filter(([,v])=>v).map(([label,value])=>(
                <div key={label} style={{ background:'rgba(255,255,255,0.04)', borderRadius:9, padding:'10px 14px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:13, color:C.dark }}>{value}</div>
                </div>
              ))}
            </div>
            {selected.notes&&<div style={{ marginTop:12, background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:9, padding:'10px 14px', fontSize:13, color:'#92400E' }}>📝 {selected.notes}</div>}
            {alertes.filter(a=>a.fournisseur?.toLowerCase()===selected.nom?.toLowerCase()).map(a=>(
              <div key={a.id} style={{ marginTop:12, background:'rgba(212,168,83,0.08)', border:'1px solid rgba(212,168,83,0.3)', borderRadius:9, padding:'10px 14px', fontSize:12, color:C.orange, fontWeight:600 }}>
                ⚠️ {a.titre} — {a.detail}
                {a.surcoût!=null&&<div style={{ marginTop:4, fontSize:11, fontWeight:400 }}>Surcoût vs inflation INSEE : +{a.surcoût}%</div>}
              </div>
            ))}
          </div>
        )}
      </>)}

      {tab==='analyse'&&(
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:22, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize:13, fontWeight:700, color:C.dark, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 20px' }}>Dépenses par catégorie · inflation INSEE</h2>
          {Object.keys(statsCategorie).length===0?(
            <p style={{ color:C.light, fontSize:13, textAlign:'center', padding:24 }}>Aucune donnée — ajoutez des fournisseurs et des dépenses.</p>
          ):Object.entries(statsCategorie).sort((a,b)=>b[1].total-a[1].total).map(([cat,stats])=>{
            const max=Math.max(...Object.values(statsCategorie).map(s=>s.total));
            const pct=max>0?Math.round((stats.total/max)*100):0;
            const infl=inflationData[cat];
            const aAlertesCat=alertes.filter(a=>a.categorie===cat).length;
            return(
              <div key={cat} style={{ marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:13, color:'rgba(237,232,219,0.5)', fontWeight:600 }}>{cat}</span>
                    <span style={{ fontSize:11, color:C.light }}>({stats.count} fournisseur{stats.count>1?'s':''})</span>
                    {infl&&<span style={{ fontSize:10, background:'rgba(91,163,199,0.1)', color:C.blue, padding:'1px 6px', borderRadius:10, fontWeight:600 }}>INSEE +{infl.inflation12m}%/an</span>}
                    {aAlertesCat>0&&<span style={{ fontSize:9, background:'rgba(212,168,83,0.15)', color:C.orange, padding:'1px 6px', borderRadius:10, fontWeight:700 }}>⚠️ {aAlertesCat} alerte{aAlertesCat>1?'s':''}</span>}
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(stats.total)}</span>
                </div>
                <div style={{ height:8, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ width:`${pct}%`, height:'100%', background:`linear-gradient(90deg, ${C.blue}, ${C.purple})`, borderRadius:4, transition:'width 0.6s ease' }}/>
                </div>
              </div>
            );
          })}
          {Object.keys(inflationData).length>0&&(
            <p style={{ fontSize:11, color:C.light, marginTop:16, textAlign:'right' }}>📊 Indices de prix à la consommation — INSEE BDM</p>
          )}
        </div>
      )}
    </div>
  );
}
