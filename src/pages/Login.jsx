import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else navigate('/app');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0E0D0B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "'Nunito Sans', sans-serif" }}>
      <div style={{ background: '#161513', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '36px 40px', width: '100%', maxWidth: 420 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: '#D4A853', marginBottom: 4 }}>Vigie</h1>
        </Link>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 28 }}>Ravi de vous revoir !</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.fr" required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#EDE8DB', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#EDE8DB', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {error && <div style={{ color: '#C75B4E', fontSize: 11, background: 'rgba(199,91,78,0.1)', padding: '8px 12px', borderRadius: 6 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: loading ? 'rgba(212,168,83,0.3)' : 'linear-gradient(135deg, #D4A853, #C78A5B)', color: '#0E0D0B', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          Pas encore de compte ?{' '}
          <Link to="/signup" style={{ color: '#D4A853', textDecoration: 'none' }}>Inscription</Link>
        </p>
      </div>
    </div>
  );
}