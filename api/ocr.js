import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { fileBase64, mimeType, fileName } = req.body;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Analyse cette facture et extrait en JSON uniquement sans texte autour, sans backticks :
{"date":"JJ/MM/AAAA","numero_facture":"","fournisseur":"","montant_ht":0,"tva":0,"montant_ttc":0,"categorie":"Fournitures|Transport|Services|Alimentation|Logement|Autre","description":""}`;

    // Pour les PDF et les images : on reçoit toujours une image base64 (conversion faite côté client)
    const imageType = mimeType === "application/pdf" ? "image/png" : mimeType;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${imageType};base64,${fileBase64}`,
                detail: "high",
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const text = response.choices[0].message.content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const json = JSON.parse(text);
    return res.status(200).json(json);

  } catch (error) {
    console.error("OCR Error:", error);
    res.status(500).json({ error: "Erreur OCR", details: error.message });
  }
}