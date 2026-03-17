import { useState, useEffect, createContext, useContext } from 'react';
import { supabasePro } from '../lib/supabasePro';

// ─── Définition des plans et accès ───────────────────────────────────
export const PLANS = {
  gratuit:  { label: 'Gratuit',  color: '#9AA0AE', price: '0 €/mois'  },
  starter:  { label: 'Starter',  color: '#5BC78A', price: '29 €/mois' },
  pro:      { label: 'Pro',      color: '#5BA3C7', price: '49 €/mois' },
  premium:  { label: 'Premium',  color: '#A85BC7', price: '89 €/mois' },
};

// Modules et le plan minimum requis pour y accéder
export const MODULE_ACCESS = {
  // ── Gratuit ──────────────────────────────────────────
  tva:           'gratuit',
  charges:       'gratuit',
  devises:       'gratuit',
  rentabilite:   'gratuit',
  graphiques:    'gratuit',
  amortissement: 'gratuit',
  salaire:       'gratuit',
  seuil:         'gratuit',
  fiscal:        'gratuit',

  // ── Starter ──────────────────────────────────────────
  depenses:      'starter',
  recettes:      'starter',
  banque:        'starter',
  contrats:      'starter',
  formalites:    'starter',
  'mail-agent':  'starter',
  equipe:        'starter',
  pointages:     'starter',
  fournisseurs:  'starter',

  // ── Pro ──────────────────────────────────────────────
  documents:     'pro',
  exports:       'pro',
  factures:      'pro',  // VigieFacturesCore

  // ── Premium ──────────────────────────────────────────
  // (business plan et étude de marché à venir)
};

// Ordre des plans pour comparaison
const PLAN_ORDER = { gratuit: 0, starter: 1, pro: 2, premium: 3 };

// Vérifie si le plan de l'utilisateur donne accès à un module
export function hasAccess(userPlan, requiredPlan) {
  return PLAN_ORDER[userPlan] >= PLAN_ORDER[requiredPlan];
}

// ─── Context ─────────────────────────────────────────────────────────
const PlanContext = createContext({ plan: 'gratuit', loading: true });

export function PlanProvider({ children }) {
  const [plan,    setPlan]    = useState('gratuit');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchPlan = async () => {
      try {
        const { data: { user } } = await supabasePro.auth.getUser();
        if (!user || !mounted) { setLoading(false); return; }

        const { data } = await supabasePro
          .from('user_profiles')
          .select('plan')
          .eq('id', user.id)
          .single();

        if (mounted) {
          setPlan(data?.plan || 'gratuit');
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };

    fetchPlan();

    // Rafraîchir si l'auth change (ex: après paiement Stripe)
    const { data: sub } = supabasePro.auth.onAuthStateChange(() => {
      if (mounted) fetchPlan();
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <PlanContext.Provider value={{ plan, loading }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}
