import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabasePro } from '../lib/supabasePro';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase lit le hash #access_token dans l'URL et établit la session
    supabasePro.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Nettoyer le hash et rediriger vers le dashboard
        window.history.replaceState(null, '', '/pro/auth/callback');
        navigate('/pro', { replace: true });
      }
    });

    // Fallback : si la session est déjà là
    supabasePro.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate('/pro', { replace: true });
      }
    });
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
