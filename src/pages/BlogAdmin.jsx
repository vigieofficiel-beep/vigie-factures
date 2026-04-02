import { useState, useEffect } from 'react';
import { supabasePro } from '../lib/supabasePro';
import { Plus, Trash2, Eye, EyeOff, Loader, CheckCircle, AlertTriangle, Lock, RefreshCw, ExternalLink, FileText, X, Edit3, Save } from 'lucide-react';

const ACCENT = '#5BC78A';
const ADMIN_EMAIL = 'luciendoppler@gmail.com';
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '—';

const CATEGORIES = [
  'TVA & Régimes fiscaux', 'Charges & Cotisations URSSAF', 'Facturation & Devis',
  'Contrats & Assurances', 'Comptabilité & Trésorerie', 'Seuils & Plafonds',
  'Radiation & Cessation', "Création d'entreprise", 'Droit du travail indépendant',
  'RGPD & Données personnelles', 'Propriété intellectuelle', 'Contrats clients & CGV',
  'Réglementation sectorielle', 'Outils SaaS indépendants', 'Automatisation & IA',
  'Gestion du temps', 'Facturation électronique (e-invoicing 2026)', 'Épargne & Prévoyance',
  'Financement & Aides', 'Optimisation fiscale', 'Trésorerie & Cash flow',
  'Trouver des clients', 'Tarification & Positionnement', 'Personal branding',
  'Réseaux sociaux pro', 'Artisans & BTP', 'Consultants & Freelances',
  'Créatifs & Développeurs', 'Santé & Bien-être indépendant', 'Nouveautés légales',
  'Actualité auto-entrepreneur', 'Chiffres & Statistiques', 'Europe & International',
  'Formation & Montée en compétences', 'Cybersécurité & Protection données',
];

const STATUT_STYLE = {
  publie:    { bg: 'rgba(91,199,138,0.1)',   color: '#5BC78A',               label: '● Publié'   },
  brouillon: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(237,232,219,0.4)', label: '○ Brouillon'},
  a_relire:  { bg: 'rgba(212,168,83,0.1)',   color: '#D4A853',               label: '◐ À relire' },
};

function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;color:#EDE8DB;margin:16px 0 8px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:18px;color:#EDE8DB;margin:24px 0 12px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:8px">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:22px;color:#EDE8DB;margin:0 0 16px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:rgba(237,232,219,0.6)">$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #D4A853;padding:8px 16px;margin:12px 0;background:rgba(212,168,83,0.05);color:#D4A853;border-radius:0 6px 6px 0">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li style="margin:4px 0;color:rgba(237,232,219,0.8)">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul style="padding-left:20px;margin:8px 0">$&</ul>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0"/>')
    .replace(/\n\n/g, '</p><p style="margin:8px 0;color:rgba(237,232,219,0.8);line-height:1.7">')
    .replace(/^(?!<[h|u|b|l|p])(.+)$/gm, '<p style="margin:8px 0;color:rgba(237,232,219,0.8);line-height:1.7">$1</p>');
}

