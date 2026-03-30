import { useState, useEffect, useRef } from 'react';
import { supabasePro } from '../lib/supabasePro';
import { Plus, Trash2, Edit2, FileCheck, AlertTriangle, CheckCircle, Clock, Bell, ExternalLink } from 'lucide-react';
import ExportButton from '../components/ExportButton';
import DateFilter from '../components/DateFilter';
import Tooltip from '../components/Tooltip';
import { TIPS } from '../utils/tooltips';
import { useWorkspace } from '../hooks/useWorkspace.jsx';

const ACCENT = '#5BC78A';
const formatEuro = (n) => n == null ? '—' : new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR' }).format(n);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '—';
const daysUntil = (dateStr) => { if (!dateStr) return null; return Math.ceil((new Date(dateStr) - new Date()) / (1000*60*60*24)); };

function parseOCRDate(str) {
  if (!str) return '';
  const p = str.split('/');
  if (p.length === 3) return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
  return '';
}

const TYPES = [
  { id:'bail',        label:'Bail commercial' },
  { id:'assurance',   label:'Assurance'       },
  { id:'maintenance', label:'Maintenance'      },
  { id:'mandat',      label:'Mandat'           },
  { id:'prestation',  label:'Prestation'       },
  { id:'autre',       label:'Autre'            },
];
const PERIODICITES = [
  { id:'mensuel',     label:'Mensuel'     },
  { id:'trimestriel', label:'Trimestriel' },
  { id:'annuel',      label:'Annuel'      },
  { id:'unique',      label:'Unique'      },
];

