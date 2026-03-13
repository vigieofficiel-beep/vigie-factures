import { useState, useEffect, useCallback } from "react";

const C = { blue:'#5BA3C7', purple:'#A85BC7', dark:'#1A1C20', light:'#9AA0AE', border:'#E8EAF0', red:'#C75B4E', orange:'#D4A853', green:'#5BC78A' };

const DEVISES = [
  { code:'EUR', label:'Euro',                  flag:'🇪🇺' },
  { code:'USD', label:'Dollar américain',       flag:'🇺🇸' },
  { code:'GBP', label:'Livre sterling',         flag:'🇬🇧' },
  { code:'CHF', label:'Franc suisse',           flag:'🇨🇭' },
  { code:'JPY', label:'Yen japonais',           flag:'🇯🇵' },
  { code:'CAD', label:'Dollar canadien',        flag:'🇨🇦' },
  { code:'AUD', label:'Dollar australien',      flag:'🇦🇺' },
  { code:'CNY', label:'Yuan chinois',           flag:'🇨🇳' },
  { code:'MAD', label:'Dirham marocain',        flag:'🇲🇦' },
  { code:'TND', label:'Dinar tunisien',         flag:'🇹🇳' },
  { code:'DZD', label:'Dinar algérien',         flag:'🇩🇿' },
  { code:'XOF', label:'Franc CFA Ouest',        flag:'🌍' },
  { code:'BRL', label:'Real brésilien',         flag:'🇧🇷' },
  { code:'INR', label:'Roupie indienne',        flag:'🇮🇳' },
  { code:'MXN', label:'Peso mexicain',          flag:'🇲🇽' },
  { code:'SGD', label:'Dollar singapourien',    flag:'🇸🇬' },
  { code:'AED', label:'Dirham émirien',         flag:'🇦🇪' },
  { code:'TRY', label:'Livre turque',           flag:'🇹🇷' },
];

