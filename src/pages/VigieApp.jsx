import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, Monitor, Smartphone, ChevronDown } from 'lucide-react';
import Footer from '../components/Footer';

const APPS = [
  {
    id: 'vigie-pro',
    nom: 'Vigie Pro',
    sousTitre: 'Application mobile & bureau',
    description: 'Gérez votre activité d\'auto-entrepreneur depuis votre téléphone. Scan OCR, factures, dépenses, contrats — tout dans votre poche.',
    color: '#5BA3C7',
    emoji: '🛡️',
    platforms: [
      { label: 'Android (TWA)', icon: Smartphone, url: '#', available: true },
      { label: 'iOS (bientôt)', icon: Smartphone, url: '#', available: false },
      { label: 'Web App', icon: Monitor, url: '/pro', available: true },
    ],
    features: ['Scan papier OCR', 'Factures & devis', 'Dépenses & recettes', 'Contrats & alertes'],
  },
  {
    id: 'pilot',
    nom: 'Pilot',
    sousTitre: 'Application desktop Windows',
    description: 'Votre cockpit de création de contenu et de gestion de prospects. Générez, planifiez et publiez sur tous vos réseaux depuis une seule app.',
    color: '#5BC78A',
    emoji: '🧭',
    platforms: [
      { label: 'Windows (.exe)', icon: Monitor, url: '#', available: true },
      { label: 'macOS (bientôt)', icon: Monitor, url: '#', available: false },
    ],
    features: ['Génération IA de contenu', 'Prospection SIRENE', 'Assistant agenda', 'Multi-projets'],
  },
];

