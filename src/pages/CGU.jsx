import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function CGU() {
  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", background:'#F8FAFC', minHeight:'100vh', padding:'40px 20px' }}>
      <div style={{ maxWidth:760, margin:'0 auto' }}>

        <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#94A3B8', textDecoration:'none', marginBottom:32 }}>
          <ArrowLeft size={14}/> Retour à l'accueil
        </Link>

        <div style={{ marginBottom:40 }}>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:36, fontWeight:600, color:'#0F172A', margin:0 }}>
            Conditions Générales d'Utilisation
          </h1>
          <p style={{ fontSize:13, color:'#94A3B8', marginTop:8 }}>
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>

        {[
          {
            titre:'1. Objet',
            texte:`Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du service Vigie Pro, accessible à l'adresse vigie-officiel.com, édité par Narcisse Gaëtan (SIRET : 888 362 118 00026).\n\nEn accédant au service, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, vous devez cesser d'utiliser le service.`,
          },
          {
            titre:'2. Description du service',
            texte:`Vigie Pro est une application de pré-comptabilité en ligne destinée aux professionnels (auto-entrepreneurs, TPE, PME) permettant de :\n\n• Gérer les dépenses, recettes et factures\n• Générer des devis et factures PDF\n• Analyser l'activité financière\n• Accéder à des outils de simulation fiscale et sociale\n• Bénéficier d'alertes automatiques et d'un assistant IA (Vigil)\n\nVigie Pro est un outil de pré-comptabilité. Il ne remplace pas un expert-comptable et ne constitue pas un conseil juridique, fiscal ou comptable.`,
          },
          {
            titre:'3. Accès au service',
            texte:`L'accès au service nécessite la création d'un compte utilisateur avec une adresse email valide et un mot de passe. Vous êtes seul responsable de la confidentialité de vos identifiants.\n\nVigie Pro propose trois niveaux d'accès :\n• Plan Découverte (gratuit) : fonctionnalités limitées\n• Plan Pro (19 €/mois) : fonctionnalités complètes pour indépendants\n• Plan Premium (39 €/mois) : fonctionnalités avancées pour TPE/PME\n\nL'éditeur se réserve le droit de modifier les fonctionnalités incluses dans chaque plan, avec notification préalable aux utilisateurs concernés.`,
          },
          {
            titre:'4. Obligations de l\'utilisateur',
            texte:`En utilisant Vigie Pro, vous vous engagez à :\n\n• Fournir des informations exactes et à jour lors de l'inscription\n• Utiliser le service à des fins licites et professionnelles uniquement\n• Ne pas tenter de contourner les mesures de sécurité\n• Ne pas utiliser le service pour stocker des données de tiers sans leur consentement\n• Ne pas revendre ou redistribuer l'accès au service\n• Respecter les droits de propriété intellectuelle de l'éditeur`,
          },
          {
            titre:'5. Tarifs et facturation',
            texte:`Les plans payants sont facturés mensuellement, à terme échu, via Stripe Inc. Le paiement est automatiquement renouvelé chaque mois sauf résiliation.\n\nPrix TTC (TVA 20% incluse) :\n• Plan Pro : 19 € TTC/mois\n• Plan Premium : 39 € TTC/mois\n\nEn cas de non-paiement, l'accès aux fonctionnalités payantes sera suspendu après un délai de 7 jours. Aucun remboursement n'est accordé pour les périodes déjà facturées, sauf disposition légale contraire.`,
          },
          {
            titre:'6. Résiliation',
            texte:`Vous pouvez résilier votre abonnement à tout moment depuis votre espace "Mon compte". La résiliation prend effet à la fin de la période de facturation en cours.\n\nL'éditeur peut suspendre ou résilier votre accès en cas de violation des présentes CGU, avec ou sans préavis selon la gravité des manquements.`,
          },
          {
            titre:'7. Propriété intellectuelle',
            texte:`L'ensemble des éléments constituant Vigie Pro (code source, interface, marques, logos, contenus) est la propriété exclusive de l'éditeur et est protégé par le droit de la propriété intellectuelle.\n\nVos données (dépenses, recettes, documents) restent votre propriété. Vous accordez à l'éditeur une licence limitée pour les traiter dans le cadre de la fourniture du service.`,
          },
          {
            titre:'8. Limitation de responsabilité',
            texte:`Vigie Pro est fourni "en l'état". L'éditeur s'engage à maintenir le service disponible mais ne garantit pas une disponibilité ininterrompue.\n\nL'éditeur ne saurait être tenu responsable :\n• Des décisions prises sur la base des informations fournies par le service\n• Des erreurs de calcul résultant de données incorrectes saisies par l'utilisateur\n• Des pertes de données dues à un cas de force majeure\n• Du non-respect de vos obligations fiscales ou comptables\n\nEn tout état de cause, la responsabilité de l'éditeur est limitée au montant des sommes versées au cours des 3 derniers mois.`,
          },
          {
            titre:'9. Données personnelles',
            texte:`Le traitement de vos données personnelles est décrit dans notre Politique de confidentialité, accessible à l'adresse vigie-officiel.com/confidentialite.\n\nConformément au RGPD, vous disposez de droits d'accès, rectification, suppression et portabilité de vos données. Pour les exercer : vigie-officiel@gmail.com`,
          },
          {
            titre:'10. Modification des CGU',
            texte:`L'éditeur se réserve le droit de modifier les présentes CGU. Les modifications substantielles seront notifiées par email au moins 30 jours avant leur entrée en vigueur. La poursuite de l'utilisation du service après cette date vaut acceptation des nouvelles CGU.`,
          },
          {
            titre:'11. Droit applicable et litiges',
            texte:`Les présentes CGU sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux français seront compétents.\n\nConformément aux articles L.611-1 et suivants du Code de la consommation, vous pouvez recourir gratuitement à un médiateur de la consommation.`,
          },
        ].map((section, i) => (
          <div key={i} style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:'24px 28px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:'#0F172A', margin:'0 0 16px', paddingBottom:12, borderBottom:'1px solid #F0F2F5' }}>
              {section.titre}
            </h2>
            <p style={{ fontSize:13, color:'#5A6070', lineHeight:1.7, margin:0, whiteSpace:'pre-line' }}>{section.texte}</p>
          </div>
        ))}

        <p style={{ textAlign:'center', fontSize:12, color:'#CBD5E1', marginTop:32 }}>
          <Link to="/mentions-legales" style={{ color:'#94A3B8', textDecoration:'none' }}>Mentions légales</Link>
          {' · '}
          <Link to="/confidentialite" style={{ color:'#94A3B8', textDecoration:'none' }}>Politique de confidentialité</Link>
        </p>
      </div>
    </div>
  );
}
