import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSuccess(true);
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#0E0D0B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "'Nunito Sans', sans-serif" }}>
        <div style={{ background: '#161513', border: '1px solid rgba(91,199,138,0.2)', borderRadius: 16, padding: '36px 40px', width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: '#EDE8DB', marginBottom: 12 }}>Compte créé !</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 24 }}>
            Un email de confirmation vous a été envoyé à <strong style={{ color: '#D4A853' }}>{email}</strong>. Cliquez sur le lien pour activer votre compte.
          </p>
          <Link to="/login" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #D4A853, #C78A5B)', color: '#0E0D0B', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0E0D0B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "'Nunito Sans', sans-serif" }}>
      <div style={{ background: '#161513', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '36px 40px', width: '100%', maxWidth: 420 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: '#D4A853', marginBottom: 4 }}>Vigie</h1>
        </Link>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 28 }}>Créez votre compte gratuitement</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Nom complet</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jean Dupont" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#EDE8DB', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.fr" required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#EDE8DB', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#EDE8DB', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {error && <div style={{ color: '#C75B4E', fontSize: 11, background: 'rgba(199,91,78,0.1)', padding: '8px 12px', borderRadius: 6 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: loading ? 'rgba(212,168,83,0.3)' : 'linear-gradient(135deg, #D4A853, #C78A5B)', color: '#0E0D0B', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          Déjà inscrit ?{' '}
          <Link to="/login" style={{ color: '#D4A853', textDecoration: 'none' }}>Connexion</Link>
        </p>
      </div>
    </div>
  );
}