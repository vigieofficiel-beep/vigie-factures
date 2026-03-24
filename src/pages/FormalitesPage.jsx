import { useState, useEffect } from 'react';
import { supabasePro } from '../lib/supabasePro';
import { Plus, Trash2, Edit2, AlertCircle, CheckCircle, Clock, Bell, RefreshCw, Download, Calendar } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace.jsx';

const ACCENT = '#5BC78A';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '—';
const daysUntil = (dateStr) => { if (!dateStr) return null; return Math.ceil((new Date(dateStr) - new Date()) / (1000*60*60*24)); };

const TYPES_PREDEFINIS = [
  { id:'kbis',          label:'Renouvellement Kbis',               icon:'📋', description:'Extrait Kbis — validité 3 mois',                          alerte_j:30, recurrente:false },
  { id:'ag_annuelle',   label:'Assemblée Générale annuelle',        icon:'🏛️', description:'AG obligatoire dans les 6 mois suivant la clôture',       alerte_j:60, recurrente:true, periodicite:12 },
  { id:'cfe',           label:'Cotisation Foncière des Entreprises',icon:'🏢', description:'CFE — échéance 15 décembre chaque année',                 alerte_j:45, recurrente:true, periodicite:12 },
  { id:'beneficiaires', label:'Déclaration bénéficiaires effectifs', icon:'👤', description:'À déclarer dans les 30j après tout changement',           alerte_j:15, recurrente:false },
  { id:'bilan',         label:'Dépôt des comptes annuels',          icon:'📊', description:'Dépôt au greffe dans les 7 mois après clôture',            alerte_j:60, recurrente:true, periodicite:12 },
  { id:'autre',         label:'Autre formalité',                    icon:'📌', description:'Formalité personnalisée',                                  alerte_j:30, recurrente:false },
];

const STATUTS = [
  { id:'a_faire',   label:'À faire',   color:'#5BC78A' },
  { id:'en_cours',  label:'En cours',  color:'#5BA3C7' },
  { id:'fait',      label:'Fait',      color:'#5BC78A' },
  { id:'en_retard', label:'En retard', color:'#C75B4E' },
];

