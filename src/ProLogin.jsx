import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabasePro } from './lib/supabasePro';
function translateError(msg) {
  if (!msg) return 'Une erreur est survenue.';
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (msg.includes('Email not confirmed')) return 'Veuillez confirmer votre email avant de vous connecter.';
  if (msg.includes('Too many requests')) return 'Trop de tentatives. Réessayez dans quelques minutes.';
  if (msg.includes('User not found')) return 'Aucun compte trouvé avec cet email.';
  if (msg.includes('Invalid email')) return 'Adresse email invalide.';
  if (msg.includes('Password should be')) return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (msg.includes('network')) return 'Erreur réseau. Vérifiez votre connexion.';
  return 'Une erreur est survenue. Veuillez réessayer.';
}

export default function ProLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabasePro.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(translateError(error.message));
    else navigate('/pro', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0E0D0B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "'Nunito Sans', sans-serif" }}>
      <div style={{ background: '#161513', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '36px 40px', width: '100%', maxWidth: 420 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: '#5BA3C7', marginBottom: 4 }}>Vigie</h1>
        </Link>
        <p style={{ fontSize: 13, color: '#5BA3C7', fontWeight: 600, marginBottom: 4 }}>Espace Pro</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 28 }}>Ravi de vous revoir !</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.fr" required
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#EDE8DB', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#EDE8DB', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {error && (
            <div style={{ color: '#C75B4E', fontSize: 11, background: 'rgba(199,91,78,0.1)', padding: '8px 12px', borderRadius: 6 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: loading ? 'rgba(91,163,199,0.3)' : 'linear-gradient(135deg, #2563EB, #5BA3C7)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          Pas encore de compte ?{' '}
          <Link to="/pro/signup" style={{ color: '#5BA3C7', textDecoration: 'none' }}>Inscription</Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>← Retour à la page d'accueil Vigie </Link>
        </p>
      </div>
    </div>
  );
}
