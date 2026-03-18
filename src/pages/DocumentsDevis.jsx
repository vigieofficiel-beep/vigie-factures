import { useState } from 'react';
import { Plus, Trash2, FileText, Building2, User, Hash, Printer } from 'lucide-react';
import Tooltip from '../components/Tooltip';
import { TIPS } from '../utils/tooltips';

const TVA_TAUX = [0, 5.5, 10, 20];

function newLigne() {
  return { id: Date.now() + Math.random(), description: '', quantite: 1, prixUnitaire: 0, tva: 20 };
}

function CardSection({ title, icon: Icon, tooltip, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(15,23,42,0.06)', marginBottom: 20, border: '1px solid rgba(15,23,42,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Icon size={16} color="#5BA3C7" strokeWidth={2} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{title}</span>
        {tooltip && <Tooltip text={tooltip} />}
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
      <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inp = {
  width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
  background: '#F8FAFC', fontSize: 13, color: '#1E293B', outline: 'none',
  fontFamily: "'Nunito Sans', sans-serif", boxSizing: 'border-box',
};

export default function DocumentsDevis() {
  const [form, setForm] = useState({
    emetteurNom: '', emetteurAdresse: '', emetteurCodePostal: '', emetteurVille: '',
    emetteurSiret: '', emetteurTvaIntra: '', emetteurEmail: '', emetteurTel: '',
    clientNom: '', clientAdresse: '', clientCodePostal: '', clientVille: '',
    clientSiret: '', clientEmail: '',
    numeroDevis: `D-${new Date().getFullYear()}-001`,
    dateEmission: new Date().toISOString().split('T')[0],
    dateValidite: '',
    objet: '',
    notes: '',
    conditionsPaiement: '30 jours à réception de facture',
  });

  const [lignes, setLignes] = useState([newLigne()]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const updateLigne = (id, k, v) => setLignes(ls => ls.map(l => l.id === id ? { ...l, [k]: v } : l));
  const addLigne = () => setLignes(ls => [...ls, newLigne()]);
  const removeLigne = (id) => setLignes(ls => ls.filter(l => l.id !== id));

  const calcLigne = (l) => {
    const ht = parseFloat(l.quantite) * parseFloat(l.prixUnitaire) || 0;
    const tvaAmt = ht * (parseFloat(l.tva) / 100);
    return { ht, tvaAmt, ttc: ht + tvaAmt };
  };

  const totaux = lignes.reduce((acc, l) => {
    const c = calcLigne(l);
    acc.ht += c.ht; acc.tva += c.tvaAmt; acc.ttc += c.ttc;
    return acc;
  }, { ht: 0, tva: 0, ttc: 0 });

  const fmt = (n) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d) => { if (!d) return ''; const [y, m, j] = d.split('-'); return `${j}/${m}/${y}`; };

  const tvaDetails = {};
  lignes.forEach(l => {
    const t = parseFloat(l.tva);
    if (!tvaDetails[t]) tvaDetails[t] = { base: 0, montant: 0 };
    const c = calcLigne(l);
    tvaDetails[t].base += c.ht;
    tvaDetails[t].montant += c.tvaAmt;
  });

  const genererPDF = () => {
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Devis ${form.numeroDevis}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:11px; color:#1E293B; padding:32px 40px; background:#fff; line-height:1.5; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; padding-bottom:18px; border-bottom:2px solid #5BC78A; }
  .emetteur-nom { font-size:22px; font-weight:800; color:#0F172A; }
  .emetteur-info { margin-top:6px; color:#64748B; font-size:10px; line-height:1.7; }
  .devis-label { font-size:26px; font-weight:800; color:#5BC78A; text-transform:uppercase; letter-spacing:-1px; text-align:right; }
  .devis-meta { margin-top:8px; text-align:right; font-size:10px; line-height:1.8; }
  .devis-meta strong { color:#1E293B; }
  .validite-banner { background:rgba(91,199,138,0.07); border-left:3px solid #5BC78A; padding:8px 12px; border-radius:0 5px 5px 0; margin-bottom:20px; font-size:10.5px; color:#166534; }
  .parties { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px; }
  .partie { padding:12px 14px; border-radius:6px; background:#F8FAFC; border:1px solid #E2E8F0; }
  .partie-title { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#5BC78A; margin-bottom:6px; }
  .partie-nom { font-size:13px; font-weight:700; color:#0F172A; margin-bottom:3px; }
  .partie-detail { font-size:10px; color:#64748B; line-height:1.7; }
  .objet { background:rgba(91,199,138,0.06); border-left:3px solid #5BC78A; padding:8px 12px; border-radius:0 5px 5px 0; margin-bottom:20px; font-size:11px; }
  table.lignes { width:100%; border-collapse:collapse; margin-bottom:20px; font-size:10px; }
  table.lignes thead tr { background:#0F172A; color:#F8FAFC; }
  table.lignes thead th { padding:9px 10px; text-align:left; font-size:8.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; }
  table.lignes thead th.r { text-align:right; }
  table.lignes tbody tr:nth-child(even) { background:#F8FAFC; }
  table.lignes tbody td { padding:9px 10px; border-bottom:1px solid #E2E8F0; }
  table.lignes tbody td.r { text-align:right; font-variant-numeric:tabular-nums; }
  .totaux { display:flex; justify-content:flex-end; margin-bottom:24px; }
  .totaux-box { width:280px; border:1px solid #E2E8F0; border-radius:6px; overflow:hidden; }
  .tot-row { display:flex; justify-content:space-between; padding:7px 12px; font-size:10.5px; border-bottom:1px solid #F1F5F9; }
  .tot-row .tl { color:#64748B; }
  .tot-row .tv { font-variant-numeric:tabular-nums; font-weight:500; }
  .tot-row.ttc { background:#0F172A; border-bottom:none; padding:10px 12px; }
  .tot-row.ttc .tl { color:#fff; font-weight:700; font-size:12px; }
  .tot-row.ttc .tv { color:#5BC78A; font-weight:800; font-size:15px; }
  .conditions { padding:12px 14px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; margin-bottom:16px; font-size:10px; }
  .conditions strong { color:#5BC78A; }
  .signature { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:24px; }
  .sig-box { border-top:1px solid #E2E8F0; padding-top:10px; }
  .sig-label { font-size:9px; color:#94A3B8; text-transform:uppercase; letter-spacing:0.08em; }
  .sig-space { height:50px; }
  .mentions { font-size:9px; color:#94A3B8; line-height:1.7; border-top:1px solid #E2E8F0; padding-top:14px; margin-top:8px; }
  .footer-page { margin-top:16px; text-align:center; font-size:9px; color:#CBD5E1; border-top:1px solid #F1F5F9; padding-top:10px; }
  @media print { body { padding:20px 28px; } @page { margin:10mm; size:A4; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="emetteur-nom">${form.emetteurNom || 'Mon Entreprise'}</div>
    <div class="emetteur-info">
      ${form.emetteurAdresse ? form.emetteurAdresse + '<br>' : ''}
      ${(form.emetteurCodePostal || form.emetteurVille) ? form.emetteurCodePostal + ' ' + form.emetteurVille + '<br>' : ''}
      ${form.emetteurSiret ? 'SIRET : ' + form.emetteurSiret + '<br>' : ''}
      ${form.emetteurTvaIntra ? 'TVA intra : ' + form.emetteurTvaIntra + '<br>' : ''}
      ${form.emetteurEmail ? form.emetteurEmail + '<br>' : ''}
      ${form.emetteurTel ? form.emetteurTel : ''}
    </div>
  </div>
  <div>
    <div class="devis-label">Devis</div>
    <div class="devis-meta">
      N° <strong>${form.numeroDevis}</strong><br>
      Établi le <strong>${fmtDate(form.dateEmission)}</strong><br>
      ${form.dateValidite ? 'Valable jusqu\'au <strong>' + fmtDate(form.dateValidite) + '</strong>' : ''}
    </div>
  </div>
</div>
${form.dateValidite ? `<div class="validite-banner">⏳ Ce devis est valable jusqu'au <strong>${fmtDate(form.dateValidite)}</strong>. Passé ce délai, les tarifs pourront être révisés.</div>` : ''}
<div class="parties">
  <div class="partie">
    <div class="partie-title">Émetteur</div>
    <div class="partie-nom">${form.emetteurNom}</div>
    <div class="partie-detail">
      ${form.emetteurAdresse ? form.emetteurAdresse + '<br>' : ''}
      ${(form.emetteurCodePostal || form.emetteurVille) ? form.emetteurCodePostal + ' ' + form.emetteurVille + '<br>' : ''}
      ${form.emetteurSiret ? 'SIRET : ' + form.emetteurSiret : ''}
    </div>
  </div>
  <div class="partie">
    <div class="partie-title">Destinataire</div>
    <div class="partie-nom">${form.clientNom || '—'}</div>
    <div class="partie-detail">
      ${form.clientAdresse ? form.clientAdresse + '<br>' : ''}
      ${(form.clientCodePostal || form.clientVille) ? form.clientCodePostal + ' ' + form.clientVille + '<br>' : ''}
      ${form.clientSiret ? 'SIRET : ' + form.clientSiret + '<br>' : ''}
      ${form.clientEmail ? form.clientEmail : ''}
    </div>
  </div>
</div>
${form.objet ? `<div class="objet"><strong>Objet :</strong> ${form.objet}</div>` : ''}
<table class="lignes">
  <thead>
    <tr>
      <th style="width:40%">Prestation / Description</th>
      <th class="r" style="width:8%">Qté</th>
      <th class="r" style="width:12%">PU HT</th>
      <th class="r" style="width:8%">TVA</th>
      <th class="r" style="width:12%">HT</th>
      <th class="r" style="width:12%">TTC</th>
    </tr>
  </thead>
  <tbody>
    ${lignes.map(l => { const c = calcLigne(l); return `<tr><td>${l.description || '—'}</td><td class="r">${l.quantite}</td><td class="r">${fmt(l.prixUnitaire)} €</td><td class="r">${l.tva}%</td><td class="r">${fmt(c.ht)} €</td><td class="r">${fmt(c.ttc)} €</td></tr>`; }).join('')}
  </tbody>
</table>
<div class="totaux">
  <div class="totaux-box">
    <div class="tot-row"><span class="tl">Total HT</span><span class="tv">${fmt(totaux.ht)} €</span></div>
    ${Object.entries(tvaDetails).filter(([, d]) => d.base > 0).map(([taux, d]) => `<div class="tot-row"><span class="tl">TVA ${taux}% (base ${fmt(d.base)} €)</span><span class="tv">${fmt(d.montant)} €</span></div>`).join('')}
    <div class="tot-row ttc"><span class="tl">Total TTC</span><span class="tv">${fmt(totaux.ttc)} €</span></div>
  </div>
</div>
<div class="conditions"><strong>Conditions de paiement :</strong> ${form.conditionsPaiement}</div>
${form.notes ? `<div style="margin-bottom:16px;padding:10px 12px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;font-size:10px;color:#92400E"><strong>Note :</strong> ${form.notes}</div>` : ''}
<div class="signature">
  <div class="sig-box"><div class="sig-label">Bon pour accord — Date et signature du client</div><div class="sig-space"></div></div>
  <div class="sig-box"><div class="sig-label">Signature de l'émetteur</div><div class="sig-space"></div></div>
</div>
<div class="mentions">
  <p>Devis établi par ${form.emetteurNom}${form.emetteurSiret ? ' — SIRET ' + form.emetteurSiret : ''}. Ce devis est valable${form.dateValidite ? ' jusqu\'au ' + fmtDate(form.dateValidite) : ' 30 jours'}. La signature du présent devis vaut acceptation des conditions.</p>
</div>
<div class="footer-page">
  ${form.emetteurNom}${form.emetteurSiret ? ' — SIRET ' + form.emetteurSiret : ''} — Devis ${form.numeroDevis} — ${fmt(totaux.ttc)} € TTC
</div>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=900,height=700');
    w.document.write(html);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };

    const match = form.numeroDevis.match(/(\d+)$/);
    if (match) {
      const next = String(parseInt(match[1]) + 1).padStart(match[1].length, '0');
      set('numeroDevis', form.numeroDevis.replace(/(\d+)$/, next));
    }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        <div>

          {/* Section émetteur */}
          <CardSection title="Votre entreprise (émetteur)" icon={Building2}>
            <FieldRow>
              <Field label="Raison sociale / Nom" required>
                <input style={inp} value={form.emetteurNom} onChange={e => set('emetteurNom', e.target.value)} placeholder="Ma Société SAS" />
              </Field>
              <Field label={<>SIRET <Tooltip text={TIPS.siret} /></>}>
                <input style={inp} value={form.emetteurSiret} onChange={e => set('emetteurSiret', e.target.value)} placeholder="888 362 118 00026" />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label={<>N° TVA intracommunautaire <Tooltip text={TIPS.tva_intra} /></>}>
                <input style={inp} value={form.emetteurTvaIntra} onChange={e => set('emetteurTvaIntra', e.target.value)} placeholder="FR12345678901" />
              </Field>
              <Field label="Email">
                <input style={inp} type="email" value={form.emetteurEmail} onChange={e => set('emetteurEmail', e.target.value)} placeholder="contact@masociete.fr" />
              </Field>
            </FieldRow>
            <Field label="Adresse">
              <input style={{ ...inp, marginBottom: 8 }} value={form.emetteurAdresse} onChange={e => set('emetteurAdresse', e.target.value)} placeholder="37 bis rue du 13 octobre 1918" />
            </Field>
            <FieldRow>
              <Field label="Code postal">
                <input style={inp} value={form.emetteurCodePostal} onChange={e => set('emetteurCodePostal', e.target.value)} placeholder="02000" />
              </Field>
              <Field label="Ville">
                <input style={inp} value={form.emetteurVille} onChange={e => set('emetteurVille', e.target.value)} placeholder="Laon" />
              </Field>
            </FieldRow>
            <Field label="Téléphone">
              <input style={inp} value={form.emetteurTel} onChange={e => set('emetteurTel', e.target.value)} placeholder="06 00 00 00 00" />
            </Field>
          </CardSection>

          {/* Section destinataire */}
          <CardSection title="Destinataire" icon={User}>
            <FieldRow>
              <Field label="Nom / Raison sociale" required>
                <input style={inp} value={form.clientNom} onChange={e => set('clientNom', e.target.value)} placeholder="Client SAS" />
              </Field>
              <Field label={<>SIRET <Tooltip text={TIPS.siret} /></>}>
                <input style={inp} value={form.clientSiret} onChange={e => set('clientSiret', e.target.value)} placeholder="123 456 789 00010" />
              </Field>
            </FieldRow>
            <Field label="Adresse">
              <input style={{ ...inp, marginBottom: 8 }} value={form.clientAdresse} onChange={e => set('clientAdresse', e.target.value)} placeholder="10 rue de la Paix" />
            </Field>
            <FieldRow>
              <Field label="Code postal">
                <input style={inp} value={form.clientCodePostal} onChange={e => set('clientCodePostal', e.target.value)} placeholder="75001" />
              </Field>
              <Field label="Ville">
                <input style={inp} value={form.clientVille} onChange={e => set('clientVille', e.target.value)} placeholder="Paris" />
              </Field>
            </FieldRow>
            <Field label="Email">
              <input style={inp} type="email" value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} placeholder="contact@client.fr" />
            </Field>
          </CardSection>

          {/* Section infos devis */}
          <CardSection title="Informations du devis" icon={Hash} tooltip={TIPS.devis}>
            <FieldRow>
              <Field label="Numéro de devis" required>
                <input style={inp} value={form.numeroDevis} onChange={e => set('numeroDevis', e.target.value)} />
              </Field>
              <Field label="Objet">
                <input style={inp} value={form.objet} onChange={e => set('objet', e.target.value)} placeholder="Développement site web..." />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Date d'émission" required>
                <input style={inp} type="date" value={form.dateEmission} onChange={e => set('dateEmission', e.target.value)} />
              </Field>
              <Field label={<>Valable jusqu'au <Tooltip text={TIPS.date_validite} /></>}>
                <input style={inp} type="date" value={form.dateValidite} onChange={e => set('dateValidite', e.target.value)} />
              </Field>
            </FieldRow>
            <Field label={<>Conditions de paiement <Tooltip text={TIPS.conditions_paiement} /></>}>
              <input style={inp} value={form.conditionsPaiement} onChange={e => set('conditionsPaiement', e.target.value)} placeholder="30 jours à réception de facture" />
            </Field>
          </CardSection>

          {/* Section prestations */}
          <CardSection title="Prestations" icon={FileText}>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 70px 100px 70px 85px 32px', gap: 8, marginBottom: 8 }}>
              {[
                'Description', 'Qté',
                <span key="ht" style={{ display:'flex', alignItems:'center', gap:3 }}>Prix HT <Tooltip text={TIPS.ht} size={11} /></span>,
                <span key="tva" style={{ display:'flex', alignItems:'center', gap:3 }}>TVA <Tooltip text={TIPS.taux_tva} size={11} /></span>,
                <span key="totalht" style={{ display:'flex', alignItems:'center', gap:3 }}>Total HT <Tooltip text={TIPS.montant_ht} size={11} /></span>,
                '',
              ].map((h, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
              ))}
            </div>
            {lignes.map(l => (
              <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '3fr 70px 100px 70px 85px 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input style={inp} value={l.description} onChange={e => updateLigne(l.id, 'description', e.target.value)} placeholder="Description..." />
                <input style={{ ...inp, textAlign: 'center' }} type="number" min="0" step="0.01" value={l.quantite} onChange={e => updateLigne(l.id, 'quantite', e.target.value)} />
                <input style={{ ...inp, textAlign: 'right' }} type="number" min="0" step="0.01" value={l.prixUnitaire} onChange={e => updateLigne(l.id, 'prixUnitaire', e.target.value)} />
                <select style={{ ...inp, cursor: 'pointer' }} value={l.tva} onChange={e => updateLigne(l.id, 'tva', e.target.value)}>
                  {TVA_TAUX.map(t => <option key={t} value={t}>{t}%</option>)}
                </select>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#1E293B', padding: '9px 4px' }}>{fmt(calcLigne(l).ht)} €</div>
                <button onClick={() => removeLigne(l.id)} disabled={lignes.length === 1} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: lignes.length === 1 ? 'transparent' : 'rgba(239,68,68,0.08)', color: lignes.length === 1 ? '#CBD5E1' : '#EF4444', cursor: lignes.length === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button onClick={addLigne} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px dashed rgba(91,163,199,0.4)', background: 'rgba(91,163,199,0.05)', color: '#5BA3C7', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8, fontFamily: "'Nunito Sans', sans-serif" }}>
              <Plus size={14} /> Ajouter une ligne
            </button>
          </CardSection>

          {/* Section notes */}
          <CardSection title="Notes" icon={FileText}>
            <Field label="Informations complémentaires">
              <textarea style={{ ...inp, minHeight: 80, resize: 'vertical', lineHeight: 1.5 }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Délai de réalisation, modalités particulières..." />
            </Field>
          </CardSection>
        </div>

        {/* RÉCAP */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(15,23,42,0.06)', border: '1px solid rgba(15,23,42,0.06)', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 20 }}>Récapitulatif</div>
            {Object.entries(tvaDetails).filter(([, d]) => d.base > 0).map(([t, d]) => (
              <div key={t} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 6 }}>
                <span>TVA {t}% (base {fmt(d.base)} €)</span><span>{fmt(d.montant)} €</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #F1F5F9', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B', marginBottom: 8, alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Total HT <Tooltip text={TIPS.ht} size={12} /></span>
              <span>{fmt(totaux.ht)} €</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B', marginBottom: 8, alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Total TVA <Tooltip text={TIPS.tva} size={12} /></span>
              <span>{fmt(totaux.tva)} €</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, marginTop: 8, background: 'linear-gradient(135deg, rgba(91,199,138,0.12), rgba(91,199,138,0.06))', border: '1px solid rgba(91,199,138,0.2)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
                Total TTC <Tooltip text={TIPS.ttc} size={13} />
              </span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#5BC78A' }}>{fmt(totaux.ttc)} €</span>
            </div>
          </div>

          <button onClick={genererPDF} style={{
            width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #5BC78A, #3DA36A)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(91,199,138,0.35)', fontFamily: "'Nunito Sans', sans-serif",
          }}>
            <Printer size={16} /> Générer et imprimer / PDF
          </button>
          <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
            Une fenêtre s'ouvre → "Enregistrer en PDF" dans l'imprimante.
          </div>
        </div>
      </div>
    </div>
  );
}
