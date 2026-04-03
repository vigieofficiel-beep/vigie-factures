import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabasePro } from '../lib/supabasePro';
import { ArrowLeft, BookOpen, Send, CheckCircle } from 'lucide-react';
import Footer from '../components/Footer';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }) : '';

function readingTime(contenu) {
  if (!contenu) return null;
  const words = contenu.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^### (.+)$/gm, '<h3 style="font-family:\'Cormorant Garamond\',serif;font-size:20px;font-weight:700;color:#EDE8DB;margin:28px 0 12px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-family:\'Cormorant Garamond\',serif;font-size:26px;font-weight:700;color:#EDE8DB;margin:36px 0 14px">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-family:\'Cormorant Garamond\',serif;font-size:32px;font-weight:700;color:#EDE8DB;margin:0 0 20px">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#EDE8DB;font-weight:700">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color:rgba(237,232,219,0.7)">$1</em>')
    .replace(/^- (.+)$/gm, '<li style="color:rgba(237,232,219,0.7);font-size:15px;line-height:1.7;margin-bottom:6px">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, (m) => `<ul style="padding-left:20px;margin:12px 0">${m}</ul>`)
    .replace(/^(?!<[h|u|l]).+$/gm, (m) => m.trim() ? `<p style="color:rgba(237,232,219,0.7);font-size:15px;line-height:1.8;margin-bottom:14px">${m}</p>` : '')
    .replace(/\n{2,}/g, '');
}

export default function BlogArticle() {
  const { slug } = useParams();
  const [article,    setArticle]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [similaires, setSimilaires] = useState([]);
  const [comments,   setComments]   = useState([]);
  const [nom,        setNom]        = useState('');
  const [message,    setMessage]    = useState('');
  const [cmtStatus,  setCmtStatus]  = useState(null);

  useEffect(() => {
    supabasePro.from('blog_articles')
      .select('*').eq('slug', slug).eq('statut', 'publie').single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return; }
        setArticle(data);
        setLoading(false);
        supabasePro.from('blog_articles')
          .select('id, slug, titre, meta_description, image_url, date_publication')
          .eq('statut', 'publie').eq('categorie', data.categorie).neq('slug', slug).limit(3)
          .then(({ data: sim }) => setSimilaires(sim || []));
        supabasePro.from('blog_comments')
          .select('id, nom, message, created_at')
          .eq('article_id', data.id).eq('approuve', true)
          .order('created_at', { ascending: true })
          .then(({ data: cmts }) => setComments(cmts || []));
      });
  }, [slug]);

  const handleComment = async () => {
    if (!nom.trim() || !message.trim() || !article) return;
    setCmtStatus('loading');
    try {
      const { error } = await supabasePro.from('blog_comments').insert({
        article_id: article.id, nom: nom.trim(), message: message.trim()
      });
      if (error) throw error;
      setCmtStatus('success'); setNom(''); setMessage('');
    } catch { setCmtStatus('error'); }
  };

  const iS = { width:'100%', padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#EDE8DB', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:"'Nunito Sans',sans-serif" };

  if (loading) return (
    <div style={{ fontFamily:"'Nunito Sans',sans-serif", background:'#06080B', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(237,232,219,0.3)', fontSize:14 }}>Chargement...</div>
  );
  if (notFound) return (
    <div style={{ fontFamily:"'Nunito Sans',sans-serif", background:'#06080B', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#EDE8DB' }}>
      <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:48, marginBottom:16 }}>Article introuvable</h1>
      <Link to="/blog" style={{ color:'#5BC78A', textDecoration:'none', fontSize:14 }}>← Retour au blog</Link>
    </div>
  );

  const minutes = readingTime(article.contenu);

  return (
    <div style={{ fontFamily:"'Nunito Sans',sans-serif", background:'#06080B', color:'#EDE8DB', minHeight:'100vh' }}>

      {/* NAV */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6%', height:64, borderBottom:'1px solid rgba(255,255,255,0.06)', position:'sticky', top:0, background:'rgba(6,8,11,0.95)', backdropFilter:'blur(20px)', zIndex:100 }}>
        <Link to="/blog" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:8, color:'rgba(237,232,219,0.6)', fontSize:13 }}>
          <ArrowLeft size={14}/> Vigie Blog
        </Link>
        <div style={{ display:'flex', gap:10 }}>
          <Link to="/pro/login" style={{ padding:'7px 16px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', color:'rgba(237,232,219,0.6)', fontSize:13, fontWeight:600, textDecoration:'none' }}>Connexion</Link>
          <Link to="/pro/signup" style={{ padding:'7px 16px', borderRadius:8, background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none' }}>Vigie Pro</Link>
        </div>
      </nav>

      {/* IMAGE EN-TÊTE */}
      {article.image_url && (
        <div style={{ width:'100%', maxHeight:420, overflow:'hidden', position:'relative' }}>
          <img src={article.image_url} alt={article.titre} style={{ width:'100%', height:420, objectFit:'cover', filter:'brightness(0.7)' }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(6,8,11,0.1) 0%, rgba(6,8,11,0.8) 100%)' }}/>
          {article.image_credit && (
            <a href={article.image_credit_url || 'https://unsplash.com'} target="_blank" rel="noreferrer"
              style={{ position:'absolute', bottom:12, right:16, fontSize:10, color:'rgba(255,255,255,0.4)', textDecoration:'none' }}>
              Photo : {article.image_credit} · Unsplash
            </a>
          )}
        </div>
      )}

      <article style={{ maxWidth:740, margin:'0 auto', padding: article.image_url ? '40px 6% 80px' : '64px 6% 80px' }}>

        {/* Meta */}
        <div style={{ marginBottom:32 }}>
          {article.categorie && (
            <span style={{ fontSize:11, fontWeight:700, color:'#5BC78A', background:'rgba(91,199,138,0.1)', padding:'4px 12px', borderRadius:20, display:'inline-block', marginBottom:20, textTransform:'uppercase', letterSpacing:'0.06em' }}>{article.categorie}</span>
          )}
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(28px, 4vw, 44px)', fontWeight:700, color:'#EDE8DB', lineHeight:1.2, marginBottom:16 }}>{article.titre}</h1>
          <p style={{ fontSize:16, color:'rgba(237,232,219,0.5)', lineHeight:1.7, marginBottom:20 }}>{article.meta_description}</p>
          <div style={{ display:'flex', alignItems:'center', gap:12, fontSize:12, color:'rgba(237,232,219,0.3)', flexWrap:'wrap' }}>
            <span>Publié le {formatDate(article.date_publication)}</span>
            {minutes && <span style={{ background:'rgba(255,255,255,0.05)', padding:'2px 8px', borderRadius:10 }}>{minutes} min de lecture</span>}
            {article.tags?.length > 0 && <>
              <span>·</span>
              {article.tags.slice(0,3).map(t => (
                <span key={t} style={{ background:'rgba(255,255,255,0.06)', padding:'2px 8px', borderRadius:10, fontSize:11 }}>{t}</span>
              ))}
            </>}
          </div>
        </div>

        <div style={{ height:1, background:'rgba(255,255,255,0.06)', marginBottom:40 }}/>
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(article.contenu) }}/>
        <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'48px 0 40px' }}/>

        {/* Disclaimer */}
        <div style={{ background:'rgba(91,163,199,0.06)', border:'1px solid rgba(91,163,199,0.15)', borderRadius:12, padding:'16px 20px', marginBottom:40, fontSize:13, color:'rgba(237,232,219,0.4)', lineHeight:1.6 }}>
          ℹ️ Ces informations sont fournies à titre indicatif. Pour votre situation personnelle, consultez un expert-comptable ou un conseiller juridique.
        </div>

        {/* COMMENTAIRES */}
        <div style={{ marginBottom:48 }}>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:'#EDE8DB', marginBottom:24 }}>
            Commentaires {comments.length > 0 && `(${comments.length})`}
          </h3>
          {comments.length === 0 && <p style={{ fontSize:13, color:'rgba(237,232,219,0.3)', marginBottom:24 }}>Soyez le premier à commenter.</p>}
          {comments.map(c => (
            <div key={c.id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'16px 20px', marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#EDE8DB' }}>{c.nom}</span>
                <span style={{ fontSize:11, color:'rgba(237,232,219,0.3)' }}>{formatDate(c.created_at)}</span>
              </div>
              <p style={{ fontSize:13, color:'rgba(237,232,219,0.6)', lineHeight:1.6, margin:0 }}>{c.message}</p>
            </div>
          ))}
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:20, marginTop:24 }}>
            <h4 style={{ fontSize:14, fontWeight:700, color:'#EDE8DB', marginBottom:16 }}>Laisser un commentaire</h4>
            {cmtStatus === 'success' ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, color:'#5BC78A', fontSize:13 }}>
                <CheckCircle size={16}/> Commentaire envoyé — en attente de validation.
              </div>
            ) : (
              <>
                <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre prénom *" style={{ ...iS, marginBottom:10 }}/>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Votre commentaire *" rows={4} style={{ ...iS, resize:'vertical', marginBottom:12 }}/>
                <button onClick={handleComment} disabled={cmtStatus === 'loading' || !nom.trim() || !message.trim()}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:8, background:'#5BC78A', color:'#06080B', fontSize:13, fontWeight:700, border:'none', cursor:'pointer' }}>
                  <Send size={13}/> {cmtStatus === 'loading' ? 'Envoi...' : 'Envoyer'}
                </button>
                {cmtStatus === 'error' && <p style={{ fontSize:12, color:'#C75B4E', marginTop:8 }}>Une erreur est survenue.</p>}
                <p style={{ fontSize:11, color:'rgba(237,232,219,0.2)', marginTop:8 }}>Votre commentaire sera visible après modération.</p>
              </>
            )}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background:'linear-gradient(135deg, rgba(91,163,199,0.1), rgba(91,163,199,0.04))', border:'1px solid rgba(91,163,199,0.2)', borderRadius:16, padding:'32px', textAlign:'center', marginBottom:48 }}>
          <BookOpen size={28} color="#5BA3C7" style={{ marginBottom:12 }}/>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, color:'#EDE8DB', marginBottom:10 }}>Gérez votre activité avec Vigie Pro</h3>
          <p style={{ fontSize:14, color:'rgba(237,232,219,0.45)', marginBottom:20 }}>L'application de gestion pour auto-entrepreneurs et TPE françaises.</p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/pro/signup" style={{ padding:'11px 28px', borderRadius:10, background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none' }}>Essayer gratuitement →</Link>
            <Link to="/blog" style={{ padding:'11px 20px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', color:'rgba(237,232,219,0.6)', fontSize:13, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}><ArrowLeft size={13}/> Retour au blog</Link>
          </div>
        </div>

        {/* ARTICLES SIMILAIRES */}
        {similaires.length > 0 && (
          <div>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:'#EDE8DB', marginBottom:20 }}>Articles similaires</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:16 }}>
              {similaires.map(s => (
                <Link key={s.id} to={`/blog/${s.slug}`} style={{ textDecoration:'none' }}>
                  <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, overflow:'hidden', transition:'all 200ms' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(91,199,138,0.25)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.transform='translateY(0)'; }}>
                    {s.image_url && <img src={s.image_url} alt={s.titre} style={{ width:'100%', height:100, objectFit:'cover', filter:'brightness(0.7)' }}/>}
                    <div style={{ padding:'12px 14px' }}>
                      <p style={{ fontSize:13, fontWeight:700, color:'#EDE8DB', lineHeight:1.4, margin:'0 0 6px' }}>{s.titre}</p>
                      <span style={{ fontSize:11, color:'#5BC78A', fontWeight:600 }}>Lire →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
      <Footer/>
    </div>
  );
}
