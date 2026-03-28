import { useNavigate } from 'react-router-dom';

const C = {
  dark:   '#0A0F1E',
  card:   '#141C2E',
  border: 'rgba(255,255,255,0.08)',
  text:   '#E2E8F0',
  light:  '#94A3B8',
  muted:  '#64748B',
  blue:   '#5BA3C7',
  green:  '#5BC78A',
};

const SECTIONS = [
  {
    titre: '1. Objet',
    texte: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du service Vigie Pro, accessible à l'adresse vigie-officiel.com, édité par Lucien Doppler (SIRET : 888 362 118 00026).\n\nEn accédant au service, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, vous devez cesser d'utiliser le service.`,
  },
  {
    titre: '2. Description du service',
    texte: `Vigie Pro est une application de pré-comptabilité en ligne destinée aux professionnels (auto-entrepreneurs, TPE, PME) permettant de :\n\n• Gérer les dépenses, recettes et factures\n• Générer des devis et factures PDF\n• Analyser l'activité financière\n• Accéder à des outils de simulation fiscale et sociale\n• Bénéficier d'alertes automatiques et d'un assistant IA (Vigil)\n\nVigie Pro est un outil de pré-comptabilité. Il ne remplace pas un expert-comptable et ne constitue pas un conseil juridique, fiscal ou comptable.`,
  },
  {
    titre: '3. Accès au service',
    texte: `L'accès au service nécessite la création d'un compte utilisateur avec une adresse email valide et un mot de passe. Vous êtes seul responsable de la confidentialité de vos identifiants.\n\nVigie Pro propose quatre niveaux d'accès :\n• Plan Gratuit : fonctionnalités de base\n• Plan Starter (29 €/mois) : modules essentiels\n• Plan Pro (49 €/mois) : fonctionnalités complètes\n• Plan Premium (89 €/mois) : multi-bureau et fonctionnalités avancées\n\nL'éditeur se réserve le droit de modifier les fonctionnalités incluses dans chaque plan, avec notification préalable aux utilisateurs concernés.`,
  },
  {
    titre: "4. Obligations de l'utilisateur",
    texte: `En utilisant Vigie Pro, vous vous engagez à :\n\n• Fournir des informations exactes et à jour lors de l'inscription\n• Utiliser le service à des fins licites et professionnelles uniquement\n• Ne pas tenter de contourner les mesures de sécurité\n• Ne pas utiliser le service pour stocker des données de tiers sans leur consentement\n• Ne pas revendre ou redistribuer l'accès au service\n• Respecter les droits de propriété intellectuelle de l'éditeur`,
  },
  {
    titre: '5. Tarifs et facturation',
    texte: `Les plans payants sont facturés mensuellement via Stripe Inc. Le paiement est automatiquement renouvelé chaque mois sauf résiliation.\n\nPrix TTC (TVA 20% incluse) :\n• Plan Starter : 29 € TTC/mois\n• Plan Pro : 49 € TTC/mois\n• Plan Premium : 89 € TTC/mois\n\nEn cas de non-paiement, l'accès aux fonctionnalités payantes sera suspendu après un délai de 7 jours. Aucun remboursement n'est accordé pour les périodes déjà facturées, sauf disposition légale contraire.`,
  },
  {
    titre: '6. Résiliation',
    texte: `Vous pouvez résilier votre abonnement à tout moment depuis votre espace "Mon profil". La résiliation prend effet à la fin de la période de facturation en cours.\n\nL'éditeur peut suspendre ou résilier votre accès en cas de violation des présentes CGU, avec ou sans préavis selon la gravité des manquements.`,
  },
  {
    titre: '7. Propriété intellectuelle',
    texte: `L'ensemble des éléments constituant Vigie Pro (code source, interface, marques, logos, contenus) est la propriété exclusive de l'éditeur et est protégé par le droit de la propriété intellectuelle.\n\nVos données (dépenses, recettes, documents) restent votre propriété. Vous accordez à l'éditeur une licence limitée pour les traiter dans le cadre de la fourniture du service.`,
  },
  {
    titre: '8. Limitation de responsabilité',
    texte: `Vigie Pro est fourni "en l'état". L'éditeur s'engage à maintenir le service disponible mais ne garantit pas une disponibilité ininterrompue.\n\nL'éditeur ne saurait être tenu responsable :\n• Des décisions prises sur la base des informations fournies par le service\n• Des erreurs de calcul résultant de données incorrectes saisies par l'utilisateur\n• Des pertes de données dues à un cas de force majeure\n• Du non-respect de vos obligations fiscales ou comptables\n\nEn tout état de cause, la responsabilité de l'éditeur est limitée au montant des sommes versées au cours des 3 derniers mois.`,
  },
  {
    titre: '9. Données personnelles',
    texte: `Le traitement de vos données personnelles est décrit dans notre Politique de confidentialité, accessible à l'adresse vigie-officiel.com/confidentialite.\n\nConformément au RGPD, vous disposez de droits d'accès, rectification, suppression et portabilité de vos données. Pour les exercer : vigie.officiel@gmail.com`,
  },
  {
    titre: '10. Modification des CGU',
    texte: `L'éditeur se réserve le droit de modifier les présentes CGU. Les modifications substantielles seront notifiées par email au moins 30 jours avant leur entrée en vigueur. La poursuite de l'utilisation du service après cette date vaut acceptation des nouvelles CGU.`,
  },
  {
    titre: '11. Droit applicable et litiges',
    texte: `Les présentes CGU sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux français seront compétents.\n\nConformément aux articles L.611-1 et suivants du Code de la consommation, vous pouvez recourir gratuitement à un médiateur de la consommation.`,
  },
];

