import { useState, useEffect, useRef } from 'react';
import { supabasePro } from '../lib/supabasePro';
import { Plus, Trash2, Edit2, FileText, Car, Coffee, Hotel, Package, CheckCircle, Loader, Scan, ExternalLink, X } from 'lucide-react';
import ExportButton from '../components/ExportButton';
import DateFilter from '../components/DateFilter';
import Tooltip from '../components/Tooltip';
import { TIPS } from '../utils/tooltips';
import { useWorkspace } from '../hooks/useWorkspace.jsx';

const ACCENT = '#5BC78A';

const TYPES = [
  { id:'restauration', label:'Restauration', icon:Coffee,   color:'#5BC78A' },
  { id:'transport',    label:'Transport',    icon:Car,       color:'#5BA3C7' },
  { id:'logement',     label:'Logement',     icon:Hotel,     color:'#A85BC7' },
  { id:'fournitures',  label:'Fournitures',  icon:Package,   color:'#5BC78A' },
  { id:'autre',        label:'Autre',        icon:FileText,  color:'rgba(237,232,219,0.4)' },
];

const TYPE_MAP = { 'Services':'autre','Transport':'transport','Alimentation':'restauration','Logement':'logement','Fournitures':'fournitures','Autre':'autre' };
const TAUX_KM = 0.529;
const formatEuro = (n) => n == null ? '—' : new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR' }).format(n);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '—';

function parseOCRDate(str) {
  if (!str) return new Date().toISOString().split('T')[0];
  const p = str.split('/');
  if (p.length === 3) return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
  return new Date().toISOString().split('T')[0];
}

function TypeBadge({ type }) {
  const t = TYPES.find(x => x.id === type) || TYPES[4];
  const Icon = t.icon;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:`${t.color}20`, color:t.color, fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20 }}>
      <Icon size={11}/> {t.label}
    </span>
  );
}

