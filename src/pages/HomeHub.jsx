import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Briefcase, ArrowRight, Lock, ChevronDown, Check, Zap, Shield, BarChart2, Bell, BookOpen, Settings } from 'lucide-react';
import Footer from '../components/Footer';
import ExitIntent from '../components/ExitIntent';
import { supabasePro } from '../lib/supabasePro';

const ADMIN_EMAIL = 'luciendoppler@gmail.com';

const FEATURES = [
  { icon: '🧾', label: 'Dépenses & Recettes',    desc: 'Suivi complet de votre trésorerie en temps réel' },
  { icon: '🤖', label: "Détection d'anomalies",   desc: 'IA qui repère les doublons et montants inhabituels' },
  { icon: '📊', label: 'Graphiques CA',           desc: "Visualisez l'évolution de votre chiffre d'affaires" },
  { icon: '⚖️', label: 'Calculateur TVA',         desc: 'Calculez et anticipez vos déclarations TVA' },
  { icon: '📋', label: 'Devis PDF automatiques',  desc: 'Générez des devis professionnels en un clic' },
  { icon: '🏪', label: 'Analyse fournisseurs',    desc: 'Comparez et optimisez vos achats fournisseurs' },
  { icon: '💱', label: 'Convertisseur devises',   desc: 'Taux de change en temps réel pour vos factures' },
  { icon: '🔔', label: 'Alertes intelligentes',   desc: 'Notifications sur vos échéances et obligations' },
];

const ETAPES = [
  { num: '01', titre: 'Créez votre espace',     desc: "Inscrivez-vous gratuitement en moins d'une minute. Aucune carte bancaire requise pour commencer.", color: '#5BA3C7' },
  { num: '02', titre: 'Connectez vos données',  desc: 'Importez vos relevés bancaires, vos factures et vos dépenses. Vigie analyse tout automatiquement.',  color: '#5BC78A' },
  { num: '03', titre: 'Pilotez votre activité', desc: "Tableaux de bord, alertes intelligentes, exports comptables — prenez les bonnes décisions.",          color: '#A85BC7' },
];

const AVANTAGES = [
  "Aucune installation — 100% en ligne",
  "Données hébergées en Europe (RGPD)",
  "Mises à jour automatiques incluses",
  "Support par email inclus",
];

