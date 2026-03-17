import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Briefcase, ArrowRight, Lock, ChevronDown } from 'lucide-react';
import Footer from '../components/Footer';

const FEATURES = [
  { emoji: '🧾', label: 'Dépenses & Recettes' },
  { emoji: '🤖', label: 'Détection d\'anomalies' },
  { emoji: '📊', label: 'Graphiques CA' },
  { emoji: '⚖️', label: 'Calculateur TVA' },
  { emoji: '📋', label: 'Devis PDF automatiques' },
  { emoji: '🏪', label: 'Analyse fournisseurs' },
  { emoji: '💱', label: 'Convertisseur devises' },
  { emoji: '🔔', label: 'Alertes intelligentes' },
];

const STATS = [
  { value: '10+', label: 'Modules métier' },
  { value: '100%', label: 'Données en Europe' },
];

export default function HomeHub() {
  const [scrolled, setScrolled] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", background:'#08090C', color:'#EDE8DB', minHeight:'100vh', overflowX:'hidden' }}>

      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity:0.025, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`, backgroundRepeat:'repeat', backgroundSize:'128px' }}/>
      <div style={{ position:'fixed', top:'-20vh', left:'50%', transform:'translateX(-50%)', width:'80vw', height:'80vw', maxWidth:900, background:'radial-gradient(ellipse, rgba(91,163,199,0.07) 0%, transparent 65%)', pointerEvents:'none', zIndex:0 }}/>

      {/* Navbar */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6%', height:64, background:scrolled?'rgba(8,9,12,0.92)':'transparent', backdropFilter:scrolled?'blur(20px)':'none', borderBottom:scrolled?'1px solid rgba(255,255,255,0.05)':'1px solid transparent', transition:'all 0.4s ease' }}>
        <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:700, color:'#EDE8DB' }}>Vigie</div>
        <div style={{ display:'flex', gap:10 }}>
          <Link to="/pro/login" style={{ padding:'8px 18px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', color:'rgba(237,232,219,0.6)', fontSize:13, fontWeight:600, textDecoration:'none' }}>Connexion</Link>
          <Link to="/pro/signup" style={{ padding:'8px 18px', borderRadius:8, background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none' }}>S'inscrire</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position:'relative', zIndex:1, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'100px 6% 60px', textAlign:'center' }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(91,163,199,0.08)', border:'1px solid rgba(91,163,199,0.2)', borderRadius:20, padding:'6px 16px', marginBottom:32, animation:'fadeUp 0.6s ease both' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#5BA3C7', animation:'pulse 2s infinite' }}/>
          <span style={{ fontSize:11, fontWeight:700, color:'#5BA3C7', letterSpacing:'0.1em', textTransform:'uppercase' }}>Gestion d'entreprise · 100% français</span>
        </div>

        {/* Titre SANS Hub */}
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(52px, 9vw, 110px)', fontWeight:700, lineHeight:0.95, letterSpacing:'-2px', color:'#EDE8DB', marginBottom:28, animation:'fadeUp 0.6s 0.1s ease both' }}>
          Vigie
        </h1>

        <p style={{ fontSize:'clamp(15px, 2vw, 19px)', color:'rgba(237,232,219,0.5)', maxWidth:520, lineHeight:1.7, marginBottom:52, animation:'fadeUp 0.6s 0.2s ease both' }}>
          Votre espace de gestion tout-en-un. Pilotez votre activité, automatisez vos tâches et prenez les bonnes décisions.
        </p>

        {/* Cartes */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:20, maxWidth:620, width:'100%', animation:'fadeUp 0.6s 0.3s ease both' }}>

          {/* Vigie Perso — EN CONSTRUCTION */}
          <div style={{ position:'relative', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:'36px 28px', opacity:0.5, cursor:'not-allowed', backdropFilter:'blur(10px)' }}>
            <div style={{ position:'absolute', top:14, right:14, display:'flex', alignItems:'center', gap:4, background:'rgba(212,168,83,0.1)', border:'1px solid rgba(212,168,83,0.25)', borderRadius:20, padding:'3px 10px' }}>
              <Lock size={9} color="#5BC78A"/>
              <span style={{ fontSize:10, fontWeight:700, color:'#5BC78A' }}>Bientôt</span>
            </div>
            <div style={{ width:56, height:56, borderRadius:16, background:'rgba(212,168,83,0.1)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
              <User size={24} color="#5BC78A" strokeWidth={2}/>
            </div>
            <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:700, color:'#EDE8DB', marginBottom:8, textAlign:'left' }}>Vigie Perso</h2>
            <p style={{ fontSize:13, color:'rgba(237,232,219,0.4)', lineHeight:1.6, textAlign:'left', marginBottom:14 }}>Gestion personnelle, factures, démarches, foyer</p>
            <span style={{ fontSize:11, color:'rgba(237,232,219,0.25)', fontStyle:'italic' }}>🚧 En cours de développement</span>
          </div>

          {/* Vigie Pro */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <Link to="/pro" style={{ textDecoration:'none' }} onMouseEnter={() => setHoveredCard('pro')} onMouseLeave={() => setHoveredCard(null)}>
              <div style={{ position:'relative', overflow:'hidden', background:hoveredCard==='pro'?'linear-gradient(135deg, rgba(91,163,199,0.12), rgba(91,163,199,0.06))':'rgba(255,255,255,0.04)', border:`1px solid ${hoveredCard==='pro'?'rgba(91,163,199,0.4)':'rgba(255,255,255,0.08)'}`, borderRadius:20, padding:'36px 28px', backdropFilter:'blur(10px)', transform:hoveredCard==='pro'?'translateY(-4px)':'translateY(0)', boxShadow:hoveredCard==='pro'?'0 20px 60px rgba(91,163,199,0.15)':'none', transition:'all 0.3s ease' }}>
                {hoveredCard==='pro' && <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, background:'radial-gradient(circle, rgba(91,163,199,0.2), transparent 70%)', pointerEvents:'none' }}/>}
                <div style={{ width:56, height:56, borderRadius:16, background:'rgba(91,163,199,0.12)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                  <Briefcase size={24} color="#5BA3C7" strokeWidth={2}/>
                </div>
                <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:700, color:'#EDE8DB', marginBottom:8, textAlign:'left' }}>Vigie Pro</h2>
                <p style={{ fontSize:13, color:'rgba(237,232,219,0.5)', lineHeight:1.6, textAlign:'left', marginBottom:18 }}>Gestion entreprise, automatisation, veille, conformité</p>
                <div style={{ display:'flex', alignItems:'center', gap:6, color:'#5BA3C7', fontSize:13, fontWeight:700 }}>Accéder <ArrowRight size={14}/></div>
              </div>
            </Link>
            <Link to="/tarifs" style={{ textDecoration:'none' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'11px 16px', borderRadius:12, background:'rgba(91,163,199,0.06)', border:'1px solid rgba(91,163,199,0.15)', transition:'all 0.2s ease', cursor:'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(91,163,199,0.12)'; e.currentTarget.style.borderColor='rgba(91,163,199,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(91,163,199,0.06)'; e.currentTarget.style.borderColor='rgba(91,163,199,0.15)'; }}>
                <span style={{ fontSize:13, fontWeight:600, color:'#5BA3C7' }}>Fonctionnalités & tarifs</span>
                <ArrowRight size={13} color="#5BA3C7"/>
              </div>
            </Link>
          </div>
        </div>

        <div style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', animation:'bounce 2s infinite', opacity:0.3 }}>
          <ChevronDown size={20} color="#EDE8DB"/>
        </div>
      </section>

      {/* Stats */}
      <section style={{ position:'relative', zIndex:1, borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'40px 6%' }}>
        <div style={{ maxWidth:700, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, textAlign:'center' }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(32px, 5vw, 48px)', fontWeight:700, color:'#EDE8DB', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:12, color:'rgba(237,232,219,0.35)', marginTop:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Fonctionnalités */}
      <section style={{ position:'relative', zIndex:1, padding:'80px 6%', textAlign:'center' }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#5BA3C7', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:14 }}>Ce que Vigie Pro fait pour vous</p>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(28px, 4vw, 44px)', fontWeight:700, color:'#EDE8DB', marginBottom:48, lineHeight:1.2 }}>
          Tout ce dont vous avez besoin,<br/><em style={{ color:'#5BA3C7' }}>au même endroit</em>
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, maxWidth:800, margin:'0 auto' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'20px 16px', textAlign:'center', transition:'all 0.2s ease', cursor:'default' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(91,163,199,0.07)'; e.currentTarget.style.borderColor='rgba(91,163,199,0.2)'; e.currentTarget.style.transform='translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.transform='translateY(0)'; }}>
              <div style={{ fontSize:28, marginBottom:10 }}>{f.emoji}</div>
              <div style={{ fontSize:12, color:'rgba(237,232,219,0.6)', fontWeight:600, lineHeight:1.4 }}>{f.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position:'relative', zIndex:1, margin:'0 6% 80px', borderRadius:24, background:'linear-gradient(135deg, rgba(91,163,199,0.1) 0%, rgba(91,163,199,0.04) 100%)', border:'1px solid rgba(91,163,199,0.15)', padding:'clamp(40px, 6vw, 72px)', textAlign:'center', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:250, height:250, background:'radial-gradient(circle, rgba(91,163,199,0.08), transparent 70%)', pointerEvents:'none' }}/>
        <p style={{ fontSize:11, fontWeight:700, color:'#5BA3C7', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16 }}>Prêt à commencer ?</p>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(28px, 4vw, 44px)', fontWeight:700, color:'#EDE8DB', marginBottom:14, lineHeight:1.2 }}>
          Rejoignez Vigie Pro<br/>gratuitement
        </h2>
        <p style={{ fontSize:15, color:'rgba(237,232,219,0.45)', marginBottom:36, maxWidth:400, margin:'0 auto 36px' }}>
          Créez votre compte en moins d'une minute et commencez à piloter votre activité.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/pro/signup" style={{ padding:'13px 32px', borderRadius:10, background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 24px rgba(91,163,199,0.3)' }}>Créer mon compte Pro →</Link>
          <Link to="/pro/login" style={{ padding:'13px 28px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', color:'rgba(237,232,219,0.6)', fontSize:14, fontWeight:600, textDecoration:'none' }}>Se connecter</Link>
        </div>
      </section>

      <Footer />
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes bounce { 0%,100% { transform:translateX(-50%) translateY(0); } 50% { transform:translateX(-50%) translateY(6px); } }
      `}</style>
    </div>
  );
}
