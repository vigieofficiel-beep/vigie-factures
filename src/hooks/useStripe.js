import { useState } from 'react';
import { supabasePro } from '../lib/supabasePro';

/**
 * Hook useStripe
 * Gère le checkout et le portail client Stripe.
 *
 * Usage :
 *   const { startCheckout, openPortal, loading } = useStripe();
 *   <button onClick={() => startCheckout('pro')}>S'abonner Pro</button>
 *   <button onClick={openPortal}>Gérer mon abonnement</button>
 */
export function useStripe() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Lance le Checkout Stripe pour un plan donné
  const startCheckout = async (plan) => {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      if (!user) throw new Error('Non connecté');

      // Récupérer le stripe_customer_id si existant
      const { data: profil } = await supabasePro
        .from('user_profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      const res = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          userId:     user.id,
          userEmail:  user.email,
          customerId: profil?.stripe_customer_id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur checkout');

      // Redirection vers la page Stripe
      window.location.href = data.url;

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Ouvre le portail client Stripe (gérer CB, annuler, etc.)
  const openPortal = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      if (!user) throw new Error('Non connecté');

      const { data: profil } = await supabasePro
        .from('user_profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (!profil?.stripe_customer_id) {
        throw new Error('Aucun abonnement actif trouvé.');
      }

      const res = await fetch('/api/stripe/portal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: profil.stripe_customer_id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur portail');

      window.location.href = data.url;

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return { startCheckout, openPortal, loading, error };
}