export default function VigieApp() {
  const [scrolled,    setScrolled]    = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredBtn,  setHoveredBtn]  = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", background:'#06080B', color:'#EDE8DB', minHeight:'100vh', overflowX:'hidden' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6%', height:64, background:scrolled?'rgba(6,8,11,0.92)':'transparent', backdropFilter:scrolled?'blur(20px)':'none', borderBottom:scrolled?'1px solid rgba(255,255,255,0.05)':'1px solid transparent', transition:'all 0.4s ease' }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <img src="/logo-vigie.png" alt="Vigie" style={{ height:36, width:'auto', objectFit:'contain' }} onError={e => { e.currentTarget.style.display='none'; }}/>
          <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:700, color:'#EDE8DB' }}>Vigie</span>
        </Link>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <Link to="/blog" style={{ padding:'8px 18px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', color:'rgba(237,232,219,0.7)', fontSize:13, fontWeight:600, textDecoration:'none', background:'rgba(255,255,255,0.04)' }}>Blog</Link>
          <Link to="/pro/login" style={{ padding:'8px 18px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', color:'rgba(237,232,219,0.7)', fontSize:13, fontWeight:600, textDecoration:'none', background:'rgba(255,255,255,0.04)' }}>Connexion</Link>
          <Link to="/pro/signup" style={{ padding:'8px 18px', borderRadius:8, background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none' }}>S'inscrire</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position:'relative', minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'120px 6% 80px', textAlign:'center', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'url(/hero-bg.jpg)', backgroundSize:'cover', backgroundPosition:'center 40%', zIndex:0 }}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(6,8,11,0.72) 0%, rgba(6,8,11,0.55) 40%, rgba(6,8,11,0.95) 100%)', zIndex:1 }}/>
        <div style={{ position:'relative', zIndex:2 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#5BC78A', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:14, animation:'fadeUp 0.6s ease both' }}>Applications Vigie</p>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(40px, 7vw, 80px)', fontWeight:700, lineHeight:0.95, letterSpacing:'-2px', color:'#EDE8DB', marginBottom:24, animation:'fadeUp 0.7s ease both' }}>
            Vigie App
          </h1>
          <p style={{ fontSize:'clamp(14px, 1.8vw, 18px)', color:'rgba(237,232,219,0.55)', maxWidth:520, lineHeight:1.75, margin:'0 auto 0', animation:'fadeUp 0.7s 0.1s ease both' }}>
            Téléchargez les applications Vigie sur tous vos appareils — mobile, desktop, et web.
          </p>
        </div>
        <div style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', animation:'bounce 2s infinite', opacity:0.4, zIndex:3 }}>
          <ChevronDown size={20} color="#EDE8DB"/>
        </div>
      </section>

      {/* ── APPS ── */}
      <section style={{ position:'relative', zIndex:1, padding:'80px 6%', background:'#06080B' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'flex', flexDirection:'column', gap:32 }}>
          {APPS.map((app) => (
            <div key={app.id}
              style={{ position:'relative', overflow:'hidden', background:hoveredCard===app.id?`rgba(${app.color === '#5BA3C7' ? '91,163,199' : '91,199,138'},0.08)`:'rgba(255,255,255,0.04)', border:`1px solid ${hoveredCard===app.id?`${app.color}50`:'rgba(255,255,255,0.1)'}`, borderRadius:24, padding:'36px 40px', transition:'all 0.3s ease', boxShadow:hoveredCard===app.id?`0 20px 60px ${app.color}20`:'none' }}
              onMouseEnter={() => setHoveredCard(app.id)}
              onMouseLeave={() => setHoveredCard(null)}>

              {hoveredCard===app.id && <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, background:`radial-gradient(circle, ${app.color}20, transparent 70%)`, pointerEvents:'none' }}/>}

              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:32, alignItems:'start' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                    <div style={{ width:56, height:56, borderRadius:16, background:`${app.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>
                      {app.emoji}
                    </div>
                    <div>
                      <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:28, fontWeight:700, color:'#EDE8DB', margin:0 }}>{app.nom}</h2>
                      <p style={{ fontSize:12, color:'rgba(237,232,219,0.35)', margin:0, marginTop:2 }}>{app.sousTitre}</p>
                    </div>
                  </div>
                  <p style={{ fontSize:14, color:'rgba(237,232,219,0.55)', lineHeight:1.7, marginBottom:20, maxWidth:520 }}>{app.description}</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {app.features.map((f, i) => (
                      <span key={i} style={{ fontSize:11, fontWeight:600, color:app.color, background:`${app.color}12`, border:`1px solid ${app.color}25`, padding:'4px 12px', borderRadius:20 }}>{f}</span>
                    ))}
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:10, minWidth:200 }}>
                  {app.platforms.map((p, i) => {
                    const Icon = p.icon;
                    const btnKey = `${app.id}-${i}`;
                    return (
                      <a key={i} href={p.available ? p.url : undefined}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 18px', borderRadius:12, border:`1px solid ${p.available ? `${app.color}50` : 'rgba(255,255,255,0.08)'}`, background:p.available ? (hoveredBtn===btnKey ? `${app.color}18` : `${app.color}08`) : 'rgba(255,255,255,0.02)', color:p.available ? app.color : 'rgba(237,232,219,0.25)', fontSize:13, fontWeight:p.available?700:500, textDecoration:'none', cursor:p.available?'pointer':'not-allowed', transition:'all 0.2s ease', opacity:p.available?1:0.5 }}
                        onMouseEnter={() => p.available && setHoveredBtn(btnKey)}
                        onMouseLeave={() => setHoveredBtn(null)}>
                        <Icon size={15}/>
                        <span style={{ flex:1 }}>{p.label}</span>
                        {p.available ? <Download size={13}/> : <span style={{ fontSize:10 }}>Bientôt</span>}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position:'relative', zIndex:1, margin:'40px 6% 80px', borderRadius:24, background:'linear-gradient(135deg, rgba(91,163,199,0.08) 0%, rgba(91,199,138,0.04) 100%)', border:'1px solid rgba(91,163,199,0.12)', padding:'60px', textAlign:'center' }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(24px, 3vw, 40px)', fontWeight:700, color:'#EDE8DB', marginBottom:14 }}>
          Commencez par Vigie Pro
        </h2>
        <p style={{ fontSize:14, color:'rgba(237,232,219,0.4)', maxWidth:400, margin:'0 auto 32px', lineHeight:1.7 }}>
          Créez votre compte gratuitement et accédez à l'application web immédiatement.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/pro/signup" style={{ padding:'14px 36px', borderRadius:10, background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:15, fontWeight:700, textDecoration:'none' }}>
            Créer mon compte →
          </Link>
          <Link to="/" style={{ padding:'14px 28px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', color:'rgba(237,232,219,0.6)', fontSize:14, fontWeight:600, textDecoration:'none' }}>
            Retour à l'accueil
          </Link>
        </div>
      </section>

      <Footer/>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bounce { 0%,100% { transform:translateX(-50%) translateY(0); } 50% { transform:translateX(-50%) translateY(8px); } }
      `}</style>
    </div>
  );
}
