import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabasePro } from '../lib/supabasePro';
import { ArrowRight, BookOpen, Search, Mail, CheckCircle } from 'lucide-react';
import Footer from '../components/Footer';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }) : '';

function readingTime(contenu) {
  if (!contenu) return null;
  const words = contenu.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

export default function BlogPage() {
  const [articles,  setArticles]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [categorie, setCategorie] = useState('tous');
  const [email,     setEmail]     = useState('');
  const [subStatus, setSubStatus] = useState(null);

  useEffect(() => {
    supabasePro.from('blog_articles')
      .select('id, slug, titre, meta_description, categorie, tags, date_publication, image_url, contenu')
      .eq('statut', 'publie')
      .order('date_publication', { ascending: false })
      .then(({ data }) => { setArticles(data || []); setLoading(false); });
  }, []);

  const handleSubscribe = async () => {
    if (!email.trim() || !email.includes('@')) return;
    setSubStatus('loading');
    try {
      const res = await fetch('/api/blog-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe', email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubStatus('success');
      setEmail('');
    } catch { setSubStatus('error'); }
  };

  const categories = ['tous', ...new Set(articles.map(a => a.categorie).filter(Boolean))];
  const filtered = articles.filter(a => {
    const matchSearch = !search || a.titre.toLowerCase().includes(search.toLowerCase()) || a.meta_description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categorie === 'tous' || a.categorie === categorie;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", background:'#06080B', color:'#EDE8DB', minHeight:'100vh' }}>

      {/* NAV */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6%', height:64, borderBottom:'1px solid rgba(255,255,255,0.06)', position:'sticky', top:0, background:'rgba(6,8,11,0.95)', backdropFilter:'blur(20px)', zIndex:100 }}>
        <Link to="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}>
          <img src="/logo-vigie.png" alt="Vigie" style={{ height:28 }} onError={e => e.currentTarget.style.display='none'}/>
          <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:18, fontWeight:700, color:'#5BC78A' }}>Vigie Blog</span>
        </Link>
        <div style={{ display:'flex', gap:10 }}>
          <Link to="/pro/login" style={{ padding:'7px 16px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', color:'rgba(237,232,219,0.6)', fontSize:13, fontWeight:600, textDecoration:'none' }}>Connexion</Link>
          <Link to="/pro/signup" style={{ padding:'7px 16px', borderRadius:8, background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none' }}>Vigie Pro</Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ textAlign:'center', padding:'72px 6% 48px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(91,199,138,0.1)', border:'1px solid rgba(91,199,138,0.2)', borderRadius:20, padding:'6px 14px', marginBottom:20 }}>
          <BookOpen size={13} color="#5BC78A"/>
          <span style={{ fontSize:12, fontWeight:700, color:'#5BC78A' }}>Vigie Blog</span>
        </div>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(32px, 5vw, 56px)', fontWeight:700, color:'#EDE8DB', marginBottom:16, lineHeight:1.1 }}>
          Guides & ressources pour<br/><em style={{ color:'#5BC78A' }}>auto-entrepreneurs</em>
        </h1>
        <p style={{ fontSize:15, color:'rgba(237,232,219,0.45)', maxWidth:480, margin:'0 auto 32px', lineHeight:1.7 }}>
          Informations pratiques sur la gestion, la fiscalité et les obligations des indépendants français.
        </p>
        <div style={{ maxWidth:480, margin:'0 auto', position:'relative' }}>
          <Search size={16} color="rgba(237,232,219,0.3)" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un article..."
            style={{ width:'100%', padding:'12px 14px 12px 42px', borderRadius:12, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#EDE8DB', fontSize:14, outline:'none', boxSizing:'border-box' }}/>
        </div>
      </div>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'48px 6%' }}>

        {/* Filtres */}
        {categories.length > 1 && (
          <div style={{ display:'flex', gap:8, marginBottom:32, flexWrap:'wrap' }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCategorie(c)}
                style={{ padding:'6px 16px', borderRadius:20, border:`1px solid ${categorie===c?'#5BC78A':'rgba(255,255,255,0.1)'}`, background:categorie===c?'rgba(91,199,138,0.15)':'transparent', color:categorie===c?'#5BC78A':'rgba(237,232,219,0.5)', fontSize:12, fontWeight:categorie===c?700:500, cursor:'pointer' }}>
                {c === 'tous' ? 'Tous les articles' : c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'rgba(237,232,219,0.3)', fontSize:14 }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <BookOpen size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom:16 }}/>
            <p style={{ color:'rgba(237,232,219,0.3)', fontSize:14 }}>{search ? 'Aucun article pour cette recherche.' : "Aucun article publié pour l'instant."}</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:24 }}>
            {filtered.map(a => (
              <Link key={a.id} to={`/blog/${a.slug}`} style={{ textDecoration:'none' }}>
                <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, overflow:'hidden', height:'100%', transition:'all 200ms ease', display:'flex', flexDirection:'column' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(91,199,138,0.06)'; e.currentTarget.style.borderColor='rgba(91,199,138,0.25)'; e.currentTarget.style.transform='translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.transform='translateY(0)'; }}>
                  {a.image_url
                    ? <div style={{ width:'100%', height:160, overflow:'hidden', flexShrink:0 }}>
                        <img src={a.image_url} alt={a.titre} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.8)' }}/>
                      </div>
                    : <div style={{ width:'100%', height:80, background:'linear-gradient(135deg, rgba(91,199,138,0.1), rgba(91,163,199,0.05))', flexShrink:0 }}/>
                  }
                  <div style={{ padding:'20px', display:'flex', flexDirection:'column', flex:1 }}>
                    {a.categorie && (
                      <span style={{ fontSize:10, fontWeight:700, color:'#5BC78A', background:'rgba(91,199,138,0.1)', padding:'3px 10px', borderRadius:20, display:'inline-block', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.06em' }}>{a.categorie}</span>
                    )}
                    <h2 style={{ fontSize:15, fontWeight:700, color:'#EDE8DB', marginBottom:8, lineHeight:1.4, flex:1 }}>{a.titre}</h2>
                    <p style={{ fontSize:12, color:'rgba(237,232,219,0.4)', lineHeight:1.6, marginBottom:14 }}>{a.meta_description}</p>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={{ fontSize:11, color:'rgba(237,232,219,0.25)' }}>{formatDate(a.date_publication)}</span>
                        {a.contenu && <span style={{ fontSize:10, color:'rgba(237,232,219,0.2)', background:'rgba(255,255,255,0.05)', padding:'2px 7px', borderRadius:10 }}>{readingTime(a.contenu)} de lecture</span>}
                      </div>
                      <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:700, color:'#5BC78A' }}>Lire <ArrowRight size={12}/></span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* NEWSLETTER */}
        {!loading && (
          <div style={{ marginTop:64, padding:'48px', background:'rgba(91,199,138,0.05)', border:'1px solid rgba(91,199,138,0.15)', borderRadius:20, textAlign:'center' }}>
            <Mail size={28} color="#5BC78A" style={{ marginBottom:12 }}/>
            <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:700, color:'#EDE8DB', marginBottom:8 }}>Restez informé</h3>
            <p style={{ fontSize:14, color:'rgba(237,232,219,0.4)', marginBottom:24, maxWidth:400, margin:'0 auto 24px' }}>
              Recevez les nouveaux articles directement dans votre boîte mail. Gratuit, sans spam.
            </p>
            {subStatus === 'success' ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'#5BC78A', fontSize:14, fontWeight:600 }}>
                <CheckCircle size={18}/> Inscription confirmée !
              </div>
            ) : (
              <div style={{ display:'flex', gap:10, maxWidth:400, margin:'0 auto', flexWrap:'wrap', justifyContent:'center' }}>
                <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                  placeholder="votre@email.fr" type="email"
                  style={{ flex:1, minWidth:200, padding:'11px 16px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#EDE8DB', fontSize:14, outline:'none' }}/>
                <button onClick={handleSubscribe} disabled={subStatus === 'loading'}
                  style={{ padding:'11px 24px', borderRadius:10, background:'#5BC78A', color:'#06080B', fontSize:14, fontWeight:700, border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>
                  {subStatus === 'loading' ? '...' : "S'inscrire"}
                </button>
              </div>
            )}
            {subStatus === 'error' && <p style={{ fontSize:12, color:'#C75B4E', marginTop:10 }}>Une erreur est survenue. Réessayez.</p>}
          </div>
        )}

        {/* CTA Vigie Pro */}
        {!loading && filtered.length > 0 && (
          <div style={{ marginTop:32, textAlign:'center', padding:'48px', background:'rgba(91,163,199,0.05)', border:'1px solid rgba(91,163,199,0.15)', borderRadius:20 }}>
            <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:28, fontWeight:700, color:'#EDE8DB', marginBottom:12 }}>Gérez votre activité avec Vigie Pro</h3>
            <p style={{ fontSize:14, color:'rgba(237,232,219,0.4)', marginBottom:24 }}>L'application de gestion pour auto-entrepreneurs et TPE françaises.</p>
            <Link to="/pro/signup" style={{ padding:'12px 32px', borderRadius:10, background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none' }}>
              Essayer gratuitement →
            </Link>
          </div>
        )}
      </div>

      <Footer/>
    </div>
  );
}
