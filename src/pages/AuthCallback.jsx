import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabasePro } from '../lib/supabasePro';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Extraire le hash de l'URL (#access_token=...&refresh_token=...&type=...)
      const hash = window.location.hash;

      if (hash && hash.includes('access_token')) {
        // Laisser Supabase parser le hash et établir la session
        const { data, error } = await supabasePro.auth.getSession();

        if (error) {
          console.error('[AuthCallback] Erreur session:', error.message);
          navigate('/pro/login', { replace: true });
          return;
        }

        if (data.session) {
          window.history.replaceState(null, '', '/pro/auth/callback');
          navigate('/pro', { replace: true });
          return;
        }

        // Si getSession ne donne rien, écouter onAuthStateChange
        const { data: { subscription } } = supabasePro.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe();
            window.history.replaceState(null, '', '/pro/auth/callback');
            navigate('/pro', { replace: true });
          }
        });

        // Timeout de sécurité — si rien après 5s, rediriger vers login
        setTimeout(() => {
          subscription.unsubscribe();
          navigate('/pro/login', { replace: true });
        }, 5000);

      } else {
        // Pas de hash — vérifier si session existe déjà
        const { data } = await supabasePro.auth.getSession();
        if (data.session) {
          navigate('/pro', { replace: true });
        } else {
          navigate('/pro/login', { replace: true });
        }
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div style={{ minHeight:'100vh', background:'#08090C', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Nunito Sans', sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(91,163,199,0.2)', borderTop:'3px solid #5BA3C7', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
        <p style={{ fontSize:13, color:'rgba(237,232,219,0.4)' }}>Connexion en cours…</p>
      </div>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
