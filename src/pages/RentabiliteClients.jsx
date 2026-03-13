import { useState, useEffect } from "react";
import { supabasePro } from "../lib/supabasePro";

const C = { blue:'#5BA3C7', purple:'#A85BC7', dark:'#1A1C20', light:'#9AA0AE', border:'#E8EAF0', red:'#C75B4E', orange:'#D4A853', green:'#5BC78A' };

function fmt(n) { return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0); }
function fmtPct(n) { return `${Math.round(n||0)}%`; }

function Badge({ val }) {
  const color = val >= 70 ? C.green : val >= 40 ? C.orange : C.red;
  const label = val >= 70 ? 'Excellent' : val >= 40 ? 'Moyen' : 'Faible';
  return (
    <span style={{ fontSize:10, fontWeight:700, background:`${color}15`, color, padding:'2px 8px', borderRadius:20 }}>
      {label}
    </span>
  );
}

function BarScore({ pct, color }) {
  return (
    <div style={{ height:6, background:'#F0F2F5', borderRadius:3, overflow:'hidden', marginTop:6 }}>
      <div style={{ width:`${Math.min(pct,100)}%`, height:'100%', background:color, borderRadius:3, transition:'width 0.6s ease' }}/>
    </div>
  );
}

export default function RentabiliteClients() {
  const [clients,   setClients]   = useState([]);
  const [devis,     setDevis]     = useState([]);
  const [depenses,  setDepenses]  = useState([]);
  const [charges,   setCharges]   = useState({}); // charges manuelles par client
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [tri,       setTri]       = useState('rentabilite'); // rentabilite | ca | marge

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabasePro.auth.getUser();
    if (!user) return;
    const [{ data: c }, { data: d }, { data: e }] = await Promise.all([
      supabasePro.from('clients').select('*').eq('user_id', user.id),
      supabasePro.from('devis').select('*, clients(nom)').eq('user_id', user.id).eq('statut', 'accepté'),
      supabasePro.from('expenses').select('amount_ttc, etablissement, notes, user_id').eq('user_id', user.id),
    ]);
    setClients(c || []);
    setDevis(d || []);
    setDepenses(e || []);
    setLoading(false);
  };

  // Calcul rentabilité par client
  const stats = clients.map(client => {
    const devisClient = devis.filter(d => d.client_id === client.id);
    const ca          = devisClient.reduce((s, d) => s + (d.montant_ht || 0), 0);
    const nbDevis     = devisClient.length;
    const chargesManuelles = parseFloat(charges[client.id] || 0);

    // Détection automatique des dépenses liées (établissement contient le nom du client)
    const depensesLiees = depenses.filter(e =>
      e.etablissement?.toLowerCase().includes(client.nom?.toLowerCase()) ||
      e.notes?.toLowerCase().includes(client.nom?.toLowerCase())
    );
    const coutsDirecs = depensesLiees.reduce((s, e) => s + (e.amount_ttc || 0), 0);
    const coutTotal   = coutsDirecs + chargesManuelles;
    const marge       = ca - coutTotal;
    const tauxMarge   = ca > 0 ? (marge / ca) * 100 : 0;
    const rentabilite = Math.min(Math.max(tauxMarge, 0), 100);

    return { client, ca, nbDevis, coutsDirecs, chargesManuelles, coutTotal, marge, tauxMarge, rentabilite };
  }).filter(s => s.ca > 0 || s.coutTotal > 0);

  const sorted = [...stats].sort((a, b) => {
    if (tri === 'rentabilite') return b.rentabilite - a.rentabilite;
    if (tri === 'ca')          return b.ca - a.ca;
    if (tri === 'marge')       return b.marge - a.marge;
    return 0;
  });

  const totalCA    = stats.reduce((s, x) => s + x.ca, 0);
  const totalMarge = stats.reduce((s, x) => s + x.marge, 0);
  const tauxGlobal = totalCA > 0 ? (totalMarge / totalCA) * 100 : 0;

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:1000, margin:'0 auto' }}>

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:C.dark, margin:0 }}>Rentabilité par client</h1>
        <p style={{ fontSize:13, color:C.light, marginTop:4 }}>Basé sur vos devis acceptés · ajoutez des charges manuelles pour affiner</p>
      </div>

      {/* KPIs globaux */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:14, marginBottom:28 }}>
        {[
          { label:'CA total', value:fmt(totalCA), color:C.blue },
          { label:'Marge totale', value:fmt(totalMarge), color:totalMarge>=0?C.green:C.red },
          { label:'Taux de marge global', value:fmtPct(tauxGlobal), color:tauxGlobal>=50?C.green:tauxGlobal>=30?C.orange:C.red },
          { label:'Clients analysés', value:stats.length, color:C.purple },
        ].map(k => (
          <div key={k.label} style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize:11, color:C.light, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>{k.label}</p>
            <p style={{ fontSize:22, fontWeight:700, color:k.color, margin:0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:48, color:C.light }}>Chargement...</div>
      ) : stats.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:48, textAlign:'center' }}>
          <p style={{ fontSize:32, marginBottom:12 }}>📊</p>
          <p style={{ color:C.light, fontSize:13 }}>Aucun devis accepté trouvé. Acceptez des devis dans Recettes pour voir la rentabilité.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap:20 }}>

          {/* Liste clients */}
          <div>
            {/* Tri */}
            <div style={{ display:'flex', gap:4, marginBottom:16, background:'#F0F2F5', borderRadius:10, padding:4, width:'fit-content' }}>
              {[['rentabilite','Rentabilité'],['ca','CA'],['marge','Marge']].map(([val,lab])=>(
                <button key={val} onClick={()=>setTri(val)} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:tri===val?'#fff':'transparent', color:tri===val?C.dark:C.light, fontSize:12, fontWeight:tri===val?700:500, cursor:'pointer', boxShadow:tri===val?'0 1px 3px rgba(0,0,0,0.08)':'none', transition:'all 150ms' }}>
                  {lab}
                </button>
              ))}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {sorted.map((s, i) => {
                const color = s.rentabilite >= 70 ? C.green : s.rentabilite >= 40 ? C.orange : C.red;
                const isSelected = selected?.client.id === s.client.id;
                return (
                  <div key={s.client.id} onClick={() => setSelected(isSelected ? null : s)}
                    style={{ background:'#fff', border:`1px solid ${isSelected ? C.blue : '#E8EAF0'}`, borderRadius:12, padding:'16px 20px', cursor:'pointer', boxShadow: isSelected ? `0 0 0 2px ${C.blue}30` : '0 1px 4px rgba(0,0,0,0.05)', transition:'all 150ms' }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#D0D8E8'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#E8EAF0'; }}>

                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      {/* Rang */}
                      <div style={{ width:32, height:32, borderRadius:'50%', background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:13, fontWeight:800, color }}>{i+1}</span>
                      </div>

                      {/* Infos client */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:14, fontWeight:700, color:C.dark }}>{s.client.nom}</span>
                          <Badge val={s.rentabilite}/>
                        </div>
                        <div style={{ display:'flex', gap:16, fontSize:12, color:C.light }}>
                          <span>CA : <strong style={{ color:C.dark }}>{fmt(s.ca)}</strong></span>
                          <span>Marge : <strong style={{ color: s.marge >= 0 ? C.green : C.red }}>{fmt(s.marge)}</strong></span>
                          <span>{s.nbDevis} devis</span>
                        </div>
                        <BarScore pct={s.rentabilite} color={color}/>
                      </div>

                      {/* Taux */}
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:24, fontWeight:800, color }}>{fmtPct(s.tauxMarge)}</div>
                        <div style={{ fontSize:10, color:C.light }}>de marge</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fiche détail */}
          {selected && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:22, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', position:'sticky', top:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                  <h3 style={{ fontSize:16, fontWeight:700, color:C.dark, margin:0 }}>{selected.client.nom}</h3>
                  <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer', color:C.light, fontSize:18 }}>×</button>
                </div>

                {/* Détail financier */}
                {[
                  { label:'Chiffre d\'affaires', value:fmt(selected.ca), color:C.blue, big:true },
                  { label:'Coûts directs détectés', value:`− ${fmt(selected.coutsDirecs)}`, color:C.red },
                  { label:'Charges manuelles', value:`− ${fmt(selected.chargesManuelles)}`, color:C.red },
                  { label:'Marge nette', value:fmt(selected.marge), color:selected.marge>=0?C.green:C.red, big:true },
                ].map(r => (
                  <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #F0F2F5' }}>
                    <span style={{ fontSize:13, color:'#5A6070' }}>{r.label}</span>
                    <span style={{ fontSize:r.big?17:13, fontWeight:r.big?800:600, color:r.color }}>{r.value}</span>
                  </div>
                ))}

                {/* Taux de marge visuel */}
                <div style={{ marginTop:16, padding:'14px', background:`${selected.rentabilite>=70?C.green:selected.rentabilite>=40?C.orange:C.red}08`, borderRadius:10, border:`1px solid ${selected.rentabilite>=70?C.green:selected.rentabilite>=40?C.orange:C.red}25` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:C.light, textTransform:'uppercase' }}>Taux de marge</span>
                    <span style={{ fontSize:20, fontWeight:800, color:selected.rentabilite>=70?C.green:selected.rentabilite>=40?C.orange:C.red }}>{fmtPct(selected.tauxMarge)}</span>
                  </div>
                  <BarScore pct={selected.rentabilite} color={selected.rentabilite>=70?C.green:selected.rentabilite>=40?C.orange:C.red}/>
                </div>

                {/* Charges manuelles */}
                <div style={{ marginTop:16 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:'#5A6070', marginBottom:6, display:'block', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    Ajouter des charges spécifiques (€)
                  </label>
                  <input type="number" value={charges[selected.client.id] || ''} placeholder="0"
                    onChange={e => {
                      setCharges(c => ({ ...c, [selected.client.id]: e.target.value }));
                      // Recalcul à la volée
                      const val = parseFloat(e.target.value) || 0;
                      setSelected(prev => {
                        const newCout = prev.coutsDirecs + val;
                        const newMarge = prev.ca - newCout;
                        const newTaux = prev.ca > 0 ? (newMarge / prev.ca) * 100 : 0;
                        return { ...prev, chargesManuelles:val, coutTotal:newCout, marge:newMarge, tauxMarge:newTaux, rentabilite:Math.min(Math.max(newTaux,0),100) };
                      });
                    }}
                    style={{ width:'100%', padding:'9px 12px', borderRadius:9, background:'#F8F9FB', border:'1px solid #E8EAF0', color:'#1A1C20', fontSize:14, outline:'none', boxSizing:'border-box' }}
                  />
                  <p style={{ fontSize:11, color:C.light, marginTop:6 }}>Ex: temps passé valorisé, frais déplacement, sous-traitance...</p>
                </div>

                {/* Conseil */}
                <div style={{ marginTop:14, background:'rgba(91,163,199,0.07)', border:'1px solid rgba(91,163,199,0.2)', borderRadius:9, padding:'11px 14px', fontSize:12, color:C.blue }}>
                  {selected.tauxMarge >= 70 ? '🌟 Client très rentable — priorité haute à maintenir.' :
                   selected.tauxMarge >= 40 ? '📈 Marge correcte — cherchez à réduire les coûts directs.' :
                   '⚠️ Marge faible — envisagez une révision tarifaire ou une réduction des charges.'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