export default function HomeHub() {
  const [scrolled,       setScrolled]       = useState(false);
  const [hoveredCard,    setHoveredCard]     = useState(null);
  const [hoveredFeature, setHoveredFeature]  = useState(null);
  const [isAdmin,        setIsAdmin]         = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    supabasePro.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(session?.user?.email === ADMIN_EMAIL);
    });
  }, []);

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", background:'#06080B', color:'#EDE8DB', minHeight:'100vh', overflowX:'hidden' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6%', height:64, background:scrolled?'rgba(6,8,11,0.92)':'transparent', backdropFilter:scrolled?'blur(20px)':'none', borderBottom:scrolled?'1px solid rgba(255,255,255,0.05)':'1px solid transparent', transition:'all 0.4s ease' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <img src="/logo-vigie.png" alt="Vigie" style={{ height:36, width:'auto', objectFit:'contain' }} onError={e => { e.currentTarget.style.display='none'; if(e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display='block'; }}/>
          <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:700, color:'#EDE8DB', display:'none' }}>Vigie</span>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <Link to="/blog" style={{ padding:'8px 18px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', color:'rgba(237,232,219,0.7)', fontSize:13, fontWeight:600, textDecoration:'none', backdropFilter:'blur(8px)', background:'rgba(255,255,255,0.04)' }}>Blog</Link>
          {isAdmin && (
            <Link to="/pro/blog-admin" style={{ padding:'8px 18px', borderRadius:8, border:'1px solid rgba(212,168,83,0.4)', color:'#D4A853', fontSize:13, fontWeight:600, textDecoration:'none', backdropFilter:'blur(8px)', background:'rgba(212,168,83,0.08)', display:'flex', alignItems:'center', gap:6 }}>
              <Settings size={13}/> Admin
            </Link>
          )}
          <Link to="/pro/login"  style={{ padding:'8px 18px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', color:'rgba(237,232,219,0.7)', fontSize:13, fontWeight:600, textDecoration:'none', backdropFilter:'blur(8px)', background:'rgba(255,255,255,0.04)' }}>Connexion</Link>
          <Link to="/pro/signup" style={{ padding:'8px 18px', borderRadius:8, background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none' }}>S'inscrire</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position:'relative', zIndex:1, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'100px 6% 80px', textAlign:'center', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'url(/hero-bg.jpg)', backgroundSize:'cover', backgroundPosition:'center 40%', backgroundRepeat:'no-repeat', zIndex:0 }}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(6,8,11,0.72) 0%, rgba(6,8,11,0.55) 40%, rgba(6,8,11,0.88) 85%, rgba(6,8,11,1) 100%)', zIndex:1 }}/>
        <div style={{ position:'absolute', inset:0, zIndex:2, opacity:0.06, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`, backgroundRepeat:'repeat', backgroundSize:'128px', pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:3 }}>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(64px, 10vw, 120px)', fontWeight:700, lineHeight:0.92, letterSpacing:'-3px', color:'#EDE8DB', marginBottom:28, animation:'fadeUp 0.7s ease both' }}>
            Vigie
          </h1>
          <p style={{ fontSize:'clamp(15px, 2vw, 20px)', color:'rgba(237,232,219,0.6)', maxWidth:540, lineHeight:1.75, margin:'0 auto 24px', animation:'fadeUp 0.7s 0.1s ease both' }}>
            Votre espace de gestion tout-en-un. Pilotez votre activité, automatisez vos tâches et prenez les bonnes décisions.
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:14, justifyContent:'center', marginBottom:52, animation:'fadeUp 0.7s 0.2s ease both' }}>
            {AVANTAGES.map((a, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Check size={12} color="#5BC78A" strokeWidth={3}/>
                <span style={{ fontSize:12, color:'rgba(237,232,219,0.45)' }}>{a}</span>
              </div>
            ))}
          </div>

          {/* CARTES PRODUITS */}
          <div style={{ maxWidth:isAdmin ? 1020 : 680, width:'100%', margin:'0 auto', animation:'fadeUp 0.7s 0.3s ease both' }}>
            <div style={{ display:'grid', gridTemplateColumns: isAdmin ? 'repeat(auto-fit, minmax(260px, 1fr))' : 'repeat(auto-fit, minmax(280px, 1fr))', gap:12, marginBottom:10 }}>

              {/* Vigie Pro */}
              <Link to="/pro" style={{ textDecoration:'none' }} onMouseEnter={() => setHoveredCard('pro')} onMouseLeave={() => setHoveredCard(null)}>
                <div style={{ position:'relative', overflow:'hidden', background:hoveredCard==='pro'?'rgba(91,163,199,0.15)':'rgba(255,255,255,0.06)', border:`1px solid ${hoveredCard==='pro'?'rgba(91,163,199,0.5)':'rgba(255,255,255,0.12)'}`, borderRadius:20, padding:'32px 28px', backdropFilter:'blur(16px)', transform:hoveredCard==='pro'?'translateY(-4px)':'translateY(0)', boxShadow:hoveredCard==='pro'?'0 20px 60px rgba(91,163,199,0.2)':'0 8px 32px rgba(0,0,0,0.3)', transition:'all 0.3s ease', height:'100%' }}>
                  {hoveredCard==='pro' && <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, background:'radial-gradient(circle, rgba(91,163,199,0.25), transparent 70%)', pointerEvents:'none' }}/>}
                  <div style={{ width:52, height:52, borderRadius:14, background:'rgba(91,163,199,0.15)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                    <Briefcase size={22} color="#5BA3C7" strokeWidth={2}/>
                  </div>
                  <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:24, fontWeight:700, color:'#EDE8DB', marginBottom:8, textAlign:'left' }}>Vigie Pro</h2>
                  <p style={{ fontSize:13, color:'rgba(237,232,219,0.5)', lineHeight:1.6, textAlign:'left', marginBottom:18 }}>Gestion entreprise, automatisation, veille, conformité</p>
                  <div style={{ display:'flex', alignItems:'center', gap:6, color:'#5BA3C7', fontSize:13, fontWeight:700 }}>Accéder <ArrowRight size={14}/></div>
                </div>
              </Link>

              {/* Vigie Blog */}
              <Link to="/blog" style={{ textDecoration:'none' }} onMouseEnter={() => setHoveredCard('blog')} onMouseLeave={() => setHoveredCard(null)}>
                <div style={{ position:'relative', overflow:'hidden', background:hoveredCard==='blog'?'rgba(91,199,138,0.15)':'rgba(255,255,255,0.06)', border:`1px solid ${hoveredCard==='blog'?'rgba(91,199,138,0.5)':'rgba(255,255,255,0.12)'}`, borderRadius:20, padding:'32px 28px', backdropFilter:'blur(16px)', transform:hoveredCard==='blog'?'translateY(-4px)':'translateY(0)', boxShadow:hoveredCard==='blog'?'0 20px 60px rgba(91,199,138,0.2)':'0 8px 32px rgba(0,0,0,0.3)', transition:'all 0.3s ease', height:'100%' }}>
                  {hoveredCard==='blog' && <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, background:'radial-gradient(circle, rgba(91,199,138,0.25), transparent 70%)', pointerEvents:'none' }}/>}
                  <div style={{ width:52, height:52, borderRadius:14, background:'rgba(91,199,138,0.15)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                    <BookOpen size={22} color="#5BC78A" strokeWidth={2}/>
                  </div>
                  <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:24, fontWeight:700, color:'#EDE8DB', marginBottom:8, textAlign:'left' }}>Vigie Blog</h2>
                  <p style={{ fontSize:13, color:'rgba(237,232,219,0.5)', lineHeight:1.6, textAlign:'left', marginBottom:18 }}>Guides pratiques, actu fiscale et conseils pour auto-entrepreneurs</p>
                  <div style={{ display:'flex', alignItems:'center', gap:6, color:'#5BC78A', fontSize:13, fontWeight:700 }}>Lire <ArrowRight size={14}/></div>
                </div>
              </Link>
<Link to="/apps" style={{ textDecoration:'none' }} onMouseEnter={() => setHoveredCard('apps')} onMouseLeave={() => setHoveredCard(null)}>
  <div style={{ position:'relative', overflow:'hidden', background:hoveredCard==='apps'?'rgba(168,91,199,0.15)':'rgba(255,255,255,0.06)', border:`1px solid ${hoveredCard==='apps'?'rgba(168,91,199,0.5)':'rgba(255,255,255,0.12)'}`, borderRadius:20, padding:'32px 28px', backdropFilter:'blur(16px)', transform:hoveredCard==='apps'?'translateY(-4px)':'translateY(0)', boxShadow:hoveredCard==='apps'?'0 20px 60px rgba(168,91,199,0.2)':'0 8px 32px rgba(0,0,0,0.3)', transition:'all 0.3s ease', height:'100%' }}>
    {hoveredCard==='apps' && <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, background:'radial-gradient(circle, rgba(168,91,199,0.25), transparent 70%)', pointerEvents:'none' }}/>}
    <div style={{ width:52, height:52, borderRadius:14, background:'rgba(168,91,199,0.15)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, fontSize:26 }}>📱</div>
    <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:24, fontWeight:700, color:'#EDE8DB', marginBottom:8, textAlign:'left' }}>Vigie App</h2>
    <p style={{ fontSize:13, color:'rgba(237,232,219,0.5)', lineHeight:1.6, textAlign:'left', marginBottom:18 }}>Téléchargez les apps Vigie sur mobile et desktop</p>
    <div style={{ display:'flex', alignItems:'center', gap:6, color:'#A85BC7', fontSize:13, fontWeight:700 }}>Télécharger <ArrowRight size={14}/></div>
  </div>
</Link>
              {/* Blog Admin — visible uniquement pour l'admin */}
              {isAdmin && (
                <Link to="/pro/blog-admin" style={{ textDecoration:'none' }} onMouseEnter={() => setHoveredCard('admin')} onMouseLeave={() => setHoveredCard(null)}>
                  <div style={{ position:'relative', overflow:'hidden', background:hoveredCard==='admin'?'rgba(212,168,83,0.15)':'rgba(255,255,255,0.04)', border:`1px solid ${hoveredCard==='admin'?'rgba(212,168,83,0.5)':'rgba(212,168,83,0.2)'}`, borderRadius:20, padding:'32px 28px', backdropFilter:'blur(16px)', transform:hoveredCard==='admin'?'translateY(-4px)':'translateY(0)', boxShadow:hoveredCard==='admin'?'0 20px 60px rgba(212,168,83,0.15)':'0 8px 32px rgba(0,0,0,0.3)', transition:'all 0.3s ease', height:'100%' }}>
                    {hoveredCard==='admin' && <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, background:'radial-gradient(circle, rgba(212,168,83,0.2), transparent 70%)', pointerEvents:'none' }}/>}
                    <div style={{ position:'absolute', top:16, right:16, background:'rgba(212,168,83,0.15)', border:'1px solid rgba(212,168,83,0.3)', borderRadius:6, padding:'2px 8px', fontSize:9, fontWeight:700, color:'#D4A853', letterSpacing:'0.08em', textTransform:'uppercase' }}>Admin</div>
                    <div style={{ width:52, height:52, borderRadius:14, background:'rgba(212,168,83,0.15)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                      <Settings size={22} color="#D4A853" strokeWidth={2}/>
                    </div>
                    <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:24, fontWeight:700, color:'#EDE8DB', marginBottom:8, textAlign:'left' }}>Blog Admin</h2>
                    <p style={{ fontSize:13, color:'rgba(237,232,219,0.5)', lineHeight:1.6, textAlign:'left', marginBottom:18 }}>Gérer les articles, pipeline IA, publication, correction</p>
                    <div style={{ display:'flex', alignItems:'center', gap:6, color:'#D4A853', fontSize:13, fontWeight:700 }}>Gérer <ArrowRight size={14}/></div>
                  </div>
                </Link>
              )}
            </div>

            <Link to="/tarifs" style={{ textDecoration:'none' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'11px 16px', borderRadius:12, background:'rgba(91,163,199,0.06)', border:'1px solid rgba(91,163,199,0.2)', backdropFilter:'blur(8px)', transition:'all 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(91,163,199,0.14)'; e.currentTarget.style.borderColor='rgba(91,163,199,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(91,163,199,0.06)'; e.currentTarget.style.borderColor='rgba(91,163,199,0.2)'; }}>
                <span style={{ fontSize:13, fontWeight:600, color:'#5BA3C7' }}>Fonctionnalités & tarifs</span>
                <ArrowRight size={13} color="#5BA3C7"/>
              </div>
            </Link>
          </div>
        </div>

        <div style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', animation:'bounce 2s infinite', opacity:0.4, zIndex:3 }}>
          <ChevronDown size={20} color="#EDE8DB"/>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section style={{ position:'relative', zIndex:1, padding:'100px 6%', textAlign:'center', background:'#06080B' }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#5BA3C7', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:14 }}>Simple et rapide</p>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(28px, 4vw, 44px)', fontWeight:700, color:'#EDE8DB', marginBottom:64, lineHeight:1.2 }}>
          Opérationnel en<br/><em style={{ color:'#5BA3C7' }}>3 étapes</em>
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:24, maxWidth:900, margin:'0 auto' }}>
          {ETAPES.map((e, i) => (
            <div key={i} style={{ position:'relative', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20, padding:'36px 28px', textAlign:'left' }}>
              <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:48, fontWeight:700, color:e.color, opacity:0.2, lineHeight:1, marginBottom:16 }}>{e.num}</div>
              <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:700, color:'#EDE8DB', marginBottom:12 }}>{e.titre}</h3>
              <p style={{ fontSize:13, color:'rgba(237,232,219,0.45)', lineHeight:1.7 }}>{e.desc}</p>
              {i < ETAPES.length - 1 && (
                <div style={{ position:'absolute', top:'50%', right:-12, transform:'translateY(-50%)', width:24, height:24, borderRadius:'50%', background:e.color, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
                  <ArrowRight size={12} color="#fff"/>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ── */}
      <section style={{ position:'relative', zIndex:1, padding:'80px 6%', textAlign:'center', background:'rgba(255,255,255,0.015)', borderTop:'1px solid rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#5BA3C7', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:14 }}>Ce que Vigie Pro fait pour vous</p>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(28px, 4vw, 44px)', fontWeight:700, color:'#EDE8DB', marginBottom:48, lineHeight:1.2 }}>
          Tout ce dont vous avez besoin,<br/><em style={{ color:'#5BA3C7' }}>au même endroit</em>
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, maxWidth:900, margin:'0 auto' }}>
          {FEATURES.map((f, i) => (
            <div key={i}
              style={{ background:hoveredFeature===i?'rgba(91,163,199,0.08)':'rgba(255,255,255,0.02)', border:`1px solid ${hoveredFeature===i?'rgba(91,163,199,0.25)':'rgba(255,255,255,0.06)'}`, borderRadius:16, padding:'24px 20px', textAlign:'left', transition:'all 0.2s ease', cursor:'default', transform:hoveredFeature===i?'translateY(-3px)':'translateY(0)' }}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}>
              <div style={{ fontSize:28, marginBottom:14 }}>{f.icon}</div>
              <div style={{ fontSize:13, color:'#EDE8DB', fontWeight:700, marginBottom:6 }}>{f.label}</div>
              <div style={{ fontSize:12, color:'rgba(237,232,219,0.35)', lineHeight:1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PREMIERS UTILISATEURS ── */}
      <section style={{ position:'relative', zIndex:1, padding:'100px 6%', textAlign:'center', background:'#06080B' }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#5BA3C7', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:14 }}>Lancement en cours</p>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(28px, 4vw, 44px)', fontWeight:700, color:'#EDE8DB', marginBottom:20, lineHeight:1.2 }}>
          Soyez parmi<br/><em style={{ color:'#5BA3C7' }}>les premiers</em>
        </h2>
        <p style={{ fontSize:14, color:'rgba(237,232,219,0.4)', maxWidth:480, margin:'0 auto 48px', lineHeight:1.8 }}>
          Vigie Pro vient de lancer. Rejoignez les premiers utilisateurs, bénéficiez du plan gratuit et contribuez à façonner le produit avec vos retours.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16, maxWidth:700, margin:'0 auto' }}>
          {[
            { icon:'🚀', titre:'Accès immédiat',      desc:"Compte opérationnel en moins d'une minute" },
            { icon:'💬', titre:'Retours bienvenus',   desc:'Vos suggestions impactent directement le produit' },
            { icon:'🎯', titre:'Plan gratuit inclus', desc:'Fonctionnalités essentielles sans limite de durée' },
          ].map((item, i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:'28px 22px', textAlign:'left' }}>
              <div style={{ fontSize:28, marginBottom:14 }}>{item.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#EDE8DB', marginBottom:6 }}>{item.titre}</div>
              <div style={{ fontSize:12, color:'rgba(237,232,219,0.4)', lineHeight:1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── POURQUOI VIGIE ── */}
      <section style={{ position:'relative', zIndex:1, padding:'80px 6%', background:'rgba(91,163,199,0.03)', borderTop:'1px solid rgba(91,163,199,0.08)', borderBottom:'1px solid rgba(91,163,199,0.08)' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:60, alignItems:'center' }}>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'#5BA3C7', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:14 }}>Pourquoi Vigie ?</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(24px, 3vw, 38px)', fontWeight:700, color:'#EDE8DB', marginBottom:24, lineHeight:1.2 }}>
              Conçu pour les<br/>indépendants français
            </h2>
            <p style={{ fontSize:14, color:'rgba(237,232,219,0.5)', lineHeight:1.8, marginBottom:32 }}>
              Vigie Pro est construit autour des obligations réelles des auto-entrepreneurs, freelances et TPE en France. TVA, URSSAF, formalités obligatoires — tout est intégré.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { icon: Shield,    text: 'Conforme RGPD — données en Europe' },
                { icon: Zap,       text: 'Interface rapide, aucune formation requise' },
                { icon: Bell,      text: 'Alertes automatiques sur vos échéances' },
                { icon: BarChart2, text: 'Tableaux de bord adaptés aux indépendants' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:'rgba(91,163,199,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={15} color="#5BA3C7" strokeWidth={2}/>
                  </div>
                  <span style={{ fontSize:13, color:'rgba(237,232,219,0.6)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid rgba(91,163,199,0.15)', borderRadius:20, padding:24, backdropFilter:'blur(10px)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'rgba(199,91,78,0.6)' }}/>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'rgba(212,168,83,0.6)' }}/>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'rgba(91,199,138,0.6)' }}/>
              <span style={{ fontSize:11, color:'rgba(237,232,219,0.2)', marginLeft:8 }}>vigie-officiel.com/pro</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              {[
                { label:'Dépenses', value:'2 340 €',    color:'#C75B4E' },
                { label:'Recettes', value:'8 900 €',    color:'#5BC78A' },
                { label:'Devis',    value:'3 en cours', color:'#5BA3C7' },
                { label:'TVA',      value:'J-12',       color:'#D4A853' },
              ].map((k, i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:10, color:'rgba(237,232,219,0.3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{k.label}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:k.color }}>{k.value}</div>
                </div>
              ))}
            </div>
            <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'12px 14px', marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:11, color:'rgba(237,232,219,0.4)' }}>Objectif CA mensuel</span>
                <span style={{ fontSize:11, color:'#5BC78A', fontWeight:700 }}>74%</span>
              </div>
              <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2 }}>
                <div style={{ width:'74%', height:'100%', background:'linear-gradient(90deg, #5BA3C7, #5BC78A)', borderRadius:2 }}/>
              </div>
            </div>
            <div style={{ background:'rgba(212,168,83,0.08)', border:'1px solid rgba(212,168,83,0.15)', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
              <Bell size={12} color="#D4A853"/>
              <span style={{ fontSize:11, color:'rgba(212,168,83,0.8)' }}>Déclaration TVA dans 12 jours</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ position:'relative', zIndex:1, margin:'80px 6%', borderRadius:24, background:'linear-gradient(135deg, rgba(91,163,199,0.1) 0%, rgba(91,163,199,0.04) 100%)', border:'1px solid rgba(91,163,199,0.15)', padding:'clamp(40px, 6vw, 72px)', textAlign:'center', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:250, height:250, background:'radial-gradient(circle, rgba(91,163,199,0.08), transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-40, left:-40, width:180, height:180, background:'radial-gradient(circle, rgba(91,199,138,0.05), transparent 70%)', pointerEvents:'none' }}/>
        <p style={{ fontSize:11, fontWeight:700, color:'#5BA3C7', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16 }}>Prêt à commencer ?</p>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(28px, 4vw, 48px)', fontWeight:700, color:'#EDE8DB', marginBottom:14, lineHeight:1.2 }}>
          Rejoignez Vigie Pro<br/>gratuitement
        </h2>
        <p style={{ fontSize:15, color:'rgba(237,232,219,0.45)', marginBottom:36, maxWidth:400, margin:'0 auto 36px' }}>
          Créez votre compte en moins d'une minute. Aucune carte bancaire requise.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/pro/signup" style={{ padding:'14px 36px', borderRadius:10, background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:15, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 24px rgba(91,163,199,0.3)' }}>
            Créer mon compte Pro →
          </Link>
          <Link to="/tarifs" style={{ padding:'14px 28px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', color:'rgba(237,232,219,0.6)', fontSize:14, fontWeight:600, textDecoration:'none' }}>
            Voir les tarifs
          </Link>
        </div>
        <p style={{ fontSize:11, color:'rgba(237,232,219,0.2)', marginTop:20 }}>
          Gratuit pour toujours · Starter à 29€/mois · Pro à 49€/mois
        </p>
      </section>

      <ExitIntent />
      <Footer />

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes bounce { 0%,100% { transform:translateX(-50%) translateY(0); } 50% { transform:translateX(-50%) translateY(8px); } }
      `}</style>
    </div>
  );
}
