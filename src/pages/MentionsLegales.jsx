import { useNavigate } from 'react-router-dom';

const C = {
  dark:   '#0A0F1E',
  card:   '#141C2E',
  border: 'rgba(255,255,255,0.08)',
  text:   '#E2E8F0',
  light:  '#94A3B8',
  muted:  '#64748B',
  blue:   '#5BA3C7',
};

const SECTIONS = [
  {
    title: "1. Éditeur du site",
    content: `Le site vigiepro.fr (ci-après "le Site") est édité par :

• Nom / Raison sociale : [À COMPLÉTER — votre nom ou nom commercial]
• Forme juridique : Auto-entrepreneur
• SIRET : [À COMPLÉTER — en cours d'obtention]
• Adresse : [À COMPLÉTER]
• Email : contact@vigiepro.fr
• Directeur de la publication : [À COMPLÉTER — votre nom]`
  },
  {
    title: "2. Hébergement",
    content: `Le Site est hébergé par :

• Vercel Inc. — 340 Pine Street, Suite 900, San Francisco, CA 94104, États-Unis
• Les données utilisateurs sont stockées par Supabase (Supabase Inc.) sur des serveurs situés en Europe (Frankfurt, Allemagne), conformément au RGPD.`
  },
  {
    title: "3. Propriété intellectuelle",
    content: `L'ensemble des contenus présents sur le Site (textes, images, graphismes, logo, icônes, logiciels, code source, etc.) est la propriété exclusive de l'éditeur ou de ses partenaires, et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.

Toute reproduction, représentation, modification, publication, transmission ou dénaturation, totale ou partielle, du Site ou de son contenu, par quelque procédé que ce soit, et sur quelque support que ce soit, est interdite sans l'autorisation écrite préalable de l'éditeur.`
  },
  {
    title: "4. Objet du service",
    content: `Vigie Pro est une plateforme SaaS de pré-comptabilité et de gestion administrative destinée aux entrepreneurs, auto-entrepreneurs, TPE et PME françaises.

⚠️ Avertissement important : Vigie Pro est un outil de pré-comptabilité qui facilite la gestion administrative et la préparation des données comptables. Il ne constitue pas un logiciel de comptabilité certifié et ne remplace en aucun cas les services d'un expert-comptable. Les données générées par Vigie Pro doivent être validées par un professionnel comptable avant toute utilisation officielle ou fiscale.`
  },
  {
    title: "5. Conditions générales d'utilisation (CGU)",
    content: `5.1 Accès au service
L'accès au service Vigie Pro est soumis à la création d'un compte utilisateur et à l'acceptation des présentes CGU. L'utilisateur garantit que les informations fournies lors de son inscription sont exactes et à jour.

5.2 Utilisation du service
L'utilisateur s'engage à utiliser Vigie Pro conformément à sa destination et aux lois en vigueur. Il est interdit d'utiliser le service à des fins illicites, frauduleuses ou portant atteinte aux droits de tiers.

5.3 Responsabilité de l'utilisateur
L'utilisateur est seul responsable des données qu'il saisit, importe ou génère via Vigie Pro. Il lui appartient de vérifier l'exactitude des informations avant toute transmission à un tiers (expert-comptable, administration fiscale, etc.).

5.4 Disponibilité du service
L'éditeur s'efforce de maintenir le service accessible 24h/24, 7j/7, mais ne garantit pas une disponibilité ininterrompue. Des interruptions pour maintenance peuvent intervenir sans préavis.

5.5 Modification des CGU
L'éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par email ou notification dans l'application. La poursuite de l'utilisation du service après modification vaut acceptation des nouvelles CGU.

5.6 Résiliation
L'utilisateur peut résilier son abonnement à tout moment depuis son espace personnel. La résiliation prend effet à la fin de la période de facturation en cours.`
  },
  {
    title: "6. Tarifs et facturation",
    content: `Les tarifs des abonnements Vigie Pro sont indiqués en euros hors taxes (HT). La TVA au taux légal en vigueur (20%) s'applique.

Les abonnements sont à renouvellement automatique (mensuel ou annuel selon le plan choisi). Le paiement est sécurisé par Stripe. Vigie Pro ne stocke aucune donnée bancaire — la totalité du traitement des paiements est déléguée à Stripe Inc.

En cas de litige relatif à une facturation, l'utilisateur dispose d'un délai de 30 jours pour contacter le support à contact@vigiepro.fr.`
  },
  {
    title: "7. Limitation de responsabilité",
    content: `Vigie Pro est fourni "en l'état". L'éditeur ne saurait être tenu responsable :

• Des erreurs ou inexactitudes dans les données saisies par l'utilisateur
• Des décisions prises sur la base des informations générées par la plateforme
• Des pertes de données résultant d'un usage inapproprié
• Des dommages indirects, pertes d'exploitation ou manques à gagner

La responsabilité de l'éditeur est limitée au montant des sommes effectivement versées par l'utilisateur au cours des 12 derniers mois.`
  },
  {
    title: "8. Droit applicable et juridiction",
    content: `Les présentes mentions légales et CGU sont soumises au droit français. En cas de litige, et après tentative de résolution amiable, les tribunaux français seront seuls compétents.

Pour tout litige de consommation, l'utilisateur peut recourir à la médiation en ligne via la plateforme européenne de règlement en ligne des litiges : https://ec.europa.eu/consumers/odr`
  },
  {
    title: "9. Contact",
    content: `Pour toute question relative aux présentes mentions légales ou CGU :

• Email : contact@vigiepro.fr
• Délai de réponse : sous 5 jours ouvrés

Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
  },
];

export default function MentionsLegales() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: C.dark, color: C.text, minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Navbar simple */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6%', height: 64, background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => navigate('/')} style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
          Vigie<span style={{ color: C.blue, fontStyle: 'italic' }}>Pro</span>
        </button>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 14px', color: C.light, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          ← Retour
        </button>
      </nav>

      {/* En-tête */}
      <div style={{ padding: '60px 6% 40px', borderBottom: `1px solid ${C.border}`, background: 'linear-gradient(135deg, rgba(91,163,199,0.06) 0%, transparent 60%)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.blue, display: 'block', marginBottom: 12 }}>Informations légales</span>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px,4vw,48px)', fontWeight: 700, color: '#F8FAFC', marginBottom: 14, lineHeight: 1.2 }}>
            Mentions légales <em style={{ color: C.blue }}>&</em> CGU
          </h1>
          <p style={{ fontSize: 15, color: C.light, lineHeight: 1.7, maxWidth: 560 }}>
            Ces mentions légales et conditions générales d'utilisation régissent l'accès et l'utilisation de la plateforme Vigie Pro. Nous vous invitons à les lire attentivement.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, background: 'rgba(212,168,83,0.10)', border: '1px solid rgba(212,168,83,0.25)', borderRadius: 8, padding: '8px 14px' }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={{ fontSize: 12, color: '#D4A853', fontWeight: 600 }}>Certains champs sont à compléter dès obtention de votre SIRET et URL définitive.</span>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '60px 6%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SECTIONS.map((s, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '28px 32px' }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                {s.title}
              </h2>
              <div style={{ fontSize: 14, color: C.light, lineHeight: 1.9, whiteSpace: 'pre-line' }}>
                {s.content.split('[À COMPLÉTER').map((part, j) => {
                  if (j === 0) return <span key={j}>{part}</span>;
                  const end = part.indexOf(']');
                  const placeholder = '[À COMPLÉTER' + part.substring(0, end + 1);
                  const rest = part.substring(end + 1);
                  return (
                    <span key={j}>
                      <span style={{ background: 'rgba(212,168,83,0.15)', color: '#D4A853', borderRadius: 4, padding: '1px 6px', fontSize: 12, fontWeight: 700 }}>{placeholder}</span>
                      {rest}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bas de page */}
        <div style={{ marginTop: 40, padding: '24px 28px', background: 'rgba(91,163,199,0.06)', border: `1px solid rgba(91,163,199,0.15)`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>Une question sur ces mentions légales ?</p>
            <p style={{ fontSize: 12, color: C.light, margin: '3px 0 0' }}>Contactez-nous à contact@vigiepro.fr</p>
          </div>
          <a href="mailto:contact@vigiepro.fr" style={{ padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#5BA3C7,#3d7fa8)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Nous contacter
          </a>
        </div>
      </div>

      {/* Footer minimal */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '24px 6%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 700, color: C.light }}>
          Vigie<span style={{ color: C.blue, fontStyle: 'italic' }}>Pro</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.muted, fontFamily: 'inherit' }}>Accueil</button>
          <button onClick={() => navigate('/confidentialite')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.muted, fontFamily: 'inherit' }}>Confidentialité</button>
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>© 2026 Vigie Pro</div>
      </footer>
    </div>
  );
}
