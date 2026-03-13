import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabasePro } from '../lib/supabasePro';

const FR_ERRORS = {
  'User already registered': 'Un compte existe déjà avec cet email.',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
  'Unable to validate email address: invalid format': "Format d'email invalide.",
  'Email rate limit exceeded': 'Trop de tentatives, réessayez dans quelques minutes.',
};
const toFr = (msg) => { if (!msg) return 'Une erreur est survenue.'; for (const [en, fr] of Object.entries(FR_ERRORS)) { if (msg.includes(en)) return fr; } return msg; };

/* ── Générateur de mot de passe ── */
function genererMdp(longueur = 16) {
  const maj = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const min = 'abcdefghijklmnopqrstuvwxyz';
  const chf = '0123456789';
  const sym = '!@#$%&*-_=+?';
  const pool = maj + min + chf + sym;
  let result = [
    maj[Math.floor(Math.random() * maj.length)],
    min[Math.floor(Math.random() * min.length)],
    chf[Math.floor(Math.random() * chf.length)],
    sym[Math.floor(Math.random() * sym.length)],
  ];
  while (result.length < longueur) result.push(pool[Math.floor(Math.random() * pool.length)]);
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i+1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result.join('');
}

function scoreMdp(mdp) {
  if (!mdp) return { pct:0, label:'', color:'transparent' };
  let s = 0;
  if (mdp.length >= 8)  s++;
  if (mdp.length >= 12) s++;
  if (/[A-Z]/.test(mdp)) s++;
  if (/[a-z]/.test(mdp)) s++;
  if (/[0-9]/.test(mdp)) s++;
  if (/[^A-Za-z0-9]/.test(mdp)) s++;
  if (s <= 2) return { pct:20,  label:'Très faible', color:'#C75B4E' };
  if (s <= 3) return { pct:40,  label:'Faible',      color:'#C75B4E' };
  if (s <= 4) return { pct:60,  label:'Moyen',       color:'#D4A853' };
  if (s <= 5) return { pct:80,  label:'Fort',        color:'#5BA3C7' };
  return              { pct:100, label:'Très fort',  color:'#5BC78A' };
}

