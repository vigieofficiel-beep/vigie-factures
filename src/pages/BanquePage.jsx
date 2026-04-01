import { useState, useEffect, useRef, useMemo } from 'react';
import { supabasePro } from '../lib/supabasePro';
import { Upload, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, RefreshCw, X, BarChart2, Calendar, ArrowUp, ArrowDown, Edit2, ExternalLink } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import ExportButton from '../components/ExportButton';
import DateFilter from '../components/DateFilter';
import Tooltip from '../components/Tooltip';
import { TIPS } from '../utils/tooltips';
import { useWorkspace } from '../hooks/useWorkspace.jsx';

const ACCENT = '#5BA3C7';
const VERT   = '#5BC78A';
const ROUGE  = '#C75B4E';
const MOIS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

const formatEuro = (n) => n == null ? '—' : new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR' }).format(n);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '—';

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/[;,]/).map(c => c.replace(/"/g, '').trim());
    if (cols.length < 3) continue;
    const date    = cols[0] || '';
    const libelle = cols[1] || cols[2] || '';
    const montant = parseFloat((cols[2] || cols[3] || '0').replace(',', '.').replace(/\s/g, '')) || 0;
    if (!date || !libelle) continue;
    results.push({ date:normalizeDate(date), libelle:libelle.substring(0,200), montant, type:montant>=0?'credit':'debit', statut:'non_rapproche', rapproche:false });
  }
  return results;
}

function normalizeDate(str) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parts = str.split('/');
  if (parts.length === 3) { const [d,m,y] = parts; return `${y.length===2?'20'+y:y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`; }
  return str;
}

