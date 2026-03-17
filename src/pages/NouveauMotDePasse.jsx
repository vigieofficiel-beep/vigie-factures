import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabasePro } from './lib/supabasePro';

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

const iS = { width:'100%', padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#EDE8DB', fontSize:13, outline:'none', boxSizing:'border-box' };
const lS = { display:'block', fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:6 };

export default function NouveauMotDePasse() {
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState(null);
  const [success,         setSuccess]         = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [showMdp,         setShowMdp]         = useState(false);
  const navigate = useNavigate();
  const score = scoreMdp(password);
  const confirmOk  = confirmPassword && password === confirmPassword;
  const confirmErr = confirmPassword && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null);
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    setLoading(true);
    const { error } = await supabasePro.auth.updateUser({ password });
    setLoading(false);
    if (error) setError(error.message);
    else setSuccess(true);
  };

  if (success) return (
    <div style={{ minHeight:'100vh', background:'#0F172A', display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Nunito Sans', sans-serif" }}>
      <div style={{ background:'#1E293B', border:'1px solid rgba(91,199,138,0.2)', borderRadius:16, padding:'36px 40px', width:'100%', maxWidth:420, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:16 }}>✅</div>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, color:'#F8FAFC', marginBottom:12 }}>Mot de passe modifié !</h2>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.6, marginBottom:24 }}>
          Votre mot de passe a été mis à jour avec succès.
        </p>
        <button onClick={() => navigate('/pro/login')} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'linear-gradient(135deg, #2563EB, #5BA3C7)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          Se connecter
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#0F172A', display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Nunito Sans', sans-serif" }}>
      <div style={{ background:'#1E293B', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'36px 40px', width:'100%', maxWidth:420 }}>

        <Link to="/" style={{ textDecoration:'none' }}>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:24, color:'#5BA3C7', marginBottom:4 }}>Vigie</h1>
        </Link>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:28 }}>Créer un nouveau mot de passe</p>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <label style={{ ...lS, marginBottom:0 }}>Nouveau mot de passe</label>
              <button type="button" onClick={() => setShowMdp(v => !v)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'inherit' }}>
                {showMdp ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <input
              type={showMdp ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required minLength={6}
              style={{ ...iS, fontFamily: showMdp ? 'monospace' : 'inherit' }}
            />
            {password && (
              <div style={{ marginTop:8 }}>
                <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ width:`${score.pct}%`, height:'100%', background:score.color, borderRadius:2, transition:'width 0.3s ease' }}/>
                </div>
                <span style={{ fontSize:10, color:score.color, fontWeight:600, marginTop:4, display:'block' }}>{score.label}</span>
              </div>
            )}
          </div>

          <div>
            <label style={lS}>Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required minLength={6}
              style={{ ...iS, border: confirmOk ? '1px solid rgba(91,199,138,0.4)' : confirmErr ? '1px solid rgba(199,91,78,0.4)' : '1px solid rgba(255,255,255,0.08)' }}
            />
            {confirmOk  && <p style={{ fontSize:10, color:'#5BC78A', marginTop:4, fontWeight:600 }}>✓ Les mots de passe correspondent</p>}
            {confirmErr && <p style={{ fontSize:10, color:'#C75B4E', marginTop:4, fontWeight:600 }}>✗ Les mots de passe ne correspondent pas</p>}
          </div>

          {error && <div style={{ color:'#C75B4E', fontSize:11, background:'rgba(199,91,78,0.1)', padding:'8px 12px', borderRadius:6 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:loading?'rgba(37,99,235,0.3)':'linear-gradient(135deg, #2563EB, #5BA3C7)', color:'#fff', fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', marginTop:4 }}>
            {loading ? 'Mise à jour...' : 'Enregistrer le nouveau mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