export default function ProSignup() {
  const [form, setForm] = useState({ firstName:'', lastName:'', birthDate:'', city:'', email:'', password:'' });
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMdp, setShowMdp] = useState(false);
  const [copied,  setCopied]  = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    const { error } = await supabasePro.auth.signUp({
      email: form.email, password: form.password,
      options: { emailRedirectTo: `${window.location.origin}/perso`, data: { full_name:`${form.firstName} ${form.lastName}`, first_name:form.firstName, last_name:form.lastName, birth_date:form.birthDate, city:form.city } },
    });
    setLoading(false);
    if (error) setError(toFr(error.message)); else setSuccess(true);
  };

  const generer = () => {
    const mdp = genererMdp(16);
    setForm(f => ({ ...f, password: mdp }));
    setShowMdp(true);
    setCopied(false);
  };

  const copier = () => {
    navigator.clipboard.writeText(form.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const score = scoreMdp(form.password);

  const inputStyle = { width:'100%', padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#F8FAFC', fontSize:13, outline:'none', boxSizing:'border-box' };
  const labelStyle = { display:'block', fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:6 };

  if (success) return (
    <div style={{ minHeight:'100vh', background:'#0F172A', display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Nunito Sans', sans-serif" }}>
      <div style={{ background:'#1E293B', border:'1px solid rgba(91,199,138,0.2)', borderRadius:16, padding:'36px 40px', width:'100%', maxWidth:420, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:16 }}>✅</div>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, color:'#F8FAFC', marginBottom:12 }}>Compte Pro créé !</h2>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:24 }}>
          Un email de confirmation a été envoyé à <strong style={{ color:'#5BA3C7' }}>{form.email}</strong>. Cliquez sur le lien pour activer votre compte.
        </p>
        <Link to="/pro/login" style={{ display:'inline-block', padding:'10px 24px', borderRadius:10, background:'linear-gradient(135deg, #2563EB, #5BA3C7)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none' }}>
          Se connecter
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#0F172A', display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Nunito Sans', sans-serif" }}>
      <div style={{ background:'#1E293B', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'36px 40px', width:'100%', maxWidth:460 }}>

        <Link to="/" style={{ textDecoration:'none' }}>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:24, color:'#5BA3C7', marginBottom:4 }}>Vigie</h1>
        </Link>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:28 }}>
          Créez votre compte <span style={{ color:'#5BA3C7' }}>Pro</span> gratuitement
        </p>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label style={labelStyle}>Prénom</label><input type="text" value={form.firstName} onChange={set('firstName')} placeholder="Jean" required style={inputStyle}/></div>
            <div><label style={labelStyle}>Nom</label><input type="text" value={form.lastName} onChange={set('lastName')} placeholder="Dupont" required style={inputStyle}/></div>
          </div>

          <div><label style={labelStyle}>Date de naissance</label><input type="date" value={form.birthDate} onChange={set('birthDate')} required style={{ ...inputStyle, colorScheme:'dark' }}/></div>
          <div><label style={labelStyle}>Ville</label><input type="text" value={form.city} onChange={set('city')} placeholder="Paris" required style={inputStyle}/></div>
          <div><label style={labelStyle}>Courriel</label><input type="email" value={form.email} onChange={set('email')} placeholder="votre@email.fr" required style={inputStyle}/></div>

          {/* Mot de passe + générateur */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <label style={{ ...labelStyle, marginBottom:0 }}>Mot de passe</label>
              <button type="button" onClick={generer} style={{ background:'rgba(91,163,199,0.15)', border:'1px solid rgba(91,163,199,0.3)', borderRadius:6, padding:'3px 10px', color:'#5BA3C7', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                🔐 Générer
              </button>
            </div>
            <div style={{ position:'relative' }}>
              <input
                type={showMdp ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                required minLength={6}
                style={{ ...inputStyle, paddingRight: form.password ? 80 : 14, fontFamily: showMdp ? 'monospace' : 'inherit', letterSpacing: showMdp ? '0.05em' : 'normal' }}
              />
              <div style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', display:'flex', gap:4 }}>
                {form.password && (
                  <button type="button" onClick={copier} title="Copier" style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:14, padding:2 }}>
                    {copied ? '✓' : '📋'}
                  </button>
                )}
                <button type="button" onClick={() => setShowMdp(v => !v)} title={showMdp ? 'Masquer' : 'Afficher'} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:14, padding:2 }}>
                  {showMdp ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Barre de force */}
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

            {/* Conseil si mot de passe généré */}
            {showMdp && form.password && (
              <div style={{ marginTop:8, background:'rgba(91,163,199,0.08)', border:'1px solid rgba(91,163,199,0.2)', borderRadius:7, padding:'7px 10px', fontSize:11, color:'rgba(255,255,255,0.45)' }}>
                💡 Copiez ce mot de passe et conservez-le dans un endroit sûr avant de continuer.
              </div>
            )}
          </div>

          {error && <div style={{ color:'#C75B4E', fontSize:11, background:'rgba(199,91,78,0.1)', padding:'8px 12px', borderRadius:6 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:loading?'rgba(37,99,235,0.3)':'linear-gradient(135deg, #2563EB, #5BA3C7)', color:'#fff', fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', marginTop:4 }}>
            {loading ? 'Création...' : 'Créer mon compte Pro'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:20, fontSize:12, color:'rgba(255,255,255,0.35)' }}>
          Déjà inscrit ?{' '}<Link to="/pro/login" style={{ color:'#5BA3C7', textDecoration:'none' }}>Connexion</Link>
        </p>
      </div>
    </div>
  );
}