const iS = { width:'100%', padding:'10px 14px', borderRadius:9, background:'#F8F9FB', border:'1px solid #E8EAF0', color:'#1A1C20', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
const lS = { fontSize:11, fontWeight:700, color:'#5A6070', marginBottom:6, display:'block', textTransform:'uppercase', letterSpacing:'0.05em' };

function fmt(n, code) {
  if (!n && n !== 0) return '—';
  return new Intl.NumberFormat('fr-FR', { style:'currency', currency:code, maximumFractionDigits: ['JPY','XOF','DZD'].includes(code)?0:2 }).format(n);
}

export default function ConvertisseurDevises() {
  const [montant,    setMontant]    = useState('1000');
  const [de,         setDe]         = useState('EUR');
  const [vers,       setVers]       = useState('USD');
  const [taux,       setTaux]       = useState(null);
  const [tous,       setTous]       = useState(null); // tous les taux vs EUR
  const [loading,    setLoading]    = useState(false);
  const [erreur,     setErreur]     = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [mode,       setMode]       = useState('simple'); // simple | multi

  const fetchTaux = useCallback(async () => {
    setLoading(true); setErreur('');
    try {
      // API publique gratuite, aucune clé requise
      const res = await fetch('https://api.frankfurter.app/latest?base=EUR');
      if (!res.ok) throw new Error('Indisponible');
      const data = await res.json();
      // Ajouter EUR lui-même
      const rates = { ...data.rates, EUR: 1 };
      setTous(rates);
      setLastUpdate(new Date(data.date));
    } catch {
      setErreur('Impossible de récupérer les taux. Vérifiez votre connexion.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTaux(); }, [fetchTaux]);

  // Calcul taux entre deux devises quelconques via EUR comme pivot
  useEffect(() => {
    if (!tous) return;
    const rateDE   = tous[de]   || 1;
    const rateVERS = tous[vers] || 1;
    setTaux(rateVERS / rateDE);
  }, [de, vers, tous]);

  const m        = parseFloat(montant) || 0;
  const resultat = taux ? m * taux : null;

  const swap = () => { setDe(vers); setVers(de); };

  const deviseFmt = d => DEVISES.find(x => x.code === d) || { code:d, label:d, flag:'💱' };

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:900, margin:'0 auto' }}>

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:C.dark, margin:0 }}>Convertisseur de devises</h1>
        <p style={{ fontSize:13, color:C.light, marginTop:4 }}>
          Taux en temps réel · Banque centrale européenne
          {lastUpdate && <span style={{ marginLeft:8, color:C.blue }}>· Mis à jour le {lastUpdate.toLocaleDateString('fr-FR')}</span>}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:'#F0F2F5', borderRadius:10, padding:4, width:'fit-content' }}>
        {[['simple','Conversion simple'],['multi','Toutes les devises']].map(([val,lab])=>(
          <button key={val} onClick={()=>setMode(val)} style={{ padding:'8px 18px', borderRadius:8, border:'none', background:mode===val?'#fff':'transparent', color:mode===val?C.dark:C.light, fontSize:13, fontWeight:mode===val?700:500, cursor:'pointer', boxShadow:mode===val?'0 1px 3px rgba(0,0,0,0.08)':'none', transition:'all 150ms' }}>
            {lab}
          </button>
        ))}
      </div>

      {erreur && (
        <div style={{ background:'rgba(199,91,78,0.07)', border:'1px solid rgba(199,91,78,0.25)', borderRadius:12, padding:'12px 16px', fontSize:13, color:C.red, marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          {erreur}
          <button onClick={fetchTaux} style={{ background:'none', border:'none', cursor:'pointer', color:C.red, fontWeight:700, fontSize:12 }}>Réessayer</button>
        </div>
      )}

      {mode === 'simple' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

          {/* Saisie */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:24, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <label style={lS}>Montant</label>
              <input type="number" value={montant} onChange={e=>setMontant(e.target.value)} placeholder="0" min="0" step="1"
                style={{ ...iS, fontSize:22, fontWeight:700, textAlign:'right', color:C.blue }} />
            </div>

            <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:24, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
              <label style={lS}>De</label>
              <select value={de} onChange={e=>setDe(e.target.value)} style={{ ...iS, cursor:'pointer', marginBottom:16 }}>
                {DEVISES.map(d=><option key={d.code} value={d.code}>{d.flag} {d.code} — {d.label}</option>)}
              </select>

              {/* Bouton swap */}
              <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
                <button onClick={swap} style={{ background:`${C.blue}12`, border:`1px solid ${C.blue}30`, borderRadius:50, padding:'8px 20px', cursor:'pointer', fontSize:13, color:C.blue, fontWeight:700, display:'flex', alignItems:'center', gap:6, transition:'all 150ms' }}
                  onMouseEnter={e=>e.currentTarget.style.background=`${C.blue}22`}
                  onMouseLeave={e=>e.currentTarget.style.background=`${C.blue}12`}>
                  ⇅ Inverser
                </button>
              </div>

              <label style={lS}>Vers</label>
              <select value={vers} onChange={e=>setVers(e.target.value)} style={{ ...iS, cursor:'pointer' }}>
                {DEVISES.map(d=><option key={d.code} value={d.code}>{d.flag} {d.code} — {d.label}</option>)}
              </select>
            </div>

            <button onClick={fetchTaux} disabled={loading} style={{ padding:'11px', borderRadius:10, border:'none', background:C.blue, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity:loading?0.6:1 }}>
              {loading ? '⏳ Actualisation...' : '🔄 Actualiser les taux'}
            </button>
          </div>

          {/* Résultat */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            <div style={{ background:`linear-gradient(135deg, ${C.blue}08, ${C.purple}08)`, border:`1px solid ${C.blue}30`, borderRadius:14, padding:28, boxShadow:'0 1px 6px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em' }}>Résultat</div>

              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 0', borderBottom:'1px solid #F0F2F5' }}>
                <span style={{ fontSize:28 }}>{deviseFmt(de).flag}</span>
                <div>
                  <div style={{ fontSize:13, color:C.light }}>{deviseFmt(de).label}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:C.dark }}>{fmt(m, de)}</div>
                </div>
              </div>

              <div style={{ fontSize:28, textAlign:'center', color:C.light }}>↓</div>

              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 0' }}>
                <span style={{ fontSize:28 }}>{deviseFmt(vers).flag}</span>
                <div>
                  <div style={{ fontSize:13, color:C.light }}>{deviseFmt(vers).label}</div>
                  <div style={{ fontSize:30, fontWeight:800, color:C.blue }}>
                    {loading ? '...' : resultat != null ? fmt(resultat, vers) : '—'}
                  </div>
                </div>
              </div>

              {taux && (
                <div style={{ background:'rgba(91,163,199,0.08)', borderRadius:9, padding:'10px 14px', fontSize:12, color:C.blue, fontWeight:600, textAlign:'center' }}>
                  1 {de} = {taux.toFixed(4)} {vers}
                  <span style={{ margin:'0 8px', color:C.light }}>·</span>
                  1 {vers} = {(1/taux).toFixed(4)} {de}
                </div>
              )}
            </div>

            {/* Conversions rapides */}
            {taux && (
              <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:20, boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14 }}>Conversions rapides</div>
                {[100, 500, 1000, 5000, 10000].map(val => (
                  <div key={val} onClick={() => setMontant(String(val))} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', borderRadius:8, marginBottom:4, cursor:'pointer', background:m===val?`${C.blue}08`:'transparent', transition:'background 150ms' }}
                    onMouseEnter={e=>e.currentTarget.style.background=`${C.blue}08`}
                    onMouseLeave={e=>e.currentTarget.style.background=m===val?`${C.blue}08`:'transparent'}>
                    <span style={{ fontSize:13, color:'#5A6070' }}>{fmt(val, de)}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:C.blue }}>{fmt(val * taux, vers)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode multi — tableau de toutes les devises */}
      {mode === 'multi' && tous && (
        <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #F0F2F5', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <div>
              <label style={{ ...lS, marginBottom:4 }}>Montant de base</label>
              <input type="number" value={montant} onChange={e=>setMontant(e.target.value)} style={{ ...iS, width:140 }} />
            </div>
            <div>
              <label style={{ ...lS, marginBottom:4 }}>Devise de base</label>
              <select value={de} onChange={e=>setDe(e.target.value)} style={{ ...iS, width:200, cursor:'pointer' }}>
                {DEVISES.map(d=><option key={d.code} value={d.code}>{d.flag} {d.code} — {d.label}</option>)}
              </select>
            </div>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #F0F2F5' }}>
                {['Devise','Taux','Équivalent'].map(h=>(
                  <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEVISES.filter(d => d.code !== de).map(d => {
                const rateDE   = tous[de]     || 1;
                const rateVERS = tous[d.code] || 1;
                const t = rateVERS / rateDE;
                const equiv = m * t;
                return (
                  <tr key={d.code} style={{ borderBottom:'1px solid #F8F9FB' }}
                    onMouseEnter={ev=>ev.currentTarget.style.background='#FAFBFC'}
                    onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'11px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:20 }}>{d.flag}</span>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:C.dark }}>{d.code}</div>
                          <div style={{ fontSize:11, color:C.light }}>{d.label}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'11px 16px', fontSize:12, color:'#5A6070' }}>1 {de} = {t.toFixed(4)} {d.code}</td>
                    <td style={{ padding:'11px 16px', fontSize:14, fontWeight:700, color:C.blue }}>{fmt(equiv, d.code)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding:'12px 16px', fontSize:11, color:C.light, borderTop:'1px solid #F0F2F5', textAlign:'right' }}>
            📊 Taux BCE via Frankfurter API · {lastUpdate?.toLocaleDateString('fr-FR')}
          </div>
        </div>
      )}

      {mode === 'multi' && loading && (
        <div style={{ textAlign:'center', padding:40, color:C.light, fontSize:13 }}>Chargement des taux...</div>
      )}
    </div>
  );
}
