import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { fileBase64, mimeType } = req.body;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const isImage = mimeType.startsWith("image/");

    const messages = isImage
      ? [{ type: "image_url", image_url: { url: `data:${mimeType};base64,${fileBase64}` } },
         { type: "text", text: `Analyse cette facture et extrait en JSON uniquement sans texte autour : {"date":"JJ/MM/AAAA","numero_facture":"","fournisseur":"","montant_ht":0,"tva":0,"montant_ttc":0,"categorie":"Fournitures|Transport|Services|Alimentation|Logement|Autre","description":""}` }]
      : [{ type: "text", text: `Analyse cette facture PDF (base64) et extrait en JSON uniquement sans texte autour : {"date":"JJ/MM/AAAA","numero_facture":"","fournisseur":"","montant_ht":0,"tva":0,"montant_ttc":0,"categorie":"Fournitures|Transport|Services|Alimentation|Logement|Autre","description":""}\n\nContenu base64: ${fileBase64}` }];

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1024,
      messages: [{ role: "user", content: messages }],
    });

    const text = response.choices[0].message.content.replace(/```json|```/g, "").trim();
    const json = JSON.parse(text);
    res.status(200).json(json);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur OCR" });
  }
}