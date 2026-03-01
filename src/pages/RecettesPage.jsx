import { useState, useEffect } from 'react';
import { supabasePro } from '../lib/supabasePro';
import {
  Plus, Trash2, Edit2, Send, CheckCircle, Clock, XCircle,
  AlertTriangle, Download, Users, FileText, TrendingUp, RefreshCw
} from 'lucide-react';

const ACCENT = '#5BA3C7';

const formatEuro = (n) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/* ── Statuts ── */
const STATUTS = [
  { id: 'brouillon',  label: 'Brouillon',   color: '#9AA0AE', bg: '#F0F2F5' },
  { id: 'envoye',     label: 'Envoyé',       color: '#5BA3C7', bg: 'rgba(91,163,199,0.1)' },
  { id: 'signe',      label: 'Signé',        color: '#5BC78A', bg: 'rgba(91,199,138,0.1)' },
  { id: 'encaisse',   label: 'Encaissé',     color: '#A85BC7', bg: 'rgba(168,91,199,0.1)' },
  { id: 'en_retard',  label: 'En retard',    color: '#C75B4E', bg: 'rgba(199,91,78,0.1)' },
  { id: 'annule',     label: 'Annulé',       color: '#D0D4DC', bg: '#F8F9FB' },
];

function StatutBadge({ statut }) {
  const s = STATUTS.find(x => x.id === statut) || STATUTS[0];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
    }}>
      {s.label}
    </span>
  );
}

