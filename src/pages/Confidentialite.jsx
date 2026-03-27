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
    title: "1. Responsable du traitement",
    content: `Le responsable du traitement des données personnelles collectées via Vigie Pro est :

• Nom : Lucien Doppler
• Forme juridique : Auto-entrepreneur
• SIRET : 888 362 118 00026
• Email : vigie-officiel@gmail.com
• Adresse : France`
  },
  {
    title: "2. Données collectées",
    content: `Vigie Pro collecte uniquement les données nécessaires à la fourniture du service :

Données d'identification
• Nom, prénom, adresse email
• Nom de l'entreprise (optionnel)

Données d'utilisation
• Transactions financières saisies (dépenses, recettes, factures)
• Documents uploadés (justificatifs, relevés bancaires)
• Données collaborateurs et fournisseurs saisies par l'utilisateur
• Journaux de connexion et d'utilisation (à des fins de sécurité)

Données de paiement
• Aucune donnée bancaire n'est stockée par Vigie Pro. Les paiements sont intégralement traités par Stripe Inc. Vigie Pro ne reçoit qu'un identifiant de transaction anonymisé.`
  },
  {
    title: "3. Finalités du traitement",
    content: `Les données collectées sont utilisées exclusivement pour :

• Fournir et améliorer le service Vigie Pro
• Gérer votre compte et votre abonnement
• Vous envoyer des notifications relatives au service (alertes, rappels)
• Assurer la sécurité et prévenir les fraudes
• Répondre à vos demandes de support
• Respecter nos obligations légales

Vigie Pro ne vend, ne loue et ne cède jamais vos données à des tiers à des fins commerciales.`
  },
  {
    title: "4. Base légale du traitement",
    content: `Les traitements de données personnelles effectués par Vigie Pro reposent sur les bases légales suivantes (article 6 du RGPD) :

• Exécution du contrat : traitement nécessaire à la fourniture du service souscrit
• Intérêt légitime : sécurité du service, prévention des fraudes
• Obligation légale : conservation des données comptables conformément au droit français`
  },
  {
    title: "5. Durée de conservation",
    content: `Vos données sont conservées pendant les durées suivantes :

• Données de compte : durée de l'abonnement + 3 ans après résiliation
• Données comptables et financières : 10 ans (obligation légale — article L.123-22 du Code de commerce)
• Documents uploadés : durée de l'abonnement + 1 an
• Journaux de connexion : 12 mois
• Données de contact (formulaire) : 3 ans

À l'expiration de ces délais, vos données sont supprimées ou anonymisées de manière irréversible.`
  },
  {
    title: "6. Hébergement et transfert des données",
    content: `Vos données sont hébergées sur des serveurs situés en Europe :

• Base de données & fichiers : Supabase Inc. — serveurs Frankfurt (Allemagne, UE)
• Authentification : Supabase Auth — chiffrement AES-256
• Emails transactionnels : Resend Inc. — les emails sont envoyés depuis des serveurs certifiés
• Paiements : Stripe Inc. — certifié PCI DSS niveau 1

Aucun transfert de données hors de l'Espace Économique Européen (EEE) n'est effectué sans garanties appropriées.`
  },
  {
    title: "7. Vos droits (RGPD)",
    content: `Conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679), vous disposez des droits suivants :

• Droit d'accès : obtenir une copie de vos données personnelles
• Droit de rectification : corriger des données inexactes ou incomplètes
• Droit à l'effacement : demander la suppression de vos données (sous réserve des obligations légales de conservation)
• Droit à la portabilité : recevoir vos données dans un format structuré et lisible
• Droit d'opposition : vous opposer à certains traitements
• Droit à la limitation : demander la limitation du traitement dans certains cas

Pour exercer ces droits, contactez-nous à : vigie-officiel@gmail.com

Nous nous engageons à répondre à toute demande dans un délai maximum de 30 jours. En cas de réponse insatisfaisante, vous pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr).`
  },
  {
    title: "8. Sécurité des données",
    content: `Vigie Pro met en œuvre les mesures techniques et organisationnelles suivantes pour protéger vos données :

• Chiffrement TLS/HTTPS pour toutes les communications
• Chiffrement AES-256 des données au repos
• Isolation des données par utilisateur via Row Level Security (RLS) Supabase
• Authentification sécurisée avec gestion des sessions
• Accès aux données restreint au strict nécessaire
• Sauvegardes automatiques quotidiennes

En cas de violation de données susceptible de vous affecter, vous serez notifié dans les 72 heures conformément au RGPD.`
  },
  {
    title: "9. Cookies et traceurs",
    content: `Vigie Pro utilise uniquement des cookies strictement nécessaires au fonctionnement du service :

• Cookie de session : maintien de votre connexion
• Cookie de préférences : mémorisation de vos paramètres d'interface

Aucun cookie publicitaire ou de tracking tiers n'est utilisé. Aucune régie publicitaire n'a accès à vos données.`
  },
  {
    title: "10. Modifications de la politique",
    content: `Cette politique de confidentialité peut être mise à jour pour refléter les évolutions légales ou les changements du service. Toute modification substantielle vous sera notifiée par email ou notification dans l'application.

Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
  },
];

export default function Confidentialite() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: C.dark, color: C.text, minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6%', height: 64, background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => navigate('/')} style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
          Vigie<span style={{ color: C.blue, fontStyle: 'italic' }}>Pro</span>
        </button>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 14px', color: C.light, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          ← Retour
        </button>
      </nav>

      {/* En-tête */}
      <div style={{ padding: '60px 6% 40px', borderBottom: `1px solid ${C.border}`, background: 'linear-gradient(135deg, rgba(91,199,138,0.05) 0%, transparent 60%)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.green, display: 'block', marginBottom: 12 }}>Protection des données</span>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px,4vw,48px)', fontWeight: 700, color: '#F8FAFC', marginBottom: 14, lineHeight: 1.2 }}>
            Politique de <em style={{ color: C.green }}>confidentialité</em>
          </h1>
          <p style={{ fontSize: 15, color: C.light, lineHeight: 1.7, maxWidth: 560 }}>
            Vigie Pro s'engage à protéger vos données personnelles. Cette politique décrit comment nous collectons, utilisons et protégeons vos informations, conformément au RGPD.
          </p>

          {/* Badges RGPD */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            {[
              { icon: '🇪🇺', label: 'Données hébergées en Europe' },
              { icon: '🔒', label: 'Chiffrement AES-256' },
              { icon: '🚫', label: 'Zéro publicité' },
              { icon: '✅', label: 'Conforme RGPD' },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(91,199,138,0.08)', border: '1px solid rgba(91,199,138,0.2)', borderRadius: 20, padding: '5px 12px' }}>
                <span style={{ fontSize: 13 }}>{icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>{label}</span>
              </div>
            ))}
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
                      <span style={{ background: 'rgba(212,168,83,0.15)', color: '#5BC78A', borderRadius: 4, padding: '1px 6px', fontSize: 12, fontWeight: 700 }}>{placeholder}</span>
                      {rest}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Droits RGPD - CTA */}
        <div style={{ marginTop: 40, padding: '28px 32px', background: 'rgba(91,199,138,0.06)', border: '1px solid rgba(91,199,138,0.15)', borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Exercer vos droits RGPD</p>
              <p style={{ fontSize: 13, color: C.light, margin: 0, maxWidth: 420 }}>Pour toute demande d'accès, rectification, suppression ou portabilité de vos données, contactez-nous directement.</p>
            </div>
            <a href="mailto:vigie-officiel@gmail.com?subject=Demande RGPD — Vigie Pro" style={{ padding: '10px 22px', borderRadius: 8, background: 'linear-gradient(135deg,#5BC78A,#3da86a)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Exercer mes droits →
            </a>
          </div>
        </div>

        {/* Lien CNIL */}
        <div style={{ marginTop: 16, padding: '16px 24px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>🏛️</span>
          <div>
            <p style={{ fontSize: 13, color: C.light, margin: 0 }}>
              En cas de réponse insatisfaisante, vous pouvez introduire une réclamation auprès de la{' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: C.blue, textDecoration: 'none', fontWeight: 600 }}>CNIL (www.cnil.fr)</a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '24px 6%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 700, color: C.light }}>
          Vigie<span style={{ color: C.blue, fontStyle: 'italic' }}>Pro</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.muted, fontFamily: 'inherit' }}>Accueil</button>
          <button onClick={() => navigate('/mentions-legales')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.muted, fontFamily: 'inherit' }}>Mentions légales</button>
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>© 2026 Vigie Pro</div>
      </footer>
    </div>
  );
}
