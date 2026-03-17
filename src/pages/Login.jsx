import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

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

const iS = { width:'100%', padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#EDE8DB', fontSize:13, outline:'none', boxSizing:'border-box' };
const lS = { display:'block', fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:6 };

export default function Login() {
  const [mode,     setMode]     = useState('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(translateError(error.message));
    else navigate('/perso', { replace: true });
  };

  const handleReset = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nouveau-mot-de-passe`,
    });
    setLoading(false);
    if (error) setError(translateError(error.message));
    else setSuccess(true);
  };

  if (success) return (
    <div style={{ minHeight:'100vh', background:'#0E0D0B', display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Nunito Sans', sans-serif" }}>
      <div style={{ background:'#161513', border:'1px solid rgba(91,199,138,0.2)', borderRadius:16, padding:'36px 40px', width:'100%', maxWidth:420, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:16 }}>📧</div>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, color:'#EDE8DB', marginBottom:12 }}>Email envoyé !</h2>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:24 }}>
          Un lien de réinitialisation a été envoyé à <strong style={{ color:'#5BC78A' }}>{email}</strong>.<br/>
          Vérifiez vos spams si vous ne le recevez pas.
        </p>
        <button onClick={() => { setMode('login'); setSuccess(false); }} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg, #5BC78A, #3da86a)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          Retour à la connexion
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#0E0D0B', display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Nunito Sans', sans-serif" }}>
      <div style={{ background:'#161513', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'36px 40px', width:'100%', maxWidth:420 }}>

        <Link to="/" style={{ textDecoration:'none' }}>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:24, color:'#5BC78A', marginBottom:4 }}>Vigie</h1>
        </Link>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:28 }}>
          {mode === 'login' ? 'Ravi de vous revoir !' : 'Réinitialiser votre mot de passe'}
        </p>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={lS}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.fr" required style={iS}/>
            </div>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <label style={{ ...lS, marginBottom:0 }}>Mot de passe</label>
                <button type="button" onClick={() => { setMode('reset'); setError(null); }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'rgba(91,199,138,0.7)', fontFamily:'inherit' }}>
                  Mot de passe oublié ?
                </button>
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={iS}/>
            </div>

            {error && <div style={{ color:'#C75B4E', fontSize:11, background:'rgba(199,91,78,0.1)', padding:'8px 12px', borderRadius:6 }}>{error}</div>}

            <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:loading?'rgba(91,199,138,0.3)':'linear-gradient(135deg, #5BC78A, #3da86a)', color:'#fff', fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', marginTop:8 }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={lS}>Votre adresse email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.fr" required style={iS}/>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', margin:0, lineHeight:1.6 }}>
              Nous vous enverrons un lien pour créer un nouveau mot de passe.
            </p>

            {error && <div style={{ color:'#C75B4E', fontSize:11, background:'rgba(199,91,78,0.1)', padding:'8px 12px', borderRadius:6 }}>{error}</div>}

            <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:loading?'rgba(91,199,138,0.3)':'linear-gradient(135deg, #5BC78A, #3da86a)', color:'#fff', fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer' }}>
              {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
            </button>

            <button type="button" onClick={() => { setMode('login'); setError(null); }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'rgba(255,255,255,0.35)', fontFamily:'inherit' }}>
              ← Retour à la connexion
            </button>
          </form>
        )}

        {mode === 'login' && (
          <p style={{ textAlign:'center', marginTop:20, fontSize:12, color:'rgba(255,255,255,0.35)' }}>
            Pas encore de compte ?{' '}
            <Link to="/signup" style={{ color:'#5BC78A', textDecoration:'none' }}>Inscription</Link>
          </p>
        )}
      </div>
    </div>
  );
}
