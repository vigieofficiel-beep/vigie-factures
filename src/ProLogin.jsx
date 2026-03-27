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

const iS = { width:'100%', padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#EDE8DB', fontSize:13, outline:'none', boxSizing:'border-box' };
const lS = { display:'block', fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:6 };

export default function ProLogin() {
  const [mode,     setMode]     = useState('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    const { error } = await supabasePro.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(translateError(error.message));
    else navigate('/pro', { replace: true });
  };

  const handleReset = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    const { error } = await supabasePro.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/pro/nouveau-mot-de-passe`,
    });
    setLoading(false);
    if (error) setError(translateError(error.message));
    else setSuccess(true);
  };

  const bg = (
    <>
      <div style={{ position:'fixed', inset:0, backgroundImage:'url(/hero-bg.jpg)', backgroundSize:'cover', backgroundPosition:'center 40%', zIndex:0 }}/>
      <div style={{ position:'fixed', inset:0, background:'rgba(6,8,11,0.78)', zIndex:1 }}/>
      <div style={{ position:'fixed', inset:0, zIndex:2, opacity:0.06, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`, backgroundRepeat:'repeat', backgroundSize:'128px', pointerEvents:'none' }}/>
    </>
  );

  if (success) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Nunito Sans', sans-serif", position:'relative' }}>
      {bg}
      <div style={{ position:'relative', zIndex:10, background:'rgba(15,23,42,0.85)', backdropFilter:'blur(20px)', border:'1px solid rgba(91,199,138,0.2)', borderRadius:20, padding:'36px 40px', width:'100%', maxWidth:420, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:16 }}>📧</div>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, color:'#F8FAFC', marginBottom:12 }}>Email envoyé !</h2>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:24 }}>
          Un lien de réinitialisation a été envoyé à <strong style={{ color:'#5BA3C7' }}>{email}</strong>.<br/>
          Vérifiez vos spams si vous ne le recevez pas.
        </p>
        <button onClick={() => { setMode('login'); setSuccess(false); }} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg, #2563EB, #5BA3C7)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
          Retour à la connexion
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', fontFamily:"'Nunito Sans', sans-serif", position:'relative' }}>
      {bg}

      <nav style={{ position:'relative', zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6%', height:64 }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <img src="/logo-vigie.png" alt="Vigie" style={{ height:32, width:'auto', objectFit:'contain' }} onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='block'; }}/>
          <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:700, color:'#EDE8DB', display:'none' }}>Vigie</span>
        </Link>
        <Link to="/pro/signup" style={{ padding:'8px 18px', borderRadius:8, background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none' }}>S'inscrire</Link>
      </nav>

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 16px 40px', position:'relative', zIndex:10 }}>
        <div style={{ background:'linear-gradient(135deg, rgba(91,163,199,0.1), rgba(91,163,199,0.04))', backdropFilter:'blur(24px)', border:'1px solid rgba(91,163,199,0.2)', borderRadius:20, padding:'36px 40px', width:'100%', maxWidth:420 }}>

          <Link to="/" style={{ textDecoration:'none' }}>
            <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:24, color:'#5BA3C7', marginBottom:4 }}>Vigie</h1>
          </Link>
          <p style={{ fontSize:13, color:'#5BA3C7', fontWeight:600, marginBottom:4 }}>Espace Pro</p>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:28 }}>
            {mode === 'login' ? 'Ravi de vous revoir !' : 'Réinitialiser votre mot de passe'}
          </p>

          {mode === 'login' && (
            <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={lS}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.fr" required style={iS}/>
              </div>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <label style={{ ...lS, marginBottom:0 }}>Mot de passe</label>
                  <button type="button" onClick={() => { setMode('reset'); setError(null); }}
                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'rgba(91,163,199,0.7)', fontFamily:'inherit' }}>
                    Mot de passe oublié ?
                  </button>
                </div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={iS}/>
              </div>
              {error && <div style={{ color:'#C75B4E', fontSize:11, background:'rgba(199,91,78,0.12)', padding:'8px 12px', borderRadius:6 }}>{error}</div>}
              <button type="submit" disabled={loading}
                style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:loading?'rgba(91,163,199,0.3)':'linear-gradient(135deg, #2563EB, #5BA3C7)', color:'#fff', fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', marginTop:4, fontFamily:'inherit' }}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
              <p style={{ textAlign:'center', marginTop:4, fontSize:12, color:'rgba(255,255,255,0.35)' }}>
                Pas encore de compte ?{' '}<Link to="/pro/signup" style={{ color:'#5BA3C7', textDecoration:'none' }}>Inscription</Link>
              </p>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleReset} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={lS}>Votre adresse email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.fr" required style={iS}/>
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', margin:0, lineHeight:1.6 }}>
                Nous vous enverrons un lien pour créer un nouveau mot de passe.
              </p>
              {error && <div style={{ color:'#C75B4E', fontSize:11, background:'rgba(199,91,78,0.12)', padding:'8px 12px', borderRadius:6 }}>{error}</div>}
              <button type="submit" disabled={loading}
                style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:loading?'rgba(91,163,199,0.3)':'linear-gradient(135deg, #2563EB, #5BA3C7)', color:'#fff', fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit' }}>
                {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
              </button>
              <button type="button" onClick={() => { setMode('login'); setError(null); }}
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'rgba(255,255,255,0.35)', fontFamily:'inherit' }}>
                ← Retour à la connexion
              </button>
            </form>
          )}

          <p style={{ textAlign:'center', marginTop:16, fontSize:12 }}>
            <Link to="/" style={{ color:'rgba(255,255,255,0.3)', textDecoration:'none' }}>← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
