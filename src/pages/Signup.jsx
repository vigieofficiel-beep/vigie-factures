import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
const FR_ERRORS = {
  'User already registered': 'Un compte existe déjà avec cet email.',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
  'Unable to validate email address: invalid format': "Format d'email invalide.",
  'Email rate limit exceeded': 'Trop de tentatives, réessayez dans quelques minutes.',
};

const toFr = (msg) => {
  if (!msg) return 'Une erreur est survenue.';
  for (const [en, fr] of Object.entries(FR_ERRORS)) {
    if (msg.includes(en)) return fr;
  }
  return msg;
};
export default function Signup() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', birthDate: '', city: '', email: '', password: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
options: {
  emailRedirectTo: `${window.location.origin}/perso`,
   data: {
          full_name: `${form.firstName} ${form.lastName}`,
          first_name: form.firstName,
          last_name: form.lastName,
          birth_date: form.birthDate,
          city: form.city,
        },
      },
    });
    setLoading(false);
if (error) setError(toFr(error.message));
    else setSuccess(true);
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#EDE8DB', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#0E0D0B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "'Nunito Sans', sans-serif" }}>
        <div style={{ background: '#161513', border: '1px solid rgba(91,199,138,0.2)', borderRadius: 16, padding: '36px 40px', width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: '#EDE8DB', marginBottom: 12 }}>Compte créé !</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 24 }}>
            Un email de confirmation a été envoyé à <strong style={{ color: '#D4A853' }}>{form.email}</strong>. Cliquez sur le lien pour activer votre compte.
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
      <div style={{ background: '#161513', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '36px 40px', width: '100%', maxWidth: 460 }}>

        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: '#D4A853', marginBottom: 4 }}>Vigie</h1>
        </Link>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 28 }}>
          Créez votre compte <span style={{ color: '#D4A853' }}>Perso</span> gratuitement
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Prénom + Nom */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Prénom</label>
              <input type="text" value={form.firstName} onChange={set('firstName')} placeholder="Jean" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Nom</label>
              <input type="text" value={form.lastName} onChange={set('lastName')} placeholder="Dupont" required style={inputStyle} />
            </div>
          </div>

          {/* Date de naissance */}
          <div>
            <label style={labelStyle}>Date de naissance</label>
            <input type="date" value={form.birthDate} onChange={set('birthDate')} required style={{ ...inputStyle, colorScheme: 'dark' }} />
          </div>

          {/* Ville */}
          <div>
            <label style={labelStyle}>Ville</label>
            <input type="text" value={form.city} onChange={set('city')} placeholder="Paris" required style={inputStyle} />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Courriel</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="votre@email.fr" required style={inputStyle} />
          </div>

          {/* Mot de passe */}
          <div>
            <label style={labelStyle}>Mot de passe</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required minLength={6} style={inputStyle} />
          </div>

          {error && (
            <div style={{ color: '#C75B4E', fontSize: 11, background: 'rgba(199,91,78,0.1)', padding: '8px 12px', borderRadius: 6 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            background: loading ? 'rgba(212,168,83,0.3)' : 'linear-gradient(135deg, #D4A853, #C78A5B)',
            color: '#0E0D0B', fontSize: 14, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
          }}>
            {loading ? 'Création...' : 'Créer mon compte Perso'}
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
