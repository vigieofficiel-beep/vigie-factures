export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const CLAUDE_API_KEY = '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';
  const SUPABASE_URL = 'https://qkvqujnctdyaxsenvwsm.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdnF1am5jdGR5YXhzZW52d3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Nzc1MzcsImV4cCI6MjA4NjU1MzUzN30.XtzE94TOrI7KRh8Naj3cBxM80wGPDjZvI8nhUbxIvdA';

  async function callClaude(systemPrompt, userPrompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    const data = await response.json();
    if (data.content && data.content[0]) {
      return data.content[0].text;
    }
    throw new Error(data.error?.message || 'Claude API error');
  }

  function parseJSON(text) {
    try {
      // Remove markdown code blocks if present
      const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    // ═══ AGENT 1: EXTRACTION ═══
    const extractionRaw = await callClaude(
      'Tu es un extracteur de données de factures. Tu reçois du texte OCR d\'une facture et tu dois extraire les informations demandées. Tu retournes UNIQUEMENT du JSON valide, sans texte autour, sans commentaire. Si une information n\'est pas trouvée, mets null.',
      `Retourne UNIQUEMENT un JSON valide, sans texte autour, sans \`\`\`.
Montants = nombres. Dates = YYYY-MM-DD si possible, sinon null. Inconnu = null.

Schéma EXACT :
{
  "provider": string|null,
  "provider_siret": string|null,
  "amount_ttc": number|null,
  "amount_ht": number|null,
  "tax": number|null,
  "tax_rate": number|null,
  "invoice_date": string|null,
  "due_date": string|null,
  "invoice_number": string|null,
  "ocr_confidence": number|null
}

Texte OCR :
${text}`
    );
    const extraction = parseJSON(extractionRaw) || {};

    // ═══ AGENT 2: CLASSIFICATION ═══
    const classificationRaw = await callClaude(
      'Tu es un classificateur de documents. Tu retournes UNIQUEMENT du JSON valide.',
      `Retourne UNIQUEMENT un JSON valide, sans texte autour, sans \`\`\`.

Schéma EXACT :
{
  "document_type": "facture"|"avoir"|"devis"|"autre",
  "category": string|null,
  "subcategory": string|null,
  "frequency": "mensuel"|"trimestriel"|"annuel"|"ponctuel",
  "confidence": number
}

Texte OCR :
${text}`
    );
    const classification = parseJSON(classificationRaw) || {};

    // ═══ FETCH HISTORICAL INVOICES ═══
    let historical = [];
    if (extraction.provider) {
      try {
        const histRes = await fetch(
          `${SUPABASE_URL}/rest/v1/invoices?provider=eq.${encodeURIComponent(extraction.provider)}&order=invoice_date.desc&limit=6`,
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (histRes.ok) historical = await histRes.json();
      } catch {}
    }

    // ═══ AGENT 3: ANOMALY DETECTION ═══
    const anomalyRaw = await callClaude(
      'Tu es un détecteur d\'anomalies sur factures. Tu retournes UNIQUEMENT du JSON valide.',
      `Retourne UNIQUEMENT un JSON valide, sans texte autour, sans \`\`\`.
Règles :
- Si historical_invoices = [] : has_anomaly=false et le reste = null (sauf explanation optionnelle).
- Sinon compare amount_ttc actuel avec le montant de la facture la plus récente de l'historique.
- variation_percent = ((current - previous)/previous)*100 si previous > 0.

Schéma EXACT :
{
  "has_anomaly": boolean,
  "anomaly_type": string|null,
  "variation_percent": number|null,
  "previous_amount": number|null,
  "current_amount": number|null,
  "explanation": string|null,
  "severity": "low"|"medium"|"high"|null
}

Actuel :
${JSON.stringify(extraction)}

Historique :
${JSON.stringify(historical)}`
    );
    const anomaly = parseJSON(anomalyRaw) || {};

    // ═══ AGENT 4: CALENDAR ═══
    const calendarRaw = await callClaude(
      'Tu es un agent de projection calendaire. Tu retournes UNIQUEMENT du JSON valide.',
      `Retourne UNIQUEMENT un JSON valide, sans texte autour, sans \`\`\`.

Règles :
- Utilise la frequency de la classification pour déterminer la fréquence.
- Si frequency = "mensuel", calcule les 3 prochaines dates à partir de invoice_date.
- total_year = amount_ttc x 12 si mensuel, amount_ttc x 4 si trimestriel, amount_ttc si annuel.
- Si frequency = "ponctuel" ou inconnu : next_payments = [], total_year = amount_ttc.

Schéma EXACT :
{
  "frequency": string,
  "next_payments": [
    { "payment_date": string|null, "amount": number|null, "provider": string|null }
  ],
  "total_year": number|null
}

Extraction :
${JSON.stringify(extraction)}

Classification :
${JSON.stringify(classification)}`
    );
    const calendar = parseJSON(calendarRaw) || {};

    // ═══ AGENT 5: COMPARATOR ═══
    const comparatorRaw = await callClaude(
      'Tu es un comparateur de prix. Tu retournes UNIQUEMENT du JSON valide.',
      `Retourne UNIQUEMENT un JSON valide, sans texte autour, sans \`\`\`.

Règles :
- current_provider = le fournisseur extrait.
- current_price_monthly = amount_ttc si frequency="mensuel", sinon null.
- Tu ne connais pas les alternatives réelles, donc alternatives=[] et best_option=null.

Schéma EXACT :
{
  "current_provider": string|null,
  "current_price_monthly": number|null,
  "alternatives": [],
  "best_option": null
}

Extraction :
${JSON.stringify(extraction)}

Classification :
${JSON.stringify(classification)}`
    );
    const comparison = parseJSON(comparatorRaw) || {};

    // ═══ BUILD FINAL RESULT ═══
    const finalResult = {
      extraction,
      classification,
      anomaly,
      calendar,
      comparison,
      historical_invoices: historical,
      processing_date: new Date().toISOString(),
    };

    // ═══ SAVE TO SUPABASE ═══
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/invoices`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation,resolution=merge-duplicates',
        },
        body: JSON.stringify({
          provider: extraction.provider,
          provider_siret: extraction.provider_siret,
          amount_ttc: extraction.amount_ttc,
          amount_ht: extraction.amount_ht,
          tax: extraction.tax,
          tax_rate: extraction.tax_rate,
          invoice_date: extraction.invoice_date,
          invoice_number: extraction.invoice_number,
          document_type: classification.document_type,
          category: classification.category,
          subcategory: classification.subcategory,
          frequency: classification.frequency,
          has_anomaly: anomaly.has_anomaly || false,
          anomaly_explanation: anomaly.explanation,
          calendar_frequency: calendar.frequency,
          total_year: calendar.total_year,
          ocr_confidence: extraction.ocr_confidence,
        }),
      });
    } catch {}

    return res.status(200).json({ success: true, result: finalResult });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
