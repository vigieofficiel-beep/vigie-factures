import { useState, useEffect } from 'react';
import { supabasePro } from '../lib/supabasePro';
import {
  Plus, Trash2, Edit2, Users, Clock, Car,
  Download, CheckCircle, MapPin, Calendar
} from 'lucide-react';

const ACCENT = '#A85BC7';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const formatEuro = (n) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

const TAUX_KM = 0.529;

const TYPES_POINTAGE = [
  { id: 'presence',     label: 'Présence',     color: '#5BC78A' },
  { id: 'deplacement',  label: 'Déplacement',  color: '#5BA3C7' },
  { id: 'teletravail',  label: 'Télétravail',  color: '#A85BC7' },
  { id: 'absence',      label: 'Absence',      color: '#C75B4E' },
  { id: 'conge',        label: 'Congé',        color: '#5BC78A' },
];

function dureeHeures(debut, fin) {
  if (!debut || !fin) return null;
  const [h1, m1] = debut.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}`;
}

/* ══════════════════════════════════════════
   FORMULAIRE EMPLOYÉ
══════════════════════════════════════════ */
function EmployeForm({ onSave, onCancel, editData = null }) {
  const [form, setForm] = useState(editData || {
    nom: '', prenom: '', poste: '', email: '',
    telephone: '', date_entree: '', statut: 'actif',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      const payload = { ...form, user_id: user.id };
      if (editData?.id) {
        const { error: err } = await supabasePro.from('equipe').update(payload).eq('id', editData.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabasePro.from('equipe').insert(payload);
        if (err) throw err;
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    background: '#F8F9FB', border: '1px solid rgba(255,255,255,0.08)',
    color: '#EDE8DB', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#5A6070', marginBottom: 5, display: 'block' };

  return (
    <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#EDE8DB', marginBottom: 20 }}>
        {editData ? 'Modifier l\'employé' : 'Ajouter un membre'}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Prénom *</label>
          <input value={form.prenom} onChange={set('prenom')} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Nom *</label>
          <input value={form.nom} onChange={set('nom')} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Poste</label>
          <input value={form.poste} onChange={set('poste')} style={inputStyle} placeholder="Ex: Développeur, Commercial..." />
        </div>
        <div>
          <label style={labelStyle}>Statut</label>
          <select value={form.statut} onChange={set('statut')} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" value={form.email} onChange={set('email')} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Date d'entrée</label>
          <input type="date" value={form.date_entree} onChange={set('date_entree')} style={{ ...inputStyle, colorScheme: 'light' }} />
        </div>
      </div>
      {error && <div style={{ color: '#C75B4E', fontSize: 12, marginBottom: 12 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={loading} style={{ flex: 1, padding: '11px', borderRadius: 9, border: 'none', background: loading ? `${ACCENT}50` : ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Enregistrement...' : '✓ Enregistrer'}
        </button>
        <button type="button" onClick={onCancel} style={{ padding: '11px 18px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#5A6070', fontSize: 13, cursor: 'pointer' }}>
          Annuler
        </button>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════
   FORMULAIRE POINTAGE
══════════════════════════════════════════ */
function PointageForm({ employes, onSave, onCancel }) {
  const [form, setForm] = useState({
    employe_id: employes[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    heure_debut: '09:00',
    heure_fin: '18:00',
    type: 'presence',
    km: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabasePro.auth.getUser();
    await supabasePro.from('pointages').insert({
      ...form,
      user_id: user.id,
      km: form.km ? parseFloat(form.km) : null,
    });
    setLoading(false);
    onSave();
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    background: '#F8F9FB', border: '1px solid rgba(255,255,255,0.08)',
    color: '#EDE8DB', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#5A6070', marginBottom: 5, display: 'block' };

  return (
    <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#EDE8DB', marginBottom: 20 }}>Enregistrer un pointage</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Employé *</label>
          <select value={form.employe_id} onChange={set('employe_id')} required style={{ ...inputStyle, cursor: 'pointer' }}>
            {employes.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Date *</label>
          <input type="date" value={form.date} onChange={set('date')} required style={{ ...inputStyle, colorScheme: 'light' }} />
        </div>
        <div>
          <label style={labelStyle}>Heure début</label>
          <input type="time" value={form.heure_debut} onChange={set('heure_debut')} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Heure fin</label>
          <input type="time" value={form.heure_fin} onChange={set('heure_fin')} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Type</label>
          <select value={form.type} onChange={set('type')} style={{ ...inputStyle, cursor: 'pointer' }}>
            {TYPES_POINTAGE.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        {form.type === 'deplacement' && (
          <div>
            <label style={labelStyle}>Kilomètres</label>
            <input type="number" min="0" value={form.km} onChange={set('km')} style={inputStyle} placeholder="Ex: 150" />
          </div>
        )}
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Notes</label>
        <input value={form.notes} onChange={set('notes')} style={inputStyle} placeholder="Lieu, mission..." />
      </div>
      {form.heure_debut && form.heure_fin && (
        <div style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}20`, borderRadius: 8, padding: '8px 14px', marginBottom: 14, fontSize: 12, color: ACCENT, fontWeight: 600 }}>
          Durée : {dureeHeures(form.heure_debut, form.heure_fin) || '—'}
          {form.type === 'deplacement' && form.km && ` — Indemnité km : ${formatEuro(parseFloat(form.km) * TAUX_KM)}`}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={loading} style={{ flex: 1, padding: '11px', borderRadius: 9, border: 'none', background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Enregistrement...' : '✓ Enregistrer le pointage'}
        </button>
        <button type="button" onClick={onCancel} style={{ padding: '11px 18px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#5A6070', fontSize: 13, cursor: 'pointer' }}>
          Annuler
        </button>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════ */
export default function EquipePage() {
  const [tab, setTab]           = useState('equipe');
  const [employes, setEmployes] = useState([]);
  const [pointages, setPointages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showEmployeForm, setShowEmployeForm]   = useState(false);
  const [showPointageForm, setShowPointageForm] = useState(false);
  const [editEmploye, setEditEmploye]           = useState(null);
  const [filterMois, setFilterMois]             = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabasePro.auth.getUser();
    if (!user) return;
    const [{ data: emp }, { data: pts }] = await Promise.all([
      supabasePro.from('equipe').select('*').eq('user_id', user.id).order('nom'),
      supabasePro.from('pointages').select('*').eq('user_id', user.id).order('date', { ascending: false }),
    ]);
    setEmployes(emp || []);
    setPointages(pts || []);
    setLoading(false);
  };

  const deleteEmploye = async (id) => {
    if (!confirm('Supprimer ce membre ?')) return;
    await supabasePro.from('equipe').delete().eq('id', id);
    fetchAll();
  };

  const deletePointage = async (id) => {
    await supabasePro.from('pointages').delete().eq('id', id);
    fetchAll();
  };

  const exportCSV = () => {
    const rows = pointagesFiltres.map(p => {
      const emp = employes.find(e => e.id === p.employe_id);
      return [
        p.date,
        emp ? `${emp.prenom} ${emp.nom}` : '—',
        p.type, p.heure_debut, p.heure_fin,
        dureeHeures(p.heure_debut, p.heure_fin) || '',
        p.km || '', p.km ? (p.km * TAUX_KM).toFixed(2) : '',
        p.notes || '',
      ];
    });
    const headers = ['Date', 'Employé', 'Type', 'Début', 'Fin', 'Durée', 'Km', 'Indemnité km (€)', 'Notes'];
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `pointages-${filterMois}.csv`;
    a.click();
  };

  const pointagesFiltres = pointages.filter(p => p.date?.startsWith(filterMois));
  const totalKm = pointagesFiltres.filter(p => p.km).reduce((s, p) => s + (p.km || 0), 0);
  const totalIndemnites = totalKm * TAUX_KM;

  return (
    <div style={{ fontFamily: "'Nunito Sans', sans-serif", padding: '32px 28px', maxWidth: 1000, margin: '0 auto' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: '#EDE8DB', margin: 0 }}>
            Équipe & Déplacements
          </h1>
          <p style={{ fontSize: 13, color: '#9AA0AE', marginTop: 4 }}>
            Pointages bruts et suivi des déplacements
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#5A6070', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Download size={13} /> Exporter CSV
          </button>
          {tab === 'equipe' ? (
            <button onClick={() => { setShowEmployeForm(true); setEditEmploye(null); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Plus size={13} /> Ajouter un membre
            </button>
          ) : (
            <button onClick={() => setShowPointageForm(true)} disabled={employes.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: 'none', background: employes.length === 0 ? '#E8EAF0' : ACCENT, color: employes.length === 0 ? '#9AA0AE' : '#fff', fontSize: 12, fontWeight: 700, cursor: employes.length === 0 ? 'not-allowed' : 'pointer' }}>
              <Plus size={13} /> Nouveau pointage
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Membres actifs',   value: employes.filter(e => e.statut === 'actif').length, color: ACCENT,    icon: Users    },
          { label: 'Pointages ce mois',value: pointagesFiltres.length,                           color: '#5BA3C7', icon: Clock    },
          { label: 'Km ce mois',       value: `${totalKm} km`,                                   color: '#5BC78A', icon: Car      },
          { label: 'Indemnités km',    value: formatEuro(totalIndemnites),                        color: '#5BC78A', icon: MapPin   },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: 11, color: '#9AA0AE', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{s.label}</p>
                <Icon size={14} color={s.color} />
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div style={{ background: 'rgba(212,168,83,0.06)', border: '1px solid rgba(212,168,83,0.2)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 12, color: '#9AA0AE' }}>
        ⚠️ Vigie enregistre uniquement les pointages bruts horodatés. Aucun calcul de paie ou d'heures supplémentaires n'est effectué.
      </div>

      {/* Formulaires */}
      {(showEmployeForm || editEmploye) && (
        <EmployeForm
          editData={editEmploye}
          onSave={() => { setShowEmployeForm(false); setEditEmploye(null); fetchAll(); }}
          onCancel={() => { setShowEmployeForm(false); setEditEmploye(null); }}
        />
      )}
      {showPointageForm && employes.length > 0 && (
        <PointageForm
          employes={employes}
          onSave={() => { setShowPointageForm(false); fetchAll(); }}
          onCancel={() => setShowPointageForm(false)}
        />
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, background: '#F0F2F5', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{ id: 'equipe', label: 'Équipe', icon: Users }, { id: 'pointages', label: 'Pointages', icon: Clock }].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 8, border: 'none',
              background: tab === t.id ? '#fff' : 'transparent',
              color: tab === t.id ? '#1A1C20' : '#9AA0AE',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 500, cursor: 'pointer',
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Équipe */}
      {tab === 'equipe' && (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9AA0AE', fontSize: 13 }}>Chargement...</div>
          ) : employes.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Users size={32} color="#E8EAF0" style={{ marginBottom: 12 }} />
              <p style={{ color: '#9AA0AE', fontSize: 13, margin: 0 }}>Aucun membre — cliquez sur "Ajouter un membre"</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F0F2F5' }}>
                  {['Membre', 'Poste', 'Email', 'Entrée', 'Statut', ''].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9AA0AE', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employes.map((e, i) => (
                  <tr key={e.id || i} style={{ borderBottom: '1px solid #F8F9FB' }}
                    onMouseEnter={ev => ev.currentTarget.style.background = '#FAFBFC'}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${ACCENT}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: ACCENT, flexShrink: 0 }}>
                          {(e.prenom?.[0] || '') + (e.nom?.[0] || '')}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#EDE8DB' }}>{e.prenom} {e.nom}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#5A6070' }}>{e.poste || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#5A6070' }}>{e.email || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#5A6070' }}>{formatDate(e.date_entree)}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ background: e.statut === 'actif' ? 'rgba(91,199,138,0.1)' : '#F0F2F5', color: e.statut === 'actif' ? '#5BC78A' : '#9AA0AE', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                        {e.statut === 'actif' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setEditEmploye(e); setShowEmployeForm(false); }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: '#9AA0AE' }}
                          onMouseEnter={ev => ev.currentTarget.style.color = ACCENT}
                          onMouseLeave={ev => ev.currentTarget.style.color = '#9AA0AE'}
                        ><Edit2 size={13} /></button>
                        <button onClick={() => deleteEmploye(e.id)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: '#D0D4DC' }}
                          onMouseEnter={ev => ev.currentTarget.style.color = '#C75B4E'}
                          onMouseLeave={ev => ev.currentTarget.style.color = '#D0D4DC'}
                        ><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab Pointages */}
      {tab === 'pointages' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#5A6070' }}>Mois :</label>
            <input type="month" value={filterMois} onChange={e => setFilterMois(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, outline: 'none', colorScheme: 'light' }} />
            <span style={{ fontSize: 12, color: '#9AA0AE' }}>{pointagesFiltres.length} pointage{pointagesFiltres.length > 1 ? 's' : ''}</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {pointagesFiltres.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <Clock size={32} color="#E8EAF0" style={{ marginBottom: 12 }} />
                <p style={{ color: '#9AA0AE', fontSize: 13, margin: 0 }}>
                  {employes.length === 0 ? 'Ajoutez d\'abord des membres à votre équipe' : 'Aucun pointage ce mois'}
                </p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F0F2F5' }}>
                    {['Date', 'Employé', 'Type', 'Horaires', 'Durée', 'Km / Indemnité', ''].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9AA0AE', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pointagesFiltres.map((p, i) => {
                    const emp  = employes.find(e => e.id === p.employe_id);
                    const type = TYPES_POINTAGE.find(t => t.id === p.type);
                    const duree = dureeHeures(p.heure_debut, p.heure_fin);
                    return (
                      <tr key={p.id || i} style={{ borderBottom: '1px solid #F8F9FB' }}
                        onMouseEnter={ev => ev.currentTarget.style.background = '#FAFBFC'}
                        onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#5A6070' }}>{formatDate(p.date)}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#EDE8DB' }}>
                          {emp ? `${emp.prenom} ${emp.nom}` : '—'}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ background: `${type?.color || '#9AA0AE'}15`, color: type?.color || '#9AA0AE', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>
                            {type?.label || p.type}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#5A6070' }}>
                          {p.heure_debut && p.heure_fin ? `${p.heure_debut} → ${p.heure_fin}` : '—'}
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 600, color: ACCENT }}>
                          {duree || '—'}
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#5BA3C7' }}>
                          {p.km ? `${p.km} km — ${formatEuro(p.km * TAUX_KM)}` : '—'}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <button onClick={() => deletePointage(p.id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: '#D0D4DC' }}
                            onMouseEnter={ev => ev.currentTarget.style.color = '#C75B4E'}
                            onMouseLeave={ev => ev.currentTarget.style.color = '#D0D4DC'}
                          ><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