export default function BlogAdmin() {
  const [articles,   setArticles]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [correcting, setCorrecting] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [sujet,      setSujet]      = useState('');
  const [categorie,  setCategorie]  = useState('TVA & Régimes fiscaux');
  const [publier,    setPublier]    = useState(true);
  const [msg,        setMsg]        = useState(null);
  const [authorized, setAuthorized] = useState(null);
  const [filterCat,  setFilterCat]  = useState('tous');
  const [filterStat, setFilterStat] = useState('tous');
  const [preview,    setPreview]    = useState(null);
  const [editMode,   setEditMode]   = useState(false);
  const [editData,   setEditData]   = useState({});

  useEffect(() => {
    supabasePro.auth.getSession().then(({ data: { session } }) => {
      setAuthorized(session?.user?.email === ADMIN_EMAIL);
    });
  }, []);

  useEffect(() => { if (authorized) fetchArticles(); }, [authorized]);

  const fetchArticles = async () => {
    setLoading(true);
    const { data } = await supabasePro
      .from('blog_articles')
      .select('id, slug, titre, contenu, meta_description, categorie, tags, statut, date_publication, created_at, auto_generated, updated_at')
      .order('created_at', { ascending: false });
    setArticles(data || []);
    setLoading(false);
  };

  const openPreview = (article) => {
    setPreview(article);
    setEditMode(false);
    setEditData({
      titre: article.titre,
      meta_description: article.meta_description || '',
      categorie: article.categorie,
      tags: (article.tags || []).join(', '),
      contenu: article.contenu || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      const tagsArray = editData.tags.split(',').map(t => t.trim()).filter(Boolean);
      const { error } = await supabasePro.from('blog_articles').update({
        titre: editData.titre,
        meta_description: editData.meta_description,
        categorie: editData.categorie,
        tags: tagsArray,
        contenu: editData.contenu,
        updated_at: new Date().toISOString(),
      }).eq('id', preview.id);
      if (error) throw error;
      setMsg({ type: 'success', text: '✓ Article mis à jour !' });
      setEditMode(false);
      await fetchArticles();
      // Met à jour preview avec les nouvelles données
      setPreview(prev => ({ ...prev, ...editData, tags: tagsArray }));
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
    setSaving(false);
  };

  const generer = async () => {
    if (!sujet.trim()) return;
    setGenerating(true); setMsg(null);
    try {
      const res = await fetch('/api/blog-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', sujet, categorie, publier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ type: 'success', text: `✓ Article "${data.article.titre}" généré !` });
      setSujet('');
      fetchArticles();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setGenerating(false);
  };

  const handleCorrection = async (article) => {
    if (!confirm(`Relancer le pipeline de correction IA sur "${article.titre}" ?`)) return;
    setCorrecting(article.id); setMsg(null);
    try {
      const res = await fetch('/api/blog-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pipeline', titre: article.titre, categorie: article.categorie, angle: article.titre, auto_generated: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ type: 'success', text: `✓ Article régénéré — Score factuel : ${data.score_factuel}/10` });
      fetchArticles();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setCorrecting(null);
  };

  const toggleStatut = async (article) => {
    const newStatut = article.statut === 'publie' ? 'brouillon' : 'publie';
    await supabasePro.from('blog_articles').update({
      statut: newStatut,
      date_publication: newStatut === 'publie' ? new Date().toISOString() : null
    }).eq('id', article.id);
    fetchArticles();
  };

  const supprimer = async (id) => {
    if (!confirm('Supprimer cet article définitivement ?')) return;
    await supabasePro.from('blog_articles').delete().eq('id', id);
    fetchArticles();
  };

  const iS = { width:'100%', padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#EDE8DB', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:"'Nunito Sans', sans-serif" };
  const iSEdit = { ...iS, border:'1px solid rgba(91,163,199,0.4)', background:'rgba(91,163,199,0.05)' };

  const nbPublies   = articles.filter(a => a.statut === 'publie').length;
  const nbBrouillon = articles.filter(a => a.statut === 'brouillon').length;
  const nbARelire   = articles.filter(a => a.statut === 'a_relire').length;
  const categoriesPresentes = ['tous', ...new Set(articles.map(a => a.categorie).filter(Boolean))];

  const filtered = articles.filter(a => {
    const matchCat  = filterCat  === 'tous' || a.categorie === filterCat;
    const matchStat = filterStat === 'tous' || a.statut    === filterStat;
    return matchCat && matchStat;
  });

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
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:1100, margin:'0 auto' }}>

      {/* ── MODALE PRÉVISUALISATION + ÉDITION ── */}
      {preview && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 20px', overflowY:'auto' }}
          onClick={e => { if (e.target === e.currentTarget) { setPreview(null); setEditMode(false); } }}>
          <div style={{ background:'#1a1d24', border:`1px solid ${editMode ? 'rgba(91,163,199,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius:16, maxWidth:860, width:'100%', padding:32, position:'relative' }}>

            {/* Boutons haut */}
            <div style={{ position:'absolute', top:16, right:16, display:'flex', gap:8 }}>
              {!editMode ? (
                <button onClick={() => setEditMode(true)}
                  style={{ background:'rgba(91,163,199,0.1)', border:'1px solid rgba(91,163,199,0.3)', borderRadius:8, padding:'6px 12px', cursor:'pointer', color:'#5BA3C7', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600 }}>
                  <Edit3 size={13}/> Modifier
                </button>
              ) : (
                <>
                  <button onClick={() => setEditMode(false)}
                    style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', color:'rgba(237,232,219,0.5)', fontSize:12 }}>
                    Annuler
                  </button>
                  <button onClick={handleSaveEdit} disabled={saving}
                    style={{ background: saving ? 'rgba(91,199,138,0.3)' : ACCENT, border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700 }}>
                    {saving ? <Loader size={13} style={{ animation:'spin 1s linear infinite' }}/> : <Save size={13}/>}
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </>
              )}
              <button onClick={() => { setPreview(null); setEditMode(false); }}
                style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'rgba(237,232,219,0.6)', display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
                <X size={14}/>
              </button>
            </div>

            {editMode ? (
              /* ── MODE ÉDITION ── */
              <div style={{ marginTop:8 }}>
                <div style={{ background:'rgba(91,163,199,0.06)', border:'1px solid rgba(91,163,199,0.15)', borderRadius:10, padding:'10px 14px', marginBottom:20, fontSize:12, color:'#5BA3C7' }}>
                  ✏️ Mode édition — modifiez les champs puis cliquez "Sauvegarder"
                </div>

                <label style={{ fontSize:11, fontWeight:600, color:'rgba(237,232,219,0.5)', display:'block', marginBottom:6 }}>Titre</label>
                <input value={editData.titre} onChange={e => setEditData(p => ({ ...p, titre: e.target.value }))} style={{ ...iSEdit, marginBottom:16 }}/>

                <label style={{ fontSize:11, fontWeight:600, color:'rgba(237,232,219,0.5)', display:'block', marginBottom:6 }}>Meta description</label>
                <input value={editData.meta_description} onChange={e => setEditData(p => ({ ...p, meta_description: e.target.value }))} style={{ ...iSEdit, marginBottom:16 }} placeholder="Description SEO (150-160 caractères)"/>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
                  <div>
                    <label style={{ fontSize:11, fontWeight:600, color:'rgba(237,232,219,0.5)', display:'block', marginBottom:6 }}>Catégorie</label>
                    <select value={editData.categorie} onChange={e => setEditData(p => ({ ...p, categorie: e.target.value }))} style={{ ...iSEdit, cursor:'pointer' }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:600, color:'rgba(237,232,219,0.5)', display:'block', marginBottom:6 }}>Tags (séparés par des virgules)</label>
                    <input value={editData.tags} onChange={e => setEditData(p => ({ ...p, tags: e.target.value }))} style={iSEdit} placeholder="tag1, tag2, tag3"/>
                  </div>
                </div>

                <label style={{ fontSize:11, fontWeight:600, color:'rgba(237,232,219,0.5)', display:'block', marginBottom:6 }}>Contenu (Markdown)</label>
                <textarea
                  value={editData.contenu}
                  onChange={e => setEditData(p => ({ ...p, contenu: e.target.value }))}
                  style={{ ...iSEdit, minHeight:400, resize:'vertical', lineHeight:1.6, fontFamily:'monospace', fontSize:12 }}
                />
              </div>
            ) : (
              /* ── MODE PRÉVISUALISATION ── */
              <>
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(91,163,199,0.1)', color:'#5BA3C7' }}>{preview.categorie}</span>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, ...(STATUT_STYLE[preview.statut] || STATUT_STYLE.brouillon) }}>{(STATUT_STYLE[preview.statut] || STATUT_STYLE.brouillon).label}</span>
                  {preview.tags?.length > 0 && preview.tags.map(t => (
                    <span key={t} style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(255,255,255,0.05)', color:'rgba(237,232,219,0.4)' }}>{t}</span>
                  ))}
                </div>
                <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:700, color:'#EDE8DB', margin:'0 0 8px', paddingRight:120 }}>{preview.titre}</h1>
                {preview.meta_description && <p style={{ fontSize:13, color:'rgba(237,232,219,0.4)', margin:'0 0 24px', fontStyle:'italic' }}>{preview.meta_description}</p>}
                <hr style={{ border:'none', borderTop:'1px solid rgba(255,255,255,0.08)', marginBottom:24 }}/>
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(preview.contenu) }}/>
                <div style={{ marginTop:32, display:'flex', gap:10, flexWrap:'wrap' }}>
                  <a href={`/blog/${preview.slug}`} target="_blank" rel="noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, background:'rgba(91,163,199,0.1)', border:'1px solid rgba(91,163,199,0.2)', color:'#5BA3C7', textDecoration:'none', fontSize:13, fontWeight:600 }}>
                    <ExternalLink size={13}/> Voir sur le blog
                  </a>
                  <button onClick={() => { toggleStatut(preview); setPreview(null); }}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, background: preview.statut === 'publie' ? 'rgba(199,91,78,0.1)' : 'rgba(91,199,138,0.1)', border:`1px solid ${preview.statut === 'publie' ? 'rgba(199,91,78,0.2)' : 'rgba(91,199,138,0.2)'}`, color: preview.statut === 'publie' ? '#C75B4E' : ACCENT, cursor:'pointer', fontSize:13, fontWeight:600 }}>
                    {preview.statut === 'publie' ? <EyeOff size={13}/> : <Eye size={13}/>}
                    {preview.statut === 'publie' ? 'Dépublier' : 'Publier'}
                  </button>
                  <button onClick={() => supprimer(preview.id)}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, background:'rgba(199,91,78,0.08)', border:'1px solid rgba(199,91,78,0.15)', color:'#C75B4E', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                    <Trash2 size={13}/> Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:28, fontWeight:600, color:'#EDE8DB', margin:0 }}>Vigie Blog — Admin</h1>
        <p style={{ fontSize:13, color:'rgba(237,232,219,0.4)', marginTop:4 }}>
          {articles.length} articles · {nbPublies} publiés · {nbBrouillon} brouillons
          {nbARelire > 0 && <span style={{ color:'#D4A853', fontWeight:700 }}> · {nbARelire} à relire</span>}
        </p>
      </div>

      {/* Alerte articles à relire */}
      {nbARelire > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:10, background:'rgba(212,168,83,0.08)', border:'1px solid rgba(212,168,83,0.25)', marginBottom:24, fontSize:13, color:'#D4A853' }}>
          <AlertTriangle size={15}/>
          <span><strong>{nbARelire} article{nbARelire > 1 ? 's' : ''}</strong> généré{nbARelire > 1 ? 's' : ''} automatiquement attend{nbARelire > 1 ? 'ent' : ''} votre validation.</span>
          <button onClick={() => setFilterStat('a_relire')} style={{ marginLeft:'auto', background:'rgba(212,168,83,0.15)', border:'1px solid rgba(212,168,83,0.3)', color:'#D4A853', borderRadius:6, padding:'4px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}>
            Voir
          </button>
        </div>
      )}

      {/* Message global */}
      {msg && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:9, background:msg.type==='success'?'rgba(91,199,138,0.1)':'rgba(199,91,78,0.1)', border:`1px solid ${msg.type==='success'?'rgba(91,199,138,0.25)':'rgba(199,91,78,0.25)'}`, marginBottom:16, fontSize:13, color:msg.type==='success'?ACCENT:'#C75B4E' }}>
          {msg.type==='success' ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'inherit', opacity:0.5 }}><X size={12}/></button>
        </div>
      )}

      {/* Formulaire génération */}
      <div style={{ background:'rgba(91,199,138,0.05)', border:'1px solid rgba(91,199,138,0.2)', borderRadius:16, padding:24, marginBottom:32 }}>
        <h2 style={{ fontSize:15, fontWeight:700, color:'#EDE8DB', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
          <Plus size={16} color={ACCENT}/> Générer un nouvel article
        </h2>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, fontWeight:600, color:'rgba(237,232,219,0.5)', display:'block', marginBottom:6 }}>Sujet ou mot-clé *</label>
          <input value={sujet} onChange={e => setSujet(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !generating) generer(); }}
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
        <button onClick={generer} disabled={generating || !sujet.trim()}
          style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:generating||!sujet.trim()?`${ACCENT}50`:ACCENT, color:'#fff', fontSize:14, fontWeight:700, cursor:generating||!sujet.trim()?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          {generating ? <><Loader size={15} style={{ animation:'spin 1s linear infinite' }}/> Génération en cours... (30-60s)</> : "✨ Générer l'article"}
        </button>
        <p style={{ fontSize:11, color:'rgba(237,232,219,0.25)', textAlign:'center', marginTop:8 }}>
          Article généré par GPT-4o (~1500 mots, optimisé SEO)
        </p>
      </div>

      {/* Filtres statut */}
      <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
        {[
          { val:'tous',      label:`Tous (${articles.length})` },
          { val:'publie',    label:`Publiés (${nbPublies})` },
          { val:'a_relire',  label:`À relire (${nbARelire})` },
          { val:'brouillon', label:`Brouillons (${nbBrouillon})` },
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setFilterStat(val)}
            style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${filterStat===val?ACCENT:'rgba(255,255,255,0.1)'}`, background:filterStat===val?`${ACCENT}20`:'transparent', color:filterStat===val?ACCENT:'rgba(237,232,219,0.4)', fontSize:11, fontWeight:filterStat===val?700:500, cursor:'pointer', whiteSpace:'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Filtres catégorie */}
      {categoriesPresentes.length > 1 && (
        <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
          {categoriesPresentes.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${filterCat===c?'rgba(91,163,199,0.8)':'rgba(255,255,255,0.1)'}`, background:filterCat===c?'rgba(91,163,199,0.15)':'transparent', color:filterCat===c?'#5BA3C7':'rgba(237,232,219,0.4)', fontSize:11, fontWeight:filterCat===c?700:500, cursor:'pointer', whiteSpace:'nowrap' }}>
              {c === 'tous' ? 'Toutes catégories' : c}
            </button>
          ))}
        </div>
      )}

      {/* Liste articles */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:700, color:'#EDE8DB' }}>{filtered.length} article{filtered.length !== 1 ? 's' : ''}</span>
          <span style={{ fontSize:11, color:'rgba(237,232,219,0.3)' }}>{nbPublies} publiés · {nbBrouillon} brouillons · {nbARelire} à relire</span>
        </div>

        {loading
          ? <div style={{ padding:40, textAlign:'center', color:'rgba(237,232,219,0.3)', fontSize:13 }}>Chargement...</div>
          : filtered.length === 0
            ? <div style={{ padding:48, textAlign:'center', color:'rgba(237,232,219,0.3)', fontSize:13 }}>Aucun article dans cette sélection.</div>
            : <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                    {['Titre', 'Catégorie', 'Statut', 'Date', 'Source', ''].map((h, i) => (
                      <th key={i} style={{ padding:'11px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'rgba(237,232,219,0.3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const st = STATUT_STYLE[a.statut] || STATUT_STYLE.brouillon;
                    return (
                      <tr key={a.id}
                        style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background: a.statut === 'a_relire' ? 'rgba(212,168,83,0.03)' : 'transparent' }}
                        onMouseEnter={ev => ev.currentTarget.style.background='rgba(255,255,255,0.02)'}
                        onMouseLeave={ev => ev.currentTarget.style.background= a.statut === 'a_relire' ? 'rgba(212,168,83,0.03)' : 'transparent'}>

                        <td style={{ padding:'12px 14px', fontSize:13, color:'#EDE8DB', maxWidth:300 }}>
                          <span style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', cursor:'pointer' }}
                            onClick={() => openPreview(a)}>{a.titre}</span>
                          <a href={`/blog/${a.slug}`} target="_blank" rel="noreferrer"
                            style={{ fontSize:11, color:'rgba(237,232,219,0.3)', textDecoration:'none' }}>/blog/{a.slug}</a>
                        </td>

                        <td style={{ padding:'12px 14px', fontSize:12, color:'rgba(237,232,219,0.5)', maxWidth:160 }}>
                          <span style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.categorie || '—'}</span>
                        </td>

                        <td style={{ padding:'12px 14px' }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:st.bg, color:st.color }}>{st.label}</span>
                        </td>

                        <td style={{ padding:'12px 14px', fontSize:12, color:'rgba(237,232,219,0.4)', whiteSpace:'nowrap' }}>
                          {formatDate(a.date_publication || a.created_at)}
                        </td>

                        <td style={{ padding:'12px 14px' }}>
                          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background: a.auto_generated ? 'rgba(91,163,199,0.1)' : 'rgba(255,255,255,0.05)', color: a.auto_generated ? '#5BA3C7' : 'rgba(237,232,219,0.3)' }}>
                            {a.auto_generated ? 'Auto' : 'Manuel'}
                          </span>
                        </td>

                        <td style={{ padding:'12px 14px' }}>
                          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                            <button onClick={() => openPreview(a)} title="Prévisualiser / Modifier"
                              style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'rgba(237,232,219,0.4)', display:'flex' }}
                              onMouseEnter={ev => ev.currentTarget.style.color='#EDE8DB'}
                              onMouseLeave={ev => ev.currentTarget.style.color='rgba(237,232,219,0.4)'}>
                              <FileText size={14}/>
                            </button>
                            <a href={`/blog/${a.slug}`} target="_blank" rel="noreferrer" title="Voir sur le blog"
                              style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'rgba(237,232,219,0.4)', display:'flex', textDecoration:'none' }}
                              onMouseEnter={ev => ev.currentTarget.style.color='#5BA3C7'}
                              onMouseLeave={ev => ev.currentTarget.style.color='rgba(237,232,219,0.4)'}>
                              <ExternalLink size={14}/>
                            </a>
                            <button onClick={() => toggleStatut(a)} title={a.statut === 'publie' ? 'Dépublier' : 'Publier'}
                              style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:a.statut==='publie'?ACCENT:'rgba(237,232,219,0.3)', display:'flex' }}>
                              {a.statut === 'publie' ? <Eye size={14}/> : <EyeOff size={14}/>}
                            </button>
                            <button onClick={() => handleCorrection(a)} title="Régénérer via pipeline IA"
                              disabled={correcting === a.id}
                              style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'rgba(212,168,83,0.6)', display:'flex' }}
                              onMouseEnter={ev => ev.currentTarget.style.color='#D4A853'}
                              onMouseLeave={ev => ev.currentTarget.style.color='rgba(212,168,83,0.6)'}>
                              {correcting === a.id ? <Loader size={14} style={{ animation:'spin 1s linear infinite' }}/> : <RefreshCw size={14}/>}
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
                    );
                  })}
                </tbody>
              </table>
        }
      </div>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
