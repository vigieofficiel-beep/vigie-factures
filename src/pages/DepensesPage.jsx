import { useState, useEffect, useRef } from 'react';
import { supabasePro } from '../lib/supabasePro';
import { Upload, Plus, Trash2, FileText, Car, Coffee, Hotel, Package, AlertTriangle, CheckCircle, Loader, Download, Scan } from 'lucide-react';

const ACCENT = '#5BC78A';

/* ── Types de frais ── */
const TYPES = [
  { id: 'restauration', label: 'Restauration',  icon: Coffee,   color: '#D4A853' },
  { id: 'transport',    label: 'Transport',      icon: Car,      color: '#5BA3C7' },
  { id: 'logement',     label: 'Logement',       icon: Hotel,    color: '#A85BC7' },
  { id: 'fournitures',  label: 'Fournitures',    icon: Package,  color: '#5BC78A' },
  { id: 'autre',        label: 'Autre',          icon: FileText, color: '#9AA0AE' },
];

const TYPE_MAP = {
  'Services': 'autre',
  'Transport': 'transport',
  'Alimentation': 'restauration',
  'Logement': 'logement',
  'Fournitures': 'fournitures',
  'Autre': 'autre',
};

const TAUX_KM = 0.529;

const formatEuro = (n) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function TypeBadge({ type }) {
  const t = TYPES.find(x => x.id === type) || TYPES[4];
  const Icon = t.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: `${t.color}15`, color: t.color,
      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
    }}>
      <Icon size={11} /> {t.label}
    </span>
  );
}

