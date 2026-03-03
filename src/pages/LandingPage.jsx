import { useState, useEffect, useRef } from 'react';

const C = {
  blue:   '#5BA3C7',
  green:  '#5BC78A',
  gold:   '#D4A853',
  purple: '#A85BC7',
  red:    '#C75B4E',
  dark:   '#0A0F1E',
  mid:    '#111827',
  card:   '#141C2E',
  border: 'rgba(255,255,255,0.08)',
  text:   '#E2E8F0',
  muted:  '#64748B',
  light:  '#94A3B8',
};

const PRICES = { starter: 19, pro: 39, entreprise: 79 };

const FAQS = [
  { q: "Vigie Pro remplace-t-il mon expert-comptable ?", a: "Non. Vigie Pro est un outil de pré-comptabilité qui prépare et facilite le travail de votre expert-comptable. Il centralise vos données, génère des exports normalisés (FEC) et automatise les tâches répétitives — mais ne remplace pas le conseil d'un professionnel comptable." },
  { q: "Mes données sont-elles sécurisées et hébergées en Europe ?", a: "Oui. Vigie Pro utilise Supabase avec des serveurs hébergés en Europe (Frankfurt). Toutes les données sont chiffrées en transit et au repos. Chaque utilisateur n'accède qu'à ses propres données grâce au Row Level Security. La plateforme est conforme au RGPD." },
  { q: "Puis-je changer de plan à tout moment ?", a: "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment depuis votre espace. Les changements sont effectifs immédiatement et la facturation est ajustée au prorata. Aucun engagement de durée minimum sur les plans mensuels." },
  { q: "Comment fonctionne l'import de documents ?", a: "Depuis le tableau de bord, glissez ou sélectionnez un fichier (PDF, JPG, PNG, CSV). Vigie Pro détecte automatiquement le type de document et vous propose de le classer dans le bon module — dépenses, fournisseurs ou banque. Vous confirmez en un clic." },
  { q: "Le Mail Agent accède-t-il à mes emails entrants ?", a: "Non. Le Mail Agent fonctionne en mode sortant uniquement. Il ne lit jamais votre boîte de réception et ne stocke pas les communications de vos clients. Il sert uniquement à rédiger et envoyer des emails professionnels depuis Vigie Pro." },
  { q: "Le FEC généré est-il conforme à la réglementation française ?", a: "Le fichier FEC respecte le format défini par l'article L.47 A du Livre des Procédures Fiscales. Il doit néanmoins être validé par votre expert-comptable avant remise à l'administration fiscale." },
  { q: "Est-il possible d'essayer Vigie Pro avant de s'abonner ?", a: "Oui. Contactez-nous via le formulaire ci-dessous pour obtenir un accès démo personnalisé. Un membre de l'équipe vous guidera à travers les fonctionnalités adaptées à votre situation." },
];

const s = {
  fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
};

