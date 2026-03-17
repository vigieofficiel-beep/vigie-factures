import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowRight, Zap, Star, Crown, Rocket } from 'lucide-react';
import Footer from '../components/Footer';

const C = {
  blue:'#5BA3C7', green:'#5BC78A', purple:'#A85BC7',
  dark:'#08090C', card:'rgba(255,255,255,0.04)',
  border:'rgba(255,255,255,0.08)', text:'#EDE8DB',
  light:'rgba(237,232,219,0.5)',
};

const PLANS = [
  {
    id: 'gratuit',
    nom: 'Gratuit',
    prix: 0,
    couleur: C.blue,
    icon: Zap,
    description: 'Pour découvrir Vigie Pro sans engagement',
    cta: 'Commencer gratuitement',
    ctaLink: '/pro/signup',
    populaire: false,
    fonctionnalites: [
      { label: 'Bureau de pilotage',          ok: true  },
      { label: 'Calculateur TVA',             ok: true  },
      { label: 'Simulateur de charges',       ok: true  },
      { label: 'Convertisseur devises',       ok: true  },
      { label: 'Calculateur amortissement',   ok: true  },
      { label: 'Seuil de rentabilité',        ok: true  },
      { label: 'Simulateur salaire',          ok: true  },
      { label: 'Tableau fiscal',              ok: true  },
      { label: 'Vigil (assistant limité)',    ok: true  },
      { label: 'Dépenses & Recettes',         ok: false },
      { label: 'Banque & Rapprochement',      ok: false },
      { label: 'Contrats & Assurances',       ok: false },
      { label: 'Générateur de documents',     ok: false },
      { label: 'Export FEC comptable',        ok: false },
    ],
  },
  {
    id: 'starter',
    nom: 'Starter',
    prix: 29,
    couleur: C.green,
    icon: Star,
    description: 'Pour indépendants et auto-entrepreneurs',
    cta: 'Choisir Starter',
    ctaLink: '/pro/signup',
    populaire: false,
    fonctionnalites: [
      { label: 'Tout le plan Gratuit',        ok: true  },
      { label: 'Dépenses & Notes de frais',   ok: true  },
      { label: 'Recettes & Clients',          ok: true  },
      { label: 'Banque & Rapprochement CSV',  ok: true  },
      { label: 'Contrats & Assurances',       ok: true  },
      { label: 'Formalités administratives',  ok: true  },
      { label: 'Gestion équipe',              ok: true  },
      { label: 'Pointages',                   ok: true  },
      { label: 'Gestion fournisseurs',        ok: true  },
      { label: 'Agent email',                 ok: true  },
      { label: 'Vigil illimité',              ok: true  },
      { label: 'Générateur de documents',     ok: false },
      { label: 'Export FEC comptable',        ok: false },
      { label: 'Business Plan IA',            ok: false },
    ],
  },
  {
    id: 'pro',
    nom: 'Pro',
    prix: 49,
    couleur: C.blue,
    icon: Rocket,
    description: 'Pour freelances confirmés et TPE',
    cta: 'Choisir Pro',
    ctaLink: '/pro/signup',
    populaire: true,
    fonctionnalites: [
      { label: 'Tout le plan Starter',        ok: true  },
      { label: 'Générateur de devis PDF',     ok: true  },
      { label: 'Générateur de factures PDF',  ok: true  },
      { label: 'Export FEC comptable',        ok: true  },
      { label: 'OCR reconnaissance factures', ok: true  },
      { label: 'Détection anomalies financières', ok: true },
      { label: 'Alertes intelligentes TVA',   ok: true  },
      { label: 'Prévision trésorerie',        ok: true  },
      { label: 'Graphiques CA avancés',       ok: true  },
      { label: 'Export Excel avancé',         ok: true  },
      { label: 'Notifications in-app',        ok: true  },
      { label: 'Business Plan IA',            ok: false },
      { label: 'Étude de marché IA',          ok: false },
      { label: 'Multi-entreprises',           ok: false },
    ],
  },
  {
    id: 'premium',
    nom: 'Premium',
    prix: 89,
    couleur: C.purple,
    icon: Crown,
    description: 'Pour EURL, SAS, SARL et structures en croissance',
    cta: 'Choisir Premium',
    ctaLink: '/pro/signup',
    populaire: false,
    fonctionnalites: [
      { label: 'Tout le plan Pro',            ok: true  },
      { label: 'Business Plan généré par IA', ok: true  },
      { label: 'Étude de marché IA',          ok: true  },
      { label: 'Comparateur devis fournisseurs', ok: true },
      { label: 'Multi-entreprises',           ok: true, soon: true },
      { label: 'Support prioritaire email',   ok: true  },
      { label: 'Accès anticipé nouveautés',   ok: true  },
      { label: 'Onboarding personnalisé',     ok: true  },
    ],
  },
];

