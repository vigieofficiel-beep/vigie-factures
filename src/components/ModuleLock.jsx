import { useNavigate } from 'react-router-dom';
import { Lock, Zap, ArrowRight, CheckCircle, Loader } from 'lucide-react';
import { usePlan, hasAccess, PLANS, MODULE_ACCESS } from '../hooks/usePlan';
import { useStripe } from '../hooks/useStripe';

// Contenu affiché selon le plan requis
const UPGRADE_CONTENT = {
  starter: {
    icon: '📊',
    titre: 'Fonctionnalité Starter',
    description: 'Ce module est inclus dans le plan Starter et supérieurs.',
    avantages: [
      'Gestion des dépenses & notes de frais',
      'Suivi des recettes et devis clients',
      'Rapprochement bancaire',
      'Contrats & assurances avec alertes',
      'Formalités administratives',
    ],
    cta: 'Passer au Starter — 29 €/mois',
    color: '#5BC78A',
  },
  pro: {
    icon: '🤖',
    titre: 'Fonctionnalité Pro',
    description: 'Ce module est inclus dans le plan Pro et supérieurs.',
    avantages: [
      'Tout le plan Starter',
      'Générateur de factures & devis PDF',
      'Export FEC comptable',
      'Agent OCR reconnaissance de factures',
      'Détection d\'anomalies financières',
      'Alertes intelligentes TVA & contrats',
    ],
    cta: 'Passer au Pro — 49 €/mois',
    color: '#5BA3C7',
  },
  premium: {
    icon: '🚀',
    titre: 'Fonctionnalité Premium',
    description: 'Ce module est inclus dans le plan Premium.',
    avantages: [
      'Tout le plan Pro',
      'Business Plan généré par IA',
      'Étude de marché automatisée',
      'Multi-entreprises',
      'Support prioritaire',
    ],
    cta: 'Passer au Premium — 89 €/mois',
    color: '#A85BC7',
  },
};

/**
 * Enveloppe un module et affiche un écran de verrouillage
 * si l'utilisateur n'a pas le bon plan.
 *
 * Usage :
 *   <ModuleLock module="depenses">
 *     <DepensesPage />
 *   </ModuleLock>
 *
 * Ou directement avec un plan requis :
 *   <ModuleLock requiredPlan="pro">
 *     <DocumentsPage />
 *   </ModuleLock>
 */
export default function ModuleLock({ children, module, requiredPlan }) {
  const { plan, loading } = usePlan();
  const navigate = useNavigate();
  const { startCheckout, loading: stripeLoading, error: stripeError } = useStripe();

  // Déterminer le plan requis
  const needed = requiredPlan || MODULE_ACCESS[module] || 'gratuit';

  // Pendant le chargement, ne rien afficher (évite le flash)
  if (loading) return null;

  // Accès accordé → afficher le contenu normalement
  if (hasAccess(plan, needed)) return children;

  // Accès refusé → écran de verrouillage
  const content = UPGRADE_CONTENT[needed] || UPGRADE_CONTENT.starter;
  const planInfo = PLANS[needed];

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: "'Nunito Sans', sans-serif",
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '40px 36px',
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 4px 32px rgba(15,23,42,0.1)',
        border: `1px solid ${content.color}30`,
        textAlign: 'center',
      }}>

        {/* Icône cadenas */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: `${content.color}15`,
          border: `2px solid ${content.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Lock size={28} color={content.color} strokeWidth={2} />
        </div>

        {/* Badge plan */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: `${content.color}15`,
          border: `1px solid ${content.color}40`,
          borderRadius: 20, padding: '4px 14px',
          marginBottom: 16,
        }}>
          <Zap size={12} color={content.color} />
          <span style={{ fontSize: 12, fontWeight: 700, color: content.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Plan {planInfo?.label}
          </span>
        </div>

        {/* Titre */}
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 24, fontWeight: 700, color: '#1E293B',
          margin: '0 0 10px',
        }}>
          {content.titre}
        </h2>

        {/* Description */}
        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', lineHeight: 1.6 }}>
          {content.description}
          <br />
          <span style={{ fontWeight: 600, color: '#1E293B' }}>
            Votre plan actuel : {PLANS[plan]?.label || 'Gratuit'}
          </span>
        </p>

        {/* Avantages */}
        <div style={{
          background: '#F8FAFC', borderRadius: 12,
          padding: '16px 20px', marginBottom: 24,
          textAlign: 'left',
        }}>
          {content.avantages.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < content.avantages.length - 1 ? 10 : 0 }}>
              <CheckCircle size={14} color={content.color} strokeWidth={2.5} flexShrink={0} />
              <span style={{ fontSize: 13, color: '#475569' }}>{a}</span>
            </div>
          ))}
        </div>

        {/* Bouton upgrade direct Stripe */}
        <button
          onClick={() => startCheckout(needed)}
          disabled={stripeLoading}
          style={{
            width: '100%', padding: '14px 20px',
            borderRadius: 12, border: 'none',
            background: stripeLoading ? `${content.color}80` : `linear-gradient(135deg, ${content.color}, ${content.color}CC)`,
            color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: stripeLoading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: `0 4px 16px ${content.color}40`,
            fontFamily: "'Nunito Sans', sans-serif",
            marginBottom: 8,
            transition: 'transform 150ms ease, box-shadow 150ms ease',
          }}
          onMouseEnter={e => { if (!stripeLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {stripeLoading
            ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }}/> Redirection…</>
            : <>{content.cta} <ArrowRight size={16}/></>
          }
        </button>

        {stripeError && (
          <div style={{ fontSize: 12, color: '#C75B4E', textAlign: 'center', marginBottom: 8 }}>
            {stripeError}
          </div>
        )}

        {/* Lien voir les tarifs */}
        <button
          onClick={() => navigate('/tarifs')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#94A3B8', fontFamily: "'Nunito Sans', sans-serif", display: 'block', width: '100%', textAlign: 'center' }}
        >
          Voir tous les tarifs
        </button>
      {/* Lien retour */}
        <button
          onClick={() => navigate('/pro')}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#94A3B8', fontFamily:"'Nunito Sans', sans-serif", marginTop: 4 }}
        >
          ← Retour au bureau
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