export default function CGU() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily:"'DM Sans', 'Segoe UI', sans-serif", background:C.dark, color:C.text, minHeight:'100vh' }}>

      {/* Navbar */}
      <nav style={{ position:'sticky', top:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6%', height:64, background:'rgba(10,15,30,0.95)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${C.border}` }}>
        <button onClick={() => navigate('/')} style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:700, color:'#fff', background:'none', border:'none', cursor:'pointer' }}>
          Vigie<span style={{ color:C.blue, fontStyle:'italic' }}>Pro</span>
        </button>
        <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:`1px solid ${C.border}`, borderRadius:8, padding:'7px 14px', color:C.light, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          ← Retour
        </button>
      </nav>

      {/* En-tête */}
      <div style={{ padding:'60px 6% 40px', borderBottom:`1px solid ${C.border}`, background:'linear-gradient(135deg, rgba(91,163,199,0.05) 0%, transparent 60%)' }}>
        <div style={{ maxWidth:820, margin:'0 auto' }}>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.blue, display:'block', marginBottom:12 }}>Conditions d'utilisation</span>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(32px,4vw,48px)', fontWeight:700, color:'#F8FAFC', marginBottom:14, lineHeight:1.2 }}>
            Conditions Générales <em style={{ color:C.blue }}>d'Utilisation</em>
          </h1>
          <p style={{ fontSize:15, color:C.light, lineHeight:1.7, maxWidth:560 }}>
            En utilisant Vigie Pro, vous acceptez les présentes conditions. Merci de les lire attentivement.
          </p>
          <p style={{ fontSize:12, color:C.muted, marginTop:12 }}>
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth:820, margin:'0 auto', padding:'60px 6%' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {SECTIONS.map((section, i) => (
            <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'28px 32px' }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:700, color:'#fff', marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${C.border}` }}>
                {section.titre}
              </h2>
              <p style={{ fontSize:14, color:C.light, lineHeight:1.9, margin:0, whiteSpace:'pre-line' }}>
                {section.texte}
              </p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{ marginTop:40, padding:'28px 32px', background:'rgba(91,163,199,0.06)', border:'1px solid rgba(91,163,199,0.15)', borderRadius:14 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <p style={{ fontSize:15, fontWeight:700, color:'#fff', margin:'0 0 6px' }}>Une question sur les CGU ?</p>
              <p style={{ fontSize:13, color:C.light, margin:0, maxWidth:420 }}>Contactez-nous pour toute question relative aux présentes conditions d'utilisation.</p>
            </div>
            <a href="mailto:vigie.officiel@gmail.com?subject=Question CGU — Vigie Pro" style={{ padding:'10px 22px', borderRadius:8, background:`linear-gradient(135deg,${C.blue},#3d7fa8)`, color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>
              Nous contacter →
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:'24px 6%', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontWeight:700, color:C.light }}>
          Vigie<span style={{ color:C.blue, fontStyle:'italic' }}>Pro</span>
        </div>
        <div style={{ display:'flex', gap:20 }}>
          <button onClick={() => navigate('/')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:C.muted, fontFamily:'inherit' }}>Accueil</button>
          <button onClick={() => navigate('/mentions-legales')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:C.muted, fontFamily:'inherit' }}>Mentions légales</button>
          <button onClick={() => navigate('/confidentialite')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:C.muted, fontFamily:'inherit' }}>Confidentialité</button>
        </div>
        <div style={{ fontSize:12, color:C.muted }}>© 2026 Vigie Pro</div>
      </footer>
    </div>
  );
}
