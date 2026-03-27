import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabasePro } from './lib/supabasePro';

export default function RequireAuthPro({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;

    // Vérifier la session existante
    supabasePro.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    // FIX : écouter le retour OAuth Google (SIGNED_IN après redirect)
    const { data: sub } = supabasePro.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession ?? null);
      setLoading(false);

      // Nettoyer le hash OAuth de l'URL sans recharger la page
      if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) return null;
  if (!session) return <Navigate to="/pro/login" replace />;
  return children;
}
