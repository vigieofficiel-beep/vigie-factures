import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase  = createClient(
  process.env.VITE_SUPABASE_PRO_URL,
  process.env.SUPABASE_PRO_SERVICE_KEY
);

function slugify(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
    .substring(0, 80);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sujet, categorie = 'Guide pratique', publier = false } = req.body;
  if (!sujet) return res.status(400).json({ error: 'Sujet requis' });

  try {
    const prompt = `Tu es un rédacteur SEO expert en gestion d'entreprise et fiscalité française pour auto-entrepreneurs et TPE.

Rédige un article de blog complet et optimisé SEO sur le sujet suivant : "${sujet}"

L'article doit :
- Cibler les auto-entrepreneurs, micro-entrepreneurs et TPE françaises
- Être informatif et pédagogique (pas de conseil personnalisé)
- Faire entre 1200 et 1800 mots
- Utiliser un ton professionnel mais accessible
- Inclure des exemples concrets chiffrés quand c'est pertinent
- Se terminer par un CTA naturel vers Vigie Pro (application de gestion pour auto-entrepreneurs)

Format de réponse UNIQUEMENT en JSON valide :
{
  "titre": "Titre optimisé SEO (60 caractères max)",
  "meta_description": "Description meta SEO (155 caractères max)",
  "contenu": "Article complet en markdown avec ## H2 et ### H3",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

IMPORTANT : Termine toujours l'article par ce disclaimer :
"*Ces informations sont fournies à titre indicatif. Pour votre situation personnelle, consultez un expert-comptable ou un conseiller juridique.*"`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text;
    const clean = raw.replace(/```json|```/g, '').trim();
    const article = JSON.parse(clean);

    const slug = slugify(article.titre) + '-' + Date.now().toString(36);

    const payload = {
      slug,
      titre: article.titre,
      meta_description: article.meta_description,
      contenu: article.contenu,
      categorie,
      tags: article.tags || [],
      statut: publier ? 'publie' : 'brouillon',
      date_publication: publier ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase.from('blog_articles').insert([payload]).select().single();
    if (error) throw error;

    return res.status(200).json({ ok: true, article: data });

  } catch (e) {
    console.error('[blog-generate]', e);
    return res.status(500).json({ error: e.message });
  }
}
