import { useState, useEffect } from 'react';
import { supabasePro } from '../lib/supabasePro';
import { Plus, Trash2, Eye, EyeOff, Loader, CheckCircle, AlertTriangle, Lock } from 'lucide-react';

const ACCENT = '#5BC78A';
const ADMIN_EMAIL = 'luciendoppler@gmail.com';
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '—';

const CATEGORIES = [
  // Existantes
  'Guide pratique',
  'Fiscalité',
  'Facturation',
  'Gestion',
  'Juridique',
  'Actualité',
  // Nouvelles
  'Création & Statut',
  'Outils & Productivité',
  'Comptabilité',
  'Trésorerie',
  'Charges & Cotisations',
  'TVA',
  'Dépenses & Frais',
  'Clients & Devis',
  'Banque & Finances',
  'Contrats & Assurances',
  'Ressources Humaines',
  'Marketing & Communication',
  'Développement commercial',
  'Formation & Compétences',
  'Retraite & Protection sociale',
  'International & Export',
  'Immobilier professionnel',
  'Numérique & IA',
  'Secteur BTP',
  'Secteur Santé',
  'Secteur Conseil',
  'Secteur Commerce',
  'Secteur Artisanat',
];

export default function BlogAdmin() {
  const [articles,   setArticles]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sujet,      setSujet]      = useState('');
  const [categorie,  setCategorie]  = useState('Guide pratique');
  const [publier,    setPublier]    = useState(true);
  const [msg,        setMsg]        = useState(null);
  const [authorized, setAuthorized] = useState(null);
  const [filterCat,  setFilterCat]  = useState('tous');

  useEffect(() => {
    supabasePro.auth.getSession().then(({ data: { session } }) => {
      setAuthorized(session?.user?.email === ADMIN_EMAIL);
    });
  }, []);

  useEffect(() => { if (authorized) fetchArticles(); }, [authorized]);

  const fetchArticles = async () => {
    setLoading(true);
    const { data } = await supabasePro.from('blog_articles')
      .select('id, slug, titre, categorie, statut, date_publication, created_at')
      .order('created_at', { ascending: false });
    setArticles(data || []);
    setLoading(false);
  };

  const generer = async () => {
    if (!sujet.trim()) return;
    setGenerating(true); setMsg(null);
    try {
      const res = await fetch('/api/blog-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sujet, categorie, publier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ type: 'success', text: `✓ Article "${data.article.titre}" généré !` });
      setSujet('');
      fetchArticles();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setGenerating(false);
  };

  const toggleStatut = async (article) => {
    const newStatut = article.statut === 'publie' ? 'brouillon' : 'publie';
    await supabasePro.from('blog_articles').update({ statut: newStatut, date_publication: newStatut === 'publie' ? new Date().toISOString() : null }).eq('id', article.id);
    fetchArticles();
  };

  const supprimer = async (id) => {
    if (!confirm('Supprimer cet article définitivement ?')) return;
    await supabasePro.from('blog_articles').delete().eq('id', id);
    fetchArticles();
  };

  const iS = { width:'100%', padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#EDE8DB', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:"'Nunito Sans', sans-serif" };

  const categoriesPresentes = ['tous', ...new Set(articles.map(a => a.categorie).filter(Boolean))];
  const filtered = filterCat === 'tous' ? articles : articles.filter(a => a.categorie === filterCat);

  if (authorized === null) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'rgba(237,232,219,0.3)', fontSize:14 }}>Vérification...</div>
  );

  if (authorized === false) return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:16 }}>
      <div style={{ width:56, height:56, borderRadius:16, background:'rgba(199,91,78,0.1)', border:'1px solid rgba(199,91,78,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Lock size={24} color="#C75B4E"/>
      </div>
      <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:24, fontWeight:700, color:'#EDE8DB', margin:0 }}>Accès restreint</h2>
      <p style={{ fontSize:13, color:'rgba(237,232,219,0.4)', margin:0 }}>Cette page est réservée à l'administrateur.</p>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:1000, margin:'0 auto' }}>

      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:28, fontWeight:600, color:'#EDE8DB', margin:0 }}>Vigie Blog — Admin</h1>
        <p style={{ fontSize:13, color:'rgba(237,232,219,0.4)', marginTop:4 }}>
          {articles.length} articles · {articles.filter(a=>a.statut==='publie').length} publiés · {articles.filter(a=>a.statut==='brouillon').length} brouillons
        </p>
      </div>

      {/* Formulaire génération */}
      <div style={{ background:'rgba(91,199,138,0.05)', border:'1px solid rgba(91,199,138,0.2)', borderRadius:16, padding:24, marginBottom:32 }}>
        <h2 style={{ fontSize:15, fontWeight:700, color:'#EDE8DB', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
          <Plus size={16} color={ACCENT}/> Générer un nouvel article
        </h2>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, fontWeight:600, color:'rgba(237,232,219,0.5)', display:'block', marginBottom:6 }}>Sujet ou mot-clé *</label>
          <input value={sujet} onChange={e => setSujet(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !generating) generer(); }}
            placeholder="Ex: Comment calculer ses charges sociales en micro-entreprise" style={iS}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'rgba(237,232,219,0.5)', display:'block', marginBottom:6 }}>Catégorie ({CATEGORIES.length} disponibles)</label>
            <select value={categorie} onChange={e => setCategorie(e.target.value)} style={{ ...iS, cursor:'pointer' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'rgba(237,232,219,0.5)', display:'block', marginBottom:6 }}>Statut à la génération</label>
            <select value={publier} onChange={e => setPublier(e.target.value === 'true')} style={{ ...iS, cursor:'pointer' }}>
              <option value="true">Publier immédiatement</option>
              <option value="false">Garder en brouillon</option>
            </select>
          </div>
        </div>
        {msg && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:9, background:msg.type==='success'?'rgba(91,199,138,0.1)':'rgba(199,91,78,0.1)', border:`1px solid ${msg.type==='success'?'rgba(91,199,138,0.25)':'rgba(199,91,78,0.25)'}`, marginBottom:14, fontSize:13, color:msg.type==='success'?ACCENT:'#C75B4E' }}>
            {msg.type==='success' ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}
            {msg.text}
          </div>
        )}
        <button onClick={generer} disabled={generating || !sujet.trim()}
          style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:generating||!sujet.trim()?`${ACCENT}50`:ACCENT, color:'#fff', fontSize:14, fontWeight:700, cursor:generating||!sujet.trim()?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          {generating ? <><Loader size={15} style={{ animation:'spin 1s linear infinite' }}/> Génération en cours... (30-60s)</> : '✨ Générer l\'article'}
        </button>
        <p style={{ fontSize:11, color:'rgba(237,232,219,0.25)', textAlign:'center', marginTop:8 }}>
          Article généré par GPT-4o (~1500 mots, optimisé SEO)
        </p>
      </div>

      {/* Filtres par catégorie */}
      {categoriesPresentes.length > 1 && (
        <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
          {categoriesPresentes.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${filterCat===c?ACCENT:'rgba(255,255,255,0.1)'}`, background:filterCat===c?`${ACCENT}20`:'transparent', color:filterCat===c?ACCENT:'rgba(237,232,219,0.4)', fontSize:11, fontWeight:filterCat===c?700:500, cursor:'pointer', whiteSpace:'nowrap' }}>
              {c === 'tous' ? `Tous (${articles.length})` : `${c} (${articles.filter(a=>a.categorie===c).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Liste articles */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:700, color:'#EDE8DB' }}>
            {filterCat === 'tous' ? `Tous les articles (${articles.length})` : `${filterCat} (${filtered.length})`}
          </span>
          <span style={{ fontSize:11, color:'rgba(237,232,219,0.3)' }}>{articles.filter(a=>a.statut==='publie').length} publiés · {articles.filter(a=>a.statut==='brouillon').length} brouillons</span>
        </div>
        {loading ? <div style={{ padding:40, textAlign:'center', color:'rgba(237,232,219,0.3)', fontSize:13 }}>Chargement...</div>
        : filtered.length === 0 ? <div style={{ padding:48, textAlign:'center', color:'rgba(237,232,219,0.3)', fontSize:13 }}>Aucun article — générez votre premier article ci-dessus.</div>
        : <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                {['Titre','Catégorie','Statut','Date',''].map((h,i) => (
                  <th key={i} style={{ padding:'11px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'rgba(237,232,219,0.3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={ev => ev.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={ev => ev.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'12px 14px', fontSize:13, color:'#EDE8DB', maxWidth:320 }}>
                    <span style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.titre}</span>
                    <a href={`/blog/${a.slug}`} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'rgba(237,232,219,0.3)', textDecoration:'none' }}>/blog/{a.slug}</a>
                  </td>
                  <td style={{ padding:'12px 14px', fontSize:12, color:'rgba(237,232,219,0.5)' }}>{a.categorie || '—'}</td>
                  <td style={{ padding:'12px 14px' }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:a.statut==='publie'?'rgba(91,199,138,0.1)':'rgba(255,255,255,0.06)', color:a.statut==='publie'?ACCENT:'rgba(237,232,219,0.4)' }}>
                      {a.statut === 'publie' ? '● Publié' : '○ Brouillon'}
                    </span>
                  </td>
                  <td style={{ padding:'12px 14px', fontSize:12, color:'rgba(237,232,219,0.4)' }}>{formatDate(a.date_publication || a.created_at)}</td>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => toggleStatut(a)} title={a.statut==='publie'?'Dépublier':'Publier'}
                        style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:a.statut==='publie'?ACCENT:'rgba(237,232,219,0.3)', display:'flex' }}>
                        {a.statut==='publie' ? <Eye size={14}/> : <EyeOff size={14}/>}
                      </button>
                      <button onClick={() => supprimer(a.id)} title="Supprimer"
                        style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'rgba(237,232,219,0.2)', display:'flex' }}
                        onMouseEnter={ev => ev.currentTarget.style.color='#C75B4E'}
                        onMouseLeave={ev => ev.currentTarget.style.color='rgba(237,232,219,0.2)'}>
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