function AddExpenseForm({ onSave, onCancel, prefill=null, workspaceId=null }) {
  const [form, setForm] = useState({
    date:          prefill?.date         ? parseOCRDate(prefill.date) : new Date().toISOString().split('T')[0],
    amount_ttc:    prefill?.montant_ttc  ?? '',
    type:          prefill?.categorie    ? (TYPE_MAP[prefill.categorie] ?? 'autre') : 'restauration',
    etablissement: prefill?.fournisseur  ?? '',
    km:            '',
    notes:         prefill?.description  ?? '',
  });
  const [file,       setFile]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [scanning,   setScanning]   = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(!!prefill);
  const [error,      setError]      = useState('');
  const fileRef = useRef();
  const set = (k) => (e) => setForm(f => ({ ...f, [k]:e.target.value }));

  const handleScan = async (selectedFile) => {
    if (!selectedFile) return;
    setScanning(true); setOcrSuccess(false); setError('');
    try {
      let base64, mimeType;
      if (selectedFile.type === 'application/pdf') {
        const pdfjsLib = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        base64 = canvas.toDataURL('image/png').split(',')[1]; mimeType = 'image/png';
      } else {
        base64 = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result.split(',')[1]); r.onerror = reject; r.readAsDataURL(selectedFile); });
        mimeType = selectedFile.type;
      }
      const res = await fetch('/api/ocr', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ fileBase64:base64, mimeType, fileName:selectedFile.name }) });
      if (!res.ok) throw new Error('Erreur serveur OCR');
      const data = await res.json();
      setForm(f => ({
        ...f,
        date:          data.date ? parseOCRDate(data.date) : f.date,
        amount_ttc:    data.montant_ttc  ?? f.amount_ttc,
        etablissement: data.fournisseur  ?? f.etablissement,
        notes:         data.description  ?? f.notes,
        type:          TYPE_MAP[data.categorie] ?? f.type,
      }));
      setOcrSuccess(true);
    } catch (err) { setError('Impossible d\'analyser la facture.'); }
    finally { setScanning(false); }
  };

  const handleFileChange = (e) => { const f = e.target.files[0]||null; setFile(f); if (f) handleScan(f); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      let { data: { session } } = await supabasePro.auth.getSession();
      if (!session) { const { data: r } = await supabasePro.auth.refreshSession(); session = r.session; }
      if (!session?.user) throw new Error('Session expirée');
      const user = session.user;
      let file_url = null, storage_path = null;
      if (file) {
        const ext = file.name.split('.').pop();
        const path = `frais/${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabasePro.storage.from('invoices').upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabasePro.storage.from('invoices').getPublicUrl(path);
        file_url = urlData.publicUrl; storage_path = path;
      }
      const km = form.type === 'transport' && form.km ? parseFloat(form.km) : null;
      const indemnite_km = km ? parseFloat((km * TAUX_KM).toFixed(2)) : null;
      const { error: insErr } = await supabasePro.from('expenses').insert({
        user_id: user.id,
        workspace_id: workspaceId,
        date: form.date,
        amount_ttc: form.amount_ttc ? parseFloat(form.amount_ttc) : null,
        type: form.type,
        etablissement: form.etablissement,
        km, indemnite_km,
        notes: form.notes,
        file_url, storage_path,
      });
      if (insErr) throw insErr;
      onSave();
    } catch (err) { setError(err.message || "Erreur lors de l'enregistrement"); }
    finally { setLoading(false); }
  };

  const iS = { width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#EDE8DB', fontSize:13, outline:'none', boxSizing:'border-box' };
  const lS = { fontSize:11, fontWeight:600, color:'rgba(237,232,219,0.5)', marginBottom:5, display:'flex', alignItems:'center', gap:4 };

  return (
    <form onSubmit={handleSubmit} style={{ background:ocrSuccess?'rgba(91,199,138,0.05)':'rgba(255,255,255,0.04)', border:`1px solid ${ocrSuccess?`${ACCENT}40`:'rgba(255,255,255,0.08)'}`, borderRadius:14, padding:24, marginBottom:24 }}>
      {ocrSuccess && prefill && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:9, background:`${ACCENT}10`, border:`1px solid ${ACCENT}30`, marginBottom:18 }}>
          <CheckCircle size={14} color={ACCENT}/>
          <span style={{ fontSize:13, fontWeight:600, color:ACCENT }}>Formulaire pré-rempli depuis l'analyse du document</span>
        </div>
      )}
      <h3 style={{ fontSize:15, fontWeight:700, color:'#EDE8DB', marginBottom:20 }}>Nouvelle dépense</h3>

      <div style={{ marginBottom:20 }}>
        <label style={lS}>Justificatif (photo ou PDF) <Tooltip text={TIPS.ocr} /></label>
        <div onClick={() => fileRef.current?.click()} style={{ border:`2px dashed ${ocrSuccess?ACCENT:file?'#5BC78A':'rgba(255,255,255,0.12)'}`, borderRadius:10, padding:18, textAlign:'center', cursor:'pointer', background:ocrSuccess?`${ACCENT}08`:'rgba(255,255,255,0.02)', transition:'all 200ms ease' }}>
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display:'none' }} onChange={handleFileChange}/>
          {scanning ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><Loader size={16} color={ACCENT} style={{ animation:'spin 1s linear infinite' }}/><span style={{ fontSize:13, color:ACCENT, fontWeight:600 }}>Analyse en cours...</span></div>
          : ocrSuccess ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><CheckCircle size={16} color={ACCENT}/><span style={{ fontSize:13, color:ACCENT, fontWeight:600 }}>✓ Formulaire complété{file ? ` — ${file.name}` : ' depuis le bureau'}</span></div>
          : file ? <span style={{ fontSize:12, color:'#5BC78A', fontWeight:600 }}>📄 {file.name}</span>
          : <div><div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:4 }}><Scan size={16} color={ACCENT}/><span style={{ fontSize:13, color:ACCENT, fontWeight:700 }}>Déposer une facture</span></div><span style={{ fontSize:11, color:'rgba(237,232,219,0.3)' }}>PDF ou photo — le formulaire se complète automatiquement</span></div>}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div><label style={lS}>Date *</label><input type="date" value={form.date} onChange={set('date')} required style={{ ...iS, colorScheme:'dark' }}/></div>
        <div>
          <label style={lS}>Montant TTC (€) * <Tooltip text={TIPS.montant_ttc} /></label>
          <input type="number" step="0.01" min="0" value={form.amount_ttc} onChange={set('amount_ttc')} placeholder="0,00" required style={iS}/>
        </div>
      </div>

      <div style={{ marginBottom:14 }}>
        <label style={lS}>Catégorie *</label>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {TYPES.map(t => { const Icon = t.icon; const sel = form.type===t.id; return (
            <button key={t.id} type="button" onClick={() => setForm(f => ({ ...f, type:t.id }))} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:20, border:`1px solid ${sel?t.color:'rgba(255,255,255,0.1)'}`, background:sel?`${t.color}20`:'rgba(255,255,255,0.04)', color:sel?t.color:'rgba(237,232,219,0.5)', fontSize:12, fontWeight:sel?700:500, cursor:'pointer' }}>
              <Icon size={12}/> {t.label}
            </button>);
          })}
        </div>
      </div>

      <div style={{ marginBottom:14 }}><label style={lS}>Fournisseur</label><input type="text" value={form.etablissement} onChange={set('etablissement')} placeholder="ex : EDF, Amazon..." style={iS}/></div>

      {form.type === 'transport' && (
        <div style={{ marginBottom:14, background:'rgba(91,163,199,0.06)', border:'1px solid rgba(91,163,199,0.2)', borderRadius:10, padding:'12px 14px' }}>
          <label style={{ ...lS, color:'#5BA3C7' }}>Kilométrage (facultatif) <Tooltip text={TIPS.indemnite_km} /></label>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <input type="number" min="0" value={form.km} onChange={set('km')} placeholder="ex : 150" style={{ ...iS, maxWidth:140 }}/>
            <span style={{ fontSize:12, color:'#5BA3C7', fontWeight:500 }}>{form.km?`= ${(parseFloat(form.km)*TAUX_KM).toFixed(2)} €`:'km × 0,529 €/km'}</span>
          </div>
        </div>
      )}

      <div style={{ marginBottom:14 }}><label style={lS}>Remarques</label><input type="text" value={form.notes} onChange={set('notes')} placeholder="Informations complémentaires..." style={iS}/></div>
      {error && <div style={{ background:'rgba(199,91,78,0.08)', border:'1px solid rgba(199,91,78,0.2)', borderRadius:8, padding:'10px 14px', color:'#C75B4E', fontSize:12, marginBottom:14 }}>{error}</div>}
      <div style={{ display:'flex', gap:10 }}>
        <button type="submit" disabled={loading} style={{ flex:1, padding:'11px', borderRadius:9, border:'none', background:loading?`${ACCENT}50`:ACCENT, color:'#fff', fontSize:13, fontWeight:700, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          {loading ? <><Loader size={13} style={{ animation:'spin 1s linear infinite' }}/> Enregistrement...</> : '✓ Enregistrer'}
        </button>
        <button type="button" onClick={onCancel} style={{ padding:'11px 18px', borderRadius:9, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'rgba(237,232,219,0.5)', fontSize:13, cursor:'pointer' }}>Annuler</button>
      </div>
    </form>
  );
}

function EditExpenseModal({ expense, onSave, onClose, workspaceId }) {
  const [form, setForm] = useState({
    date:          expense.date || '',
    amount_ttc:    expense.amount_ttc || '',
    type:          expense.type || 'autre',
    etablissement: expense.etablissement || '',
    km:            expense.km || '',
    notes:         expense.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data: { session } } = await supabasePro.auth.getSession();
      if (!session?.user) throw new Error('Session expirée');
      const km = form.type === 'transport' && form.km ? parseFloat(form.km) : null;
      const indemnite_km = km ? parseFloat((km * TAUX_KM).toFixed(2)) : null;
      const { error: err } = await supabasePro.from('expenses').update({
        date: form.date,
        amount_ttc: form.amount_ttc ? parseFloat(form.amount_ttc) : null,
        type: form.type,
        etablissement: form.etablissement,
        km, indemnite_km,
        notes: form.notes,
      }).eq('id', expense.id);
      if (err) throw err;
      onSave();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const iS = { width:'100%', padding:'9px 12px', borderRadius:8, background:'#1a1d24', border:'1px solid rgba(255,255,255,0.1)', color:'#EDE8DB', fontSize:13, outline:'none', boxSizing:'border-box' };
  const lS = { fontSize:11, fontWeight:600, color:'rgba(237,232,219,0.5)', marginBottom:5, display:'flex', alignItems:'center', gap:4 };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#0F1923', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ padding:'22px 24px 0', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#EDE8DB' }}>Modifier la dépense</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(237,232,219,0.4)', padding:4 }}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding:'0 24px 24px' }}>
          {expense.file_url && (
            <div style={{ marginBottom:16, padding:'10px 14px', borderRadius:9, background:'rgba(91,163,199,0.08)', border:'1px solid rgba(91,163,199,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:12, color:'#5BA3C7', fontWeight:600 }}>📄 Justificatif joint</span>
              <button type="button" onClick={() => window.open(expense.file_url, '_blank')} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#5BA3C7', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>
                <ExternalLink size={13}/> Ouvrir le PDF
              </button>
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div><label style={lS}>Date *</label><input type="date" value={form.date} onChange={set('date')} required style={{ ...iS, colorScheme:'dark' }}/></div>
            <div><label style={lS}>Montant TTC (€) *</label><input type="number" step="0.01" min="0" value={form.amount_ttc} onChange={set('amount_ttc')} required style={iS}/></div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={lS}>Catégorie *</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {TYPES.map(t => { const Icon = t.icon; const sel = form.type===t.id; return (
                <button key={t.id} type="button" onClick={() => setForm(f => ({ ...f, type:t.id }))} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:20, border:`1px solid ${sel?t.color:'rgba(255,255,255,0.1)'}`, background:sel?`${t.color}20`:'rgba(255,255,255,0.04)', color:sel?t.color:'rgba(237,232,219,0.5)', fontSize:12, fontWeight:sel?700:500, cursor:'pointer' }}>
                  <Icon size={12}/> {t.label}
                </button>);
              })}
            </div>
          </div>
          <div style={{ marginBottom:14 }}><label style={lS}>Fournisseur</label><input value={form.etablissement} onChange={set('etablissement')} style={iS} placeholder="ex : EDF, Amazon..."/></div>
          {form.type === 'transport' && (
            <div style={{ marginBottom:14 }}><label style={lS}>Kilométrage</label><input type="number" min="0" value={form.km} onChange={set('km')} style={iS} placeholder="ex : 150"/></div>
          )}
          <div style={{ marginBottom:16 }}><label style={lS}>Remarques</label><input value={form.notes} onChange={set('notes')} style={iS} placeholder="Informations complémentaires..."/></div>
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

export default function DepensesPage() {
  const [expenses,    setExpenses]   = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [showForm,    setShowForm]   = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [filterType,  setFilterType] = useState('tous');
  const [dateRange,   setDateRange]  = useState({ debut:'', fin:'' });
  const [ocrPrefill,  setOcrPrefill] = useState(null);
  const [isMobile,    setIsMobile]   = useState(window.innerWidth < 768);
  const { activeWorkspace } = useWorkspace();

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    if (activeWorkspace) fetchExpenses();
    try {
      const raw = sessionStorage.getItem('ocr_prefill');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.source === 'prohome_ocr' && data.type_document === 'depense') {
          setOcrPrefill(data);
          setShowForm(true);
          sessionStorage.removeItem('ocr_prefill');
        }
      }
    } catch {}
  }, [activeWorkspace]);

  const fetchExpenses = async () => {
    setLoading(true);
    const { data: { session } } = await supabasePro.auth.getSession();
    if (!session?.user) return;
    const { data } = await supabasePro.from('expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('workspace_id', activeWorkspace?.id)
      .order('date', { ascending:false });
    setExpenses(data || []);
    setLoading(false);
  };

  const deleteExpense = async (id, storage_path) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    if (storage_path) await supabasePro.storage.from('invoices').remove([storage_path]);
    await supabasePro.from('expenses').delete().eq('id', id);
    fetchExpenses();
  };

  let filtered = filterType === 'tous' ? expenses : expenses.filter(e => e.type === filterType);
  if (dateRange.debut) filtered = filtered.filter(e => e.date >= dateRange.debut);
  if (dateRange.fin)   filtered = filtered.filter(e => e.date <= dateRange.fin);

  const totalFiltered = filtered.reduce((s, e) => s + (e.amount_ttc || 0), 0);
  const totalKm       = filtered.filter(e => e.indemnite_km).reduce((s, e) => s + (e.indemnite_km || 0), 0);

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding: isMobile ? '16px 12px' : '32px 28px', maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize: isMobile ? 22 : 26, fontWeight:600, color:'#EDE8DB', margin:0, display:'flex', alignItems:'center', gap:8 }}>
            Dépenses <Tooltip text={TIPS.depenses} size={16} />
          </h1>
          <p style={{ fontSize:13, color:'rgba(237,232,219,0.4)', marginTop:4 }}>Suivez vos dépenses professionnelles</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          {!isMobile && <DateFilter onChange={setDateRange} color={ACCENT}/>}
          {!isMobile && <ExportButton data={filtered} filename={`depenses-${new Date().getFullYear()}`} color={ACCENT}
            columns={[
              { key:'date',          label:'Date' },
              { key:'type',          label:'Catégorie' },
              { key:'etablissement', label:'Fournisseur' },
              { key:'amount_ttc',    label:'Montant TTC (€)' },
              { key:'km',            label:'Km' },
              { key:'indemnite_km',  label:'Indemnité Km (€)' },
              { key:'notes',         label:'Remarques' },
            ]}/>}
          <button onClick={() => { setOcrPrefill(null); setShowForm(true); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, border:'none', background:ACCENT, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            <Plus size={13}/> {isMobile ? 'Ajouter' : 'Nouvelle dépense'}
          </button>
        </div>
      </div>

      {editExpense && <EditExpenseModal expense={editExpense} workspaceId={activeWorkspace?.id} onSave={() => { setEditExpense(null); fetchExpenses(); }} onClose={() => setEditExpense(null)}/>}

      {showForm && (
        <AddExpenseForm
          prefill={ocrPrefill}
          workspaceId={activeWorkspace?.id}
          onSave={() => { setShowForm(false); setOcrPrefill(null); fetchExpenses(); }}
          onCancel={() => { setShowForm(false); setOcrPrefill(null); }}
        />
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:10, marginBottom:20 }}>
        {[
          { label:'Total dépenses',  value:formatEuro(totalFiltered), color:ACCENT,    tip: TIPS.depenses },
          { label:'Indemnités km',   value:formatEuro(totalKm),       color:'#5BA3C7', tip: TIPS.indemnite_km },
          { label:'Nb dépenses',     value:filtered.length,           color:'#5BC78A', tip: null },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:6 }}>
              <p style={{ fontSize:10, color:'rgba(237,232,219,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>{s.label}</p>
              {s.tip && <Tooltip text={s.tip} size={11} />}
            </div>
            <p style={{ fontSize:isMobile?18:22, fontWeight:700, color:s.color, margin:0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap', overflowX: isMobile ? 'auto' : 'visible' }}>
        {[{ id:'tous', label:'Toutes' }, ...TYPES].map(t => (
          <button key={t.id} onClick={() => setFilterType(t.id)} style={{ padding:'6px 12px', borderRadius:20, border:`1px solid ${filterType===t.id?(t.color||ACCENT):'rgba(255,255,255,0.1)'}`, background:filterType===t.id?`${t.color||ACCENT}20`:'transparent', color:filterType===t.id?(t.color||ACCENT):'rgba(237,232,219,0.4)', fontSize:11, fontWeight:filterType===t.id?700:500, cursor:'pointer', whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TABLEAU DESKTOP */}
      {!isMobile && (
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, overflow:'hidden' }}>
          {loading ? <div style={{ padding:40, textAlign:'center', color:'rgba(237,232,219,0.4)', fontSize:13 }}>Chargement...</div>
          : filtered.length === 0 ? (
            <div style={{ padding:48, textAlign:'center' }}>
              <CheckCircle size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom:12 }}/>
              <p style={{ color:'rgba(237,232,219,0.3)', fontSize:13, margin:0 }}>{expenses.length===0?'Aucune dépense — cliquez sur "Nouvelle dépense"':'Aucune dépense pour ce filtre'}</p>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                  {[
                    'Date', 'Catégorie', 'Fournisseur',
                    <span key="ttc" style={{ display:'flex', alignItems:'center', gap:4 }}>Montant TTC <Tooltip text={TIPS.montant_ttc} size={11} /></span>,
                    <span key="km" style={{ display:'flex', alignItems:'center', gap:4 }}>Indemnité km <Tooltip text={TIPS.indemnite_km} size={11} /></span>,
                    'Justificatif', '',
                  ].map((h, i) => (
                    <th key={i} style={{ padding:'11px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'rgba(237,232,219,0.3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e,i) => (
                  <tr key={e.id||i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={ev=>ev.currentTarget.style.background='rgba(255,255,255,0.03)'}
                    onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'rgba(237,232,219,0.4)' }}>{formatDate(e.date)}</td>
                    <td style={{ padding:'11px 14px' }}><TypeBadge type={e.type}/></td>
                    <td style={{ padding:'11px 14px', fontSize:13, color:'#EDE8DB', fontWeight:500 }}>{e.etablissement||'—'}</td>
                    <td style={{ padding:'11px 14px', fontSize:13, fontWeight:700, color:ACCENT }}>{formatEuro(e.amount_ttc)}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'#5BA3C7' }}>{e.indemnite_km?`${formatEuro(e.indemnite_km)} (${e.km} km)`:'—'}</td>
                    <td style={{ padding:'11px 14px' }}>
                      {e.file_url
                        ? <button onClick={() => window.open(e.file_url, '_blank')} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'#5BA3C7', background:'none', border:'none', cursor:'pointer', fontWeight:600, padding:0 }}><ExternalLink size={11}/> PDF</button>
                        : <span style={{ fontSize:11, color:'rgba(237,232,219,0.2)' }}>—</span>}
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={() => setEditExpense(e)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'rgba(237,232,219,0.3)' }}
                          onMouseEnter={ev=>ev.currentTarget.style.color=ACCENT}
                          onMouseLeave={ev=>ev.currentTarget.style.color='rgba(237,232,219,0.3)'}><Edit2 size={13}/></button>
                        <button onClick={() => deleteExpense(e.id, e.storage_path)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'rgba(237,232,219,0.2)' }}
                          onMouseEnter={ev=>ev.currentTarget.style.color='#C75B4E'}
                          onMouseLeave={ev=>ev.currentTarget.style.color='rgba(237,232,219,0.2)'}><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CARTES MOBILE */}
      {isMobile && (
        <div>
          {loading ? <div style={{ padding:40, textAlign:'center', color:'rgba(237,232,219,0.4)', fontSize:13 }}>Chargement...</div>
          : filtered.length === 0 ? (
            <div style={{ padding:48, textAlign:'center' }}>
              <p style={{ color:'rgba(237,232,219,0.3)', fontSize:13, margin:0 }}>{expenses.length===0?'Aucune dépense — appuyez sur "Ajouter"':'Aucune dépense pour ce filtre'}</p>
            </div>
          ) : filtered.map((e, i) => (
            <div key={e.id||i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'14px 16px', marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#EDE8DB', marginBottom:4 }}>{e.etablissement || '—'}</div>
                  <div style={{ fontSize:11, color:'rgba(237,232,219,0.4)' }}>{formatDate(e.date)}</div>
                </div>
                <div style={{ fontSize:16, fontWeight:800, color:ACCENT }}>{formatEuro(e.amount_ttc)}</div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <TypeBadge type={e.type}/>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  {e.file_url && (
                    <button onClick={() => window.open(e.file_url, '_blank')} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'#5BA3C7', background:'rgba(91,163,199,0.1)', border:'none', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontWeight:600 }}>
                      <ExternalLink size={11}/> PDF
                    </button>
                  )}
                  <button onClick={() => setEditExpense(e)} style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:6, padding:'6px 8px', cursor:'pointer', color:'rgba(237,232,219,0.5)', display:'flex' }}>
                    <Edit2 size={13}/>
                  </button>
                  <button onClick={() => deleteExpense(e.id, e.storage_path)} style={{ background:'rgba(199,91,78,0.08)', border:'none', borderRadius:6, padding:'6px 8px', cursor:'pointer', color:'#C75B4E', display:'flex' }}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
              {e.indemnite_km && (
                <div style={{ marginTop:8, fontSize:11, color:'#5BA3C7' }}>🚗 {e.km} km — {formatEuro(e.indemnite_km)}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
