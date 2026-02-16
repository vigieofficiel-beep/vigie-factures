export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;  
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdnF1am5jdGR5YXhzZW52d3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Nzc1MzcsImV4cCI6MjA4NjU1MzUzN30.XtzE94TOrI7KRh8Naj3cBxM80wGPDjZvI8nhUbxIvdA';

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    const shortText = text.substring(0, 4000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: 'Tu es un expert en analyse de factures. Tu retournes UNIQUEMENT du JSON valide, sans texte, sans backticks.',
        messages: [{ role: 'user', content: `Analyse cette facture. Retourne UNIQUEMENT un JSON valide.
Regles: Montants=nombres. Dates=YYYY-MM-DD. Inconnu=null. due_date uniquement si ecrit explicitement. frequency=mensuel/trimestriel/annuel/ponctuel. total_year=amount_ttc x12 si mensuel, x4 si trimestriel, x1 sinon. next_payments=3 prochaines dates si mensuel, sinon []. current_price_monthly=amount_ttc si mensuel, sinon null.

{
"extraction":{"provider":null,"provider_siret":null,"amount_ttc":null,"amount_ht":null,"tax":null,"tax_rate":null,"invoice_date":null,"due_date":null,"invoice_number":null,"ocr_confidence":null},
"classification":{"document_type":"facture","category":null,"subcategory":null,"frequency":"ponctuel","confidence":null},
"anomaly":{"has_anomaly":false,"anomaly_type":null,"variation_percent":null,"previous_amount":null,"current_amount":null,"explanation":"Premiere analyse","severity":null},
"calendar":{"frequency":"ponctuel","next_payments":[],"total_year":null},
"comparison":{"current_provider":null,"current_price_monthly":null,"alternatives":[],"best_option":null}
}

Texte:
${shortText}` }],
      }),
    });

    const data = await response.json();

    if (!data.content || !data.content[0]) {
      return res.status(500).json({ error: data.error?.message || 'Claude API error' });
    }

    let result;
    try {
      const raw = data.content[0].text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      result = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'JSON invalide', raw: data.content[0].text });
    }

    let historical = [];
    if (result.extraction && result.extraction.provider) {
      try {
        const histRes = await fetch(
          SUPABASE_URL + '/rest/v1/invoices?provider=eq.' + encodeURIComponent(result.extraction.provider) + '&order=invoice_date.desc&limit=6',
          { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' } }
        );
        if (histRes.ok) {
          historical = await histRes.json();
          if (historical.length > 0) {
            const prev = historical[0].amount_ttc;
            const curr = result.extraction.amount_ttc;
            if (prev && curr && prev !== curr) {
              const v = ((curr - prev) / prev) * 100;
              result.anomaly = {
                has_anomaly: Math.abs(v) > 10,
                anomaly_type: v > 0 ? 'hausse' : 'baisse',
                variation_percent: Math.round(v * 100) / 100,
                previous_amount: prev,
                current_amount: curr,
                explanation: Math.abs(v) > 10 ? 'Variation de ' + Math.round(v) + '% (' + prev + ' EUR vers ' + curr + ' EUR)' : 'Legere variation de ' + Math.round(v) + '%',
                severity: Math.abs(v) > 30 ? 'high' : Math.abs(v) > 10 ? 'medium' : 'low',
              };
            } else if (prev && curr) {
              result.anomaly = { has_anomaly: false, anomaly_type: null, variation_percent: 0, previous_amount: prev, current_amount: curr, explanation: 'Montant identique', severity: null };
            }
          }
        }
      } catch (e) {}
    }

    try {
      await fetch(SUPABASE_URL + '/rest/v1/invoices', {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=representation,resolution=merge-duplicates' },
        body: JSON.stringify({
          provider: result.extraction.provider,
          provider_siret: result.extraction.provider_siret,
          amount_ttc: result.extraction.amount_ttc,
          amount_ht: result.extraction.amount_ht,
          tax: result.extraction.tax,
          tax_rate: result.extraction.tax_rate,
          invoice_date: result.extraction.invoice_date,
          invoice_number: result.extraction.invoice_number,
          document_type: result.classification.document_type,
          category: result.classification.category,
          subcategory: result.classification.subcategory,
          frequency: result.classification.frequency,
          has_anomaly: result.anomaly.has_anomaly || false,
          anomaly_explanation: result.anomaly.explanation,
          calendar_frequency: result.calendar.frequency,
          total_year: result.calendar.total_year,
          current_provider: result.comparison.current_provider,
          current_price_monthly: result.comparison.current_price_monthly,
          ocr_confidence: result.extraction.ocr_confidence,
        }),
      });
    } catch (e) {}

    result.historical_invoices = historical;
    result.processing_date = new Date().toISOString();

    return res.status(200).json({ success: true, result: result });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
