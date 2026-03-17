import { useState, useEffect, useRef } from 'react';
import { supabasePro } from '../lib/supabasePro';
import { Upload, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, RefreshCw, X } from 'lucide-react';
import ExportButton from '../components/ExportButton';
import DateFilter from '../components/DateFilter';

const ACCENT = '#5BA3C7';
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
    results.push({ date: normalizeDate(date), libelle: libelle.substring(0, 200), montant, type: montant >= 0 ? 'credit' : 'debit', statut: 'non_rapproche', rapproche: false });
  }
  return results;
}

function normalizeDate(str) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parts = str.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y.length === 2 ? '20' + y : y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  return str;
}

function StatutBadge({ rapproche }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:rapproche?'rgba(91,199,138,0.1)':'rgba(212,168,83,0.1)', color:rapproche?'#5BC78A':'#D4A853', fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20 }}>
      {rapproche ? <><CheckCircle size={10}/> Rapproché</> : <><AlertTriangle size={10}/> À rapprocher</>}
    </span>
  );
}

export default function BanquePage() {
  const [transactions,     setTransactions]     = useState([]);
  const [invoices,         setInvoices]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [importing,        setImporting]        = useState(false);
  const [filterType,       setFilterType]       = useState('tous');
  const [filterRaproche,   setFilterRaproche]   = useState('tous');
  const [preview,          setPreview]          = useState(null);
  const [dateRange,        setDateRange]        = useState({ debut:'', fin:'' });
  const fileRef = useRef();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabasePro.auth.getUser();
    if (!user) return;
    const [{ data: tx }, { data: inv }] = await Promise.all([
      supabasePro.from('bank_transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabasePro.from('invoices').select('id, provider, amount_ttc, invoice_date').eq('user_id', user.id),
    ]);
    setTransactions(tx || []);
    setInvoices(inv || []);
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCSV(text);
    if (parsed.length === 0) { alert('Aucune transaction trouvée. Vérifiez le format du fichier CSV.'); return; }
    setPreview(parsed);
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!preview) return;
    setImporting(true);
    const { data: { user } } = await supabasePro.auth.getUser();
    if (!user) return;
    const withRapprochement = preview.map(tx => {
      const matched = invoices.find(inv => {
        const libelleMatch = inv.provider && tx.libelle.toLowerCase().includes(inv.provider.toLowerCase());
        const montantMatch = Math.abs(Math.abs(tx.montant) - (inv.amount_ttc || 0)) < 1;
        return libelleMatch || montantMatch;
      });
      return { ...tx, user_id: user.id, invoice_id: matched?.id || null, rapproche: !!matched, statut: matched ? 'rapproche' : 'non_rapproche' };
    });
    const { error } = await supabasePro.from('bank_transactions').insert(withRapprochement);
    if (error) { alert('Erreur import : ' + error.message); } else { setPreview(null); fetchAll(); }
    setImporting(false);
  };

  const toggleRapprochement = async (tx) => {
    const newVal = !tx.rapproche;
    await supabasePro.from('bank_transactions').update({ rapproche: newVal, statut: newVal ? 'rapproche' : 'non_rapproche' }).eq('id', tx.id);
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
  const filteredExport = filtered.map(t => ({ ...t, rapproche_label: t.rapproche ? 'Oui' : 'Non' }));

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:1000, margin:'0 auto' }}>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:'#1A1C20', margin:0 }}>Banque & Prévision</h1>
          <p style={{ fontSize:13, color:'#9AA0AE', marginTop:4 }}>Importez vos relevés et rapprochez vos transactions</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <DateFilter onChange={setDateRange} color={ACCENT}/>
          <ExportButton data={filteredExport} filename={`banque-${new Date().getFullYear()}`} color={ACCENT}
            columns={[
              { key:'date',            label:'Date' },
              { key:'libelle',         label:'Libellé' },
              { key:'montant',         label:'Montant (€)' },
              { key:'type',            label:'Type' },
              { key:'rapproche_label', label:'Rapproché' },
            ]}/>
          <button onClick={() => fileRef.current?.click()} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, border:'none', background:ACCENT, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            <Upload size={13}/> Importer relevé
          </button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={handleFileUpload}/>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Crédits',      value:formatEuro(totalCredits),  color:'#5BC78A', icon:TrendingUp   },
          { label:'Débits',       value:formatEuro(totalDebits),   color:'#C75B4E', icon:TrendingDown  },
          { label:'Rapprochés',   value:rapproches,                color:ACCENT,    icon:CheckCircle  },
          { label:'À rapprocher', value:nonRapproches,             color:'#D4A853', icon:AlertTriangle, alert:nonRapproches > 0 },
        ].map(s => { const Icon = s.icon; return (
          <div key={s.label} style={{ background:'#fff', border:`1px solid ${s.alert?'rgba(212,168,83,0.3)':'#E8EAF0'}`, borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <p style={{ fontSize:11, color:'#9AA0AE', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>{s.label}</p>
              <Icon size={14} color={s.color}/>
            </div>
            <p style={{ fontSize:22, fontWeight:700, color:s.color, margin:0 }}>{s.value}</p>
          </div>
        );})}
      </div>

      {preview && (
        <div style={{ background:'#fff', border:'1px solid rgba(91,163,199,0.3)', borderRadius:14, padding:20, marginBottom:24, boxShadow:'0 2px 12px rgba(91,163,199,0.08)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, color:'#1A1C20', margin:0 }}>Aperçu — {preview.length} transactions détectées</h3>
              <p style={{ fontSize:12, color:'#9AA0AE', marginTop:4 }}>Le rapprochement automatique sera tenté avec vos factures existantes.</p>
            </div>
            <button onClick={() => setPreview(null)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#9AA0AE' }}><X size={16}/></button>
          </div>
          <div style={{ maxHeight:200, overflowY:'auto', marginBottom:16 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr style={{ borderBottom:'1px solid #F0F2F5' }}>{['Date','Libellé','Montant'].map(h=>(<th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:10, fontWeight:700, color:'#9AA0AE', textTransform:'uppercase' }}>{h}</th>))}</tr></thead>
              <tbody>
                {preview.slice(0,10).map((t,i)=>(<tr key={i} style={{ borderBottom:'1px solid #F8F9FB' }}><td style={{ padding:'7px 12px', color:'#5A6070' }}>{formatDate(t.date)}</td><td style={{ padding:'7px 12px', color:'#1A1C20' }}>{t.libelle}</td><td style={{ padding:'7px 12px', fontWeight:700, color:t.montant>=0?'#5BC78A':'#C75B4E' }}>{formatEuro(t.montant)}</td></tr>))}
                {preview.length > 10 && <tr><td colSpan={3} style={{ padding:'8px 12px', color:'#9AA0AE', fontSize:11, textAlign:'center' }}>... et {preview.length - 10} autres</td></tr>}
              </tbody>
            </table>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={confirmImport} disabled={importing} style={{ flex:1, padding:'11px', borderRadius:9, border:'none', background:importing?`${ACCENT}50`:ACCENT, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>{importing?'Import en cours...':`✓ Confirmer l'import (${preview.length} transactions)`}</button>
            <button onClick={() => setPreview(null)} style={{ padding:'11px 18px', borderRadius:9, border:'1px solid #E8EAF0', background:'#fff', color:'#5A6070', fontSize:13, cursor:'pointer' }}>Annuler</button>
          </div>
        </div>
      )}

      {transactions.length === 0 && !preview && (
        <div style={{ background:'rgba(91,163,199,0.04)', border:'1px solid rgba(91,163,199,0.15)', borderRadius:12, padding:'16px 20px', marginBottom:20 }}>
          <p style={{ fontSize:13, fontWeight:600, color:ACCENT, margin:'0 0 6px' }}>Format CSV attendu</p>
          <p style={{ fontSize:12, color:'#5A6070', margin:0 }}>3 colonnes séparées par <code>;</code> ou <code>,</code> : <strong>Date ; Libellé ; Montant</strong><br/>Ex : <code>01/03/2026;EDF FACTURE;-124.50</code></p>
        </div>
      )}

      {transactions.length > 0 && (
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', gap:6 }}>
            {[{id:'tous',label:'Tous'},{id:'credit',label:'Crédits'},{id:'debit',label:'Débits'}].map(f=>(
              <button key={f.id} onClick={()=>setFilterType(f.id)} style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${filterType===f.id?ACCENT:'#E8EAF0'}`, background:filterType===f.id?`${ACCENT}15`:'#fff', color:filterType===f.id?ACCENT:'#5A6070', fontSize:12, fontWeight:filterType===f.id?700:500, cursor:'pointer' }}>{f.label}</button>
            ))}
          </div>
          <div style={{ width:1, height:20, background:'#E8EAF0' }}/>
          <div style={{ display:'flex', gap:6 }}>
            {[{id:'tous',label:'Tous'},{id:'rapproche',label:'Rapprochés'},{id:'non_rapproche',label:'À rapprocher'}].map(f=>(
              <button key={f.id} onClick={()=>setFilterRaproche(f.id)} style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${filterRaproche===f.id?'#D4A853':'#E8EAF0'}`, background:filterRaproche===f.id?'rgba(212,168,83,0.1)':'#fff', color:filterRaproche===f.id?'#D4A853':'#5A6070', fontSize:12, fontWeight:filterRaproche===f.id?700:500, cursor:'pointer' }}>{f.label}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        {loading ? <div style={{ padding:40, textAlign:'center', color:'#9AA0AE', fontSize:13 }}>Chargement...</div>
        : filtered.length === 0 ? (
          <div style={{ padding:48, textAlign:'center' }}>
            <Upload size={32} color="#E8EAF0" style={{ marginBottom:12 }}/>
            <p style={{ color:'#9AA0AE', fontSize:13, margin:0 }}>{transactions.length===0?'Aucune transaction — importez votre relevé CSV':'Aucune transaction pour ce filtre'}</p>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ borderBottom:'1px solid #F0F2F5' }}>{['Date','Libellé','Montant','Statut',''].map(h=>(<th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#9AA0AE', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>))}</tr></thead>
            <tbody>
              {filtered.map((t,i)=>(
                <tr key={t.id||i} style={{ borderBottom:'1px solid #F8F9FB' }} onMouseEnter={ev=>ev.currentTarget.style.background='#FAFBFC'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'#5A6070' }}>{formatDate(t.date)}</td>
                  <td style={{ padding:'11px 14px', fontSize:13, color:'#1A1C20', maxWidth:300 }}><span style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.libelle}</span></td>
                  <td style={{ padding:'11px 14px', fontSize:13, fontWeight:700, color:t.montant>=0?'#5BC78A':'#C75B4E' }}>{t.montant>=0?'+':''}{formatEuro(t.montant)}</td>
                  <td style={{ padding:'11px 14px' }}><StatutBadge rapproche={t.rapproche}/></td>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={()=>toggleRapprochement(t)} title={t.rapproche?'Marquer non rapproché':'Marquer rapproché'} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:t.rapproche?'#5BC78A':'#D4A853' }}><RefreshCw size={13}/></button>
                      <button onClick={()=>deleteTransaction(t.id)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'#D0D4DC' }} onMouseEnter={ev=>ev.currentTarget.style.color='#C75B4E'} onMouseLeave={ev=>ev.currentTarget.style.color='#D0D4DC'}><X size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
