import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { fileBase64, mimeType, fileName } = req.body;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Analyse cette facture et extrait en JSON uniquement sans texte autour, sans backticks :
{"date":"JJ/MM/AAAA","numero_facture":"","fournisseur":"","montant_ht":0,"tva":0,"montant_ttc":0,"categorie":"Fournitures|Transport|Services|Alimentation|Logement|Autre","description":""}`;

    const buffer = Buffer.from(fileBase64, "base64");
    const blob = new Blob([buffer], { type: mimeType });
    const file = new File([blob], fileName || "document", { type: mimeType });

    let response;

    if (mimeType === "application/pdf") {
      // Upload PDF via OpenAI Files API
      const uploaded = await client.files.create({
        file,
        purpose: "assistants",
      });

      // Utiliser l'assistant avec le fichier uploadé
      const thread = await client.beta.threads.create({
        messages: [
          {
            role: "user",
            content: prompt,
            attachments: [{ file_id: uploaded.id, tools: [{ type: "file_search" }] }],
          },
        ],
      });

      const assistant = await client.beta.assistants.create({
        model: "gpt-4o",
        tools: [{ type: "file_search" }],
      });

      const run = await client.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: assistant.id,
      });

      const messages = await client.beta.threads.messages.list(thread.id);
      const content = messages.data[0].content[0].text.value;

      // Nettoyage
      await client.files.del(uploaded.id).catch(() => {});
      await client.beta.assistants.del(assistant.id).catch(() => {});

      const text = content.replace(/```json/g, "").replace(/```/g, "").replace(/【.*?】/g, "").trim();
      const json = JSON.parse(text);
      return res.status(200).json(json);

    } else {
      // Images JPG/PNG
      response = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${fileBase64}`, detail: "high" },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      });

      const text = response.choices[0].message.content
        .replace(/```json/g, "").replace(/```/g, "").trim();
      const json = JSON.parse(text);
      return res.status(200).json(json);
    }

  } catch (error) {
    console.error("OCR Error:", error);
    res.status(500).json({ error: "Erreur OCR", details: error.message });
  }
}