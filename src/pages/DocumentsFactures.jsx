import { useState } from 'react';
import { Plus, Trash2, Download, Eye, Send, FileText, Building2, User, Calendar, Hash, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { supabasePro } from '../lib/supabasePro';

const TVA_TAUX = [0, 5.5, 10, 20];

function newLigne() {
  return { id: Date.now(), description: '', quantite: 1, prixUnitaire: 0, tva: 20 };
}

function CardSection({ title, icon: Icon, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: 24,
      boxShadow: '0 1px 4px rgba(15,23,42,0.06)', marginBottom: 20,
      border: '1px solid rgba(15,23,42,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Icon size={16} color="#5BA3C7" strokeWidth={2} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function FieldRow({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>{children}</div>;
}

function Field({ label, required, children }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #E2E8F0', background: '#F8FAFC',
  fontSize: 13, color: '#1E293B', outline: 'none',
  fontFamily: "'Nunito Sans', sans-serif",
  boxSizing: 'border-box',
  transition: 'border-color 150ms ease',
};

export default function DocumentsFactures() {
  const [form, setForm] = useState({
    // Émetteur
    emetteurNom: '',
    emetteurAdresse: '',
    emetteurCodePostal: '',
    emetteurVille: '',
    emetteurSiret: '',
    emetteurTvaIntra: '',
    emetteurEmail: '',
    emetteurTel: '',
    // Client
    clientNom: '',
    clientAdresse: '',
    clientCodePostal: '',
    clientVille: '',
    clientSiret: '',
    clientEmail: '',
    // Facture
    numeroFacture: `F-${new Date().getFullYear()}-001`,
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    conditionsPaiement: '30 jours',
    mentionEscompte: 'Pas d\'escompte pour paiement anticipé.',
    mentionPenalites: 'En cas de retard de paiement, des pénalités de 3 fois le taux d\'intérêt légal seront appliquées, ainsi qu\'une indemnité forfaitaire de recouvrement de 40 €.',
    objet: '',
    notes: '',
  });

  const [lignes, setLignes] = useState([newLigne()]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // null | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const updateLigne = (id, key, val) => {
    setLignes(ls => ls.map(l => l.id === id ? { ...l, [key]: val } : l));
  };
  const addLigne = () => setLignes(ls => [...ls, newLigne()]);
  const removeLigne = (id) => setLignes(ls => ls.filter(l => l.id !== id));

  // Calculs
  const calcLigne = (l) => {
    const ht = parseFloat(l.quantite) * parseFloat(l.prixUnitaire) || 0;
    const tvaAmt = ht * (parseFloat(l.tva) / 100);
    return { ht, tvaAmt, ttc: ht + tvaAmt };
  };

  const totaux = lignes.reduce((acc, l) => {
    const c = calcLigne(l);
    acc.ht += c.ht;
    acc.tva += c.tvaAmt;
    acc.ttc += c.ttc;
    return acc;
  }, { ht: 0, tva: 0, ttc: 0 });

  const fmt = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleGenerate = async () => {
    if (!form.emetteurNom || !form.clientNom || !form.numeroFacture) {
      setStatus('error');
      setMessage('Veuillez remplir les champs obligatoires : émetteur, client et numéro de facture.');
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const { data: { session } } = await supabasePro.auth.getSession();

      const payload = {
        form,
        lignes: lignes.map(l => ({ ...l, ...calcLigne(l) })),
        totaux,
        userId: session?.user?.id,
      };

      const res = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Erreur serveur');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.numeroFacture}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setStatus('success');
      setMessage(`Facture ${form.numeroFacture} générée et téléchargée.`);

      // Auto-incrémenter le numéro
      const match = form.numeroFacture.match(/(\d+)$/);
      if (match) {
        const next = String(parseInt(match[1]) + 1).padStart(match[1].length, '0');
        set('numeroFacture', form.numeroFacture.replace(/(\d+)$/, next));
      }

    } catch (e) {
      setStatus('error');
      setMessage('Erreur lors de la génération. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* ALERTE */}
      {status && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          borderRadius: 10, marginBottom: 20,
          background: status === 'success' ? 'rgba(91,199,138,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${status === 'success' ? 'rgba(91,199,138,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: status === 'success' ? '#166534' : '#991B1B',
          fontSize: 13, fontWeight: 500,
        }}>
          {status === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

        {/* COLONNE GAUCHE — Formulaire */}
        <div>

          {/* Émetteur */}
          <CardSection title="Votre entreprise (émetteur)" icon={Building2}>
            <FieldRow>
              <Field label="Raison sociale / Nom" required>
                <input style={inputStyle} value={form.emetteurNom} onChange={e => set('emetteurNom', e.target.value)} placeholder="Ma Société SAS" />
              </Field>
              <Field label="SIRET">
                <input style={inputStyle} value={form.emetteurSiret} onChange={e => set('emetteurSiret', e.target.value)} placeholder="888 362 118 00026" />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="N° TVA intracommunautaire">
                <input style={inputStyle} value={form.emetteurTvaIntra} onChange={e => set('emetteurTvaIntra', e.target.value)} placeholder="FR12345678901" />
              </Field>
              <Field label="Email">
                <input style={inputStyle} type="email" value={form.emetteurEmail} onChange={e => set('emetteurEmail', e.target.value)} placeholder="contact@masociete.fr" />
              </Field>
            </FieldRow>
            <Field label="Adresse">
              <input style={{ ...inputStyle, marginBottom: 8 }} value={form.emetteurAdresse} onChange={e => set('emetteurAdresse', e.target.value)} placeholder="37 bis rue du 13 octobre 1918" />
            </Field>
            <FieldRow>
              <Field label="Code postal">
                <input style={inputStyle} value={form.emetteurCodePostal} onChange={e => set('emetteurCodePostal', e.target.value)} placeholder="02000" />
              </Field>
              <Field label="Ville">
                <input style={inputStyle} value={form.emetteurVille} onChange={e => set('emetteurVille', e.target.value)} placeholder="Laon" />
              </Field>
            </FieldRow>
            <Field label="Téléphone">
              <input style={inputStyle} value={form.emetteurTel} onChange={e => set('emetteurTel', e.target.value)} placeholder="06 00 00 00 00" />
            </Field>
          </CardSection>

          {/* Client */}
          <CardSection title="Client" icon={User}>
            <FieldRow>
              <Field label="Nom / Raison sociale" required>
                <input style={inputStyle} value={form.clientNom} onChange={e => set('clientNom', e.target.value)} placeholder="Client SAS" />
              </Field>
              <Field label="SIRET">
                <input style={inputStyle} value={form.clientSiret} onChange={e => set('clientSiret', e.target.value)} placeholder="123 456 789 00010" />
              </Field>
            </FieldRow>
            <Field label="Adresse">
              <input style={{ ...inputStyle, marginBottom: 8 }} value={form.clientAdresse} onChange={e => set('clientAdresse', e.target.value)} placeholder="10 rue de la Paix" />
            </Field>
            <FieldRow>
              <Field label="Code postal">
                <input style={inputStyle} value={form.clientCodePostal} onChange={e => set('clientCodePostal', e.target.value)} placeholder="75001" />
              </Field>
              <Field label="Ville">
                <input style={inputStyle} value={form.clientVille} onChange={e => set('clientVille', e.target.value)} placeholder="Paris" />
              </Field>
            </FieldRow>
            <Field label="Email">
              <input style={inputStyle} type="email" value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} placeholder="contact@client.fr" />
            </Field>
          </CardSection>

          {/* Infos facture */}
          <CardSection title="Informations de la facture" icon={Hash}>
            <FieldRow>
              <Field label="Numéro de facture" required>
                <input style={inputStyle} value={form.numeroFacture} onChange={e => set('numeroFacture', e.target.value)} placeholder="F-2026-001" />
              </Field>
              <Field label="Objet">
                <input style={inputStyle} value={form.objet} onChange={e => set('objet', e.target.value)} placeholder="Prestation de service..." />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Date d'émission" required>
                <input style={inputStyle} type="date" value={form.dateEmission} onChange={e => set('dateEmission', e.target.value)} />
              </Field>
              <Field label="Date d'échéance">
                <input style={inputStyle} type="date" value={form.dateEcheance} onChange={e => set('dateEcheance', e.target.value)} />
              </Field>
            </FieldRow>
            <Field label="Conditions de paiement">
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.conditionsPaiement} onChange={e => set('conditionsPaiement', e.target.value)}>
                {['Comptant', '15 jours', '30 jours', '45 jours', '60 jours', 'Fin de mois'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>
          </CardSection>

          {/* Lignes de prestation */}
          <CardSection title="Prestations / Produits" icon={FileText}>
            {/* En-têtes */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 80px 100px 80px 90px 32px', gap: 8, marginBottom: 8 }}>
              {['Description', 'Qté', 'Prix HT', 'TVA', 'Total HT', ''].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
              ))}
            </div>

            {lignes.map((l) => (
              <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '3fr 80px 100px 80px 90px 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input
                  style={inputStyle}
                  value={l.description}
                  onChange={e => updateLigne(l.id, 'description', e.target.value)}
                  placeholder="Description de la prestation"
                />
                <input
                  style={{ ...inputStyle, textAlign: 'center' }}
                  type="number" min="0" step="0.01"
                  value={l.quantite}
                  onChange={e => updateLigne(l.id, 'quantite', e.target.value)}
                />
                <input
                  style={{ ...inputStyle, textAlign: 'right' }}
                  type="number" min="0" step="0.01"
                  value={l.prixUnitaire}
                  onChange={e => updateLigne(l.id, 'prixUnitaire', e.target.value)}
                />
                <select
                  style={{ ...inputStyle, textAlign: 'center', cursor: 'pointer' }}
                  value={l.tva}
                  onChange={e => updateLigne(l.id, 'tva', e.target.value)}
                >
                  {TVA_TAUX.map(t => <option key={t} value={t}>{t}%</option>)}
                </select>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#1E293B', padding: '9px 4px' }}>
                  {fmt(calcLigne(l).ht)} €
                </div>
                <button
                  onClick={() => removeLigne(l.id)}
                  disabled={lignes.length === 1}
                  style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: lignes.length === 1 ? 'transparent' : 'rgba(239,68,68,0.08)', color: lignes.length === 1 ? '#CBD5E1' : '#EF4444', cursor: lignes.length === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            <button
              onClick={addLigne}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px dashed rgba(91,163,199,0.4)', background: 'rgba(91,163,199,0.05)', color: '#5BA3C7', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8, fontFamily: "'Nunito Sans', sans-serif" }}
            >
              <Plus size={14} /> Ajouter une ligne
            </button>
          </CardSection>

          {/* Mentions légales */}
          <CardSection title="Mentions légales" icon={AlertCircle}>
            <Field label="Clause de pénalités de retard">
              <textarea
                style={{ ...inputStyle, minHeight: 72, resize: 'vertical', lineHeight: 1.5 }}
                value={form.mentionPenalites}
                onChange={e => set('mentionPenalites', e.target.value)}
              />
            </Field>
            <Field label="Clause d'escompte">
              <textarea
                style={{ ...inputStyle, minHeight: 48, resize: 'vertical', lineHeight: 1.5 }}
                value={form.mentionEscompte}
                onChange={e => set('mentionEscompte', e.target.value)}
              />
            </Field>
            <Field label="Notes complémentaires">
              <textarea
                style={{ ...inputStyle, minHeight: 60, resize: 'vertical', lineHeight: 1.5 }}
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Informations supplémentaires..."
              />
            </Field>
          </CardSection>
        </div>

        {/* COLONNE DROITE — Récap + Actions */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 24,
            boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
            border: '1px solid rgba(15,23,42,0.06)',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 20 }}>Récapitulatif</div>

            {/* Détail TVA par taux */}
            {TVA_TAUX.filter(t => lignes.some(l => parseFloat(l.tva) === t && (parseFloat(l.quantite) * parseFloat(l.prixUnitaire)) > 0)).map(t => {
              const base = lignes.filter(l => parseFloat(l.tva) === t).reduce((s, l) => s + calcLigne(l).ht, 0);
              const tvaAmt = base * (t / 100);
              if (base === 0) return null;
              return (
                <div key={t} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 6 }}>
                  <span>TVA {t}% (base {fmt(base)} €)</span>
                  <span>{fmt(tvaAmt)} €</span>
                </div>
              );
            })}

            <div style={{ borderTop: '1px solid #F1F5F9', margin: '12px 0' }} />

            {[
              { label: 'Total HT', value: totaux.ht, bold: false },
              { label: 'Total TVA', value: totaux.tva, bold: false },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B', marginBottom: 8 }}>
                <span>{r.label}</span>
                <span style={{ fontWeight: r.bold ? 700 : 400 }}>{fmt(r.value)} €</span>
              </div>
            ))}

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 14px', borderRadius: 10, marginTop: 8,
              background: 'linear-gradient(135deg, rgba(91,163,199,0.12), rgba(91,163,199,0.06))',
              border: '1px solid rgba(91,163,199,0.2)',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Total TTC</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#5BA3C7' }}>{fmt(totaux.ttc)} €</span>
            </div>
          </div>

          {/* Bouton générer */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
              background: loading ? '#CBD5E1' : 'linear-gradient(135deg, #5BA3C7, #3D7FA3)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : '0 4px 16px rgba(91,163,199,0.35)',
              transition: 'all 180ms ease',
              fontFamily: "'Nunito Sans', sans-serif",
            }}
          >
            {loading ? (
              <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Génération en cours...</>
            ) : (
              <><Download size={16} /> Générer et télécharger le PDF</>
            )}
          </button>

          <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
            Le PDF est conforme aux obligations légales françaises.
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