function StatutBadge({ contrat }) {
  const days = daysUntil(contrat.date_fin);
  if (!contrat.date_fin) return <span style={{ fontSize:11, color:'rgba(237,232,219,0.3)' }}>—</span>;
  if (days < 0)   return <span style={{ background:'rgba(199,91,78,0.1)',  color:'#C75B4E', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>Expiré</span>;
  if (days <= 30) return <span style={{ background:'rgba(199,91,78,0.1)',  color:'#C75B4E', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>⚠️ {days}j restants</span>;
  if (days <= 60) return <span style={{ background:'rgba(212,168,83,0.1)', color:'#D4A853', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>⏰ {days}j restants</span>;
  return <span style={{ background:'rgba(91,199,138,0.1)', color:'#5BC78A', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>✓ Actif</span>;
}

function ContratForm({ onSave, onCancel, editData=null, prefill=null, workspaceId=null }) {
  const [form, setForm] = useState(editData || {
    nom:                  prefill?.nom_contrat   ?? '',
    type:                 'assurance',
    fournisseur:          prefill?.fournisseur   ?? '',
    date_debut:           prefill?.date          ? parseOCRDate(prefill.date) : '',
    date_fin:             prefill?.date_fin      ? parseOCRDate(prefill.date_fin) : '',
    montant_periodique:   prefill?.montant_ttc   ?? '',
    periodicite:          'mensuel',
    reconduction_tacite:  false,
    delai_preavis_jours:  30,
    statut:               'actif',
    notes:                prefill?.description   ?? '',
  });
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const fileRef = useRef();
  const set = (k) => (e) => setForm(f => ({ ...f, [k]:e.target.value }));
  const setCheck = (k) => (e) => setForm(f => ({ ...f, [k]:e.target.checked }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data: { session } } = await supabasePro.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('Session expirée');
      let file_url = editData?.file_url || null;
      let storage_path = editData?.storage_path || null;
      if (file) {
        const ext = file.name.split('.').pop();
        const path = `contrats/${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabasePro.storage.from('invoices').upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabasePro.storage.from('invoices').getPublicUrl(path);
        file_url = urlData.publicUrl; storage_path = path;
      }
      const payload = { ...form, user_id:user.id, workspace_id:workspaceId, montant_periodique:form.montant_periodique?parseFloat(form.montant_periodique):null, delai_preavis_jours:form.delai_preavis_jours?parseInt(form.delai_preavis_jours):null, file_url, storage_path };
      if (editData?.id) { const { error:err } = await supabasePro.from('contrats').update(payload).eq('id', editData.id); if (err) throw err; }
      else { const { error:err } = await supabasePro.from('contrats').insert(payload); if (err) throw err; }
      onSave();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const iS = { width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#EDE8DB', fontSize:13, outline:'none', boxSizing:'border-box' };
  const lS = { fontSize:11, fontWeight:600, color:'rgba(237,232,219,0.5)', marginBottom:5, display:'flex', alignItems:'center', gap:4 };

  return (
    <form onSubmit={handleSubmit} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${prefill?`${ACCENT}40`:'rgba(255,255,255,0.08)'}`, borderRadius:14, padding:24, marginBottom:24 }}>
      {prefill && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:9, background:`${ACCENT}10`, border:`1px solid ${ACCENT}30`, marginBottom:18 }}>
          <CheckCircle size={14} color={ACCENT}/>
          <span style={{ fontSize:13, fontWeight:600, color:ACCENT }}>Formulaire pré-rempli depuis l'analyse du document</span>
        </div>
      )}
      <h3 style={{ fontSize:15, fontWeight:700, color:'#EDE8DB', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
        {editData?'Modifier le contrat':'Ajouter un contrat'} <Tooltip text={TIPS.contrats} size={14}/>
      </h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div><label style={lS}>Nom du contrat *</label><input value={form.nom} onChange={set('nom')} required style={iS} placeholder="Ex: Assurance RC Pro"/></div>
        <div><label style={lS}>Type *</label><select value={form.type} onChange={set('type')} style={{ ...iS, cursor:'pointer' }}>{TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
        <div><label style={lS}>Fournisseur / Prestataire</label><input value={form.fournisseur} onChange={set('fournisseur')} style={iS} placeholder="Ex: AXA, Orange..."/></div>
        <div><label style={lS}>Périodicité</label><select value={form.periodicite} onChange={set('periodicite')} style={{ ...iS, cursor:'pointer' }}>{PERIODICITES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
        <div><label style={lS}>Date de début</label><input type="date" value={form.date_debut} onChange={set('date_debut')} style={{ ...iS, colorScheme:'dark' }}/></div>
        <div><label style={lS}>Date de fin / Échéance <Tooltip text={TIPS.date_echeance}/></label><input type="date" value={form.date_fin} onChange={set('date_fin')} style={{ ...iS, colorScheme:'dark' }}/></div>
        <div><label style={lS}>Montant périodique (€)</label><input type="number" step="0.01" min="0" value={form.montant_periodique} onChange={set('montant_periodique')} style={iS} placeholder="0.00"/></div>
        <div><label style={lS}>Délai de préavis (jours) <Tooltip text={TIPS.delai_preavis}/></label><input type="number" min="0" value={form.delai_preavis_jours} onChange={set('delai_preavis_jours')} style={iS} placeholder="30"/></div>
      </div>
      <div style={{ background:form.reconduction_tacite?'rgba(199,91,78,0.06)':'rgba(255,255,255,0.03)', border:`1px solid ${form.reconduction_tacite?'rgba(199,91,78,0.2)':'rgba(255,255,255,0.08)'}`, borderRadius:10, padding:'12px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
        <input type="checkbox" id="reconduction" checked={form.reconduction_tacite} onChange={setCheck('reconduction_tacite')} style={{ width:16, height:16, cursor:'pointer', accentColor:'#C75B4E' }}/>
        <label htmlFor="reconduction" style={{ fontSize:13, color:form.reconduction_tacite?'#C75B4E':'rgba(237,232,219,0.5)', fontWeight:form.reconduction_tacite?600:400, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          Reconduction tacite <Tooltip text={TIPS.reconduction_tacite} />
          {form.reconduction_tacite&&<span style={{ fontSize:11, opacity:0.7 }}>— Alerte {form.delai_preavis_jours}j avant</span>}
        </label>
      </div>
      <div style={{ marginBottom:14 }}><label style={lS}>Notes</label><textarea value={form.notes} onChange={set('notes')} rows={2} style={{ ...iS, resize:'vertical', fontFamily:'inherit' }} placeholder="Conditions particulières..."/></div>
      <div style={{ marginBottom:20 }}>
        <label style={lS}>Document contractuel (PDF)</label>
        <div onClick={()=>fileRef.current?.click()} style={{ border:`2px dashed ${file?ACCENT:'rgba(255,255,255,0.12)'}`, borderRadius:10, padding:14, textAlign:'center', cursor:'pointer', background:file?`${ACCENT}08`:'rgba(255,255,255,0.02)' }}>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display:'none' }} onChange={e=>setFile(e.target.files[0]||null)}/>
          {file?<span style={{ fontSize:12, color:ACCENT, fontWeight:600 }}>✓ {file.name}</span>:editData?.file_url?<span style={{ fontSize:12, color:'#5BC78A', fontWeight:600 }}>✓ Document existant</span>:<span style={{ fontSize:12, color:'rgba(237,232,219,0.3)' }}>Cliquez pour ajouter le contrat PDF</span>}
        </div>
      </div>
      {error&&<div style={{ color:'#C75B4E', fontSize:12, marginBottom:12 }}>{error}</div>}
      <div style={{ display:'flex', gap:10 }}>
        <button type="submit" disabled={loading} style={{ flex:1, padding:'11px', borderRadius:9, border:'none', background:loading?`${ACCENT}50`:ACCENT, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>{loading?'Enregistrement...':'✓ Enregistrer le contrat'}</button>
        <button type="button" onClick={onCancel} style={{ padding:'11px 18px', borderRadius:9, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'rgba(237,232,219,0.5)', fontSize:13, cursor:'pointer' }}>Annuler</button>
      </div>
    </form>
  );
}

export default function ContratsPage() {
  const [contrats,    setContrats]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [editContrat, setEditContrat] = useState(null);
  const [filterType,  setFilterType]  = useState('tous');
  const [dateRange,   setDateRange]   = useState({ debut:'', fin:'' });
  const [ocrPrefill,  setOcrPrefill]  = useState(null);
  const { activeWorkspace } = useWorkspace();

  useEffect(() => {
    if (activeWorkspace) fetchContrats();
    try {
      const raw = sessionStorage.getItem('ocr_prefill');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.source === 'prohome_ocr' && data.type_document === 'contrat') {
          setOcrPrefill(data); setShowForm(true);
          sessionStorage.removeItem('ocr_prefill');
        }
      }
    } catch {}
  }, [activeWorkspace]);

  const fetchContrats = async () => {
    setLoading(true);
    const { data: { session } } = await supabasePro.auth.getSession();
    const user = session?.user;
    if (!user) return;
    const { data } = await supabasePro.from('contrats').select('*')
      .eq('user_id', user.id)
      .eq('workspace_id', activeWorkspace?.id)
      .order('date_fin', { ascending:true });
    setContrats(data || []);
    setLoading(false);
  };

  const deleteContrat = async (id, storage_path) => {
    if (!confirm('Supprimer ce contrat ?')) return;
    if (storage_path) await supabasePro.storage.from('invoices').remove([storage_path]);
    await supabasePro.from('contrats').delete().eq('id', id);
    fetchContrats();
  };

  let filtered = filterType === 'tous' ? contrats : contrats.filter(c => c.type === filterType);
  if (dateRange.debut) filtered = filtered.filter(c => c.date_debut >= dateRange.debut);
  if (dateRange.fin)   filtered = filtered.filter(c => c.date_fin   <= dateRange.fin);

  const alertes     = contrats.filter(c => { const d = daysUntil(c.date_fin); return d !== null && d <= 60 && d >= 0; });
  const expires     = contrats.filter(c => { const d = daysUntil(c.date_fin); return d !== null && d < 0; });
  const totalAnnuel = contrats.reduce((s, c) => {
    const m = c.montant_periodique || 0;
    if (c.periodicite === 'mensuel')     return s + m * 12;
    if (c.periodicite === 'trimestriel') return s + m * 4;
    return s + m;
  }, 0);

  const contratsExport = contrats.map(c => ({ ...c, reconduction_label: c.reconduction_tacite ? 'Oui' : 'Non' }));

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:1000, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:'#EDE8DB', margin:0, display:'flex', alignItems:'center', gap:8 }}>
            Contrats & Assurances <Tooltip text={TIPS.contrats} size={16}/>
          </h1>
          <p style={{ fontSize:13, color:'rgba(237,232,219,0.4)', marginTop:4 }}>Suivi des échéances et reconductions tacites</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <DateFilter onChange={setDateRange} color={ACCENT}/>
          <ExportButton data={contratsExport} filename={`contrats-${new Date().getFullYear()}`} color={ACCENT}
            columns={[
              { key:'nom', label:'Nom' }, { key:'type', label:'Type' },
              { key:'fournisseur', label:'Fournisseur' }, { key:'date_debut', label:'Début' },
              { key:'date_fin', label:'Fin' }, { key:'montant_periodique', label:'Montant (€)' },
              { key:'periodicite', label:'Périodicité' }, { key:'reconduction_label', label:'Reconduction tacite' },
              { key:'delai_preavis_jours', label:'Préavis (j)' },
            ]}/>
          <button onClick={() => { setShowForm(true); setEditContrat(null); setOcrPrefill(null); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, border:'none', background:ACCENT, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            <Plus size={13}/> Ajouter un contrat
          </button>
        </div>
      </div>

      {(alertes.length > 0 || expires.length > 0) && (
        <div style={{ background:'rgba(199,91,78,0.06)', border:'1px solid rgba(199,91,78,0.2)', borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}><Bell size={14} color="#C75B4E"/><span style={{ fontSize:13, fontWeight:700, color:'#C75B4E' }}>Alertes échéances</span></div>
          {expires.map(c => <p key={c.id} style={{ fontSize:12, color:'#C75B4E', margin:'3px 0' }}>⚠️ <strong>{c.nom}</strong> ({c.fournisseur}) — expiré depuis {Math.abs(daysUntil(c.date_fin))} jours</p>)}
          {alertes.map(c => <p key={c.id} style={{ fontSize:12, color:'#5BC78A', margin:'3px 0' }}>⏰ <strong>{c.nom}</strong> ({c.fournisseur}) — expire dans {daysUntil(c.date_fin)} jours{c.reconduction_tacite&&<span style={{ marginLeft:6, fontSize:11, opacity:0.8 }}>— reconduction tacite, préavis {c.delai_preavis_jours}j</span>}</p>)}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Contrats actifs',  value:contrats.length,        color:ACCENT,    icon:FileCheck   },
          { label:'Alertes',          value:alertes.length,         color:'#D4A853', icon:Clock,       alert:alertes.length>0 },
          { label:'Expirés',          value:expires.length,         color:'#C75B4E', icon:AlertTriangle, alert:expires.length>0 },
          { label:'Coût annuel est.', value:formatEuro(totalAnnuel), color:'#5BC78A', icon:CheckCircle },
        ].map((s,idx) => { const Icon = s.icon; return (
          <div key={idx} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${s.alert?'rgba(199,91,78,0.3)':'rgba(255,255,255,0.08)'}`, borderRadius:12, padding:'16px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <p style={{ fontSize:11, color:'rgba(237,232,219,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>{s.label}</p>
              <Icon size={14} color={s.color}/>
            </div>
            <p style={{ fontSize:22, fontWeight:700, color:s.alert?'#C75B4E':s.color, margin:0 }}>{s.value}</p>
          </div>
        );})}
      </div>

      {(showForm || editContrat) && (
        <ContratForm
          editData={editContrat}
          prefill={ocrPrefill}
          workspaceId={activeWorkspace?.id}
          onSave={() => { setShowForm(false); setEditContrat(null); setOcrPrefill(null); fetchContrats(); }}
          onCancel={() => { setShowForm(false); setEditContrat(null); setOcrPrefill(null); }}
        />
      )}

      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {[{id:'tous',label:'Tous'},...TYPES].map(t=>(
          <button key={t.id} onClick={()=>setFilterType(t.id)} style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${filterType===t.id?ACCENT:'rgba(255,255,255,0.1)'}`, background:filterType===t.id?`${ACCENT}20`:'transparent', color:filterType===t.id?ACCENT:'rgba(237,232,219,0.4)', fontSize:12, fontWeight:filterType===t.id?700:500, cursor:'pointer' }}>{t.label}</button>
        ))}
      </div>

      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, overflow:'hidden' }}>
        {loading ? <div style={{ padding:40, textAlign:'center', color:'rgba(237,232,219,0.4)', fontSize:13 }}>Chargement...</div>
        : filtered.length === 0 ? (
          <div style={{ padding:48, textAlign:'center' }}><FileCheck size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom:12 }}/><p style={{ color:'rgba(237,232,219,0.3)', fontSize:13, margin:0 }}>{contrats.length===0?'Aucun contrat — cliquez sur "Ajouter un contrat"':'Aucun contrat pour ce filtre'}</p></div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                {['Contrat','Fournisseur','Type','Montant','Échéance','Statut',''].map((h,i)=>(
                  <th key={i} style={{ padding:'11px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'rgba(237,232,219,0.3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c,i)=>(
                <tr key={c.id||i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={ev=>ev.currentTarget.style.background='rgba(255,255,255,0.03)'}
                  onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'11px 14px' }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'#EDE8DB', margin:0 }}>{c.nom}</p>
                    {c.reconduction_tacite&&<p style={{ fontSize:10, color:'#C75B4E', margin:'2px 0 0' }}>Reconduction tacite — préavis {c.delai_preavis_jours}j</p>}
                  </td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'rgba(237,232,219,0.5)' }}>{c.fournisseur||'—'}</td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'rgba(237,232,219,0.5)' }}>{TYPES.find(t=>t.id===c.type)?.label||c.type}</td>
                  <td style={{ padding:'11px 14px', fontSize:13, fontWeight:600, color:ACCENT }}>{formatEuro(c.montant_periodique)}{c.periodicite&&<span style={{ fontSize:10, color:'rgba(237,232,219,0.3)', fontWeight:400, marginLeft:4 }}>/{c.periodicite}</span>}</td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'rgba(237,232,219,0.5)' }}>{formatDate(c.date_fin)}</td>
                  <td style={{ padding:'11px 14px' }}><StatutBadge contrat={c}/></td>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                      {c.file_url&&<button onClick={() => window.open(c.file_url, '_blank')} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'#5BA3C7', background:'none', border:'none', cursor:'pointer', fontWeight:600, padding:4 }}><ExternalLink size={11}/> PDF</button>}
                      <button onClick={()=>{setEditContrat(c);setShowForm(false);}} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'rgba(237,232,219,0.2)' }} onMouseEnter={ev=>ev.currentTarget.style.color=ACCENT} onMouseLeave={ev=>ev.currentTarget.style.color='rgba(237,232,219,0.2)'}><Edit2 size={13}/></button>
                      <button onClick={()=>deleteContrat(c.id, c.storage_path)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'rgba(237,232,219,0.2)' }} onMouseEnter={ev=>ev.currentTarget.style.color='#C75B4E'} onMouseLeave={ev=>ev.currentTarget.style.color='rgba(237,232,219,0.2)'}><Trash2 size={13}/></button>
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
