export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text } = req.body;

    // First, load all apps to find the correct ID
    const loadRes = await fetch('https://api.mindstudio.ai/developer/v2/apps/load', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer skg0tCIZw5vqKYAa6OKgY6w2Gom2Q',
      },
    });
    const apps = await loadRes.json();

    // Return the list so we can find the right ID
    if (!text) {
      return res.status(200).json({ apps });
    }

    const response = await fetch('https://api.mindstudio.ai/developer/v2/apps/run', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer skg0tCIZw5vqKYAa6OKgY6w2Gom2Q',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appId: 'vigiefactures2-66aa30f6',
        variables: { uploaded_file: text },
      }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
