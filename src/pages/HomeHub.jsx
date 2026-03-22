import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Briefcase, ArrowRight, Lock, ChevronDown, Check, Star, Zap, Shield, BarChart2, FileText, Bell } from 'lucide-react';
import Footer from '../components/Footer';
import ExitIntent from '../components/ExitIntent';

const FEATURES = [
  { icon: '🧾', label: 'Dépenses & Recettes',     desc: 'Suivi complet de votre trésorerie en temps réel' },
  { icon: '🤖', label: 'Détection d\'anomalies',   desc: 'IA qui repère les doublons et montants inhabituels' },
  { icon: '📊', label: 'Graphiques CA',            desc: 'Visualisez l\'évolution de votre chiffre d\'affaires' },
  { icon: '⚖️', label: 'Calculateur TVA',          desc: 'Calculez et anticipez vos déclarations TVA' },
  { icon: '📋', label: 'Devis PDF automatiques',   desc: 'Générez des devis professionnels en un clic' },
  { icon: '🏪', label: 'Analyse fournisseurs',     desc: 'Comparez et optimisez vos achats fournisseurs' },
  { icon: '💱', label: 'Convertisseur devises',    desc: 'Taux de change en temps réel pour vos factures' },
  { icon: '🔔', label: 'Alertes intelligentes',    desc: 'Notifications sur vos échéances et obligations' },
];

const ETAPES = [
  {
    num: '01',
    titre: 'Créez votre espace',
    desc: 'Inscrivez-vous gratuitement en moins d\'une minute. Aucune carte bancaire requise pour commencer.',
    color: '#5BA3C7',
  },
  {
    num: '02',
    titre: 'Connectez vos données',
    desc: 'Importez vos relevés bancaires, vos factures et vos dépenses. Vigie analyse tout automatiquement.',
    color: '#5BC78A',
  },
  {
    num: '03',
    titre: 'Pilotez votre activité',
    desc: 'Tableaux de bord, alertes intelligentes, exports comptables — prenez les bonnes décisions.',
    color: '#A85BC7',
  },
];

const TEMOIGNAGES = [
  {
    nom: 'Marie L.',
    metier: 'Consultante indépendante',
    texte: 'Vigie Pro m\'a fait gagner 3h par semaine sur ma gestion. Les alertes TVA m\'ont évité une pénalité.',
    note: 5,
  },
  {
    nom: 'Thomas R.',
    metier: 'Artisan menuisier',
    texte: 'Enfin un outil simple pour suivre mes dépenses et générer mes devis. Je n\'ai pas besoin d\'un comptable pour ça.',
    note: 5,
  },
  {
    nom: 'Sophia M.',
    metier: 'Photographe freelance',
    texte: 'L\'interface est belle et intuitive. J\'ai tout configuré en 10 minutes et mes données sont sécurisées en France.',
    note: 5,
  },
];

const STATS = [
  { value: '10+',   label: 'Modules métier' },
  { value: '100%',  label: 'Données en Europe' },
  { value: '0€',    label: 'Pour commencer' },
];

const AVANTAGES = [
  'Aucune installation — 100% en ligne',
  'Données hébergées en France (RGPD)',
  'Mises à jour automatiques incluses',
  'Support par email inclus',
];