/* ══════════════════════════════════════════
   FORMULAIRE CLIENT
══════════════════════════════════════════ */
function ClientForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', adresse: '', siret: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      const { error: err } = await supabasePro.from('clients').insert({ ...form, user_id: user.id });
      if (err) throw err;
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    background: '#F8F9FB', border: '1px solid #E8EAF0',
    color: '#1A1C20', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #E8EAF0', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1C20', marginBottom: 20 }}>Nouveau client</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#5A6070', marginBottom: 5, display: 'block' }}>Nom / Raison sociale *</label>
          <input value={form.nom} onChange={set('nom')} required style={inputStyle} placeholder="Ex: SARL Dupont" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#5A6070', marginBottom: 5, display: 'block' }}>Email *</label>
          <input type="email" value={form.email} onChange={set('email')} required style={inputStyle} placeholder="contact@client.fr" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#5A6070', marginBottom: 5, display: 'block' }}>Téléphone</label>
          <input value={form.telephone} onChange={set('telephone')} style={inputStyle} placeholder="06 00 00 00 00" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#5A6070', marginBottom: 5, display: 'block' }}>SIRET</label>
          <input value={form.siret} onChange={set('siret')} style={inputStyle} placeholder="000 000 000 00000" />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#5A6070', marginBottom: 5, display: 'block' }}>Adresse</label>
        <input value={form.adresse} onChange={set('adresse')} style={inputStyle} placeholder="1 rue de la Paix, 75001 Paris" />
      </div>
      {error && <div style={{ color: '#C75B4E', fontSize: 12, marginBottom: 12 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Enregistrement...' : '✓ Enregistrer le client'}
        </button>
        <button type="button" onClick={onCancel} style={{ padding: '10px 18px', borderRadius: 9, border: '1px solid #E8EAF0', background: '#fff', color: '#5A6070', fontSize: 13, cursor: 'pointer' }}>
          Annuler
        </button>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════
   FORMULAIRE DEVIS
══════════════════════════════════════════ */
function DevisForm({ clients, onSave, onCancel, editData = null }) {
  const today = new Date().toISOString().split('T')[0];
  const in30  = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState(editData || {
    client_id    : '',
    numero       : `DEV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-001`,
    date_emission: today,
    date_validite: in30,
    date_echeance: in30,
    montant_ht   : '',
    tva_taux     : '20',
    montant_ttc  : '',
    statut       : 'brouillon',
    description  : '',
    notes        : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(f => {
      const updated = { ...f, [k]: val };
      // Calcul automatique TTC
      if (k === 'montant_ht' || k === 'tva_taux') {
        const ht  = parseFloat(k === 'montant_ht' ? val : f.montant_ht) || 0;
        const tva = parseFloat(k === 'tva_taux'   ? val : f.tva_taux)   || 0;
        updated.montant_ttc = (ht * (1 + tva / 100)).toFixed(2);
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      const payload = {
        ...form,
        user_id    : user.id,
        montant_ht : parseFloat(form.montant_ht)  || null,
        tva_taux   : parseFloat(form.tva_taux)    || null,
        montant_ttc: parseFloat(form.montant_ttc) || null,
      };
      if (editData?.id) {
        const { error: err } = await supabasePro.from('devis').update(payload).eq('id', editData.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabasePro.from('devis').insert(payload);
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
    background: '#F8F9FB', border: '1px solid #E8EAF0',
    color: '#1A1C20', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#5A6070', marginBottom: 5, display: 'block' };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #E8EAF0', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1C20', marginBottom: 20 }}>
        {editData ? 'Modifier le devis' : 'Nouveau devis'}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Client *</label>
          <select value={form.client_id} onChange={set('client_id')} required style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Sélectionner un client</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Numéro de devis *</label>
          <input value={form.numero} onChange={set('numero')} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Date d'émission *</label>
          <input type="date" value={form.date_emission} onChange={set('date_emission')} required style={{ ...inputStyle, colorScheme: 'light' }} />
        </div>
        <div>
          <label style={labelStyle}>Date de validité</label>
          <input type="date" value={form.date_validite} onChange={set('date_validite')} style={{ ...inputStyle, colorScheme: 'light' }} />
        </div>
        <div>
          <label style={labelStyle}>Date d'échéance paiement</label>
          <input type="date" value={form.date_echeance} onChange={set('date_echeance')} style={{ ...inputStyle, colorScheme: 'light' }} />
        </div>
        <div>
          <label style={labelStyle}>Statut</label>
          <select value={form.statut} onChange={set('statut')} style={{ ...inputStyle, cursor: 'pointer' }}>
            {STATUTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Description de la prestation *</label>
        <textarea value={form.description} onChange={set('description')} required rows={3}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          placeholder="Décrivez les prestations, livrables, conditions..." />
      </div>

      {/* Montants */}
      <div style={{ background: '#F8F9FB', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#5A6070', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Montants</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Montant HT (€) *</label>
            <input type="number" step="0.01" min="0" value={form.montant_ht} onChange={set('montant_ht')} required style={inputStyle} placeholder="0.00" />
          </div>
          <div>
            <label style={labelStyle}>TVA (%)</label>
            <select value={form.tva_taux} onChange={set('tva_taux')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="0">0% (exonéré)</option>
              <option value="5.5">5,5%</option>
              <option value="10">10%</option>
              <option value="20">20%</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Montant TTC (€)</label>
            <input type="number" step="0.01" value={form.montant_ttc} onChange={set('montant_ttc')}
              style={{ ...inputStyle, background: '#EEF0F4', fontWeight: 700, color: ACCENT }} readOnly />
          </div>
        </div>
        <p style={{ fontSize: 10, color: '#9AA0AE', marginTop: 8 }}>
          ⚠️ Les montants sont indicatifs. Validez avec votre expert-comptable.
        </p>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>Notes internes</label>
        <input value={form.notes} onChange={set('notes')} style={inputStyle} placeholder="Commentaires internes (non visibles sur le devis)" />
      </div>

      {error && <div style={{ color: '#C75B4E', fontSize: 12, marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={loading} style={{ flex: 1, padding: '11px', borderRadius: 9, border: 'none', background: loading ? `${ACCENT}50` : ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Enregistrement...' : '✓ Enregistrer le devis'}
        </button>
        <button type="button" onClick={onCancel} style={{ padding: '11px 18px', borderRadius: 9, border: '1px solid #E8EAF0', background: '#fff', color: '#5A6070', fontSize: 13, cursor: 'pointer' }}>
          Annuler
        </button>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════ */
export default function RecettesPage() {
  const [tab, setTab]           = useState('devis');
  const [devis, setDevis]       = useState([]);
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showDevisForm, setShowDevisForm]   = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editDevis, setEditDevis]           = useState(null);
  const [filterStatut, setFilterStatut]     = useState('tous');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabasePro.auth.getUser();
    if (!user) return;
    const [{ data: d }, { data: c }] = await Promise.all([
      supabasePro.from('devis').select('*, clients(nom, email)').eq('user_id', user.id).order('date_emission', { ascending: false }),
      supabasePro.from('clients').select('*').eq('user_id', user.id).order('nom'),
    ]);
    setDevis(d || []);
    setClients(c || []);
    setLoading(false);
  };

  const deleteDevis = async (id) => {
    if (!confirm('Supprimer ce devis ?')) return;
    await supabasePro.from('devis').delete().eq('id', id);
    fetchAll();
  };

  const deleteClient = async (id) => {
    if (!confirm('Supprimer ce client ?')) return;
    await supabasePro.from('clients').delete().eq('id', id);
    fetchAll();
  };

  const changerStatut = async (id, statut) => {
    await supabasePro.from('devis').update({ statut }).eq('id', id);
    fetchAll();
  };

  const envoyerRelance = async (d) => {
    const count = (d.relance_count || 0) + 1;
    await supabasePro.from('devis').update({
      relance_count   : count,
      derniere_relance: new Date().toISOString().split('T')[0],
    }).eq('id', d.id);
    // Insérer dans reminders
    await supabasePro.from('reminders').insert({
      user_id   : d.user_id,
      invoice_id: null,
      context   : 'pro',
      type      : 'relance',
      message   : `Relance ${count} envoyée à ${d.clients?.nom} pour le devis ${d.numero} (${formatEuro(d.montant_ttc)})`,
      sent_at   : new Date().toISOString(),
    });
    alert(`Relance ${count} enregistrée pour ${d.clients?.nom}`);
    fetchAll();
  };

  const exportCSV = () => {
    const rows = filtered.map(d => [
      d.numero, d.clients?.nom, d.date_emission, d.date_echeance,
      d.montant_ht, d.tva_taux, d.montant_ttc, d.statut, d.relance_count || 0
    ]);
    const headers = ['N° Devis', 'Client', 'Date émission', 'Échéance', 'HT', 'TVA%', 'TTC', 'Statut', 'Nb relances'];
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `devis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filtered = filterStatut === 'tous' ? devis : devis.filter(d => d.statut === filterStatut);

  // Stats
  const totalSigne    = devis.filter(d => d.statut === 'signe').reduce((s, d) => s + (d.montant_ttc || 0), 0);
  const totalEncaisse = devis.filter(d => d.statut === 'encaisse').reduce((s, d) => s + (d.montant_ttc || 0), 0);
  const enRetard      = devis.filter(d => {
    const days = daysUntil(d.date_echeance);
    return (d.statut === 'signe' || d.statut === 'envoye') && days !== null && days < 0;
  });

  return (
    <div style={{ fontFamily: "'Nunito Sans', sans-serif", padding: '32px 28px', maxWidth: 1000, margin: '0 auto' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: '#1A1C20', margin: 0 }}>
            Recettes
          </h1>
          <p style={{ fontSize: 13, color: '#9AA0AE', marginTop: 4 }}>Devis, clients et suivi des encaissements</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: '1px solid #E8EAF0', background: '#fff', color: '#5A6070', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Download size={13} /> Exporter CSV
          </button>
          <button onClick={() => { setShowClientForm(true); setShowDevisForm(false); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: `1px solid ${ACCENT}`, background: '#fff', color: ACCENT, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Users size={13} /> Nouveau client
          </button>
          <button onClick={() => { setShowDevisForm(true); setShowClientForm(false); setEditDevis(null); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={13} /> Nouveau devis
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Devis signés',    value: formatEuro(totalSigne),    color: '#5BC78A', icon: CheckCircle },
          { label: 'Encaissé',        value: formatEuro(totalEncaisse), color: '#A85BC7', icon: TrendingUp  },
          { label: 'En retard',       value: enRetard.length,           color: '#C75B4E', icon: AlertTriangle, alert: enRetard.length > 0 },
          { label: 'Clients',         value: clients.length,            color: ACCENT,    icon: Users       },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background: '#fff', border: `1px solid ${s.alert ? 'rgba(199,91,78,0.3)' : '#E8EAF0'}`, borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: 11, color: '#9AA0AE', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{s.label}</p>
                <Icon size={14} color={s.color} />
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: s.alert ? '#C75B4E' : s.color, margin: 0 }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Formulaires */}
      {showClientForm && <ClientForm onSave={() => { setShowClientForm(false); fetchAll(); }} onCancel={() => setShowClientForm(false)} />}
      {(showDevisForm || editDevis) && (
        <DevisForm
          clients={clients}
          editData={editDevis}
          onSave={() => { setShowDevisForm(false); setEditDevis(null); fetchAll(); }}
          onCancel={() => { setShowDevisForm(false); setEditDevis(null); }}
        />
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, background: '#F0F2F5', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{ id: 'devis', label: 'Devis', icon: FileText }, { id: 'clients', label: 'Clients', icon: Users }].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 8, border: 'none',
              background: tab === t.id ? '#fff' : 'transparent',
              color: tab === t.id ? '#1A1C20' : '#9AA0AE',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 500, cursor: 'pointer',
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 150ms ease',
            }}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Devis */}
      {tab === 'devis' && (
        <>
          {/* Filtres statut */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[{ id: 'tous', label: 'Tous', color: '#9AA0AE' }, ...STATUTS].map(s => (
              <button key={s.id} onClick={() => setFilterStatut(s.id)} style={{
                padding: '5px 14px', borderRadius: 20,
                border: `1px solid ${filterStatut === s.id ? s.color : '#E8EAF0'}`,
                background: filterStatut === s.id ? `${s.color}15` : '#fff',
                color: filterStatut === s.id ? s.color : '#5A6070',
                fontSize: 12, fontWeight: filterStatut === s.id ? 700 : 500, cursor: 'pointer',
              }}>
                {s.label}
              </button>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid #E8EAF0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9AA0AE', fontSize: 13 }}>Chargement...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <FileText size={32} color="#E8EAF0" style={{ marginBottom: 12 }} />
                <p style={{ color: '#9AA0AE', fontSize: 13, margin: 0 }}>
                  {devis.length === 0 ? 'Aucun devis — cliquez sur "Nouveau devis"' : 'Aucun devis pour ce filtre'}
                </p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F0F2F5' }}>
                    {['N° Devis', 'Client', 'Émission', 'Échéance', 'Montant TTC', 'Statut', 'Relances', ''].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9AA0AE', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => {
                    const days = daysUntil(d.date_echeance);
                    const isLate = (d.statut === 'signe' || d.statut === 'envoye') && days !== null && days < 0;
                    return (
                      <tr key={d.id || i}
                        style={{ borderBottom: '1px solid #F8F9FB', background: isLate ? 'rgba(199,91,78,0.02)' : 'transparent' }}
                        onMouseEnter={ev => ev.currentTarget.style.background = isLate ? 'rgba(199,91,78,0.04)' : '#FAFBFC'}
                        onMouseLeave={ev => ev.currentTarget.style.background = isLate ? 'rgba(199,91,78,0.02)' : 'transparent'}
                      >
                        <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: '#1A1C20' }}>{d.numero}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, color: '#1A1C20' }}>{d.clients?.nom || '—'}</td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#5A6070' }}>{formatDate(d.date_emission)}</td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: isLate ? '#C75B4E' : '#5A6070', fontWeight: isLate ? 700 : 400 }}>
                          {formatDate(d.date_echeance)}
                          {isLate && <span style={{ fontSize: 10, marginLeft: 4 }}>({Math.abs(days)}j)</span>}
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: ACCENT }}>{formatEuro(d.montant_ttc)}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <select value={d.statut} onChange={e => changerStatut(d.id, e.target.value)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, outline: 'none', color: STATUTS.find(s => s.id === d.statut)?.color || '#9AA0AE' }}>
                            {STATUTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#9AA0AE' }}>
                          {d.relance_count || 0} relance{(d.relance_count || 0) > 1 ? 's' : ''}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {(d.statut === 'signe' || d.statut === 'envoye') && (
                              <button onClick={() => envoyerRelance(d)} title="Enregistrer une relance"
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: '#D4A853' }}
                                onMouseEnter={ev => ev.currentTarget.style.color = '#B8860B'}
                                onMouseLeave={ev => ev.currentTarget.style.color = '#D4A853'}
                              >
                                <RefreshCw size={13} />
                              </button>
                            )}
                            <button onClick={() => { setEditDevis(d); setShowDevisForm(false); }} title="Modifier"
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: '#9AA0AE' }}
                              onMouseEnter={ev => ev.currentTarget.style.color = ACCENT}
                              onMouseLeave={ev => ev.currentTarget.style.color = '#9AA0AE'}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => deleteDevis(d.id)} title="Supprimer"
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: '#D0D4DC' }}
                              onMouseEnter={ev => ev.currentTarget.style.color = '#C75B4E'}
                              onMouseLeave={ev => ev.currentTarget.style.color = '#D0D4DC'}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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

      {/* Tab Clients */}
      {tab === 'clients' && (
        <div style={{ background: '#fff', border: '1px solid #E8EAF0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {clients.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Users size={32} color="#E8EAF0" style={{ marginBottom: 12 }} />
              <p style={{ color: '#9AA0AE', fontSize: 13, margin: 0 }}>Aucun client — cliquez sur "Nouveau client"</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F0F2F5' }}>
                  {['Nom', 'Email', 'Téléphone', 'SIRET', ''].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9AA0AE', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => (
                  <tr key={c.id || i} style={{ borderBottom: '1px solid #F8F9FB' }}
                    onMouseEnter={ev => ev.currentTarget.style.background = '#FAFBFC'}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#1A1C20' }}>{c.nom}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#5A6070' }}>{c.email}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#5A6070' }}>{c.telephone || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#5A6070' }}>{c.siret || '—'}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <button onClick={() => deleteClient(c.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: '#D0D4DC' }}
                        onMouseEnter={ev => ev.currentTarget.style.color = '#C75B4E'}
                        onMouseLeave={ev => ev.currentTarget.style.color = '#D0D4DC'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
