import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabasePro } from '../lib/supabasePro';
import { ArrowLeft, BookOpen, ArrowRight } from 'lucide-react';
import Footer from '../components/Footer';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }) : '';

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
  const [article,  setArticle]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabasePro.from('blog_articles')
      .select('*')
      .eq('slug', slug)
      .eq('statut', 'publie')
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setArticle(data);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", background:'#06080B', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(237,232,219,0.3)', fontSize:14 }}>
      Chargement...
    </div>
  );

  if (notFound) return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", background:'#06080B', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#EDE8DB' }}>
      <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:48, marginBottom:16 }}>Article introuvable</h1>
      <Link to="/blog" style={{ color:'#5BC78A', textDecoration:'none', fontSize:14 }}>← Retour au blog</Link>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", background:'#06080B', color:'#EDE8DB', minHeight:'100vh' }}>

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

      {/* ARTICLE */}
      <article style={{ maxWidth:740, margin:'0 auto', padding:'64px 6% 80px' }}>

        {/* Meta */}
        <div style={{ marginBottom:32 }}>
          {article.categorie && (
            <span style={{ fontSize:11, fontWeight:700, color:'#5BC78A', background:'rgba(91,199,138,0.1)', padding:'4px 12px', borderRadius:20, display:'inline-block', marginBottom:20, textTransform:'uppercase', letterSpacing:'0.06em' }}>{article.categorie}</span>
          )}
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(28px, 4vw, 44px)', fontWeight:700, color:'#EDE8DB', lineHeight:1.2, marginBottom:16 }}>{article.titre}</h1>
          <p style={{ fontSize:16, color:'rgba(237,232,219,0.5)', lineHeight:1.7, marginBottom:20 }}>{article.meta_description}</p>
          <div style={{ display:'flex', alignItems:'center', gap:12, fontSize:12, color:'rgba(237,232,219,0.3)' }}>
            <span>Publié le {formatDate(article.date_publication)}</span>
            {article.tags?.length > 0 && <>
              <span>·</span>
              <div style={{ display:'flex', gap:6 }}>
                {article.tags.slice(0,3).map(t => (
                  <span key={t} style={{ background:'rgba(255,255,255,0.06)', padding:'2px 8px', borderRadius:10, fontSize:11 }}>{t}</span>
                ))}
              </div>
            </>}
          </div>
        </div>

        <div style={{ height:1, background:'rgba(255,255,255,0.06)', marginBottom:40 }}/>

        {/* Contenu */}
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(article.contenu) }}/>

        <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'48px 0 40px' }}/>

        {/* Disclaimer */}
        <div style={{ background:'rgba(91,163,199,0.06)', border:'1px solid rgba(91,163,199,0.15)', borderRadius:12, padding:'16px 20px', marginBottom:40, fontSize:13, color:'rgba(237,232,219,0.4)', lineHeight:1.6 }}>
          ℹ️ Ces informations sont fournies à titre indicatif. Pour votre situation personnelle, consultez un expert-comptable ou un conseiller juridique.
        </div>

        {/* CTA */}
        <div style={{ background:'linear-gradient(135deg, rgba(91,163,199,0.1), rgba(91,163,199,0.04))', border:'1px solid rgba(91,163,199,0.2)', borderRadius:16, padding:'32px', textAlign:'center' }}>
          <BookOpen size={28} color="#5BA3C7" style={{ marginBottom:12 }}/>
          <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:24, fontWeight:700, color:'#EDE8DB', marginBottom:10 }}>Gérez votre activité avec Vigie Pro</h3>
          <p style={{ fontSize:14, color:'rgba(237,232,219,0.45)', marginBottom:20 }}>L'application de gestion pour auto-entrepreneurs et TPE françaises.</p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/pro/signup" style={{ padding:'11px 28px', borderRadius:10, background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none' }}>
              Essayer gratuitement →
            </Link>
            <Link to="/blog" style={{ padding:'11px 20px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', color:'rgba(237,232,219,0.6)', fontSize:13, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
              <ArrowLeft size={13}/> Retour au blog
            </Link>
          </div>
        </div>
      </article>

      <Footer/>
    </div>
  );
}
