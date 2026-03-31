import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabasePro } from '../lib/supabasePro';

const FR_ERRORS = {
  'User already registered': 'Un compte existe déjà avec cet email.',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
  'Unable to validate email address: invalid format': "Format d'email invalide.",
  'Email rate limit exceeded': 'Trop de tentatives, réessayez dans quelques minutes.',
};
const toFr = (msg) => { if (!msg) return 'Une erreur est survenue.'; for (const [en, fr] of Object.entries(FR_ERRORS)) { if (msg.includes(en)) return fr; } return msg; };

function genererMdp(longueur = 16) {
  const maj = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', min = 'abcdefghijklmnopqrstuvwxyz', chf = '0123456789', sym = '!@#$%&*-_=+?';
  const pool = maj + min + chf + sym;
  let result = [maj[Math.floor(Math.random()*maj.length)], min[Math.floor(Math.random()*min.length)], chf[Math.floor(Math.random()*chf.length)], sym[Math.floor(Math.random()*sym.length)]];
  while (result.length < longueur) result.push(pool[Math.floor(Math.random()*pool.length)]);
  for (let i = result.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result.join('');
}

function scoreMdp(mdp) {
  if (!mdp) return { pct:0, label:'', color:'transparent' };
  let s = 0;
  if (mdp.length >= 8) s++; if (mdp.length >= 12) s++;
  if (/[A-Z]/.test(mdp)) s++; if (/[a-z]/.test(mdp)) s++;
  if (/[0-9]/.test(mdp)) s++; if (/[^A-Za-z0-9]/.test(mdp)) s++;
  if (s <= 2) return { pct:20,  label:'Très faible', color:'#C75B4E' };
  if (s <= 3) return { pct:40,  label:'Faible',      color:'#C75B4E' };
  if (s <= 4) return { pct:60,  label:'Moyen',       color:'#5BC78A' };
  if (s <= 5) return { pct:80,  label:'Fort',        color:'#5BA3C7' };
  return              { pct:100, label:'Très fort',  color:'#5BC78A' };
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function ProSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName:'', lastName:'', birthDate:'', city:'', email:'', password:'', confirmPassword:'' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showMdp, setShowMdp] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // FIX : redirectTo vers /pro/auth/callback pour que AuthCallback gère la session
  const handleGoogle = async () => {
    setGoogleLoading(true); setError(null);
    const { error } = await supabasePro.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/pro/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) { setError(toFr(error.message)); setGoogleLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null);
    if (form.password !== form.confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    const { error } = await supabasePro.auth.signUp({
      email: form.email, password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/pro/auth/callback`,
        data: { full_name:`${form.firstName} ${form.lastName}`, first_name:form.firstName, last_name:form.lastName, birth_date:form.birthDate, city:form.city },
      },
    });
    setLoading(false);
    if (error) { setError(toFr(error.message)); return; }
    try {
      await fetch('/api/notify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, firstName: form.firstName, lastName: form.lastName, city: form.city }),
      });
    } catch (_) {}
    setSuccess(true);
  };

  const generer = () => { const mdp = genererMdp(16); setForm(f => ({ ...f, password:mdp, confirmPassword:mdp })); setShowMdp(true); setShowConfirm(true); setCopied(false); };
  const copier  = () => { navigator.clipboard.writeText(form.password); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const score = scoreMdp(form.password);
  const confirmOk  = form.confirmPassword && form.password === form.confirmPassword;
  const confirmErr = form.confirmPassword && form.password !== form.confirmPassword;

  const inputStyle = { width:'100%', padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#F8FAFC', fontSize:13, outline:'none', boxSizing:'border-box' };
  const labelStyle = { display:'block', fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:6 };

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
        <div style={{ fontSize:40, marginBottom:16 }}>✅</div>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, color:'#F8FAFC', marginBottom:12 }}>Compte Pro créé !</h2>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:24 }}>
          Un email de confirmation a été envoyé à <strong style={{ color:'#5BA3C7' }}>{form.email}</strong>.<br/>Cliquez sur le lien pour activer votre compte.
        </p>
        <Link to="/pro/login" style={{ display:'inline-block', padding:'10px 24px', borderRadius:10, background:'linear-gradient(135deg, #2563EB, #5BA3C7)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none' }}>Se connecter</Link>
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
        <Link to="/pro/login" style={{ padding:'8px 18px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', color:'rgba(237,232,219,0.7)', fontSize:13, fontWeight:600, textDecoration:'none', backdropFilter:'blur(8px)', background:'rgba(255,255,255,0.04)' }}>Connexion</Link>
      </nav>

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 16px 40px', position:'relative', zIndex:10 }}>
        <div style={{ background:'linear-gradient(135deg, rgba(91,163,199,0.1), rgba(91,163,199,0.04))', backdropFilter:'blur(24px)', border:'1px solid rgba(91,163,199,0.2)', borderRadius:20, padding:'36px 40px', width:'100%', maxWidth:460 }}>

          <Link to="/" style={{ textDecoration:'none' }}>
            <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:24, color:'#5BA3C7', marginBottom:4 }}>Vigie</h1>
          </Link>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:24 }}>Créez votre compte <span style={{ color:'#5BA3C7' }}>Pro</span> gratuitement</p>

          <button onClick={handleGoogle} disabled={googleLoading}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'11px 16px', borderRadius:10, marginBottom:16, background:googleLoading?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.14)', color:'#F8FAFC', fontSize:13, fontWeight:600, cursor:googleLoading?'wait':'pointer', fontFamily:"'Nunito Sans', sans-serif", transition:'all 150ms ease' }}
            onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.background='rgba(255,255,255,0.13)'; }}
            onMouseLeave={e => { e.currentTarget.style.background=googleLoading?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.08)'; }}>
            {googleLoading ? <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>Redirection vers Google…</span> : <><GoogleIcon /> S'inscrire avec Google</>}
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }}/>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)', whiteSpace:'nowrap' }}>ou avec email</span>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }}/>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label style={labelStyle}>Prénom</label><input type="text" value={form.firstName} onChange={set('firstName')} placeholder="Jean" required style={inputStyle}/></div>
              <div><label style={labelStyle}>Nom</label><input type="text" value={form.lastName} onChange={set('lastName')} placeholder="Dupont" required style={inputStyle}/></div>
            </div>
            <div><label style={labelStyle}>Date de naissance</label><input type="date" value={form.birthDate} onChange={set('birthDate')} required style={{ ...inputStyle, colorScheme:'dark' }}/></div>
            <div><label style={labelStyle}>Ville</label><input type="text" value={form.city} onChange={set('city')} placeholder="Paris" required style={inputStyle}/></div>
            <div><label style={labelStyle}>Courriel</label><input type="email" value={form.email} onChange={set('email')} placeholder="votre@email.fr" required style={inputStyle}/></div>

            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <label style={{ ...labelStyle, marginBottom:0 }}>Mot de passe</label>
                <button type="button" onClick={generer} style={{ background:'rgba(91,163,199,0.15)', border:'1px solid rgba(91,163,199,0.3)', borderRadius:6, padding:'3px 10px', color:'#5BA3C7', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>🔐 Générer</button>
              </div>
              <div style={{ position:'relative' }}>
                <input type={showMdp?'text':'password'} value={form.password} onChange={set('password')} placeholder="••••••••" required minLength={6} style={{ ...inputStyle, paddingRight:form.password?80:14, fontFamily:showMdp?'monospace':'inherit', letterSpacing:showMdp?'0.05em':'normal' }}/>
                <div style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', display:'flex', gap:4 }}>
                  {form.password && <button type="button" onClick={copier} title="Copier" style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:14, padding:2 }}>{copied?'✓':'📋'}</button>}
                  <button type="button" onClick={() => setShowMdp(v => !v)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:14, padding:2 }}>{showMdp?'🙈':'👁️'}</button>
                </div>
              </div>
              {form.password && (
                <div style={{ marginTop:8 }}>
                  <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ width:`${score.pct}%`, height:'100%', background:score.color, borderRadius:2, transition:'width 0.3s ease' }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                    <span style={{ fontSize:10, color:score.color, fontWeight:600 }}>{score.label}</span>
                    {copied && <span style={{ fontSize:10, color:'#5BC78A', fontWeight:600 }}>✓ Copié !</span>}
                  </div>
                </div>
              )}
              {showMdp && form.password && (
                <div style={{ marginTop:8, background:'rgba(91,163,199,0.08)', border:'1px solid rgba(91,163,199,0.2)', borderRadius:7, padding:'7px 10px', fontSize:11, color:'rgba(255,255,255,0.45)' }}>
                  💡 Copiez ce mot de passe et conservez-le dans un endroit sûr avant de continuer.
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Confirmer le mot de passe</label>
              <div style={{ position:'relative' }}>
                <input type={showConfirm?'text':'password'} value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••" required minLength={6}
                  style={{ ...inputStyle, paddingRight:40, border:confirmOk?'1px solid rgba(91,199,138,0.4)':confirmErr?'1px solid rgba(199,91,78,0.4)':'1px solid rgba(255,255,255,0.1)', fontFamily:showConfirm?'monospace':'inherit', letterSpacing:showConfirm?'0.05em':'normal' }}/>
                <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:14, padding:2 }}>{showConfirm?'🙈':'👁️'}</button>
              </div>
              {confirmOk  && <p style={{ fontSize:10, color:'#5BC78A', marginTop:4, fontWeight:600 }}>✓ Les mots de passe correspondent</p>}
              {confirmErr && <p style={{ fontSize:10, color:'#C75B4E', marginTop:4, fontWeight:600 }}>✗ Les mots de passe ne correspondent pas</p>}
            </div>

            {error && <div style={{ color:'#C75B4E', fontSize:11, background:'rgba(199,91,78,0.12)', padding:'8px 12px', borderRadius:6 }}>{error}</div>}

            <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:loading?'rgba(37,99,235,0.3)':'linear-gradient(135deg, #2563EB, #5BA3C7)', color:'#fff', fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', marginTop:4, fontFamily:'inherit' }}>
              {loading ? 'Création...' : 'Créer mon compte Pro'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:20, fontSize:12, color:'rgba(255,255,255,0.35)' }}>
            Déjà inscrit ?{' '}<Link to="/pro/login" style={{ color:'#5BA3C7', textDecoration:'none' }}>Connexion</Link>
          </p>
          <p style={{ textAlign:'center', marginTop:8, fontSize:12 }}>
            <Link to="/" style={{ color:'rgba(255,255,255,0.3)', textDecoration:'none' }}>← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