/* ══════════════════════════════════════════
   FORMULAIRE AJOUT FRAIS
══════════════════════════════════════════ */
function AddExpenseForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount_ttc: '',
    type: 'restauration',
    etablissement: '',
    km: '',
    notes: '',
  });
  const [file, setFile]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [error, setError]       = useState('');
  const fileRef = useRef();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  /* ── OCR : scan de la facture ── */
 const handleScan = async (selectedFile) => {
  if (!selectedFile) return;
  setScanning(true);
  setOcrSuccess(false);
  setError('');

  try {
    let base64;
    let mimeType;

    if (selectedFile.type === 'application/pdf') {
      // Convertir la 1ère page du PDF en image PNG via pdfjs-dist
      const pdfjsLib = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';

      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

      base64 = canvas.toDataURL('image/png').split(',')[1];
      mimeType = 'image/png';
    } else {
      // Image directe
      base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
      mimeType = selectedFile.type;
    }

    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64: base64, mimeType, fileName: selectedFile.name }),
    });

    if (!res.ok) throw new Error('Erreur serveur OCR');
    const data = await res.json();

    setForm(f => ({
      ...f,
      date: data.date
        ? (() => {
            const parts = data.date.split('/');
            if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
            return f.date;
          })()
        : f.date,
      amount_ttc: data.montant_ttc ?? f.amount_ttc,
      etablissement: data.fournisseur ?? f.etablissement,
      notes: data.description ?? f.notes,
      type: TYPE_MAP[data.categorie] ?? f.type,
    }));

    setOcrSuccess(true);
  } catch (err) {
    console.error(err);
    setError('Impossible de scanner la facture. Vérifiez votre connexion.');
  } finally {
    setScanning(false);
  }
};

      const mimeType = selectedFile.type || 'application/pdf';

      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileBase64: base64, mimeType, fileName: selectedFile.name }),
      });

      if (!res.ok) throw new Error('Erreur serveur OCR');
      const data = await res.json();

      // Remplissage automatique du formulaire
      setForm(f => ({
        ...f,
        date: data.date
          ? (() => {
              const parts = data.date.split('/');
              if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
              return f.date;
            })()
          : f.date,
        amount_ttc: data.montant_ttc ?? f.amount_ttc,
        etablissement: data.fournisseur ?? f.etablissement,
        notes: data.description ?? f.notes,
        type: TYPE_MAP[data.categorie] ?? f.type,
      }));

      setOcrSuccess(true);
    } catch (err) {
      setError('Impossible de scanner la facture. Vérifiez votre connexion.');
    } finally {
      setScanning(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0] || null;
    setFile(f);
    if (f) handleScan(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      if (!user) throw new Error('Non connecté');

      let file_url = null;
      let storage_path = null;

      if (file) {
        const ext  = file.name.split('.').pop();
        const path = `frais/${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabasePro.storage
          .from('invoices')
          .upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabasePro.storage.from('invoices').getPublicUrl(path);
        file_url     = urlData.publicUrl;
        storage_path = path;
      }

      const km = form.type === 'transport' && form.km ? parseFloat(form.km) : null;
      const indemnite_km = km ? parseFloat((km * TAUX_KM).toFixed(2)) : null;

      const { error: insErr } = await supabasePro.from('expenses').insert({
        user_id      : user.id,
        date         : form.date,
        amount_ttc   : form.amount_ttc ? parseFloat(form.amount_ttc) : null,
        type         : form.type,
        etablissement: form.etablissement,
        km,
        indemnite_km,
        notes        : form.notes,
        file_url,
        storage_path,
      });

      if (insErr) throw insErr;
      onSave();
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
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
    <form onSubmit={handleSubmit} style={{
      background: '#fff', border: '1px solid #E8EAF0', borderRadius: 14,
      padding: '24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1C20', marginBottom: 20 }}>
        Ajouter un frais
      </h3>

      {/* Zone upload + scan IA */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Justificatif (photo ou PDF)</label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${ocrSuccess ? ACCENT : file ? '#D4A853' : '#E8EAF0'}`,
            borderRadius: 10, padding: '18px', textAlign: 'center', cursor: 'pointer',
            background: ocrSuccess ? `${ACCENT}08` : file ? '#FFF9F0' : '#F8F9FB',
            transition: 'all 200ms ease', position: 'relative',
          }}
        >
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }}
            onChange={handleFileChange} />

          {scanning ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader size={16} color={ACCENT} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13, color: ACCENT, fontWeight: 600 }}>Analyse IA en cours...</span>
            </div>
          ) : ocrSuccess ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <CheckCircle size={16} color={ACCENT} />
              <span style={{ fontSize: 13, color: ACCENT, fontWeight: 600 }}>✓ Formulaire rempli automatiquement — {file?.name}</span>
            </div>
          ) : file ? (
            <span style={{ fontSize: 12, color: '#D4A853', fontWeight: 600 }}>📄 {file.name}</span>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                <Scan size={16} color={ACCENT} />
                <span style={{ fontSize: 13, color: ACCENT, fontWeight: 700 }}>Scanner avec l'IA</span>
              </div>
              <span style={{ fontSize: 11, color: '#9AA0AE' }}>Uploadez une facture PDF ou photo — les champs se rempliront automatiquement</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Date *</label>
          <input type="date" value={form.date} onChange={set('date')} required style={{ ...inputStyle, colorScheme: 'light' }} />
        </div>
        <div>
          <label style={labelStyle}>Montant TTC (€) *</label>
          <input type="number" step="0.01" min="0" value={form.amount_ttc} onChange={set('amount_ttc')} placeholder="0.00" required style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Type de frais *</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TYPES.map(t => {
            const Icon = t.icon;
            const selected = form.type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: t.id }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 13px', borderRadius: 20, border: `1px solid ${selected ? t.color : '#E8EAF0'}`,
                  background: selected ? `${t.color}15` : '#F8F9FB',
                  color: selected ? t.color : '#5A6070',
                  fontSize: 12, fontWeight: selected ? 700 : 500, cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Établissement / Fournisseur</label>
        <input type="text" value={form.etablissement} onChange={set('etablissement')} placeholder="ex: Restaurant Le Bistrot" style={inputStyle} />
      </div>

      {form.type === 'transport' && (
        <div style={{ marginBottom: 14, background: 'rgba(91,163,199,0.06)', border: '1px solid rgba(91,163,199,0.2)', borderRadius: 10, padding: '12px 14px' }}>
          <label style={{ ...labelStyle, color: '#5BA3C7' }}>Kilométrage (optionnel)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="number" min="0" value={form.km} onChange={set('km')} placeholder="ex: 150" style={{ ...inputStyle, maxWidth: 140 }} />
            <span style={{ fontSize: 12, color: '#5BA3C7', fontWeight: 500 }}>
              {form.km ? `= ${(parseFloat(form.km) * TAUX_KM).toFixed(2)} € (barème 2024)` : 'km × 0,529 €/km'}
            </span>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Notes / Description</label>
        <input type="text" value={form.notes} onChange={set('notes')} placeholder="Commentaire optionnel" style={inputStyle} />
      </div>

      {error && (
        <div style={{ background: 'rgba(199,91,78,0.08)', border: '1px solid rgba(199,91,78,0.2)', borderRadius: 8, padding: '10px 14px', color: '#C75B4E', fontSize: 12, marginBottom: 14 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={loading} style={{
          flex: 1, padding: '11px', borderRadius: 9, border: 'none',
          background: loading ? `${ACCENT}50` : ACCENT,
          color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {loading ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement...</> : '✓ Enregistrer le frais'}
        </button>
        <button type="button" onClick={onCancel} style={{
          padding: '11px 18px', borderRadius: 9, border: '1px solid #E8EAF0',
          background: '#fff', color: '#5A6070', fontSize: 13, cursor: 'pointer',
        }}>
          Annuler
        </button>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════ */
export default function DepensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('tous');

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    const { data: { user } } = await supabasePro.auth.getUser();
    if (!user) return;
    const { data } = await supabasePro
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  };

  const deleteExpense = async (id, storage_path) => {
    if (!confirm('Supprimer ce frais ?')) return;
    if (storage_path) {
      await supabasePro.storage.from('invoices').remove([storage_path]);
    }
    await supabasePro.from('expenses').delete().eq('id', id);
    fetchExpenses();
  };

  const exportCSV = () => {
    const rows = filtered.map(e => [
      e.date, e.type, e.etablissement, e.amount_ttc, e.km, e.indemnite_km, e.notes
    ]);
    const headers = ['Date', 'Type', 'Établissement', 'Montant TTC', 'Km', 'Indemnité Km', 'Notes'];
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `frais-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filtered = filterType === 'tous' ? expenses : expenses.filter(e => e.type === filterType);
  const totalFiltered = filtered.reduce((s, e) => s + (e.amount_ttc || 0), 0);
  const totalKm = filtered.filter(e => e.indemnite_km).reduce((s, e) => s + (e.indemnite_km || 0), 0);

  return (
    <div style={{ fontFamily: "'Nunito Sans', sans-serif", padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: '#1A1C20', margin: 0 }}>
            Dépenses & Frais
          </h1>
          <p style={{ fontSize: 13, color: '#9AA0AE', marginTop: 4 }}>
            Notes de frais et dépenses professionnelles
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={exportCSV} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 9, border: '1px solid #E8EAF0',
            background: '#fff', color: '#5A6070', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            <Download size={13} /> Exporter CSV
          </button>
          <button onClick={() => setShowForm(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 9, border: 'none',
            background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            <Plus size={13} /> Ajouter un frais
          </button>
        </div>
      </div>

      {showForm && (
        <AddExpenseForm
          onSave={() => { setShowForm(false); fetchExpenses(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total frais', value: formatEuro(totalFiltered), color: ACCENT },
          { label: 'Indemnités km', value: formatEuro(totalKm), color: '#5BA3C7' },
          { label: 'Nombre de frais', value: filtered.length, color: '#D4A853' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #E8EAF0', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: 11, color: '#9AA0AE', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {[{ id: 'tous', label: 'Tous' }, ...TYPES].map(t => (
          <button
            key={t.id}
            onClick={() => setFilterType(t.id)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: `1px solid ${filterType === t.id ? (t.color || ACCENT) : '#E8EAF0'}`,
              background: filterType === t.id ? `${t.color || ACCENT}15` : '#fff',
              color: filterType === t.id ? (t.color || ACCENT) : '#5A6070',
              fontSize: 12, fontWeight: filterType === t.id ? 700 : 500, cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E8EAF0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9AA0AE', fontSize: 13 }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <CheckCircle size={32} color="#E8EAF0" style={{ marginBottom: 12 }} />
            <p style={{ color: '#9AA0AE', fontSize: 13, margin: 0 }}>
              {expenses.length === 0 ? 'Aucun frais enregistré — cliquez sur "Ajouter un frais"' : 'Aucun frais pour ce filtre'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F0F2F5' }}>
                {['Date', 'Type', 'Établissement', 'Montant TTC', 'Indemnité km', 'Justificatif', ''].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9AA0AE', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id || i}
                  style={{ borderBottom: '1px solid #F8F9FB' }}
                  onMouseEnter={ev => ev.currentTarget.style.background = '#FAFBFC'}
                  onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#5A6070' }}>{formatDate(e.date)}</td>
                  <td style={{ padding: '11px 14px' }}><TypeBadge type={e.type} /></td>
                  <td style={{ padding: '11px 14px', fontSize: 13, color: '#1A1C20', fontWeight: 500 }}>{e.etablissement || '—'}</td>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: ACCENT }}>{formatEuro(e.amount_ttc)}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#5BA3C7' }}>
                    {e.indemnite_km ? `${formatEuro(e.indemnite_km)} (${e.km} km)` : '—'}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    {e.file_url ? (
                      <a href={e.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#5BA3C7', textDecoration: 'none', fontWeight: 600 }}>
                        Voir ↗
                      </a>
                    ) : <span style={{ fontSize: 11, color: '#D0D4DC' }}>—</span>}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => deleteExpense(e.id, e.storage_path)} style={{
                      background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: '#D0D4DC',
                    }}
                      onMouseEnter={ev => ev.currentTarget.style.color = '#C75B4E'}
                      onMouseLeave={ev => ev.currentTarget.style.color = '#D0D4DC'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