function StatutBadge({ rapproche }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:rapproche?'rgba(91,199,138,0.1)':'rgba(212,168,83,0.1)', color:rapproche?VERT:'#D4A853', fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20 }}>
      {rapproche ? <><CheckCircle size={10}/> Rapproché</> : <><AlertTriangle size={10}/> À rapprocher</>}
    </span>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(15,23,42,0.95)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <div style={{ fontWeight:700, color:'#EDE8DB', marginBottom:6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:16, color:p.color, marginBottom:2 }}>
          <span>{p.name}</span><span style={{ fontWeight:700 }}>{formatEuro(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function calculerPrevision(transactions, horizon) {
  if (!transactions.length) return [];
  const parMois = {};
  transactions.forEach(t => {
    if (!t.date) return;
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`;
    if (!parMois[key]) parMois[key] = { credits:0, debits:0 };
    if (t.montant >= 0) parMois[key].credits += t.montant;
    else parMois[key].debits += Math.abs(t.montant);
  });
  const moisReels = Object.entries(parMois).sort(([a],[b]) => a.localeCompare(b));
  if (!moisReels.length) return [];
  const derniers = moisReels.slice(-3);
  const moyCredits = derniers.reduce((s,[,v]) => s + v.credits, 0) / derniers.length;
  const moyDebits  = derniers.reduce((s,[,v]) => s + v.debits,  0) / derniers.length;
  const result = [];
  moisReels.forEach(([key, v]) => {
    const [y, m] = key.split('-');
    result.push({ mois:`${MOIS_FR[parseInt(m)]} ${y}`, credits:v.credits, debits:v.debits, solde:null, type:'reel' });
  });
  let cumulReel = 0;
  result.forEach(r => { cumulReel += r.credits - r.debits; r.solde = cumulReel; });
  const soldeDepart = cumulReel;
  const now = new Date();
  let soldeCourant = soldeDepart;
  for (let i = 1; i <= horizon; i++) {
    const future = new Date(now.getFullYear(), now.getMonth() + i, 1);
    soldeCourant += moyCredits - moyDebits;
    result.push({ mois:`${MOIS_FR[future.getMonth()]} ${future.getFullYear()}`, credits:Math.round(moyCredits), debits:Math.round(moyDebits), solde:Math.round(soldeCourant), type:'prevision' });
  }
  return result;
}

function OngletPrevision({ transactions }) {
  const [horizon, setHorizon] = useState(6);
  const donnees = useMemo(() => calculerPrevision(transactions, horizon), [transactions, horizon]);
  const moisFuturs = donnees.filter(d => d.type === 'prevision');
  const alerteNegative = moisFuturs.some(d => d.solde < 0);
  const soldeFinal  = moisFuturs[moisFuturs.length - 1]?.solde ?? 0;
  const soldeActuel = donnees.filter(d => d.type === 'reel').slice(-1)[0]?.solde ?? 0;
  const variation   = soldeFinal - soldeActuel;

  if (!transactions.length) return (
    <div style={{ padding:'60px 0', textAlign:'center' }}>
      <BarChart2 size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom:12 }}/>
      <p style={{ color:'rgba(237,232,219,0.3)', fontSize:14, margin:0 }}>Importez d'abord votre relevé bancaire pour générer une prévision.</p>
    </div>
  );

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:700, color:'#EDE8DB', margin:0 }}>Prévision de trésorerie</h2>
          <p style={{ fontSize:12, color:'rgba(237,232,219,0.4)', marginTop:4 }}>Projection basée sur vos 3 derniers mois d'historique</p>
        </div>
        <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.06)', borderRadius:10, padding:3 }}>
          {[3, 6, 12].map(h => (
            <button key={h} onClick={() => setHorizon(h)} style={{ padding:'7px 18px', borderRadius:8, border:'none', background:horizon===h?'rgba(91,163,199,0.2)':'transparent', color:horizon===h?ACCENT:'rgba(237,232,219,0.4)', fontWeight:horizon===h?700:500, fontSize:13, cursor:'pointer', fontFamily:"'Nunito Sans', sans-serif", transition:'all 150ms' }}>
              {h} mois
            </button>
          ))}
        </div>
      </div>

      {alerteNegative && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:10, background:'rgba(199,91,78,0.08)', border:'1px solid rgba(199,91,78,0.25)', marginBottom:20 }}>
          <AlertTriangle size={16} color={ROUGE}/>
          <span style={{ fontSize:13, fontWeight:600, color:ROUGE }}>Attention — Solde prévu négatif sur la période.</span>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Solde actuel', value:formatEuro(soldeActuel), color:soldeActuel>=0?VERT:ROUGE, icon:BarChart2 },
          { label:`Solde dans ${horizon} mois`, value:formatEuro(soldeFinal), color:soldeFinal>=0?VERT:ROUGE, icon:Calendar },
          { label:'Variation prévue', value:(variation>=0?'+':'')+formatEuro(variation), color:variation>=0?VERT:ROUGE, icon:variation>=0?TrendingUp:TrendingDown },
          { label:'Entrées moy./mois', value:formatEuro(moisFuturs[0]?.credits??0), color:ACCENT, icon:ArrowUp },
          { label:'Sorties moy./mois', value:formatEuro(moisFuturs[0]?.debits??0), color:'#D4A853', icon:ArrowDown },
        ].map((s,i) => { const Icon = s.icon; return (
          <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ fontSize:10, color:'rgba(237,232,219,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</span>
              <Icon size={13} color={s.color}/>
            </div>
            <span style={{ fontSize:18, fontWeight:700, color:s.color }}>{s.value}</span>
          </div>
        );})}
      </div>

      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'20px 20px 12px', marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'rgba(237,232,219,0.5)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:16 }}>Évolution du solde</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={donnees} margin={{ top:4, right:16, left:0, bottom:0 }}>
            <defs>
              <linearGradient id="gradReel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ACCENT} stopOpacity={0.2}/><stop offset="95%" stopColor={ACCENT} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
            <XAxis dataKey="mois" tick={{ fontSize:10, fill:'rgba(237,232,219,0.35)' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:10, fill:'rgba(237,232,219,0.35)' }} axisLine={false} tickLine={false} tickFormatter={v => `${Math.round(v/1000)}k€`}/>
            <ReTooltip content={<CustomTooltip/>}/>
            <ReferenceLine y={0} stroke={ROUGE} strokeDasharray="4 4" strokeWidth={1.5}/>
            <Area type="monotone" dataKey="solde" name="Solde" stroke={ACCENT} strokeWidth={2} fill="url(#gradReel)"
              dot={(props) => { const { cx, cy, payload } = props; return payload.type==='prevision' ? <circle key={props.key} cx={cx} cy={cy} r={3} fill={VERT} stroke="#0F172A" strokeWidth={1.5}/> : <circle key={props.key} cx={cx} cy={cy} r={3} fill={ACCENT} stroke="#0F172A" strokeWidth={1.5}/>; }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginTop:8, fontSize:11, color:'rgba(237,232,219,0.35)' }}>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:3, background:ACCENT, borderRadius:2, display:'inline-block' }}></span>Historique réel</span>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:3, background:VERT, borderRadius:2, display:'inline-block' }}></span>Projection</span>
        </div>
      </div>

      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'20px 20px 12px', marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'rgba(237,232,219,0.5)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:16 }}>Entrées / Sorties mensuelles</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={donnees} margin={{ top:4, right:16, left:0, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
            <XAxis dataKey="mois" tick={{ fontSize:10, fill:'rgba(237,232,219,0.35)' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:10, fill:'rgba(237,232,219,0.35)' }} axisLine={false} tickLine={false} tickFormatter={v => `${Math.round(v/1000)}k€`}/>
            <ReTooltip content={<CustomTooltip/>}/>
            <Bar dataKey="credits" name="Entrées" fill={VERT}  radius={[4,4,0,0]} opacity={0.85}/>
            <Bar dataKey="debits"  name="Sorties" fill={ROUGE} radius={[4,4,0,0]} opacity={0.85}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              {['Mois','Entrées','Sorties','Solde net','Statut'].map((h,i) => <th key={i} style={{ padding:'11px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'rgba(237,232,219,0.3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {donnees.map((d, i) => (
              <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background:d.type==='prevision'?'rgba(91,199,138,0.02)':'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background=d.type==='prevision'?'rgba(91,199,138,0.02)':'transparent'}>
                <td style={{ padding:'10px 14px', fontSize:13, fontWeight:600, color:'#EDE8DB' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    {d.mois}
                    {d.type==='prevision' && <span style={{ fontSize:9, fontWeight:700, background:'rgba(91,199,138,0.1)', color:VERT, padding:'2px 7px', borderRadius:10, textTransform:'uppercase' }}>Prévu</span>}
                  </div>
                </td>
                <td style={{ padding:'10px 14px', fontSize:13, fontWeight:600, color:VERT }}>+{formatEuro(d.credits)}</td>
                <td style={{ padding:'10px 14px', fontSize:13, fontWeight:600, color:ROUGE }}>−{formatEuro(d.debits)}</td>
                <td style={{ padding:'10px 14px', fontSize:13, fontWeight:700, color:d.solde>=0?ACCENT:ROUGE }}>{formatEuro(d.solde)}</td>
                <td style={{ padding:'10px 14px' }}>
                  {d.solde<0 ? <span style={{ fontSize:10, fontWeight:700, background:'rgba(199,91,78,0.1)', color:ROUGE, padding:'3px 9px', borderRadius:20 }}>⚠️ Déficit</span>
                  : d.solde<500 ? <span style={{ fontSize:10, fontWeight:700, background:'rgba(212,168,83,0.1)', color:'#D4A853', padding:'3px 9px', borderRadius:20 }}>⚡ Faible</span>
                  : <span style={{ fontSize:10, fontWeight:700, background:'rgba(91,199,138,0.08)', color:VERT, padding:'3px 9px', borderRadius:20 }}>✓ OK</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditTransactionModal({ tx, onSave, onClose }) {
  const [form, setForm] = useState({ date:tx.date||'', libelle:tx.libelle||'', montant:tx.montant||'', notes:tx.notes||'' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data: { session } } = await supabasePro.auth.getSession();
      if (!session?.user) throw new Error('Session expirée');
      const montant = parseFloat(String(form.montant).replace(',', '.'));
      const { error: err } = await supabasePro.from('bank_transactions').update({ date:form.date, libelle:form.libelle, montant, type:montant>=0?'credit':'debit', notes:form.notes }).eq('id', tx.id);
      if (err) throw err; onSave();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const iS = { width:'100%', padding:'9px 12px', borderRadius:8, background:'#1a1d24', border:'1px solid rgba(255,255,255,0.1)', color:'#EDE8DB', fontSize:13, outline:'none', boxSizing:'border-box' };
  const lS = { fontSize:11, fontWeight:600, color:'rgba(237,232,219,0.5)', marginBottom:5 };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#0F1923', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, width:'100%', maxWidth:460, boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ padding:'22px 24px 0', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#EDE8DB' }}>Modifier la transaction</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(237,232,219,0.4)', padding:4 }}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding:'0 24px 24px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div><label style={lS}>Date *</label><input type="date" value={form.date} onChange={set('date')} required style={{ ...iS, colorScheme:'dark' }}/></div>
            <div><label style={lS}>Montant (€) *</label><input type="number" step="0.01" value={form.montant} onChange={set('montant')} required style={iS} placeholder="-150.00 ou 1200.00"/></div>
          </div>
          <div style={{ marginBottom:14 }}><label style={lS}>Libellé *</label><input value={form.libelle} onChange={set('libelle')} required style={iS}/></div>
          <div style={{ marginBottom:16 }}><label style={lS}>Notes</label><input value={form.notes} onChange={set('notes')} style={iS} placeholder="Informations complémentaires..."/></div>
          {error && <div style={{ color:'#C75B4E', fontSize:12, marginBottom:12 }}>{error}</div>}
          <div style={{ display:'flex', gap:10 }}>
            <button type="submit" disabled={loading} style={{ flex:1, padding:'11px', borderRadius:9, border:'none', background:loading?`${ACCENT}50`:ACCENT, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>{loading?'Enregistrement...':'✓ Enregistrer'}</button>
            <button type="button" onClick={onClose} style={{ padding:'11px 18px', borderRadius:9, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'rgba(237,232,219,0.5)', fontSize:13, cursor:'pointer' }}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BanquePage() {
  const [transactions,   setTransactions]   = useState([]);
  const [invoices,       setInvoices]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [importing,      setImporting]      = useState(false);
  const [filterType,     setFilterType]     = useState('tous');
  const [filterRaproche, setFilterRaproche] = useState('tous');
  const [preview,        setPreview]        = useState(null);
  const [dateRange,      setDateRange]      = useState({ debut:'', fin:'' });
  const [activeTab,      setActiveTab]      = useState('transactions');
  const [editTx,         setEditTx]         = useState(null);
  const [isMobile,       setIsMobile]       = useState(window.innerWidth < 768);
  const fileRef = useRef();
  const { activeWorkspace } = useWorkspace();

  useEffect(() => { const fn=()=>setIsMobile(window.innerWidth<768); window.addEventListener('resize',fn); return()=>window.removeEventListener('resize',fn); }, []);
  useEffect(() => { if (activeWorkspace) fetchAll(); }, [activeWorkspace]);

  const fetchAll = async () => {
    setLoading(true);
    const { data: { session: sess } } = await supabasePro.auth.getSession();
    const user = sess?.user; if (!user) return;
    let qTx = supabasePro.from('bank_transactions').select('*').eq('user_id', user.id).order('date', { ascending: false });
    if (activeWorkspace?.id) qTx = qTx.eq('workspace_id', activeWorkspace.id);
    const [{ data: tx }, { data: inv }] = await Promise.all([qTx, supabasePro.from('invoices').select('id, provider, amount_ttc, invoice_date').eq('user_id', user.id)]);
    setTransactions(tx || []); setInvoices(inv || []); setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const text = await file.text();
    const parsed = parseCSV(text);
    if (parsed.length === 0) { alert('Aucune transaction trouvée. Vérifiez le format du fichier CSV.'); return; }
    setPreview(parsed); e.target.value = '';
  };

  const confirmImport = async () => {
    if (!preview) return; setImporting(true);
    const { data: { session } } = await supabasePro.auth.getSession();
    const user = session?.user; if (!user) return;
    const withRapprochement = preview.map(tx => {
      const matched = invoices.find(inv => { const libelleMatch = inv.provider && tx.libelle.toLowerCase().includes(inv.provider.toLowerCase()); const montantMatch = Math.abs(Math.abs(tx.montant) - (inv.amount_ttc || 0)) < 1; return libelleMatch || montantMatch; });
      return { ...tx, user_id:user.id, workspace_id:activeWorkspace?.id, invoice_id:matched?.id||null, rapproche:!!matched, statut:matched?'rapproche':'non_rapproche' };
    });
    const { error } = await supabasePro.from('bank_transactions').insert(withRapprochement);
    if (error) { alert('Erreur import : ' + error.message); } else { setPreview(null); fetchAll(); }
    setImporting(false);
  };

  const toggleRapprochement = async (tx) => {
    const newVal = !tx.rapproche;
    await supabasePro.from('bank_transactions').update({ rapproche:newVal, statut:newVal?'rapproche':'non_rapproche' }).eq('id', tx.id);
    fetchAll();
  };

  const deleteTransaction = async (id) => {
    if (!confirm('Supprimer cette transaction ?')) return;
    await supabasePro.from('bank_transactions').delete().eq('id', id);
    fetchAll();
  };

  let filtered = [...transactions];
  if (dateRange.debut) filtered = filtered.filter(t => t.date >= dateRange.debut);
  if (dateRange.fin)   filtered = filtered.filter(t => t.date <= dateRange.fin);
  if (filterType !== 'tous') filtered = filtered.filter(t => t.type === filterType);
  if (filterRaproche === 'rapproche')     filtered = filtered.filter(t => t.rapproche);
  if (filterRaproche === 'non_rapproche') filtered = filtered.filter(t => !t.rapproche);

  const totalCredits  = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + (t.montant || 0), 0);
  const totalDebits   = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Math.abs(t.montant || 0), 0);
  const nonRapproches = transactions.filter(t => !t.rapproche).length;
  const rapproches    = transactions.filter(t => t.rapproche).length;

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:isMobile?'16px 12px':'32px 28px', maxWidth:1100, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:isMobile?22:26, fontWeight:600, color:'#EDE8DB', margin:0 }}>Banque & Prévision</h1>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          {editTx && <EditTransactionModal tx={editTx} onSave={() => { setEditTx(null); fetchAll(); }} onClose={() => setEditTx(null)}/>}
          {activeTab==='transactions' && !isMobile && <><DateFilter onChange={setDateRange} color={ACCENT}/><ExportButton data={filtered.map(t=>({...t,rapproche_label:t.rapproche?'Oui':'Non'}))} filename={`banque-${new Date().getFullYear()}`} color={ACCENT} columns={[{key:'date',label:'Date'},{key:'libelle',label:'Libellé'},{key:'montant',label:'Montant (€)'},{key:'type',label:'Type'},{key:'rapproche_label',label:'Rapproché'}]}/></>}
          <button onClick={() => fileRef.current?.click()} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:9, border:'none', background:ACCENT, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            <Upload size={13}/> {isMobile?'Importer':'Importer relevé'}
          </button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={handleFileUpload}/>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:10, marginBottom:20 }}>
        {[
          {label:'Crédits',      value:formatEuro(totalCredits),  color:VERT,      icon:TrendingUp},
          {label:'Débits',       value:formatEuro(totalDebits),   color:ROUGE,     icon:TrendingDown},
          {label:'Rapprochés',   value:rapproches,                color:ACCENT,    icon:CheckCircle},
          {label:'À rapprocher', value:nonRapproches,             color:'#D4A853', icon:AlertTriangle, alert:nonRapproches>0},
        ].map((s,i) => { const Icon = s.icon; return (
          <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${s.alert?'rgba(212,168,83,0.15)':'rgba(255,255,255,0.08)'}`, borderRadius:12, padding:'12px 14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><p style={{ fontSize:10, color:'rgba(237,232,219,0.4)', fontWeight:600, textTransform:'uppercase', margin:0 }}>{s.label}</p><Icon size={13} color={s.color}/></div>
            <p style={{ fontSize:isMobile?16:20, fontWeight:700, color:s.color, margin:0 }}>{s.value}</p>
          </div>
        );})}
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, background:'rgba(255,255,255,0.05)', borderRadius:10, padding:3, width:'fit-content' }}>
        {[{id:'transactions',label:'Transactions'},{id:'prevision',label:isMobile?'Prévision':'Prévision trésorerie'}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding:'8px 16px', borderRadius:8, border:'none', background:activeTab===tab.id?'rgba(91,163,199,0.15)':'transparent', color:activeTab===tab.id?ACCENT:'rgba(237,232,219,0.4)', fontWeight:activeTab===tab.id?700:500, fontSize:13, cursor:'pointer', fontFamily:"'Nunito Sans', sans-serif", transition:'all 150ms' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {editTx && <EditTransactionModal tx={editTx} onSave={() => { setEditTx(null); fetchAll(); }} onClose={() => setEditTx(null)}/>}

      {activeTab === 'transactions' && (
        <>
          {preview && (
            <div style={{ background:'rgba(91,163,199,0.06)', border:'1px solid rgba(91,163,199,0.2)', borderRadius:14, padding:20, marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div><h3 style={{ fontSize:15, fontWeight:700, color:'#EDE8DB', margin:0 }}>Aperçu — {preview.length} transactions</h3><p style={{ fontSize:12, color:'rgba(237,232,219,0.4)', marginTop:4 }}>Le rapprochement automatique sera tenté avec vos factures existantes.</p></div>
                <button onClick={() => setPreview(null)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgba(237,232,219,0.3)' }}><X size={16}/></button>
              </div>
              <div style={{ maxHeight:200, overflowY:'auto', marginBottom:16 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{['Date','Libellé','Montant'].map(h=>(<th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:10, fontWeight:700, color:'rgba(237,232,219,0.3)', textTransform:'uppercase' }}>{h}</th>))}</tr></thead>
                  <tbody>
                    {preview.slice(0,10).map((t,i)=>(<tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}><td style={{ padding:'7px 12px', color:'rgba(237,232,219,0.5)' }}>{formatDate(t.date)}</td><td style={{ padding:'7px 12px', color:'#EDE8DB' }}>{t.libelle}</td><td style={{ padding:'7px 12px', fontWeight:700, color:t.montant>=0?VERT:ROUGE }}>{formatEuro(t.montant)}</td></tr>))}
                    {preview.length > 10 && <tr><td colSpan={3} style={{ padding:'8px 12px', color:'rgba(237,232,219,0.3)', fontSize:11, textAlign:'center' }}>... et {preview.length - 10} autres</td></tr>}
                  </tbody>
                </table>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={confirmImport} disabled={importing} style={{ flex:1, padding:'11px', borderRadius:9, border:'none', background:importing?`${ACCENT}50`:ACCENT, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>{importing?'Import en cours...':`✓ Confirmer (${preview.length} transactions)`}</button>
                <button onClick={() => setPreview(null)} style={{ padding:'11px 18px', borderRadius:9, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'rgba(237,232,219,0.5)', fontSize:13, cursor:'pointer' }}>Annuler</button>
              </div>
            </div>
          )}

          {transactions.length === 0 && !preview && (
            <div style={{ background:'rgba(91,163,199,0.04)', border:'1px solid rgba(91,163,199,0.15)', borderRadius:12, padding:'16px 20px', marginBottom:20 }}>
              <p style={{ fontSize:13, fontWeight:600, color:ACCENT, margin:'0 0 6px' }}>Format CSV attendu</p>
              <p style={{ fontSize:12, color:'rgba(237,232,219,0.4)', margin:0 }}>3 colonnes séparées par <code>;</code> ou <code>,</code> : <strong>Date ; Libellé ; Montant</strong></p>
            </div>
          )}

          {transactions.length > 0 && (
            <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
              {[{id:'tous',label:'Tous'},{id:'credit',label:'Crédits'},{id:'debit',label:'Débits'}].map(f=>(
                <button key={f.id} onClick={()=>setFilterType(f.id)} style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${filterType===f.id?ACCENT:'rgba(255,255,255,0.1)'}`, background:filterType===f.id?`${ACCENT}20`:'transparent', color:filterType===f.id?ACCENT:'rgba(237,232,219,0.4)', fontSize:11, fontWeight:filterType===f.id?700:500, cursor:'pointer' }}>{f.label}</button>
              ))}
              <div style={{ width:1, height:20, background:'rgba(255,255,255,0.08)', alignSelf:'center' }}/>
              {[{id:'tous',label:'Tous'},{id:'rapproche',label:'Rapprochés'},{id:'non_rapproche',label:'À rapprocher'}].map(f=>(
                <button key={f.id} onClick={()=>setFilterRaproche(f.id)} style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${filterRaproche===f.id?'#D4A853':'rgba(255,255,255,0.1)'}`, background:filterRaproche===f.id?'rgba(212,168,83,0.1)':'transparent', color:filterRaproche===f.id?'#D4A853':'rgba(237,232,219,0.4)', fontSize:11, fontWeight:filterRaproche===f.id?700:500, cursor:'pointer' }}>{f.label}</button>
              ))}
            </div>
          )}

          {/* TABLEAU DESKTOP */}
          {!isMobile && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, overflow:'hidden' }}>
              {loading?<div style={{padding:40,textAlign:'center',color:'rgba(237,232,219,0.4)',fontSize:13}}>Chargement...</div>
              :filtered.length===0?<div style={{padding:48,textAlign:'center'}}><Upload size={32} color="rgba(255,255,255,0.1)" style={{marginBottom:12}}/><p style={{color:'rgba(237,232,219,0.3)',fontSize:13,margin:0}}>{transactions.length===0?'Aucune transaction — importez votre relevé CSV':'Aucune transaction pour ce filtre'}</p></div>
              :<table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  {['Date','Libellé','Montant','Statut',''].map((h,i)=>(<th key={i} style={{padding:'11px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:'rgba(237,232,219,0.3)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</th>))}
                </tr></thead>
                <tbody>{filtered.map((t,i)=>(
                  <tr key={t.id||i} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}} onMouseEnter={ev=>ev.currentTarget.style.background='rgba(255,255,255,0.03)'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
                    <td style={{padding:'11px 14px',fontSize:12,color:'rgba(237,232,219,0.4)'}}>{formatDate(t.date)}</td>
                    <td style={{padding:'11px 14px',fontSize:13,color:'#EDE8DB',maxWidth:300}}><span style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.libelle}</span></td>
                    <td style={{padding:'11px 14px',fontSize:13,fontWeight:700,color:t.montant>=0?VERT:ROUGE}}>{t.montant>=0?'+':''}{formatEuro(t.montant)}</td>
                    <td style={{padding:'11px 14px'}}><StatutBadge rapproche={t.rapproche}/></td>
                    <td style={{padding:'11px 14px'}}>
                      <div style={{display:'flex',gap:4}}>
                        <button onClick={()=>toggleRapprochement(t)} style={{background:'transparent',border:'none',cursor:'pointer',padding:4,color:t.rapproche?VERT:'#D4A853'}}><RefreshCw size={13}/></button>
                        <button onClick={()=>setEditTx(t)} style={{background:'transparent',border:'none',cursor:'pointer',padding:4,color:'rgba(237,232,219,0.3)'}} onMouseEnter={ev=>ev.currentTarget.style.color=ACCENT} onMouseLeave={ev=>ev.currentTarget.style.color='rgba(237,232,219,0.3)'}><Edit2 size={13}/></button>
                        <button onClick={()=>deleteTransaction(t.id)} style={{background:'transparent',border:'none',cursor:'pointer',padding:4,color:'rgba(237,232,219,0.2)'}} onMouseEnter={ev=>ev.currentTarget.style.color=ROUGE} onMouseLeave={ev=>ev.currentTarget.style.color='rgba(237,232,219,0.2)'}><X size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>}
            </div>
          )}

          {/* CARTES MOBILE */}
          {isMobile && (
            <div>
              {loading?<div style={{padding:40,textAlign:'center',color:'rgba(237,232,219,0.4)'}}>Chargement...</div>
              :filtered.length===0?<div style={{padding:40,textAlign:'center'}}><p style={{color:'rgba(237,232,219,0.3)',fontSize:13,margin:0}}>{transactions.length===0?'Aucune transaction — importez votre relevé CSV':'Aucune transaction pour ce filtre'}</p></div>
              :filtered.map((t,i)=>(
                <div key={t.id||i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'14px 16px', marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div style={{ flex:1, minWidth:0, marginRight:12 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#EDE8DB', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.libelle}</div>
                      <div style={{ fontSize:11, color:'rgba(237,232,219,0.4)' }}>{formatDate(t.date)}</div>
                    </div>
                    <div style={{ fontSize:16, fontWeight:800, color:t.montant>=0?VERT:ROUGE, whiteSpace:'nowrap' }}>{t.montant>=0?'+':''}{formatEuro(t.montant)}</div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <StatutBadge rapproche={t.rapproche}/>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={()=>toggleRapprochement(t)} style={{ background:`${t.rapproche?'rgba(91,199,138,0.1)':'rgba(212,168,83,0.1)'}`, border:'none', borderRadius:6, padding:'6px 8px', cursor:'pointer', color:t.rapproche?VERT:'#D4A853', display:'flex' }}><RefreshCw size={13}/></button>
                      <button onClick={()=>setEditTx(t)} style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:6, padding:'6px 8px', cursor:'pointer', color:'rgba(237,232,219,0.5)', display:'flex' }}><Edit2 size={13}/></button>
                      <button onClick={()=>deleteTransaction(t.id)} style={{ background:'rgba(199,91,78,0.08)', border:'none', borderRadius:6, padding:'6px 8px', cursor:'pointer', color:ROUGE, display:'flex' }}><X size={13}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'prevision' && <OngletPrevision transactions={transactions}/>}
    </div>
  );
}
