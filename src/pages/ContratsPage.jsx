import { useState, useEffect, useRef } from 'react';
import { supabasePro } from '../lib/supabasePro';
import { Plus, Trash2, Edit2, FileCheck, AlertTriangle, CheckCircle, Clock, Download, Upload, Bell } from 'lucide-react';
import ExportButton from '../components/ExportButton';

const ACCENT = '#5BC78A';
const formatEuro = (n) => n == null ? '—' : new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR' }).format(n);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '—';
const daysUntil = (dateStr) => { if (!dateStr) return null; return Math.ceil((new Date(dateStr) - new Date()) / (1000*60*60*24)); };

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
  if (!contrat.date_fin) return <span style={{ fontSize:11, color:'#9AA0AE' }}>—</span>;
  if (days < 0)   return <span style={{ background:'rgba(199,91,78,0.1)',  color:'#C75B4E', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>Expiré</span>;
  if (days <= 30) return <span style={{ background:'rgba(199,91,78,0.1)',  color:'#C75B4E', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>⚠️ {days}j restants</span>;
  if (days <= 60) return <span style={{ background:'rgba(212,168,83,0.1)', color:'#5BC78A', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>⏰ {days}j restants</span>;
  return <span style={{ background:'rgba(91,199,138,0.1)', color:'#5BC78A', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>✓ Actif</span>;
}

function ContratForm({ onSave, onCancel, editData=null }) {
  const [form, setForm] = useState(editData || { nom:'', type:'assurance', fournisseur:'', date_debut:'', date_fin:'', montant_periodique:'', periodicite:'mensuel', reconduction_tacite:false, delai_preavis_jours:30, statut:'actif', notes:'' });
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const fileRef = useRef();
  const set = (k) => (e) => setForm(f => ({ ...f, [k]:e.target.value }));
  const setCheck = (k) => (e) => setForm(f => ({ ...f, [k]:e.target.checked }));
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
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
      const payload = { ...form, user_id:user.id, montant_periodique:form.montant_periodique?parseFloat(form.montant_periodique):null, delai_preavis_jours:form.delai_preavis_jours?parseInt(form.delai_preavis_jours):null, file_url, storage_path };
      if (editData?.id) { const { error:err } = await supabasePro.from('contrats').update(payload).eq('id', editData.id); if (err) throw err; }
      else { const { error:err } = await supabasePro.from('contrats').insert(payload); if (err) throw err; }
      onSave();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const inputStyle = { width:'100%', padding:'9px 12px', borderRadius:8, background:'#F8F9FB', border:'1px solid #E8EAF0', color:'#1A1C20', fontSize:13, outline:'none', boxSizing:'border-box' };
  const labelStyle = { fontSize:11, fontWeight:600, color:'#5A6070', marginBottom:5, display:'block' };
  return (
    <form onSubmit={handleSubmit} style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, padding:24, marginBottom:24, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
      <h3 style={{ fontSize:15, fontWeight:700, color:'#1A1C20', marginBottom:20 }}>{editData?'Modifier le contrat':'Ajouter un contrat'}</h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div><label style={labelStyle}>Nom du contrat *</label><input value={form.nom} onChange={set('nom')} required style={inputStyle} placeholder="Ex: Assurance RC Pro"/></div>
        <div><label style={labelStyle}>Type *</label><select value={form.type} onChange={set('type')} style={{ ...inputStyle, cursor:'pointer' }}>{TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
        <div><label style={labelStyle}>Fournisseur / Prestataire</label><input value={form.fournisseur} onChange={set('fournisseur')} style={inputStyle} placeholder="Ex: AXA, Orange..."/></div>
        <div><label style={labelStyle}>Périodicité</label><select value={form.periodicite} onChange={set('periodicite')} style={{ ...inputStyle, cursor:'pointer' }}>{PERIODICITES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
        <div><label style={labelStyle}>Date de début</label><input type="date" value={form.date_debut} onChange={set('date_debut')} style={{ ...inputStyle, colorScheme:'light' }}/></div>
        <div><label style={labelStyle}>Date de fin / Échéance</label><input type="date" value={form.date_fin} onChange={set('date_fin')} style={{ ...inputStyle, colorScheme:'light' }}/></div>
        <div><label style={labelStyle}>Montant périodique (€)</label><input type="number" step="0.01" min="0" value={form.montant_periodique} onChange={set('montant_periodique')} style={inputStyle} placeholder="0.00"/></div>
        <div><label style={labelStyle}>Délai de préavis (jours)</label><input type="number" min="0" value={form.delai_preavis_jours} onChange={set('delai_preavis_jours')} style={inputStyle} placeholder="30"/></div>
      </div>
      <div style={{ background:form.reconduction_tacite?'rgba(199,91,78,0.04)':'#F8F9FB', border:`1px solid ${form.reconduction_tacite?'rgba(199,91,78,0.2)':'#E8EAF0'}`, borderRadius:10, padding:'12px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
        <input type="checkbox" id="reconduction" checked={form.reconduction_tacite} onChange={setCheck('reconduction_tacite')} style={{ width:16, height:16, cursor:'pointer', accentColor:'#C75B4E' }}/>
        <label htmlFor="reconduction" style={{ fontSize:13, color:form.reconduction_tacite?'#C75B4E':'#5A6070', fontWeight:form.reconduction_tacite?600:400, cursor:'pointer' }}>
          Reconduction tacite{form.reconduction_tacite&&<span style={{ fontSize:11, marginLeft:8, opacity:0.7 }}>— Alerte {form.delai_preavis_jours}j avant</span>}
        </label>
      </div>
      <div style={{ marginBottom:14 }}><label style={labelStyle}>Notes</label><textarea value={form.notes} onChange={set('notes')} rows={2} style={{ ...inputStyle, resize:'vertical', fontFamily:'inherit' }} placeholder="Conditions particulières..."/></div>
      <div style={{ marginBottom:20 }}>
        <label style={labelStyle}>Document contractuel (PDF)</label>
        <div onClick={()=>fileRef.current?.click()} style={{ border:`2px dashed ${file?ACCENT:'#E8EAF0'}`, borderRadius:10, padding:14, textAlign:'center', cursor:'pointer', background:file?`${ACCENT}08`:'#F8F9FB' }}>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display:'none' }} onChange={e=>setFile(e.target.files[0]||null)}/>
          {file?<span style={{ fontSize:12, color:ACCENT, fontWeight:600 }}>✓ {file.name}</span>:editData?.file_url?<span style={{ fontSize:12, color:'#5BC78A', fontWeight:600 }}>✓ Document existant</span>:<span style={{ fontSize:12, color:'#9AA0AE' }}>Cliquez pour ajouter le contrat PDF</span>}
        </div>
      </div>
      {error&&<div style={{ color:'#C75B4E', fontSize:12, marginBottom:12 }}>{error}</div>}
      <div style={{ display:'flex', gap:10 }}>
        <button type="submit" disabled={loading} style={{ flex:1, padding:'11px', borderRadius:9, border:'none', background:loading?`${ACCENT}50`:ACCENT, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>{loading?'Enregistrement...':'✓ Enregistrer le contrat'}</button>
        <button type="button" onClick={onCancel} style={{ padding:'11px 18px', borderRadius:9, border:'1px solid #E8EAF0', background:'#fff', color:'#5A6070', fontSize:13, cursor:'pointer' }}>Annuler</button>
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

  useEffect(() => { fetchContrats(); }, []);

  const fetchContrats = async () => {
    setLoading(true);
    const { data: { user } } = await supabasePro.auth.getUser();
    if (!user) return;
    const { data } = await supabasePro.from('contrats').select('*').eq('user_id', user.id).order('date_fin', { ascending:true });
    setContrats(data || []);
    setLoading(false);
  };

  const deleteContrat = async (id, storage_path) => {
    if (!confirm('Supprimer ce contrat ?')) return;
    if (storage_path) await supabasePro.storage.from('invoices').remove([storage_path]);
    await supabasePro.from('contrats').delete().eq('id', id);
    fetchContrats();
  };

  const filtered = filterType === 'tous' ? contrats : contrats.filter(c => c.type === filterType);
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
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:'#1A1C20', margin:0 }}>Contrats & Assurances</h1>
          <p style={{ fontSize:13, color:'#9AA0AE', marginTop:4 }}>Suivi des échéances et reconductions tacites</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <ExportButton
            data={contratsExport}
            filename={`contrats-${new Date().getFullYear()}`}
            color={ACCENT}
            columns={[
              { key:'nom',                label:'Nom' },
              { key:'type',               label:'Type' },
              { key:'fournisseur',        label:'Fournisseur' },
              { key:'date_debut',         label:'Début' },
              { key:'date_fin',           label:'Fin' },
              { key:'montant_periodique', label:'Montant (€)' },
              { key:'periodicite',        label:'Périodicité' },
              { key:'reconduction_label', label:'Reconduction tacite' },
              { key:'delai_preavis_jours',label:'Préavis (j)' },
            ]}
          />
          <button onClick={() => { setShowForm(true); setEditContrat(null); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, border:'none', background:ACCENT, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            <Plus size={13}/> Ajouter un contrat
          </button>
        </div>
      </div>

      {(alertes.length > 0 || expires.length > 0) && (
        <div style={{ background:'rgba(199,91,78,0.04)', border:'1px solid rgba(199,91,78,0.2)', borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}><Bell size={14} color="#C75B4E"/><span style={{ fontSize:13, fontWeight:700, color:'#C75B4E' }}>Alertes échéances</span></div>
          {expires.map(c => <p key={c.id} style={{ fontSize:12, color:'#C75B4E', margin:'3px 0' }}>⚠️ <strong>{c.nom}</strong> ({c.fournisseur}) — expiré depuis {Math.abs(daysUntil(c.date_fin))} jours</p>)}
          {alertes.map(c => <p key={c.id} style={{ fontSize:12, color:'#5BC78A', margin:'3px 0' }}>⏰ <strong>{c.nom}</strong> ({c.fournisseur}) — expire dans {daysUntil(c.date_fin)} jours{c.reconduction_tacite&&<span style={{ marginLeft:6, fontSize:11, opacity:0.8 }}>— reconduction tacite, préavis {c.delai_preavis_jours}j</span>}</p>)}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Contrats actifs',  value:contrats.length,        color:ACCENT,    icon:FileCheck    },
          { label:'Alertes',          value:alertes.length,         color:'#5BC78A', icon:Clock,        alert:alertes.length>0 },
          { label:'Expirés',          value:expires.length,         color:'#C75B4E', icon:AlertTriangle,alert:expires.length>0 },
          { label:'Coût annuel est.', value:formatEuro(totalAnnuel),color:'#5BC78A', icon:CheckCircle  },
        ].map(s => { const Icon = s.icon; return (
          <div key={s.label} style={{ background:'#fff', border:`1px solid ${s.alert?'rgba(199,91,78,0.3)':'#E8EAF0'}`, borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}><p style={{ fontSize:11, color:'#9AA0AE', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>{s.label}</p><Icon size={14} color={s.color}/></div>
            <p style={{ fontSize:22, fontWeight:700, color:s.alert?'#C75B4E':s.color, margin:0 }}>{s.value}</p>
          </div>
        );})}
      </div>

      {(showForm||editContrat) && <ContratForm editData={editContrat} onSave={()=>{setShowForm(false);setEditContrat(null);fetchContrats();}} onCancel={()=>{setShowForm(false);setEditContrat(null);}}/>}

      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {[{id:'tous',label:'Tous'},...TYPES].map(t=>(
          <button key={t.id} onClick={()=>setFilterType(t.id)} style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${filterType===t.id?ACCENT:'#E8EAF0'}`, background:filterType===t.id?`${ACCENT}15`:'#fff', color:filterType===t.id?ACCENT:'#5A6070', fontSize:12, fontWeight:filterType===t.id?700:500, cursor:'pointer' }}>{t.label}</button>
        ))}
      </div>

      <div style={{ background:'#fff', border:'1px solid #E8EAF0', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        {loading ? <div style={{ padding:40, textAlign:'center', color:'#9AA0AE', fontSize:13 }}>Chargement...</div>
        : filtered.length === 0 ? (
          <div style={{ padding:48, textAlign:'center' }}><FileCheck size={32} color="#E8EAF0" style={{ marginBottom:12 }}/><p style={{ color:'#9AA0AE', fontSize:13, margin:0 }}>{contrats.length===0?'Aucun contrat — cliquez sur "Ajouter un contrat"':'Aucun contrat pour ce filtre'}</p></div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ borderBottom:'1px solid #F0F2F5' }}>{['Contrat','Fournisseur','Type','Montant','Échéance','Statut',''].map(h=>(<th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#9AA0AE', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>))}</tr></thead>
            <tbody>
              {filtered.map((c,i)=>(
                <tr key={c.id||i} style={{ borderBottom:'1px solid #F8F9FB' }} onMouseEnter={ev=>ev.currentTarget.style.background='#FAFBFC'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'11px 14px' }}><p style={{ fontSize:13, fontWeight:600, color:'#1A1C20', margin:0 }}>{c.nom}</p>{c.reconduction_tacite&&<p style={{ fontSize:10, color:'#C75B4E', margin:'2px 0 0' }}>Reconduction tacite — préavis {c.delai_preavis_jours}j</p>}</td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'#5A6070' }}>{c.fournisseur||'—'}</td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'#5A6070' }}>{TYPES.find(t=>t.id===c.type)?.label||c.type}</td>
                  <td style={{ padding:'11px 14px', fontSize:13, fontWeight:600, color:ACCENT }}>{formatEuro(c.montant_periodique)}{c.periodicite&&<span style={{ fontSize:10, color:'#9AA0AE', fontWeight:400, marginLeft:4 }}>/{c.periodicite}</span>}</td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'#5A6070' }}>{formatDate(c.date_fin)}</td>
                  <td style={{ padding:'11px 14px' }}><StatutBadge contrat={c}/></td>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                      {c.file_url&&<a href={c.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:'#5BA3C7', textDecoration:'none', fontWeight:600, padding:4 }}>PDF ↗</a>}
                      <button onClick={()=>{setEditContrat(c);setShowForm(false);}} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'#9AA0AE' }} onMouseEnter={ev=>ev.currentTarget.style.color=ACCENT} onMouseLeave={ev=>ev.currentTarget.style.color='#9AA0AE'}><Edit2 size={13}/></button>
                      <button onClick={()=>deleteContrat(c.id, c.storage_path)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'#D0D4DC' }} onMouseEnter={ev=>ev.currentTarget.style.color='#C75B4E'} onMouseLeave={ev=>ev.currentTarget.style.color='#D0D4DC'}><Trash2 size={13}/></button>
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
