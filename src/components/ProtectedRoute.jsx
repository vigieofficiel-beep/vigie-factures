import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: '#0E0D0B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4A853' }}>
        Chargement...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}