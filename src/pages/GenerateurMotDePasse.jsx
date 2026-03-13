import { useState, useCallback } from "react";

const C = { blue:'#5BA3C7', purple:'#A85BC7', dark:'#1A1C20', light:'#9AA0AE', border:'#E8EAF0', red:'#C75B4E', orange:'#D4A853', green:'#5BC78A' };

const PRESETS = [
  { label:'Simple',    longueur:12, majuscules:true,  minuscules:true,  chiffres:true,  symboles:false },
  { label:'Fort',      longueur:16, majuscules:true,  minuscules:true,  chiffres:true,  symboles:true  },
  { label:'Très fort', longueur:24, majuscules:true,  minuscules:true,  chiffres:true,  symboles:true  },
  { label:'PIN',       longueur:6,  majuscules:false, minuscules:false, chiffres:true,  symboles:false },
];

const CHARS = {
  majuscules : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  minuscules : 'abcdefghijklmnopqrstuvwxyz',
  chiffres   : '0123456789',
  symboles   : '!@#$%^&*()-_=+[]{}|;:,.<>?',
};

function generer(options) {
  const { longueur, majuscules, minuscules, chiffres, symboles } = options;
  let pool = '';
  if (majuscules) pool += CHARS.majuscules;
  if (minuscules) pool += CHARS.minuscules;
  if (chiffres)   pool += CHARS.chiffres;
  if (symboles)   pool += CHARS.symboles;
  if (!pool) return '';

  // Garantir au moins 1 char de chaque type activé
  let result = [];
  if (majuscules) result.push(CHARS.majuscules[Math.floor(Math.random() * CHARS.majuscules.length)]);
  if (minuscules) result.push(CHARS.minuscules[Math.floor(Math.random() * CHARS.minuscules.length)]);
  if (chiffres)   result.push(CHARS.chiffres[Math.floor(Math.random() * CHARS.chiffres.length)]);
  if (symboles)   result.push(CHARS.symboles[Math.floor(Math.random() * CHARS.symboles.length)]);

  while (result.length < longueur) {
    result.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  // Mélanger
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.slice(0, longueur).join('');
}

function scorer(mdp) {
  if (!mdp) return { score: 0, label: '—', color: C.light };
  let score = 0;
  if (mdp.length >= 8)  score++;
  if (mdp.length >= 12) score++;
  if (mdp.length >= 16) score++;
  if (/[A-Z]/.test(mdp)) score++;
  if (/[a-z]/.test(mdp)) score++;
  if (/[0-9]/.test(mdp)) score++;
  if (/[^A-Za-z0-9]/.test(mdp)) score++;
  if (score <= 2) return { score, label: 'Très faible', color: C.red,    pct: 15  };
  if (score <= 3) return { score, label: 'Faible',      color: C.red,    pct: 30  };
  if (score <= 4) return { score, label: 'Moyen',       color: C.orange, pct: 55  };
  if (score <= 5) return { score, label: 'Fort',        color: C.blue,   pct: 75  };
  return              { score, label: 'Très fort',   color: C.green,  pct: 100 };
}

const iS = { width:'100%', padding:'10px 14px', borderRadius:9, background:'#F8F9FB', border:'1px solid #E8EAF0', color:'#1A1C20', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
const lS = { fontSize:11, fontWeight:700, color:'#5A6070', marginBottom:6, display:'block', textTransform:'uppercase', letterSpacing:'0.05em' };

function Toggle({ label, value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', borderRadius:10, border:`1px solid ${value ? C.blue : '#E8EAF0'}`, background: value ? `${C.blue}08` : '#F8F9FB', cursor:'pointer', transition:'all 150ms', marginBottom:8 }}>
      <span style={{ fontSize:13, color: value ? C.blue : C.light, fontWeight: value ? 600 : 400 }}>{label}</span>
      <div style={{ width:36, height:20, borderRadius:10, background: value ? C.blue : '#D0D4DC', position:'relative', transition:'background 200ms', flexShrink:0 }}>
        <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: value ? 18 : 2, transition:'left 200ms', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
      </div>
    </div>
  );
}

export default function GenerateurMotDePasse() {
  const [options, setOptions] = useState({ longueur:16, majuscules:true, minuscules:true, chiffres:true, symboles:true });
  const [mdp,      setMdp]     = useState('');
  const [historique, setHistorique] = useState([]);
  const [copied,   setCopied]  = useState(false);
  const [analyser, setAnalyser] = useState('');
  const set = k => v => setOptions(o => ({ ...o, [k]: v }));

  const genererNouv = useCallback(() => {
    const nouveau = generer(options);
    setMdp(nouveau);
    setCopied(false);
    if (nouveau) setHistorique(h => [nouveau, ...h].slice(0, 8));
  }, [options]);

  const copier = (texte) => {
    navigator.clipboard.writeText(texte);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const score   = scorer(mdp);
  const scoreA  = scorer(analyser);

  // Colorier les caractères du mot de passe
  const colorierMdp = (texte) => texte.split('').map((c, i) => {
    let color = C.dark;
    if (/[A-Z]/.test(c)) color = C.blue;
    else if (/[0-9]/.test(c)) color = C.orange;
    else if (/[^A-Za-z0-9]/.test(c)) color = C.purple;
    return <span key={i} style={{ color, fontWeight: /[^A-Za-z0-9]/.test(c) ? 700 : 400 }}>{c}</span>;
  });

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:900, margin:'0 auto' }}>

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:C.dark, margin:0 }}>Générateur de mots de passe</h1>
        <p style={{ fontSize:13, color:C.light, marginTop:4 }}>Créez des mots de passe sécurisés · aucune donnée transmise</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Colonne gauche — Options */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Présets */}
          <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>Préréglages</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => { setOptions({ longueur:p.longueur, majuscules:p.majuscules, minuscules:p.minuscules, chiffres:p.chiffres, symboles:p.symboles }); }}
                  style={{ padding:'9px', borderRadius:9, border:'1px solid #E8EAF0', background:'#F8F9FB', color:C.dark, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 150ms' }}
                  onMouseEnter={e=>{ e.currentTarget.style.background=`${C.blue}10`; e.currentTarget.style.borderColor=C.blue; e.currentTarget.style.color=C.blue; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='#F8F9FB'; e.currentTarget.style.borderColor='#E8EAF0'; e.currentTarget.style.color=C.dark; }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>Longueur : {options.longueur} caractères</label>
            <input type="range" min={6} max={64} value={options.longueur} onChange={e => set('longueur')(Number(e.target.value))}
              style={{ width:'100%', marginBottom:16, accentColor:C.blue }} />
            <Toggle label="Majuscules (A-Z)"  value={options.majuscules} onChange={set('majuscules')} />
            <Toggle label="Minuscules (a-z)"  value={options.minuscules} onChange={set('minuscules')} />
            <Toggle label="Chiffres (0-9)"    value={options.chiffres}   onChange={set('chiffres')}   />
            <Toggle label="Symboles (!@#...)" value={options.symboles}   onChange={set('symboles')}   />
          </div>

          {/* Analyser un mot de passe existant */}
          <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <label style={lS}>Analyser un mot de passe existant</label>
            <input type="password" value={analyser} onChange={e => setAnalyser(e.target.value)} placeholder="Collez votre mot de passe..." style={iS} />
            {analyser && (
              <div style={{ marginTop:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:12, color:C.light }}>Niveau de sécurité</span>
                  <span style={{ fontSize:13, fontWeight:700, color:scoreA.color }}>{scoreA.label}</span>
                </div>
                <div style={{ height:8, background:'#F0F2F5', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ width:`${scoreA.pct}%`, height:'100%', background:scoreA.color, borderRadius:4, transition:'width 0.4s ease' }}/>
                </div>
                <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, fontSize:11, color:C.light }}>
                  {[
                    ['Longueur', `${analyser.length} car.`, analyser.length >= 12],
                    ['Majuscules', /[A-Z]/.test(analyser) ? '✓' : '✗', /[A-Z]/.test(analyser)],
                    ['Chiffres', /[0-9]/.test(analyser) ? '✓' : '✗', /[0-9]/.test(analyser)],
                    ['Symboles', /[^A-Za-z0-9]/.test(analyser) ? '✓' : '✗', /[^A-Za-z0-9]/.test(analyser)],
                  ].map(([label, val, ok]) => (
                    <div key={label} style={{ background: ok ? 'rgba(91,188,138,0.08)' : 'rgba(199,91,78,0.06)', border:`1px solid ${ok ? 'rgba(91,188,138,0.2)' : 'rgba(199,91,78,0.15)'}`, borderRadius:7, padding:'6px 10px' }}>
                      <span style={{ color: ok ? C.green : C.red, fontWeight:600 }}>{label}</span>
                      <span style={{ float:'right', color: ok ? C.green : C.red }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite — Résultat */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Bouton générer */}
          <button onClick={genererNouv} style={{ padding:'16px', borderRadius:12, border:'none', background:`linear-gradient(135deg, ${C.blue}, ${C.purple})`, color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer', boxShadow:`0 4px 16px ${C.blue}40`, transition:'transform 100ms, box-shadow 100ms', letterSpacing:'0.02em' }}
            onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=`0 6px 20px ${C.blue}50`; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 4px 16px ${C.blue}40`; }}>
            🔐 Générer un mot de passe
          </button>

          {/* Résultat */}
          {mdp && (
            <div style={{ background:`linear-gradient(135deg, ${C.blue}06, ${C.purple}06)`, border:`1px solid ${C.blue}25`, borderRadius:14, padding:22, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Mot de passe généré</div>

              {/* Affichage coloré */}
              <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:10, padding:'14px 16px', fontFamily:'monospace', fontSize:18, letterSpacing:'0.08em', marginBottom:14, wordBreak:'break-all', lineHeight:1.6 }}>
                {colorierMdp(mdp)}
              </div>

              {/* Score */}
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:12, color:C.light }}>Niveau de sécurité</span>
                  <span style={{ fontSize:13, fontWeight:700, color:score.color }}>{score.label}</span>
                </div>
                <div style={{ height:8, background:'#F0F2F5', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ width:`${score.pct}%`, height:'100%', background:score.color, borderRadius:4, transition:'width 0.4s ease' }}/>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => copier(mdp)} style={{ flex:1, padding:'10px', borderRadius:9, border:'none', background: copied ? C.green : C.blue, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', transition:'background 200ms' }}>
                  {copied ? '✓ Copié !' : '📋 Copier'}
                </button>
                <button onClick={genererNouv} style={{ padding:'10px 14px', borderRadius:9, border:'1px solid #E8EAF0', background:'#fff', color:C.light, fontSize:13, cursor:'pointer' }}>
                  🔄
                </button>
              </div>

              {/* Légende couleurs */}
              <div style={{ marginTop:12, display:'flex', gap:12, flexWrap:'wrap', fontSize:11, color:C.light }}>
                <span style={{ color:C.blue }}>■ Majuscules</span>
                <span style={{ color:C.dark }}>■ Minuscules</span>
                <span style={{ color:C.orange }}>■ Chiffres</span>
                <span style={{ color:C.purple }}>■ Symboles</span>
              </div>
            </div>
          )}

          {/* Historique */}
          {historique.length > 1 && (
            <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Historique (session)</div>
              {historique.slice(1).map((h, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #F8F9FB' }}>
                  <span style={{ fontFamily:'monospace', fontSize:12, color:'#5A6070', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h}</span>
                  <button onClick={() => copier(h)} style={{ background:'none', border:'1px solid #E8EAF0', borderRadius:6, padding:'3px 8px', cursor:'pointer', fontSize:11, color:C.light, flexShrink:0 }}>Copier</button>
                </div>
              ))}
              <p style={{ fontSize:10, color:C.light, margin:'10px 0 0', textAlign:'center' }}>Effacé à la fermeture de l'onglet</p>
            </div>
          )}

          {/* Conseils sécurité */}
          <div style={{ background:'rgba(91,163,199,0.06)', border:'1px solid rgba(91,163,199,0.2)', borderRadius:14, padding:18 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.blue, marginBottom:10 }}>💡 Bonnes pratiques</div>
            {[
              'Utilisez un mot de passe unique par service',
              'Minimum 12 caractères avec symboles',
              'Stockez-les dans un gestionnaire (Bitwarden, 1Password)',
              'Activez la double authentification partout',
            ].map((c, i) => (
              <div key={i} style={{ fontSize:12, color:'#5A6070', padding:'4px 0', display:'flex', gap:6 }}>
                <span style={{ color:C.blue }}>→</span> {c}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