function UrgenceBadge({ dateEcheance, statut }) {
  if (statut === 'fait') return <span style={{ background:'rgba(91,199,138,0.1)', color:'#5BC78A', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>✓ Fait</span>;
  const days = daysUntil(dateEcheance);
  if (days === null) return null;
  if (days < 0)   return <span style={{ background:'rgba(199,91,78,0.1)',  color:'#C75B4E', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>En retard {Math.abs(days)}j</span>;
  if (days <= 15) return <span style={{ background:'rgba(199,91,78,0.1)',  color:'#C75B4E', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>🔴 {days}j</span>;
  if (days <= 30) return <span style={{ background:'rgba(212,168,83,0.1)', color:'#D4A853', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>🟡 {days}j</span>;
  if (days <= 60) return <span style={{ background:'rgba(91,163,199,0.1)', color:'#5BA3C7', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>🔵 {days}j</span>;
  return <span style={{ background:'rgba(91,199,138,0.1)', color:'#5BC78A', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>{days}j</span>;
}

function FormaliteForm({ onSave, onCancel, editData=null, workspaceId=null }) {
  const [typeChoisi, setTypeChoisi] = useState(editData?.type || '');
  const [form, setForm] = useState(editData || {
    type:'', label:'', date_echeance:'', date_alerte:'', statut:'a_faire',
    notes:'', recurrente:false, periodicite_mois:12,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]:e.target.value }));
  const setCheck = (k) => (e) => setForm(f => ({ ...f, [k]:e.target.checked }));

  const choisirType = (t) => {
    setTypeChoisi(t.id);
    const alerteDate = form.date_echeance ? new Date(new Date(form.date_echeance) - t.alerte_j * 86400000).toISOString().split('T')[0] : '';
    setForm(f => ({ ...f, type:t.id, label:t.label, recurrente:t.recurrente||false, periodicite_mois:t.periodicite||12, date_alerte:alerteDate }));
  };

  const handleDateEcheance = (e) => {
    const val = e.target.value;
    const type = TYPES_PREDEFINIS.find(t => t.id === typeChoisi);
    const alerteJ = type?.alerte_j || 30;
    const alerteDate = val ? new Date(new Date(val) - alerteJ * 86400000).toISOString().split('T')[0] : '';
    setForm(f => ({ ...f, date_echeance:val, date_alerte:alerteDate }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      const payload = { ...form, user_id:user.id, workspace_id:workspaceId, periodicite_mois:form.periodicite_mois?parseInt(form.periodicite_mois):null };
      if (editData?.id) { const { error:err } = await supabasePro.from('formalites').update(payload).eq('id', editData.id); if (err) throw err; }
      else { const { error:err } = await supabasePro.from('formalites').insert(payload); if (err) throw err; }
      onSave();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const iS = { width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#EDE8DB', fontSize:13, outline:'none', boxSizing:'border-box' };
  const lS = { fontSize:11, fontWeight:600, color:'rgba(237,232,219,0.5)', marginBottom:5, display:'block' };

  return (
    <form onSubmit={handleSubmit} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:24, marginBottom:24 }}>
      <h3 style={{ fontSize:15, fontWeight:700, color:'#EDE8DB', marginBottom:16 }}>{editData?'Modifier la formalité':'Ajouter une formalité'}</h3>
      {!editData && (
        <div style={{ marginBottom:18 }}>
          <label style={lS}>Type de formalité *</label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:8 }}>
            {TYPES_PREDEFINIS.map(t => (
              <button key={t.id} type="button" onClick={() => choisirType(t)} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', borderRadius:10, textAlign:'left', border:`1px solid ${typeChoisi===t.id?ACCENT:'rgba(255,255,255,0.1)'}`, background:typeChoisi===t.id?`${ACCENT}10`:'rgba(255,255,255,0.03)', cursor:'pointer', transition:'all 150ms ease' }}>
                <span style={{ fontSize:18 }}>{t.icon}</span>
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:typeChoisi===t.id?ACCENT:'#EDE8DB', margin:0 }}>{t.label}</p>
                  <p style={{ fontSize:10, color:'rgba(237,232,219,0.3)', margin:'2px 0 0' }}>{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {(typeChoisi || editData) && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div><label style={lS}>Libellé *</label><input value={form.label} onChange={set('label')} required style={iS}/></div>
            <div><label style={lS}>Statut</label><select value={form.statut} onChange={set('statut')} style={{ ...iS, cursor:'pointer' }}>{STATUTS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
            <div><label style={lS}>Date d'échéance *</label><input type="date" value={form.date_echeance} onChange={handleDateEcheance} required style={{ ...iS, colorScheme:'dark' }}/></div>
            <div><label style={lS}>Date d'alerte (auto)</label><input type="date" value={form.date_alerte} onChange={set('date_alerte')} style={{ ...iS, colorScheme:'dark' }}/></div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'12px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" id="recurrente" checked={form.recurrente} onChange={setCheck('recurrente')} style={{ width:16, height:16, cursor:'pointer', accentColor:ACCENT }}/>
              <label htmlFor="recurrente" style={{ fontSize:13, color:'rgba(237,232,219,0.6)', cursor:'pointer' }}>Formalité récurrente</label>
            </div>
            {form.recurrente && (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <label style={{ fontSize:12, color:'rgba(237,232,219,0.4)' }}>Tous les</label>
                <input type="number" min="1" value={form.periodicite_mois} onChange={set('periodicite_mois')} style={{ ...iS, width:70 }}/>
                <label style={{ fontSize:12, color:'rgba(237,232,219,0.4)' }}>mois</label>
              </div>
            )}
          </div>
          <div style={{ marginBottom:14 }}><label style={lS}>Notes</label><textarea value={form.notes} onChange={set('notes')} rows={2} style={{ ...iS, resize:'vertical', fontFamily:'inherit' }} placeholder="Informations complémentaires..."/></div>
          {error && <div style={{ color:'#C75B4E', fontSize:12, marginBottom:12 }}>{error}</div>}
          <div style={{ display:'flex', gap:10 }}>
            <button type="submit" disabled={loading} style={{ flex:1, padding:'11px', borderRadius:9, border:'none', background:loading?`${ACCENT}50`:ACCENT, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>{loading?'Enregistrement...':'✓ Enregistrer'}</button>
            <button type="button" onClick={onCancel} style={{ padding:'11px 18px', borderRadius:9, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'rgba(237,232,219,0.5)', fontSize:13, cursor:'pointer' }}>Annuler</button>
          </div>
        </>
      )}
    </form>
  );
}

export default function FormalitesPage() {
  const [formalites,    setFormalites]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [editFormalite, setEditFormalite] = useState(null);
  const [filterStatut,  setFilterStatut]  = useState('tous');
  const { activeWorkspace } = useWorkspace();

  useEffect(() => { if (activeWorkspace) fetchFormalites(); }, [activeWorkspace]);

  const fetchFormalites = async () => {
    setLoading(true);
    const { data: { user } } = await supabasePro.auth.getUser();
    if (!user) return;
    const { data } = await supabasePro.from('formalites').select('*')
      .eq('user_id', user.id)
.or(`workspace_id.eq.${activeWorkspace?.id},workspace_id.is.null`)      .order('date_echeance', { ascending:true });
    setFormalites(data || []);
    setLoading(false);
  };

  const marquerFait    = async (id) => { await supabasePro.from('formalites').update({ statut:'fait' }).eq('id', id); fetchFormalites(); };
  const deleteFormalite = async (id) => { if (!confirm('Supprimer cette formalité ?')) return; await supabasePro.from('formalites').delete().eq('id', id); fetchFormalites(); };

  const exportCSV = () => {
    const rows = formalites.map(f => [f.label, f.type, f.date_echeance, f.date_alerte, f.statut, f.recurrente?'Oui':'Non', f.periodicite_mois]);
    const headers = ['Formalité','Type','Échéance','Alerte','Statut','Récurrente','Périodicité (mois)'];
    const csv = [headers, ...rows].map(r => r.map(v => `"${v??''}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8' }));
    a.download = `formalites-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filtered  = filterStatut === 'tous' ? formalites : formalites.filter(f => f.statut === filterStatut);
  const urgentes  = formalites.filter(f => { const d = daysUntil(f.date_echeance); return f.statut !== 'fait' && d !== null && d <= 30; });
  const aFaire    = formalites.filter(f => f.statut === 'a_faire' || f.statut === 'en_cours');
  const faites    = formalites.filter(f => f.statut === 'fait');

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:'#EDE8DB', margin:0 }}>Formalités administratives</h1>
          <p style={{ fontSize:13, color:'rgba(237,232,219,0.4)', marginTop:4 }}>Kbis, AG, CFE et obligations périodiques</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={exportCSV} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:'rgba(237,232,219,0.5)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            <Download size={13}/> Exporter CSV
          </button>
          <button onClick={() => { setShowForm(true); setEditFormalite(null); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:9, border:'none', background:ACCENT, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            <Plus size={13}/> Ajouter
          </button>
        </div>
      </div>

      {urgentes.length > 0 && (
        <div style={{ background:'rgba(199,91,78,0.06)', border:'1px solid rgba(199,91,78,0.2)', borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <Bell size={14} color="#C75B4E"/>
            <span style={{ fontSize:13, fontWeight:700, color:'#C75B4E' }}>{urgentes.length} formalité{urgentes.length>1?'s':''} urgente{urgentes.length>1?'s':''}</span>
          </div>
          {urgentes.map(f => <p key={f.id} style={{ fontSize:12, color:'#5BC78A', margin:'3px 0' }}>⏰ <strong>{f.label}</strong> — échéance le {formatDate(f.date_echeance)} ({daysUntil(f.date_echeance)}j)</p>)}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'À traiter',  value:aFaire.length,      color:ACCENT,    icon:Clock,       alert:aFaire.length>0 },
          { label:'Urgentes',   value:urgentes.length,    color:'#C75B4E', icon:AlertCircle, alert:urgentes.length>0 },
          { label:'Complétées', value:faites.length,      color:'#5BC78A', icon:CheckCircle },
          { label:'Total',      value:formalites.length,  color:'#5BA3C7', icon:Calendar },
        ].map(s => { const Icon = s.icon; return (
          <div key={s.label} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${s.alert?'rgba(199,91,78,0.3)':'rgba(255,255,255,0.08)'}`, borderRadius:12, padding:'16px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <p style={{ fontSize:11, color:'rgba(237,232,219,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>{s.label}</p>
              <Icon size={14} color={s.color}/>
            </div>
            <p style={{ fontSize:22, fontWeight:700, color:s.alert?'#C75B4E':s.color, margin:0 }}>{s.value}</p>
          </div>
        );})}
      </div>

      {(showForm || editFormalite) && (
        <FormaliteForm
          editData={editFormalite}
          workspaceId={activeWorkspace?.id}
          onSave={() => { setShowForm(false); setEditFormalite(null); fetchFormalites(); }}
          onCancel={() => { setShowForm(false); setEditFormalite(null); }}
        />
      )}

      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {[{ id:'tous', label:'Toutes', color:'rgba(237,232,219,0.4)' }, ...STATUTS].map(s => (
          <button key={s.id} onClick={() => setFilterStatut(s.id)} style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${filterStatut===s.id?s.color:'rgba(255,255,255,0.1)'}`, background:filterStatut===s.id?`${s.color}20`:'transparent', color:filterStatut===s.id?s.color:'rgba(237,232,219,0.4)', fontSize:12, fontWeight:filterStatut===s.id?700:500, cursor:'pointer' }}>{s.label}</button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'rgba(237,232,219,0.4)', fontSize:13 }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:48, textAlign:'center', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14 }}>
            <AlertCircle size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom:12 }}/>
            <p style={{ color:'rgba(237,232,219,0.3)', fontSize:13, margin:0 }}>{formalites.length===0?'Aucune formalité — cliquez sur "Ajouter"':'Aucune formalité pour ce filtre'}</p>
          </div>
        ) : filtered.map((f, i) => {
          const type = TYPES_PREDEFINIS.find(t => t.id === f.type);
          const days = daysUntil(f.date_echeance);
          const isUrgent = f.statut !== 'fait' && days !== null && days <= 30;
          return (
            <div key={f.id||i} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${isUrgent?'rgba(199,91,78,0.2)':'rgba(255,255,255,0.08)'}`, borderRadius:12, padding:'16px 18px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
              <span style={{ fontSize:22, flexShrink:0 }}>{type?.icon||'📌'}</span>
              <div style={{ flex:1, minWidth:200 }}>
                <p style={{ fontSize:14, fontWeight:700, color:'#EDE8DB', margin:0 }}>{f.label}</p>
                <p style={{ fontSize:12, color:'rgba(237,232,219,0.4)', margin:'3px 0 0' }}>
                  Échéance : {formatDate(f.date_echeance)}
                  {f.recurrente && <span style={{ marginLeft:8, color:'#5BA3C7' }}>↻ tous les {f.periodicite_mois} mois</span>}
                </p>
                {f.notes && <p style={{ fontSize:11, color:'rgba(237,232,219,0.3)', margin:'3px 0 0', fontStyle:'italic' }}>{f.notes}</p>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                <UrgenceBadge dateEcheance={f.date_echeance} statut={f.statut}/>
                {f.statut !== 'fait' && (
                  <button onClick={() => marquerFait(f.id)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:`1px solid #5BC78A`, background:'rgba(91,199,138,0.08)', color:'#5BC78A', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                    <CheckCircle size={12}/> Fait
                  </button>
                )}
                <button onClick={() => { setEditFormalite(f); setShowForm(false); }} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'rgba(237,232,219,0.2)' }} onMouseEnter={ev=>ev.currentTarget.style.color=ACCENT} onMouseLeave={ev=>ev.currentTarget.style.color='rgba(237,232,219,0.2)'}><Edit2 size={13}/></button>
                <button onClick={() => deleteFormalite(f.id)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'rgba(237,232,219,0.2)' }} onMouseEnter={ev=>ev.currentTarget.style.color='#C75B4E'} onMouseLeave={ev=>ev.currentTarget.style.color='rgba(237,232,219,0.2)'}><Trash2 size={13}/></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
