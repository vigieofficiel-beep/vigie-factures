// api/generate-invoice.js
// Génère un PDF de facture conforme droit français
// Utilise uniquement du HTML → PDF via puppeteer-core + @sparticuz/chromium

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { form, lignes, totaux } = req.body;

    const fmt = (n) =>
      Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const fmtDate = (d) => {
      if (!d) return '';
      const [y, m, j] = d.split('-');
      return `${j}/${m}/${y}`;
    };

    // Regrouper TVA par taux
    const tvaDetails = {};
    lignes.forEach((l) => {
      const taux = parseFloat(l.tva);
      if (!tvaDetails[taux]) tvaDetails[taux] = { base: 0, montant: 0 };
      tvaDetails[taux].base += l.ht;
      tvaDetails[taux].montant += l.tvaAmt;
    });

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 11px;
    color: #1E293B;
    padding: 40px 48px;
    background: #fff;
    line-height: 1.5;
  }

  /* HEADER */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 36px;
    padding-bottom: 24px;
    border-bottom: 2px solid #5BA3C7;
  }
  .logo-area h1 {
    font-size: 26px;
    font-weight: 800;
    color: #0F172A;
    letter-spacing: -0.5px;
  }
  .logo-area h1 span { color: #5BA3C7; }
  .logo-area .emetteur-info {
    margin-top: 8px;
    color: #64748B;
    font-size: 10.5px;
    line-height: 1.7;
  }
  .facture-meta {
    text-align: right;
  }
  .facture-meta .label {
    font-size: 28px;
    font-weight: 800;
    color: #5BA3C7;
    letter-spacing: -1px;
    text-transform: uppercase;
  }
  .facture-meta table {
    margin-top: 10px;
    margin-left: auto;
    border-collapse: collapse;
  }
  .facture-meta td {
    padding: 3px 6px;
    font-size: 10.5px;
  }
  .facture-meta td:first-child {
    color: #94A3B8;
    text-align: right;
    padding-right: 10px;
  }
  .facture-meta td:last-child {
    font-weight: 600;
    color: #1E293B;
  }

  /* PARTIES */
  .parties {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 32px;
  }
  .partie-box {
    padding: 14px 16px;
    border-radius: 8px;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
  }
  .partie-box .partie-title {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #5BA3C7;
    margin-bottom: 8px;
  }
  .partie-box .partie-nom {
    font-size: 13px;
    font-weight: 700;
    color: #0F172A;
    margin-bottom: 4px;
  }
  .partie-box .partie-detail {
    font-size: 10.5px;
    color: #64748B;
    line-height: 1.7;
  }

  /* OBJET */
  .objet-bar {
    background: rgba(91,163,199,0.08);
    border-left: 3px solid #5BA3C7;
    padding: 10px 14px;
    border-radius: 0 6px 6px 0;
    margin-bottom: 24px;
    font-size: 11px;
    color: #1E293B;
  }
  .objet-bar strong { color: #5BA3C7; }

  /* TABLEAU LIGNES */
  table.lignes {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
    font-size: 10.5px;
  }
  table.lignes thead tr {
    background: #0F172A;
    color: #F8FAFC;
  }
  table.lignes thead th {
    padding: 10px 12px;
    text-align: left;
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  table.lignes thead th.right { text-align: right; }
  table.lignes tbody tr:nth-child(even) { background: #F8FAFC; }
  table.lignes tbody td {
    padding: 10px 12px;
    border-bottom: 1px solid #E2E8F0;
    color: #1E293B;
  }
  table.lignes tbody td.right {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  table.lignes tbody td.desc { max-width: 300px; }

  /* TOTAUX */
  .totaux-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 32px;
  }
  .totaux-box {
    width: 320px;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    overflow: hidden;
  }
  .totaux-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 14px;
    font-size: 11px;
    border-bottom: 1px solid #F1F5F9;
  }
  .totaux-row .tot-label { color: #64748B; }
  .totaux-row .tot-val { font-variant-numeric: tabular-nums; font-weight: 500; color: #1E293B; }
  .totaux-row.ttc {
    background: #0F172A;
    padding: 12px 14px;
    border-bottom: none;
  }
  .totaux-row.ttc .tot-label { color: #fff; font-weight: 700; font-size: 13px; }
  .totaux-row.ttc .tot-val { color: #5BA3C7; font-weight: 800; font-size: 16px; }

  /* PAIEMENT */
  .paiement-section {
    margin-bottom: 24px;
    padding: 14px 16px;
    background: #F8FAFC;
    border-radius: 8px;
    border: 1px solid #E2E8F0;
  }
  .paiement-section .section-title {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #5BA3C7;
    margin-bottom: 8px;
  }
  .paiement-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
    font-size: 10.5px;
  }
  .paiement-item label { color: #94A3B8; display: block; margin-bottom: 2px; font-size: 9.5px; }
  .paiement-item span { font-weight: 600; color: #1E293B; }

  /* MENTIONS */
  .mentions {
    font-size: 9.5px;
    color: #94A3B8;
    line-height: 1.7;
    border-top: 1px solid #E2E8F0;
    padding-top: 16px;
    margin-top: 8px;
  }
  .mentions p { margin-bottom: 5px; }

  /* FOOTER PAGE */
  .page-footer {
    position: fixed;
    bottom: 24px;
    left: 48px;
    right: 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9px;
    color: #CBD5E1;
    border-top: 1px solid #F1F5F9;
    padding-top: 8px;
  }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="logo-area">
    <h1>${form.emetteurNom || 'Mon Entreprise'}</h1>
    <div class="emetteur-info">
      ${form.emetteurAdresse ? `${form.emetteurAdresse}<br>` : ''}
      ${form.emetteurCodePostal || form.emetteurVille ? `${form.emetteurCodePostal} ${form.emetteurVille}<br>` : ''}
      ${form.emetteurSiret ? `SIRET : ${form.emetteurSiret}<br>` : ''}
      ${form.emetteurTvaIntra ? `TVA intra : ${form.emetteurTvaIntra}<br>` : ''}
      ${form.emetteurEmail ? `${form.emetteurEmail}<br>` : ''}
      ${form.emetteurTel ? `${form.emetteurTel}` : ''}
    </div>
  </div>
  <div class="facture-meta">
    <div class="label">Facture</div>
    <table>
      <tr><td>Numéro</td><td>${form.numeroFacture}</td></tr>
      <tr><td>Date d'émission</td><td>${fmtDate(form.dateEmission)}</td></tr>
      ${form.dateEcheance ? `<tr><td>Échéance</td><td>${fmtDate(form.dateEcheance)}</td></tr>` : ''}
      <tr><td>Conditions</td><td>${form.conditionsPaiement}</td></tr>
    </table>
  </div>
</div>

<!-- PARTIES -->
<div class="parties">
  <div class="partie-box">
    <div class="partie-title">Émetteur</div>
    <div class="partie-nom">${form.emetteurNom}</div>
    <div class="partie-detail">
      ${form.emetteurAdresse ? `${form.emetteurAdresse}<br>` : ''}
      ${form.emetteurCodePostal || form.emetteurVille ? `${form.emetteurCodePostal} ${form.emetteurVille}<br>` : ''}
      ${form.emetteurSiret ? `SIRET : ${form.emetteurSiret}<br>` : ''}
      ${form.emetteurTvaIntra ? `TVA : ${form.emetteurTvaIntra}` : ''}
    </div>
  </div>
  <div class="partie-box">
    <div class="partie-title">Client / Destinataire</div>
    <div class="partie-nom">${form.clientNom}</div>
    <div class="partie-detail">
      ${form.clientAdresse ? `${form.clientAdresse}<br>` : ''}
      ${form.clientCodePostal || form.clientVille ? `${form.clientCodePostal} ${form.clientVille}<br>` : ''}
      ${form.clientSiret ? `SIRET : ${form.clientSiret}<br>` : ''}
      ${form.clientEmail ? `${form.clientEmail}` : ''}
    </div>
  </div>
</div>

<!-- OBJET -->
${form.objet ? `<div class="objet-bar"><strong>Objet :</strong> ${form.objet}</div>` : ''}

<!-- TABLEAU LIGNES -->
<table class="lignes">
  <thead>
    <tr>
      <th style="width:40%">Description</th>
      <th class="right" style="width:8%">Qté</th>
      <th class="right" style="width:13%">PU HT</th>
      <th class="right" style="width:8%">TVA</th>
      <th class="right" style="width:13%">HT</th>
      <th class="right" style="width:13%">TTC</th>
    </tr>
  </thead>
  <tbody>
    ${lignes.map(l => `
      <tr>
        <td class="desc">${l.description || '—'}</td>
        <td class="right">${l.quantite}</td>
        <td class="right">${fmt(l.prixUnitaire)} €</td>
        <td class="right">${l.tva}%</td>
        <td class="right">${fmt(l.ht)} €</td>
        <td class="right">${fmt(l.ttc)} €</td>
      </tr>
    `).join('')}
  </tbody>
</table>

<!-- TOTAUX -->
<div class="totaux-wrapper">
  <div class="totaux-box">
    <div class="totaux-row">
      <span class="tot-label">Total HT</span>
      <span class="tot-val">${fmt(totaux.ht)} €</span>
    </div>
    ${Object.entries(tvaDetails).map(([taux, d]) => `
      <div class="totaux-row">
        <span class="tot-label">TVA ${taux}% (base ${fmt(d.base)} €)</span>
        <span class="tot-val">${fmt(d.montant)} €</span>
      </div>
    `).join('')}
    <div class="totaux-row ttc">
      <span class="tot-label">Total TTC</span>
      <span class="tot-val">${fmt(totaux.ttc)} €</span>
    </div>
  </div>
</div>

<!-- PAIEMENT -->
<div class="paiement-section">
  <div class="section-title">Modalités de paiement</div>
  <div class="paiement-grid">
    <div class="paiement-item">
      <label>Conditions</label>
      <span>${form.conditionsPaiement}</span>
    </div>
    ${form.dateEcheance ? `<div class="paiement-item"><label>Date limite</label><span>${fmtDate(form.dateEcheance)}</span></div>` : ''}
    <div class="paiement-item">
      <label>Montant dû</label>
      <span>${fmt(totaux.ttc)} € TTC</span>
    </div>
  </div>
</div>

${form.notes ? `<div style="margin-bottom:20px; padding:12px 14px; background:#FFFBEB; border:1px solid #FDE68A; border-radius:8px; font-size:10.5px; color:#92400E; line-height:1.6"><strong>Note :</strong> ${form.notes}</div>` : ''}

<!-- MENTIONS LÉGALES -->
<div class="mentions">
  ${form.mentionPenalites ? `<p>${form.mentionPenalites}</p>` : ''}
  ${form.mentionEscompte ? `<p>${form.mentionEscompte}</p>` : ''}
  <p>Document généré le ${fmtDate(form.dateEmission)} — ${form.emetteurNom}${form.emetteurSiret ? ` — SIRET ${form.emetteurSiret}` : ''}</p>
</div>

<!-- FOOTER PAGE -->
<div class="page-footer">
  <span>${form.emetteurNom} — ${form.emetteurSiret ? `SIRET ${form.emetteurSiret}` : ''}</span>
  <span>Facture ${form.numeroFacture}</span>
  <span>${fmt(totaux.ttc)} € TTC</span>
</div>

</body>
</html>`;

    // Génération PDF via puppeteer
    let chromium, puppeteer;
    try {
      chromium = (await import('@sparticuz/chromium')).default;
      puppeteer = (await import('puppeteer-core')).default;
    } catch (e) {
      // Fallback : renvoyer le HTML si puppeteer non disponible (dev local)
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${form.numeroFacture}.pdf"`);
    return res.status(200).send(pdf);

  } catch (error) {
    console.error('generate-invoice error:', error);
    return res.status(500).json({ error: 'Erreur génération PDF', detail: error.message });
  }
}
