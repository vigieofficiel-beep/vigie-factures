// ═══ PROMPT PARTAGÉ ═══
const PROMPT_TEXT = `Analyse cette facture. Retourne UNIQUEMENT un JSON valide.
Regles: Montants=nombres. Dates=YYYY-MM-DD. Inconnu=null. due_date uniquement si ecrit explicitement. frequency=mensuel/trimestriel/annuel/ponctuel. total_year=amount_ttc x12 si mensuel, x4 si trimestriel, x1 sinon. next_payments=3 prochaines dates si mensuel, sinon []. current_price_monthly=amount_ttc si mensuel, sinon null.

{
  "extraction": {
    "provider": null,
    "provider_siret": null,
    "amount_ttc": null,
    "amount_ht": null,
    "tax": null,
    "tax_rate": null,
    "invoice_date": null,
    "due_date": null,
    "invoice_number": null,
    "ocr_confidence": null
  },
  "classification": {
    "document_type": "facture",
    "category": null,
    "subcategory": null,
    "frequency": "ponctuel",
    "confidence": null
  },
  "anomaly": {
    "has_anomaly": false,
    "anomaly_type": null,
    "variation_percent": null,
    "previous_amount": null,
    "current_amount": null,
    "explanation": "Premiere analyse",
    "severity": null
  },
  "calendar": {
    "frequency": "ponctuel",
    "next_payments": [],
    "total_year": null
  },
  "comparison": {
    "current_provider": null,
    "current_price_monthly": null,
    "alternatives": [],
    "best_option": null
  }
}`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qkvqujnctdyaxsenvwsm.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdnF1am5jdGR5YXhzZW52d3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Nzc1MzcsImV4cCI6MjA4NjU1MzUzN30.XtzE94TOrI7KRh8Naj3cBxM80wGPDjZvI8nhUbxIvdA';

  if (!CLAUDE_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY non configurée dans les variables d\'environnement Vercel.' });
  }

  try {
    const { text, fileBase64, fileType, user_id } = req.body;

    if (!text && !fileBase64) {
      return res.status(400).json({ error: 'Aucun contenu fourni (text ou fileBase64 requis)' });
    }

    // ═══ Construction du message selon le type de fichier ═══
    let messageContent;

    if (fileBase64 && fileType === 'application/pdf') {
      // PDF envoyé en base64 → Claude le lit nativement (même les PDFs scannés)
      messageContent = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: fileBase64,
          },
        },
        {
          type: 'text',
          text: PROMPT_TEXT,
        },
      ];
    } else if (fileBase64 && fileType?.startsWith('image/')) {
      // Image (JPG, PNG) envoyée en base64
      messageContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: fileType,
            data: fileBase64,
          },
        },
        {
          type: 'text',
          text: PROMPT_TEXT,
        },
      ];
    } else {
      // Texte brut (fallback)
      messageContent = `${PROMPT_TEXT}\n\nTexte:\n${(text || '').substring(0, 4000)}`;
    }

    // ═══ STEP 1: Analyse principale ═══
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
        system: 'Tu es un expert en analyse de factures. Tu retournes UNIQUEMENT du JSON valide, sans texte, sans backticks, sans commentaires.',
        messages: [{ role: 'user', content: messageContent }],
      }),
    });

    const data = await response.json();

    if (!data.content || !data.content[0]) {
      return res.status(500).json({ error: data.error?.message || 'Erreur API Claude' });
    }

    let result;
    try {
      const raw = data.content[0].text
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      result = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'JSON invalide retourné par Claude', raw: data.content[0].text });
    }

    // ═══ STEP 2: Historique Supabase ═══
    let historical = [];
    if (result.extraction?.provider) {
      try {
        const histRes = await fetch(
          `${SUPABASE_URL}/rest/v1/invoices?provider=eq.${encodeURIComponent(result.extraction.provider)}&order=invoice_date.desc&limit=6`,
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
            },
          }
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
                explanation: Math.abs(v) > 10
                  ? `Variation de ${Math.round(v)}% (${prev} EUR → ${curr} EUR)`
                  : `Légère variation de ${Math.round(v)}%`,
                severity: Math.abs(v) > 30 ? 'high' : Math.abs(v) > 10 ? 'medium' : 'low',
              };
            } else if (prev && curr) {
              result.anomaly = {
                has_anomaly: false,
                anomaly_type: null,
                variation_percent: 0,
                previous_amount: prev,
                current_amount: curr,
                explanation: 'Montant identique',
                severity: null,
              };
            }
          }
        }
      } catch (_e) {}
    }

    // ═══ STEP 3: Comparateur de prix (mensuel uniquement) ═══
    if (result.classification?.frequency === 'mensuel' && result.extraction?.amount_ttc) {
      try {
        const compRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            tools: [{ type: 'web_search_20250305', name: 'web_search' }],
            messages: [{
              role: 'user',
              content: `Trouve des alternatives moins cheres pour ce service en France.
Fournisseur actuel: ${result.extraction.provider}
Type: ${result.classification.category} / ${result.classification.subcategory}
Prix mensuel: ${result.extraction.amount_ttc} EUR/mois

Cherche 2-3 concurrents avec leurs prix. Retourne UNIQUEMENT un JSON:
{"current_provider":"${result.extraction.provider}","current_price_monthly":${result.extraction.amount_ttc},"alternatives":[{"provider":"nom","price_monthly":0,"savings_yearly":0}],"best_option":{"provider":"nom","savings_yearly":0},"recommendation":"conseil"}`,
            }],
          }),
        });

        const compData = await compRes.json();
        if (compData.content) {
          for (const block of compData.content) {
            if (block.type === 'text') {
              try {
                const jsonMatch = block.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) result.comparison = JSON.parse(jsonMatch[0]);
              } catch (_e) {}
            }
          }
        }
      } catch (_e) {}
    }

    // ═══ STEP 4: Sauvegarde Supabase ═══
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
          user_id: user_id || null,
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
          has_anomaly: result.anomaly?.has_anomaly || false,
          anomaly_explanation: result.anomaly?.explanation || null,
          calendar_frequency: result.calendar?.frequency || null,
          total_year: result.calendar?.total_year || null,
          current_provider: result.comparison?.current_provider || null,
          current_price_monthly: result.comparison?.current_price_monthly || null,
          ocr_confidence: result.extraction.ocr_confidence,
        }),
      });
    } catch (_e) {}

    // ═══ STEP 5: Alerte email si anomalie ═══
    if (result.anomaly?.has_anomaly) {
      try {
        await fetch('https://vigie-factures.vercel.app/api/send-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoice: {
              provider: result.extraction.provider,
              amount_ttc: result.extraction.amount_ttc,
              invoice_date: result.extraction.invoice_date,
              invoice_number: result.extraction.invoice_number,
            },
            anomaly: result.anomaly,
          }),
        });
      } catch (_e) {}
    }

    result.historical_invoices = historical;
    result.processing_date = new Date().toISOString();

    return res.status(200).json({ success: true, result });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}