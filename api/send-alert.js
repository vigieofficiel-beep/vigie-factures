export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const RESEND_KEY = re_HQ2KyxUq_QBUbSBty2AA41zUNMbmd3fr5;

  try {
    const { invoice, anomaly } = req.body;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Vigie-Factures <onboarding@resend.dev>',
        to: ['gaetan.narcisse@gmail.com'],
        subject: '🚨 Anomalie - ' + (invoice.provider || 'Facture'),
        html: '<h2>Anomalie detectee</h2><p><b>Fournisseur:</b> ' + invoice.provider + '</p><p><b>Montant:</b> ' + invoice.amount_ttc + ' EUR</p><p><b>Variation:</b> ' + (anomaly.variation_percent || 0) + '%</p><p><b>Explication:</b> ' + anomaly.explanation + '</p><p><a href="https://vigie-factures.vercel.app">Voir le dashboard</a></p>'
      })
    });
    const data = await r.json();
    return res.status(200).json({ success: true, data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