export default function LandingPage() {
  const [isAnnual, setIsAnnual]   = useState(false);
  const [openFaq, setOpenFaq]     = useState(null);
  const [scrolled, setScrolled]   = useState(false);
  const [formDone, setFormDone]   = useState(false);
  const [form, setForm]           = useState({ prenom: '', email: '', type: '', message: '' });
  const revealRefs                = useRef([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.style.opacity = '1', e.target.style.transform = 'translateY(0)'; }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    revealRefs.current.forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const reveal = (i = 0) => ({
    ref: el => { revealRefs.current[i] = el; },
    style: { opacity: 0, transform: 'translateY(28px)', transition: `opacity 0.7s ${i * 0.08}s ease, transform 0.7s ${i * 0.08}s ease` },
  });

  const price = (plan) => {
    const m = PRICES[plan];
    return isAnnual ? Math.round(m * 10 / 12) : m;
  };

  const submitForm = () => {
    if (!form.prenom || !form.email || !form.message) { alert('Merci de remplir prénom, email et message.'); return; }
    setFormDone(true);
  };

  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <div style={{ ...s, background: C.dark, color: C.text, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Google Fonts ── */}
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* ─────────────── NAVBAR ─────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6%', height: 68,
        background: scrolled ? 'rgba(10,15,30,0.97)' : 'rgba(10,15,30,0.80)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`,
        transition: 'background 0.3s',
      }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#fff' }}>
          Vigie<span style={{ color: C.blue, fontStyle: 'italic' }}>Pro</span>
        </div>

        <div style={{ display: 'flex', gap: 32 }}>
          {[['Fonctionnalités','features'],['Modules','piliers'],['Tarifs','pricing'],['FAQ','faq'],['Contact','contact']].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: C.light, fontFamily: 'inherit', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = C.light}
            >{label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/pro/login" style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${C.border}`, color: C.light, fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = C.light}
          >Se connecter</a>
          <a href="/pro/login" style={{ padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 20px rgba(91,163,199,0.3)' }}>
            Commencer →
          </a>
        </div>
      </nav>

      {/* ─────────────── HERO ─────────────── */}
      <section id="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 6% 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Orbes */}
        {[
          { w: 600, h: 600, color: C.blue,   top: '-100px',  right: '-100px',  left: 'auto' },
          { w: 400, h: 400, color: C.green,  bottom: '-50px', left: '10%',     top: 'auto'  },
          { w: 280, h: 280, color: C.purple, top: '40%',     left: '42%',      opacity: 0.06 },
        ].map((o, i) => (
          <div key={i} style={{ position: 'absolute', width: o.w, height: o.h, borderRadius: '50%', background: o.color, filter: 'blur(120px)', opacity: o.opacity || 0.09, top: o.top, right: o.right, bottom: o.bottom, left: o.left, pointerEvents: 'none' }} />
        ))}
        {/* Grille */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px', WebkitMaskImage: 'radial-gradient(ellipse at center,black 0%,transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            {/* Badge */}
            <div {...reveal(0)} style={{ ...reveal(0).style, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(91,163,199,0.10)', border: '1px solid rgba(91,163,199,0.25)', borderRadius: 20, padding: '5px 16px', marginBottom: 22 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: '0.09em', textTransform: 'uppercase' }}>Plateforme française de pré-comptabilité</span>
            </div>

            <h1 {...reveal(1)} style={{ ...reveal(1).style, fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(42px,5vw,64px)', fontWeight: 700, lineHeight: 1.1, color: '#F8FAFC', marginBottom: 20 }}>
              Gérez votre entreprise.<br />
              <em style={{ color: C.blue }}>Sans la complexité.</em>
            </h1>

            <p {...reveal(2)} style={{ ...reveal(2).style, fontSize: 16, color: C.light, lineHeight: 1.8, marginBottom: 36, maxWidth: 480 }}>
              Vigie Pro centralise votre gestion administrative, vos finances et votre comptabilité en un seul outil pensé pour les entrepreneurs, TPE et PME françaises.
            </p>

            <div {...reveal(3)} style={{ ...reveal(3).style, display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 44 }}>
              <a href="/pro/login" style={{ padding: '13px 28px', borderRadius: 8, background: 'linear-gradient(135deg,#5BA3C7,#3d7fa8)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(91,163,199,0.35)' }}>
                Démarrer maintenant →
              </a>
              <button onClick={() => scrollTo('features')} style={{ padding: '13px 28px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.light, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Découvrir les modules
              </button>
            </div>

            <div {...reveal(4)} style={{ ...reveal(4).style, display: 'flex', gap: 28 }}>
              {[['4','Piliers fonctionnels'],['12+','Modules intégrés'],['100%','Données en Europe']].map(([n, l], i) => (
                <div key={i} style={{ display: 'flex', gap: i > 0 ? 0 : 0, alignItems: 'center' }}>
                  {i > 0 && <div style={{ width: 1, height: 36, background: C.border, marginRight: 28 }} />}
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{n}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup dashboard */}
          <div {...reveal(2)} style={{ ...reveal(2).style }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${C.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 4, height: 18, marginLeft: 8 }} />
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tableau de bord — {new Date().toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[['Recettes du mois','18 450 €',C.green],['Dépenses','6 230 €',C.red],['Solde','12 220 €',C.blue],['En attente','3 800 €',C.gold]].map(([l,v,c]) => (
                    <div key={l} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{l}</div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: c }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 14, height: 80, display: 'flex', alignItems: 'flex-end', gap: 5, marginBottom: 12 }}>
                  {[40,65,50,80,55,90,70,45].map((h,i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 5 ? C.blue : `rgba(91,163,199,${0.2+i*0.04})`, borderRadius: '3px 3px 0 0' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, background: 'rgba(199,91,78,0.12)', border: '1px solid rgba(199,91,78,0.2)', borderRadius: 6, padding: '7px 10px' }}>
                    <div style={{ fontSize: 9, color: C.red, fontWeight: 700, marginBottom: 2 }}>⚠ 2 FACTURES EN RETARD</div>
                    <div style={{ fontSize: 9, color: C.muted }}>Action requise</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(91,199,138,0.08)', border: '1px solid rgba(91,199,138,0.15)', borderRadius: 6, padding: '7px 10px' }}>
                    <div style={{ fontSize: 9, color: C.green, fontWeight: 700, marginBottom: 2 }}>✓ CONTRATS À JOUR</div>
                    <div style={{ fontSize: 9, color: C.muted }}>0 expiration proche</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── FEATURES ─────────────── */}
      <section id="features" style={{ padding: '100px 6%', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div {...reveal(10)} style={{ ...reveal(10).style, textAlign: 'center', marginBottom: 60 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.blue, display: 'block', marginBottom: 14 }}>Pourquoi Vigie Pro</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(32px,4vw,48px)', fontWeight: 700, color: '#F8FAFC', marginBottom: 16, lineHeight: 1.2 }}>
              Tout ce dont vous avez besoin,<br /><em style={{ color: C.blue }}>enfin réuni</em>
            </h2>
            <p style={{ fontSize: 16, color: C.light, maxWidth: 520, margin: '0 auto', lineHeight: 1.8 }}>Une plateforme unique qui remplace les tableurs et les outils épars — conçue pour la réalité des entrepreneurs français.</p>
          </div>

          <div {...reveal(11)} style={{ ...reveal(11).style, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, background: C.border, borderRadius: 16, overflow: 'hidden' }}>
            {[
              { emoji: '💰', title: 'Trésorerie en temps réel',   desc: 'Recettes, dépenses, relevés bancaires et rapprochement automatique. Votre solde du mois à portée de regard.', tag: 'Trésorerie', color: C.green  },
              { emoji: '⚖️', title: 'Zéro oubli juridique',       desc: 'Contrats avec alertes de préavis, formalités administratives avec rappels automatiques. Vos obligations légales sous contrôle.', tag: 'Juridique', color: C.gold },
              { emoji: '👥', title: 'RH & Opérations',            desc: 'Fiches collaborateurs, pointages quotidiens, fournisseurs et exports FEC pour votre expert-comptable.', tag: 'Opérations', color: C.purple },
              { emoji: '✉️', title: 'Mail Agent IA',              desc: "Rédigez relances, devis et communications en quelques secondes. L'IA s'occupe de la rédaction professionnelle.", tag: 'Mail Agent', color: C.blue  },
              { emoji: '📤', title: 'Import intelligent',         desc: 'Déposez un document — Vigie Pro le classe automatiquement dans le bon module et en extrait les données.', tag: 'Import', color: C.blue },
              { emoji: '📊', title: 'Export FEC légal',           desc: 'Générez votre Fichier des Écritures Comptables au format officiel pour votre expert-comptable ou en cas de contrôle fiscal.', tag: 'Comptabilité', color: C.red },
            ].map((f, i) => (
              <div key={i} style={{ background: C.card, padding: '36px 32px', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1a243a'}
                onMouseLeave={e => e.currentTarget.style.background = C.card}
              >
                <div style={{ fontSize: 28, marginBottom: 18 }}>{f.emoji}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: C.light, lineHeight: 1.7 }}>{f.desc}</p>
                <span style={{ display: 'inline-block', marginTop: 14, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', padding: '3px 10px', borderRadius: 20, background: `${f.color}15`, color: f.color }}>{f.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── PILIERS ─────────────── */}
      <section id="piliers" style={{ padding: '100px 6%', background: C.dark }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div {...reveal(20)} style={{ ...reveal(20).style, marginBottom: 60 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.blue, display: 'block', marginBottom: 14 }}>Les 4 piliers</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(32px,4vw,48px)', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.2, marginBottom: 14 }}>
              Une architecture pensée<br /><em style={{ color: C.blue }}>pour votre quotidien</em>
            </h2>
            <p style={{ fontSize: 16, color: C.light, lineHeight: 1.8 }}>Chaque pilier regroupe des modules complémentaires, accessibles selon votre plan.</p>
          </div>

          <div {...reveal(21)} style={{ ...reveal(21).style, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { emoji: '💰', name: 'Trésorerie', color: C.green,  plan: 'Pro & Entreprise', modules: ['Dépenses & Frais professionnels','Recettes, Devis & Facturation','Banque & Rapprochement bancaire','Import justificatifs & relevés CSV'] },
              { emoji: '⚖️', name: 'Juridique',  color: C.gold,   plan: 'Pro & Entreprise', modules: ['Contrats & Assurances avec alertes préavis','Formalités administratives & rappels','Mail Agent IA (relances, communications)','Historique complet des envois'] },
              { emoji: '👥', name: 'Opérations', color: C.purple, plan: 'Entreprise',        modules: ['Équipe & Gestion RH complète','Pointages & Suivi des présences','Fournisseurs & Factures reçues','Exports FEC (format légal fiscal)'] },
              { emoji: '📊', name: 'Dashboard',  color: C.blue,   plan: 'Tous les plans',   modules: ['Vue consolidée de tous vos indicateurs','Alertes intelligentes & rappels automatiques','Import rapide de documents','Raccourcis vers tous les modules'] },
            ].map((p, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, position: 'relative', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: p.color }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${p.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{p.emoji}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{p.name}</div>
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${p.color}15`, color: p.color }}>{p.plan}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.modules.map((m, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.light }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.muted, flexShrink: 0 }} />
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── PRICING ─────────────── */}
      <section id="pricing" style={{ padding: '100px 6%', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div {...reveal(30)} style={{ ...reveal(30).style, textAlign: 'center', marginBottom: 50 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.blue, display: 'block', marginBottom: 14 }}>Tarifs</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(32px,4vw,48px)', fontWeight: 700, color: '#F8FAFC', marginBottom: 16, lineHeight: 1.2 }}>
              Simple, transparent,<br /><em style={{ color: C.blue }}>sans surprise</em>
            </h2>
            <p style={{ fontSize: 16, color: C.light, maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.8 }}>Choisissez le plan adapté à votre structure. Évoluez à tout moment.</p>

            {/* Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <span style={{ fontSize: 14, color: C.light }}>Mensuel</span>
              <div onClick={() => setIsAnnual(!isAnnual)} style={{ width: 48, height: 26, borderRadius: 13, background: isAnnual ? C.blue : 'rgba(255,255,255,0.1)', border: `1px solid ${C.border}`, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 3, left: isAnnual ? 'auto' : 3, right: isAnnual ? 3 : 'auto', width: 18, height: 18, background: '#fff', borderRadius: '50%', transition: 'all 0.2s' }} />
              </div>
              <span style={{ fontSize: 14, color: C.light }}>Annuel</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(91,199,138,0.15)', color: C.green, border: '1px solid rgba(91,199,138,0.3)' }}>2 mois offerts</span>
            </div>
          </div>

          <div {...reveal(31)} style={{ ...reveal(31).style, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { plan: 'Starter', color: C.green,  key: 'starter',    desc: 'Pour les auto-entrepreneurs qui démarrent', featured: false,
                features: ['Dépenses & Frais professionnels','Upload de justificatifs','Dashboard central','Export CSV des dépenses','Support par email'] },
              { plan: 'Pro',     color: C.blue,   key: 'pro',        desc: 'Pour les entrepreneurs et TPE actives',    featured: true,
                features: ['Tout le plan Starter','Recettes, Devis & Facturation','Banque & Rapprochement','Contrats & Formalités juridiques','Mail Agent IA','Support prioritaire'] },
              { plan: 'Entreprise', color: C.purple, key: 'entreprise', desc: 'Pour les PME avec équipe et fournisseurs', featured: false,
                features: ['Tout le plan Pro','Équipe & Gestion RH','Pointages & Présences','Fournisseurs & Factures reçues','Export FEC légal','Onboarding dédié'] },
            ].map((p) => (
              <div key={p.plan} style={{ background: C.card, border: `1px solid ${p.featured ? C.blue : C.border}`, borderRadius: 20, padding: '36px 32px', position: 'relative', overflow: 'hidden', boxShadow: p.featured ? `0 0 0 1px ${C.blue}, 0 20px 60px rgba(91,163,199,0.15)` : 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                {p.featured && (
                  <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: C.blue, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: '0 0 8px 8px', whiteSpace: 'nowrap' }}>
                    Le plus populaire
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: p.color, marginBottom: 6, marginTop: p.featured ? 18 : 0 }}>{p.plan}</div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 26 }}>{p.desc}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 20, color: C.light, marginBottom: 8 }}>€</span>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{price(p.key)}</span>
                </div>
                <div style={{ fontSize: 14, color: C.muted, marginBottom: 4 }}>/ mois HT</div>
                <div style={{ fontSize: 12, color: C.green, minHeight: 18, marginBottom: 26 }}>
                  {isAnnual ? `soit ${PRICES[p.key] * 10} € / an (2 mois offerts)` : ''}
                </div>
                <div style={{ height: 1, background: C.border, marginBottom: 22 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 30 }}>
                  {p.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: C.light }}>
                      <span style={{ color: C.green, flexShrink: 0 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <button onClick={() => window.location.href = '/login'} style={{ width: '100%', padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: p.featured ? 'none' : `1px solid ${C.border}`, background: p.featured ? 'linear-gradient(135deg,#5BA3C7,#3d7fa8)' : 'transparent', color: p.featured ? '#fff' : C.light, boxShadow: p.featured ? '0 4px 20px rgba(91,163,199,0.3)' : 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  {p.featured ? `Choisir ${p.plan} →` : `Commencer →`}
                </button>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: C.muted }}>
            Tous les prix sont HT · TVA 20% applicable · Résiliation à tout moment · Paiement sécurisé par Stripe
          </p>
        </div>
      </section>

      {/* ─────────────── FAQ ─────────────── */}
      <section id="faq" style={{ padding: '100px 6%', background: C.dark }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div {...reveal(40)} style={{ ...reveal(40).style, textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.blue, display: 'block', marginBottom: 14 }}>FAQ</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(32px,4vw,48px)', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.2 }}>
              Questions <em style={{ color: C.blue }}>fréquentes</em>
            </h2>
          </div>

          <div {...reveal(41)} style={{ ...reveal(41).style, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {FAQS.map((f, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: '#fff', textAlign: 'left', gap: 16 }}>
                  {f.q}
                  <svg style={{ width: 18, height: 18, flexShrink: 0, color: C.muted, transition: 'transform 0.25s', transform: openFaq === i ? 'rotate(180deg)' : 'none' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 24px 20px', fontSize: 14, color: C.light, lineHeight: 1.8 }}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── CONTACT ─────────────── */}
      <section id="contact" style={{ padding: '100px 6%', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
          <div {...reveal(50)} style={{ ...reveal(50).style }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.blue, display: 'block', marginBottom: 14 }}>Contact</span>
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>Une question ?<br />Parlons-en.</h3>
            <p style={{ fontSize: 15, color: C.light, lineHeight: 1.8, marginBottom: 32 }}>Notre équipe est disponible pour répondre à vos questions, vous accompagner dans votre choix de plan ou organiser une démonstration personnalisée.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[['✉️','Email','contact@vigiepro.fr'],['⏱️','Délai de réponse','Sous 24h ouvrées'],['🇫🇷','Support','En français, par des humains']].map(([icon, label, value]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(91,163,199,0.12)', border: '1px solid rgba(91,163,199,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, color: C.light }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div {...reveal(51)} style={{ ...reveal(51).style, background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 36 }}>
            {formDone ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Message envoyé !</p>
                <p style={{ fontSize: 14, color: C.light }}>Nous vous répondrons sous 24h ouvrées.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  {[['Prénom','prenom','Jean','text'],['Nom','nom','Dupont','text']].map(([label, key, ph, type]) => (
                    <div key={key}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: C.light, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>{label}</label>
                      <input type={type} placeholder={ph} value={form[key]} onChange={e => setForm(f => ({...f,[key]:e.target.value}))} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontFamily: 'inherit', fontSize: 14, color: '#fff', outline: 'none' }} />
                    </div>
                  ))}
                </div>
                {[['Email professionnel','email','jean@masociete.fr','email'],].map(([label, key, ph, type]) => (
                  <div key={key} style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.light, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>{label}</label>
                    <input type={type} placeholder={ph} value={form[key]} onChange={e => setForm(f => ({...f,[key]:e.target.value}))} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontFamily: 'inherit', fontSize: 14, color: '#fff', outline: 'none' }} />
                  </div>
                ))}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.light, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Vous êtes</label>
                  <select value={form.type} onChange={e => setForm(f => ({...f,type:e.target.value}))} style={{ width: '100%', background: '#1a243a', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontFamily: 'inherit', fontSize: 14, color: form.type ? '#fff' : C.muted, outline: 'none' }}>
                    <option value="">Sélectionnez...</option>
                    {['Auto-entrepreneur','Dirigeant de TPE','Dirigeant de PME','Expert-comptable','Autre'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.light, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>Message</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({...f,message:e.target.value}))} placeholder="Décrivez votre besoin ou posez votre question..." rows={4} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontFamily: 'inherit', fontSize: 14, color: '#fff', outline: 'none', resize: 'vertical' }} />
                </div>
                <button onClick={submitForm} style={{ width: '100%', padding: 14, borderRadius: 10, background: 'linear-gradient(135deg,#5BA3C7,#3d7fa8)', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(91,163,199,0.3)' }}>
                  Envoyer le message →
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────── CTA FINAL ─────────────── */}
      <section style={{ padding: '100px 6%', textAlign: 'center', background: 'linear-gradient(135deg,rgba(91,163,199,0.08) 0%,rgba(10,15,30,0) 60%)' }}>
        <div {...reveal(60)} style={{ ...reveal(60).style }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(36px,5vw,60px)', fontWeight: 700, color: '#F8FAFC', marginBottom: 20, lineHeight: 1.15 }}>
            Prêt à reprendre<br /><em style={{ color: C.blue }}>le contrôle de votre gestion ?</em>
          </h2>
          <p style={{ fontSize: 16, color: C.light, maxWidth: 460, margin: '0 auto 40px', lineHeight: 1.8 }}>Rejoignez les entrepreneurs qui ont choisi de simplifier leur administratif avec Vigie Pro.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/prologin" style={{ padding: '15px 36px', borderRadius: 8, background: 'linear-gradient(135deg,#5BA3C7,#3d7fa8)', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(91,163,199,0.35)' }}>Commencer maintenant →</a>
            <button onClick={() => scrollTo('contact')} style={{ padding: '15px 36px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.light, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Demander une démo</button>
          </div>
          <p style={{ marginTop: 20, fontSize: 13, color: C.muted }}>Sans engagement · Résiliation en 1 clic · Support français inclus</p>
        </div>
      </section>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '36px 6%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 700, color: C.light }}>
          Vigie<span style={{ color: C.blue, fontStyle: 'italic' }}>Pro</span>
        </div>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          {[['Fonctionnalités','features'],['Tarifs','pricing'],['FAQ','faq'],['Contact','contact']].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.muted, fontFamily: 'inherit' }}>{label}</button>
          ))}
          <a href="/mentions-legales" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>Mentions légales</a>
          <a href="/confidentialite" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>Confidentialité</a>
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>© 2026 Vigie Pro · Tous droits réservés</div>
      </footer>

    </div>
  );
}