const FAQ = [
  { q: 'Puis-je changer de plan à tout moment ?',        r: 'Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment. Le changement prend effet immédiatement.' },
  { q: 'Y a-t-il un engagement ?',                       r: 'Non. Tous les plans sont sans engagement, résiliables à tout moment depuis votre profil.' },
  { q: 'Mes données sont-elles sécurisées ?',            r: 'Oui. Vos données sont chiffrées, hébergées en Europe (Supabase Frankfurt) et jamais partagées à des tiers.' },
  { q: 'Le plan Gratuit nécessite-t-il une carte ?',     r: 'Non, aucune carte bancaire requise. Les outils calculateurs sont accessibles sans limite. Les modules de gestion (dépenses, recettes…) nécessitent un plan payant.' },
  { q: 'Vigie Pro remplace-t-il un expert-comptable ?',  r: 'Non. Vigie Pro est un outil de pré-comptabilité. Il ne remplace pas un expert-comptable pour vos obligations fiscales.' },
  { q: 'Comment fonctionne la facturation ?',            r: 'Les plans payants sont facturés mensuellement via Stripe. Vous recevez une facture par email chaque mois.' },
];

export default function Tarifs() {
  const [faqOpen, setFaqOpen] = useState(null);

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", background: C.dark, color: C.text, minHeight: '100vh' }}>

      {/* Navbar */}
      <nav style={{ position:'sticky', top:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6%', height:64, background:'rgba(8,9,12,0.95)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <Link to="/" style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:700, color:C.text, textDecoration:'none' }}>Vigie</Link>
        <div style={{ display:'flex', gap:10 }}>
          <Link to="/pro/login" style={{ padding:'7px 16px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', color:'rgba(237,232,219,0.6)', fontSize:13, fontWeight:600, textDecoration:'none' }}>Connexion</Link>
          <Link to="/pro/signup" style={{ padding:'7px 16px', borderRadius:8, background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none' }}>S'inscrire</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign:'center', padding:'72px 6% 48px' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(91,163,199,0.08)', border:'1px solid rgba(91,163,199,0.2)', borderRadius:20, padding:'5px 14px', marginBottom:24 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:C.blue }}/>
          <span style={{ fontSize:11, fontWeight:700, color:C.blue, letterSpacing:'0.1em', textTransform:'uppercase' }}>Tarifs simples et transparents</span>
        </div>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(36px, 6vw, 64px)', fontWeight:700, color:C.text, marginBottom:16, lineHeight:1.1 }}>
          Choisissez votre plan
        </h1>
        <p style={{ fontSize:16, color:C.light, maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>
          Sans engagement · Résiliable à tout moment · Données hébergées en Europe
        </p>
      </div>

      {/* Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:16, maxWidth:1100, margin:'0 auto', padding:'0 4% 72px' }}>
        {PLANS.map(plan => {
          const Icon = plan.icon;
          return (
            <div key={plan.id} style={{ position:'relative', background: plan.populaire ? 'linear-gradient(135deg, rgba(91,163,199,0.1), rgba(91,163,199,0.04))' : C.card, border:`1px solid ${plan.populaire ? 'rgba(91,163,199,0.35)' : C.border}`, borderRadius:20, padding:'28px 24px', display:'flex', flexDirection:'column', boxShadow: plan.populaire ? '0 8px 40px rgba(91,163,199,0.15)' : 'none' }}>

              {plan.populaire && (
                <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', borderRadius:20, padding:'4px 16px', fontSize:11, fontWeight:700, color:'#fff', whiteSpace:'nowrap' }}>
                  ⭐ Le plus populaire
                </div>
              )}

              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <div style={{ width:38, height:38, borderRadius:11, background:`${plan.couleur}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={18} color={plan.couleur}/>
                </div>
                <div>
                  <div style={{ fontSize:17, fontWeight:700, color:C.text }}>{plan.nom}</div>
                  <div style={{ fontSize:11, color:C.light, lineHeight:1.4 }}>{plan.description}</div>
                </div>
              </div>

              <div style={{ marginBottom:20 }}>
                <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:42, fontWeight:700, color:plan.couleur }}>
                  {plan.prix === 0 ? 'Gratuit' : `${plan.prix} €`}
                </span>
                {plan.prix > 0 && <span style={{ fontSize:13, color:C.light }}> / mois</span>}
              </div>

              <Link to={plan.ctaLink} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px', borderRadius:11, background: plan.populaire ? 'linear-gradient(135deg, #5BA3C7, #3d7fa8)' : `${plan.couleur}18`, color: plan.populaire ? '#fff' : plan.couleur, fontSize:13, fontWeight:700, textDecoration:'none', marginBottom:20, border: plan.populaire ? 'none' : `1px solid ${plan.couleur}35`, transition:'all 0.2s ease' }}>
                {plan.cta} <ArrowRight size={13}/>
              </Link>

              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
                {plan.fonctionnalites.map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:9, opacity: f.ok ? 1 : 0.3 }}>
                    <div style={{ width:17, height:17, borderRadius:'50%', background: f.ok ? `${C.green}15` : 'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {f.ok
                        ? <Check size={10} color={C.green} strokeWidth={3}/>
                        : <X size={9} color='rgba(255,255,255,0.2)' strokeWidth={2.5}/>
                      }
                    </div>
                    <span style={{ fontSize:12, color: f.ok ? C.text : C.light, lineHeight:1.4 }}>
                      {f.label}
                      {f.soon && <span style={{ fontSize:9, fontWeight:700, color:C.purple, background:'rgba(168,91,199,0.15)', borderRadius:4, padding:'1px 5px', marginLeft:5 }}>Bientôt</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Garanties */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'40px 6%' }}>
        <div style={{ maxWidth:800, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:24, textAlign:'center' }}>
          {[
            { emoji:'🔒', titre:'Données sécurisées',   desc:'Chiffrées, hébergées en Europe'  },
            { emoji:'🚫', titre:'Sans engagement',       desc:'Résiliable à tout moment'        },
            { emoji:'🇫🇷', titre:'100% français',        desc:'Conforme droit fiscal français'  },
            { emoji:'💳', titre:'Paiement sécurisé',    desc:'Via Stripe, certifié PCI DSS'    },
          ].map(g => (
            <div key={g.titre}>
              <div style={{ fontSize:28, marginBottom:8 }}>{g.emoji}</div>
              <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:4 }}>{g.titre}</div>
              <div style={{ fontSize:12, color:C.light }}>{g.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" style={{ padding:'72px 6%', maxWidth:680, margin:'0 auto' }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(28px, 4vw, 40px)', fontWeight:700, color:C.text, textAlign:'center', marginBottom:40 }}>
          Questions fréquentes
        </h2>
        {FAQ.map((item, i) => (
          <div key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:4 }}>
            <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 0', background:'none', border:'none', cursor:'pointer', color:C.text, fontSize:14, fontWeight:600, textAlign:'left', fontFamily:'inherit', gap:12 }}>
              {item.q}
              <span style={{ fontSize:18, color:C.light, flexShrink:0, transition:'transform 200ms', transform: faqOpen===i ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
            </button>
            {faqOpen === i && (
              <p style={{ fontSize:13, color:C.light, lineHeight:1.7, paddingBottom:16, marginTop:0 }}>{item.r}</p>
            )}
          </div>
        ))}
      </div>

      {/* CTA final */}
      <div style={{ margin:'0 6% 72px', borderRadius:24, background:'linear-gradient(135deg, rgba(91,163,199,0.1), rgba(91,163,199,0.04))', border:'1px solid rgba(91,163,199,0.15)', padding:'clamp(40px, 6vw, 64px)', textAlign:'center' }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(26px, 4vw, 40px)', fontWeight:700, color:C.text, marginBottom:12 }}>Prêt à démarrer ?</h2>
        <p style={{ fontSize:15, color:C.light, marginBottom:32, maxWidth:400, margin:'0 auto 32px' }}>Créez votre compte gratuitement en moins d'une minute.</p>
        <Link to="/pro/signup" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 32px', borderRadius:12, background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 24px rgba(91,163,199,0.3)' }}>
          Créer mon compte gratuit <ArrowRight size={14}/>
        </Link>
      </div>

      <Footer/>
    </div>
  );
}
