import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { fileBase64, mimeType } = req.body;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const isImage = mimeType.startsWith("image/");

    const content = isImage
      ? [
          { type: "image", source: { type: "base64", media_type: mimeType, data: fileBase64 } },
          { type: "text", text: `Analyse cette facture et extrait en JSON uniquement sans texte autour : {"date":"JJ/MM/AAAA","numero_facture":"","fournisseur":"","montant_ht":0,"tva":0,"montant_ttc":0,"categorie":"Fournitures|Transport|Services|Alimentation|Logement|Autre","description":""}` }
        ]
      : [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: fileBase64 } },
          { type: "text", text: `Analyse cette facture et extrait en JSON uniquement sans texte autour : {"date":"JJ/MM/AAAA","numero_facture":"","fournisseur":"","montant_ht":0,"tva":0,"montant_ttc":0,"categorie":"Fournitures|Transport|Services|Alimentation|Logement|Autre","description":""}` }
        ];

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content }],
    });

    const text = response.content[0].text.replace(/```json|```/g, "").trim();
    const json = JSON.parse(text);
    res.status(200).json(json);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur OCR" });
  }
}