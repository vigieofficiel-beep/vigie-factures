import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabasePro } from './lib/supabasePro';

export default function RequireAuthPro({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;

    supabasePro.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabasePro.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession ?? null);
      setLoading(false);
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
