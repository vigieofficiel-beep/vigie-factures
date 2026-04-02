// /api/blog-pipeline.js
// Agents 2+3+4+5 — Recherche → Rédaction → SEO → Fact-check → Publication
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.VITE_SUPABASE_PRO_URL,
  process.env.SUPABASE_PRO_SERVICE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function generateSlug(titre) {
  return titre
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { titre, categorie, angle, mots_cles, auto_generated = true } = req.body;

  if (!titre || !categorie) {
    return res.status(400).json({ error: 'titre et categorie requis' });
  }

  try {
    // ── AGENT 2 : Recherche + sources ──────────────────────────────
    const recherchePrompt = `Tu es un agent de recherche spécialisé en droit et gestion pour auto-entrepreneurs français.

Sujet : "${titre}"
Angle : "${angle}"
Catégorie : "${categorie}"

Recherche les informations factuelles, chiffres officiels, textes de loi, et sources fiables sur ce sujet en 2026.
Cite uniquement des sources officielles : URSSAF, Service-Public.fr, Legifrance, INPI, Bpifrance, impots.gouv.fr.

Réponds en JSON valide uniquement :
{
  "faits_cles": ["fait 1 avec chiffre/date précis", "fait 2", "fait 3", "fait 4", "fait 5"],
  "sources": ["https://url-officielle-1.fr", "https://url-officielle-2.fr"],
  "date_validite": "2026",
  "points_attention": ["piège ou erreur courante 1", "piège ou erreur courante 2"]
}`;

    const rechercheRes = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: recherchePrompt }],
      temperature: 0.2,
      max_tokens: 800
    });

    const recherche = JSON.parse(rechercheRes.choices[0].message.content.trim());

    // ── AGENT 3 : Rédaction ────────────────────────────────────────
    const redactionPrompt = `Tu es un rédacteur expert en gestion d'entreprise pour auto-entrepreneurs français.

Titre : "${titre}"
Catégorie : "${categorie}"
Angle : "${angle}"
Mots-clés : ${mots_cles?.join(', ')}

Faits vérifiés à intégrer obligatoirement :
${recherche.faits_cles.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Points d'attention à mentionner :
${recherche.points_attention.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Rédige un article complet de 1500 mots minimum en markdown.
Structure obligatoire :
- Introduction (accroche + promesse)
- H2 : contexte/définition
- H2 : comment ça fonctionne concrètement
- H2 : chiffres et règles à retenir
- H2 : erreurs à éviter
- H2 : conseils pratiques
- Conclusion avec CTA vers Vigie Pro

Règles :
- Ton professionnel mais accessible
- Exemples concrets avec chiffres
- Phrases courtes
- Pas de jargon inutile
- Termine par : "---\\n*Article libre de droit — Vigie Pro 2026. Sources : ${recherche.sources.join(', ')}*"

Réponds avec le contenu markdown uniquement, sans JSON.`;

    const redactionRes = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: redactionPrompt }],
      temperature: 0.5,
      max_tokens: 3000
    });

    const contenu = redactionRes.choices[0].message.content.trim();

    // ── AGENT 4 : SEO + Fact-check ─────────────────────────────────
    const seoPrompt = `Tu es un expert SEO et fact-checker pour contenu juridique/fiscal français.

Titre original : "${titre}"
Catégorie : "${categorie}"
Mots-clés cibles : ${mots_cles?.join(', ')}

Voici le contenu de l'article :
${contenu.slice(0, 2000)}...

Génère les métadonnées SEO optimisées et vérifie la cohérence.
Réponds en JSON valide uniquement :
{
  "titre_seo": "Titre optimisé SEO (55-60 caractères)",
  "meta_description": "Description 150-160 caractères avec mot-clé principal",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "score_factuel": 8,
  "remarques": "Aucune anomalie détectée"
}`;

    const seoRes = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: seoPrompt }],
      temperature: 0.2,
      max_tokens: 400
    });

    const seo = JSON.parse(seoRes.choices[0].message.content.trim());

    // ── AGENT 5 : Publication Supabase ─────────────────────────────
    let slug = generateSlug(seo.titre_seo || titre);

    // Anti-collision slug
    const { data: existing } = await supabase
      .from('blog_articles')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) slug = `${slug}-${Date.now()}`;

    // Statut : auto_generated → 'a_relire', manuel → 'publie'
    const statut = auto_generated ? 'a_relire' : 'publie';

    const { data: article, error } = await supabase
      .from('blog_articles')
      .insert({
        slug,
        titre: seo.titre_seo || titre,
        meta_description: seo.meta_description,
        contenu,
        categorie,
        tags: seo.tags,
        statut,
        source_urls: recherche.sources,
        auto_generated,
        date_publication: statut === 'publie' ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      article_id: article.id,
      slug: article.slug,
      titre: article.titre,
      statut,
      score_factuel: seo.score_factuel,
      remarques: seo.remarques
    });

  } catch (error) {
    console.error('blog-pipeline error:', error);
    return res.status(500).json({ error: error.message });
  }
}