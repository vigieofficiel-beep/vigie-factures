import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { fileBase64, mimeType } = req.body;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Analyse cette facture et extrait en JSON uniquement sans texte autour, sans backticks :
{"date":"JJ/MM/AAAA","numero_facture":"","fournisseur":"","montant_ht":0,"tva":0,"montant_ttc":0,"categorie":"Fournitures|Transport|Services|Alimentation|Logement|Autre","description":""}`;

    let content;

    if (mimeType === "application/pdf") {
      // Pour les PDF : on les traite comme des images en forçant le mime type
      // GPT-4o peut lire les PDF encodés en base64 via image_url avec data URI
      content = [
        {
          type: "image_url",
          image_url: {
            url: `data:application/pdf;base64,${fileBase64}`,
            detail: "high"
          }
        },
        { type: "text", text: prompt }
      ];
    } else {
      // Images JPG/PNG
      content = [
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${fileBase64}`,
            detail: "high"
          }
        },
        { type: "text", text: prompt }
      ];
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1024,
      messages: [{ role: "user", content }],
    });

    const text = response.choices[0].message.content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const json = JSON.parse(text);
    res.status(200).json(json);
  } catch (error) {
    console.error("OCR Error:", error);
    res.status(500).json({ error: "Erreur OCR", details: error.message });
  }
}