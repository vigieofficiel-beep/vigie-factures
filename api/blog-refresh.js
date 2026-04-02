// /api/blog-refresh.js
// Mise à jour automatique des articles > 30 jours
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.VITE_SUPABASE_PRO_URL,
  process.env.SUPABASE_PRO_SERVICE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Sécurité : token Make.com
  const { authorization } = req.headers;
  if (authorization !== `Bearer ${process.env.MAKE_WEBHOOK_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Articles publiés depuis > 30 jours, pas encore refreshés cette semaine
    const { data: articles } = await supabase
      .from('blog_articles')
      .select('id, titre, contenu, categorie, source_urls')
      .eq('statut', 'publie')
      .lt('updated_at', thirtyDaysAgo.toISOString())
      .limit(3); // Max 3 par run pour rester dans les quotas

    if (!articles || articles.length === 0) {
      return res.status(200).json({ success: true, message: 'Aucun article à rafraîchir' });
    }

    const results = [];

    for (const article of articles) {
      const checkPrompt = `Tu es un expert en veille juridique et fiscale pour auto-entrepreneurs français.

Titre de l'article : "${article.titre}"
Catégorie : "${article.categorie}"

Extrait du contenu actuel :
${article.contenu?.slice(0, 1500)}

Nous sommes en 2026. Vérifie si des informations dans cet article sont potentiellement obsolètes ou incorrectes.
Pense aux changements récents : taux URSSAF, plafonds auto-entrepreneur, nouvelles obligations légales, e-invoicing 2026.

Réponds en JSON valide uniquement :
{
  "necessite_update": true,
  "raisons": ["raison 1 si applicable"],
  "corrections": ["correction précise 1", "correction précise 2"],
  "nouveau_paragraphe": "Paragraphe de mise à jour à ajouter en début d'article (ou null si pas nécessaire)"
}`;

      const checkRes = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: checkPrompt }],
        temperature: 0.2,
        max_tokens: 600
      });

      const check = JSON.parse(checkRes.choices[0].message.content.trim());

      if (check.necessite_update && check.nouveau_paragraphe) {
        const updatedContenu = `> ⚠️ **Mis à jour le ${new Date().toLocaleDateString('fr-FR')}** — ${check.raisons.join('. ')}\n\n${check.nouveau_paragraphe}\n\n---\n\n${article.contenu}`;

        await supabase
          .from('blog_articles')
          .update({
            contenu: updatedContenu,
            updated_at: new Date().toISOString()
          })
          .eq('id', article.id);

        results.push({ id: article.id, titre: article.titre, updated: true, raisons: check.raisons });
      } else {
        // Touch updated_at pour ne pas le re-checker pendant 30j
        await supabase
          .from('blog_articles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', article.id);

        results.push({ id: article.id, titre: article.titre, updated: false });
      }
    }

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('blog-refresh error:', error);
    return res.status(500).json({ error: error.message });
  }
}