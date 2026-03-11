import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { fileBase64, mimeType } = req.body;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-haiku-20240307",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data: fileBase64 },
            },
            {
              type: "text",
              text: `Analyse cette facture et extrait en JSON uniquement :
{
  "date": "JJ/MM/AAAA",
  "numero_facture": "",
  "fournisseur": "",
  "montant_ht": 0,
  "tva": 0,
  "montant_ttc": 0,
  "categorie": "Fournitures|Transport|Services|Alimentation|Logement|Autre",
  "description": ""
}
Réponds UNIQUEMENT avec le JSON, rien d'autre.`,
            },
          ],
        },
      ],
    });

    const json = JSON.parse(response.content[0].text);
    res.status(200).json(json);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur OCR" });
  }
}