export default function HomeHub() {
  const [scrolled,     setScrolled]     = useState(false);
  const [hoveredCard,  setHoveredCard]  = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", background:'#08090C', color:'#EDE8DB', minHeight:'100vh', overflowX:'hidden' }}>

      {/* Fond noise */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity:0.025, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`, backgroundRepeat:'repeat', backgroundSize:'128px' }}/>
      <div style={{ position:'fixed', top:'-20vh', left:'50%', transform:'translateX(-50%)', width:'80vw', height:'80vw', maxWidth:900, background:'radial-gradient(ellipse, rgba(91,163,199,0.07) 0%, transparent 65%)', pointerEvents:'none', zIndex:0 }}/>

      {/* Navbar */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6%', height:64, background:scrolled?'rgba(8,9,12,0.92)':'transparent', backdropFilter:scrolled?'blur(20px)':'none', borderBottom:scrolled?'1px solid rgba(255,255,255,0.05)':'1px solid transparent', transition:'all 0.4s ease' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <img src="/logo-vigie.png" alt="Vigie" style={{ height:32, width:'auto' }} onError={e => e.currentTarget.style.display='none'} />
          <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:700, color:'#EDE8DB' }}>Vigie</span>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Link to="/pro/login" style={{ padding:'8px 18px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', color:'rgba(237,232,219,0.6)', fontSize:13, fontWeight:600, textDecoration:'none' }}>Connexion</Link>
          <Link to="/pro/signup" style={{ padding:'8px 18px', borderRadius:8, background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none' }}>S'inscrire</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position:'relative', zIndex:1, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'100px 6% 60px', textAlign:'center' }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(91,163,199,0.08)', border:'1px solid rgba(91,163,199,0.2)', borderRadius:20, padding:'6px 16px', marginBottom:32, animation:'fadeUp 0.6s ease both' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#5BA3C7', animation:'pulse 2s infinite' }}/>
          <span style={{ fontSize:11, fontWeight:700, color:'#5BA3C7', letterSpacing:'0.1em', textTransform:'uppercase' }}>Gestion d'entreprise · 100% français</span>
        </div>

        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(52px, 9vw, 110px)', fontWeight:700, lineHeight:0.95, letterSpacing:'-2px', color:'#EDE8DB', marginBottom:28, animation:'fadeUp 0.6s 0.1s ease both' }}>
          Vigie
        </h1>

        <p style={{ fontSize:'clamp(15px, 2vw, 19px)', color:'rgba(237,232,219,0.5)', maxWidth:560, lineHeight:1.7, marginBottom:20, animation:'fadeUp 0.6s 0.2s ease both' }}>
          Votre espace de gestion tout-en-un. Pilotez votre activité, automatisez vos tâches et prenez les bonnes décisions.
        </p>

        {/* Avantages inline */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center', marginBottom:48, animation:'fadeUp 0.6s 0.25s ease both' }}>
          {AVANTAGES.map((a, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Check size={12} color="#5BC78A" strokeWidth={3}/>
              <span style={{ fontSize:12, color:'rgba(237,232,219,0.4)' }}>{a}</span>
            </div>
          ))}
        </div>

        {/* Cartes */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:20, maxWidth:620, width:'100%', animation:'fadeUp 0.6s 0.3s ease both' }}>

          {/* Vigie Perso — EN CONSTRUCTION */}
          <div style={{ position:'relative', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:'36px 28px', opacity:0.6, cursor:'not-allowed', backdropFilter:'blur(10px)' }}>
            <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', gap:6, background:'rgba(212,168,83,0.15)', border:'1px solid rgba(212,168,83,0.35)', borderRadius:20, padding:'4px 14px', whiteSpace:'nowrap' }}>
              <span style={{ fontSize:11 }}>🚧</span>
              <span style={{ fontSize:11, fontWeight:700, color:'#D4A853', letterSpacing:'0.06em' }}>En construction</span>
            </div>
            <div style={{ width:56, height:56, borderRadius:16, background:'rgba(212,168,83,0.1)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18, marginTop:8 }}>
              <User size={24} color="#D4A853" strokeWidth={2}/>
            </div>
            <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:700, color:'#EDE8DB', marginBottom:8, textAlign:'left' }}>Vigie Perso</h2>
            <p style={{ fontSize:13, color:'rgba(237,232,219,0.4)', lineHeight:1.6, textAlign:'left', marginBottom:14 }}>Gestion personnelle, factures, démarches, foyer</p>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'rgba(237,232,219,0.25)', fontStyle:'italic' }}>
              <Lock size={10} color="rgba(237,232,219,0.25)"/>
              Disponible prochainement
            </div>
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

      {/* ── STATS ── */}
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

      {/* ── COMMENT ÇA MARCHE ── */}
      <section style={{ position:'relative', zIndex:1, padding:'100px 6%', textAlign:'center' }}>
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

      {/* ── TÉMOIGNAGES ── */}
      <section style={{ position:'relative', zIndex:1, padding:'100px 6%', textAlign:'center' }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#5BA3C7', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:14 }}>Ils nous font confiance</p>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(28px, 4vw, 44px)', fontWeight:700, color:'#EDE8DB', marginBottom:56, lineHeight:1.2 }}>
          Ce qu'en disent<br/><em style={{ color:'#5BA3C7' }}>nos utilisateurs</em>
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:20, maxWidth:900, margin:'0 auto' }}>
          {TEMOIGNAGES.map((t, i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20, padding:'28px 24px', textAlign:'left' }}>
              {/* Étoiles */}
              <div style={{ display:'flex', gap:4, marginBottom:16 }}>
                {Array.from({ length: t.note }).map((_, j) => (
                  <Star key={j} size={13} color="#D4A853" fill="#D4A853"/>
                ))}
              </div>
              <p style={{ fontSize:14, color:'rgba(237,232,219,0.7)', lineHeight:1.7, marginBottom:20, fontStyle:'italic' }}>"{t.texte}"</p>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#EDE8DB' }}>{t.nom}</div>
                <div style={{ fontSize:11, color:'rgba(237,232,219,0.35)', marginTop:2 }}>{t.metier}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── POURQUOI VIGIE ── */}
      <section style={{ position:'relative', zIndex:1, padding:'80px 6%', background:'rgba(91,163,199,0.03)', borderTop:'1px solid rgba(91,163,199,0.08)', borderBottom:'1px solid rgba(91,163,199,0.08)' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
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
                { icon: Shield,   text: 'Conforme RGPD — données en France' },
                { icon: Zap,      text: 'Interface rapide, aucune formation requise' },
                { icon: Bell,     text: 'Alertes automatiques sur vos échéances' },
                { icon: BarChart2,text: 'Tableaux de bord adaptés aux indépendants' },
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
          {/* Mockup dashboard simplifié */}
          <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid rgba(91,163,199,0.15)', borderRadius:20, padding:24, backdropFilter:'blur(10px)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'rgba(199,91,78,0.6)' }}/>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'rgba(212,168,83,0.6)' }}/>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'rgba(91,199,138,0.6)' }}/>
              <span style={{ fontSize:11, color:'rgba(237,232,219,0.2)', marginLeft:8 }}>vigie-officiel.com/pro</span>
            </div>
            {/* KPIs simulés */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              {[
                { label:'Dépenses', value:'2 340 €', color:'#C75B4E' },
                { label:'Recettes', value:'8 900 €', color:'#5BC78A' },
                { label:'Devis',    value:'3 en cours', color:'#5BA3C7' },
                { label:'TVA',      value:'J-12',   color:'#D4A853' },
              ].map((k, i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:10, color:'rgba(237,232,219,0.3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{k.label}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:k.color }}>{k.value}</div>
                </div>
              ))}
            </div>
            {/* Barre de progression simulée */}
            <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'12px 14px', marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:11, color:'rgba(237,232,219,0.4)' }}>Objectif CA mensuel</span>
                <span style={{ fontSize:11, color:'#5BC78A', fontWeight:700 }}>74%</span>
              </div>
              <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2 }}>
                <div style={{ width:'74%', height:'100%', background:'linear-gradient(90deg, #5BA3C7, #5BC78A)', borderRadius:2 }}/>
              </div>
            </div>
            {/* Alerte simulée */}
            <div style={{ background:'rgba(212,168,83,0.08)', border:'1px solid rgba(212,168,83,0.2)', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
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
        @keyframes fadeUp  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes bounce  { 0%,100% { transform:translateX(-50%) translateY(0); } 50% { transform:translateX(-50%) translateY(6px); } }
        @media (max-width: 640px) {
          .pourquoi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
