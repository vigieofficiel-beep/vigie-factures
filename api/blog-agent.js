// /api/blog-agent.js
// Actions : 'generate' | 'topics' | 'pipeline' | 'refresh'
// Remplace blog-generate.js + blog-topics.js + blog-pipeline.js + blog-refresh.js

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.VITE_SUPABASE_PRO_URL,
  process.env.SUPABASE_PRO_SERVICE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CATEGORIES = [
  "TVA & Régimes fiscaux",
  "Charges & Cotisations URSSAF",
  "Facturation & Devis",
  "Contrats & Assurances",
  "Comptabilité & Trésorerie",
  "Seuils & Plafonds",
  "Radiation & Cessation",
  "Création d'entreprise",
  "Droit du travail indépendant",
  "RGPD & Données personnelles",
  "Propriété intellectuelle",
  "Contrats clients & CGV",
  "Réglementation sectorielle",
  "Outils SaaS indépendants",
  "Automatisation & IA",
  "Gestion du temps",
  "Facturation électronique (e-invoicing 2026)",
  "Épargne & Prévoyance",
  "Financement & Aides",
  "Optimisation fiscale",
  "Trésorerie & Cash flow",
  "Trouver des clients",
  "Tarification & Positionnement",
  "Personal branding",
  "Réseaux sociaux pro",
  "Artisans & BTP",
  "Consultants & Freelances",
  "Créatifs & Développeurs",
  "Santé & Bien-être indépendant",
  "Nouveautés légales",
  "Actualité auto-entrepreneur",
  "Chiffres & Statistiques",
  "Europe & International",
  "Formation & Montée en compétences",
  "Cybersécurité & Protection données"
];

function generateSlug(titre) {
  return titre
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

// ── ACTION : generate (interface manuelle BlogAdmin) ───────────────
async function handleGenerate(body) {
  const { sujet, categorie = 'Guide pratique', publier = false } = body;
  if (!sujet) throw new Error('Sujet requis');

  const prompt = `Tu es un rédacteur SEO expert en gestion d'entreprise et fiscalité française pour auto-entrepreneurs et TPE.

Rédige un article de blog complet et optimisé SEO sur le sujet suivant : "${sujet}"

L'article doit :
- Cibler les auto-entrepreneurs, micro-entrepreneurs et TPE françaises
- Être informatif et pédagogique (pas de conseil personnalisé)
- Faire entre 1200 et 1800 mots
- Utiliser un ton professionnel mais accessible
- Inclure des exemples concrets chiffrés quand c'est pertinent
- Se terminer par un CTA naturel vers Vigie Pro (application de gestion pour auto-entrepreneurs)

Format de réponse UNIQUEMENT en JSON valide, sans balises markdown :
{
  "titre": "Titre optimisé SEO (60 caractères max)",
  "meta_description": "Description meta SEO (155 caractères max)",
  "contenu": "Article complet en markdown avec ## H2 et ### H3",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Termine toujours l'article par ce disclaimer :
"*Ces informations sont fournies à titre indicatif. Pour votre situation personnelle, consultez un expert-comptable ou un conseiller juridique.*"`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4000,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }]
  });

  const raw = completion.choices[0].message.content;
  const clean = raw.replace(/```json|```/g, '').trim();
  const article = JSON.parse(clean);

  const slug = generateSlug(article.titre) + '-' + Date.now().toString(36);

  const { data, error } = await supabase.from('blog_articles').insert([{
    slug,
    titre: article.titre,
    meta_description: article.meta_description,
    contenu: article.contenu,
    categorie,
    tags: article.tags || [],
    statut: publier ? 'publie' : 'brouillon',
    date_publication: publier ? new Date().toISOString() : null,
    auto_generated: false
  }]).select().single();

  if (error) throw error;
  return { ok: true, article: data };
}

// ── ACTION : topics (Agent 1 — choix sujet anti-doublon) ──────────
async function handleTopics() {
  const { data: existingArticles } = await supabase
    .from('blog_articles')
    .select('titre, categorie')
    .order('created_at', { ascending: false })
    .limit(200);

  const existingTitles = existingArticles?.map(a => a.titre).join('\n') || '';

  const categoryCounts = {};
  CATEGORIES.forEach(c => categoryCounts[c] = 0);
  existingArticles?.forEach(a => {
    if (a.categorie && categoryCounts[a.categorie] !== undefined) {
      categoryCounts[a.categorie]++;
    }
  });

  const sortedCategories = [...CATEGORIES].sort((a, b) => categoryCounts[a] - categoryCounts[b]);
  const targetCategory = sortedCategories[0];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Tu es un expert en gestion d'entreprise pour auto-entrepreneurs français.

Catégorie cible : "${targetCategory}"

Articles déjà publiés (ÉVITE tout sujet similaire) :
${existingTitles}

Propose UN sujet d'article factuel, utile, pratique sur "${targetCategory}" différent de tous les articles existants.
Il doit répondre à une vraie question qu'un auto-entrepreneur se pose en 2026.

Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "titre": "Titre de l'article (60 caractères max)",
  "categorie": "${targetCategory}",
  "angle": "En une phrase, l'angle précis de l'article",
  "mots_cles": ["mot1", "mot2", "mot3"]
}`
    }],
    temperature: 0.7,
    max_tokens: 300
  });

  const topic = JSON.parse(completion.choices[0].message.content.trim());
  return { success: true, topic };
}

// ── ACTION : pipeline (Agents 2+3+4+5 — automatique) ─────────────
async function handlePipeline(body) {
  const { titre, categorie, angle, mots_cles, auto_generated = true } = body;
  if (!titre || !categorie) throw new Error('titre et categorie requis');

  // Agent 2 — Recherche
  const rechercheRes = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Tu es un agent de recherche spécialisé en droit et gestion pour auto-entrepreneurs français.

Sujet : "${titre}" | Angle : "${angle}" | Catégorie : "${categorie}"

Recherche les informations factuelles, chiffres officiels, textes de loi sur ce sujet en 2026.
Sources uniquement : URSSAF, Service-Public.fr, Legifrance, INPI, Bpifrance, impots.gouv.fr.

Réponds en JSON valide uniquement :
{
  "faits_cles": ["fait 1 avec chiffre/date précis", "fait 2", "fait 3", "fait 4", "fait 5"],
  "sources": ["https://url-officielle-1.fr", "https://url-officielle-2.fr"],
  "points_attention": ["piège ou erreur courante 1", "piège ou erreur courante 2"]
}`
    }],
    temperature: 0.2,
    max_tokens: 800
  });

  const recherche = JSON.parse(rechercheRes.choices[0].message.content.trim());

  // Agent 3 — Rédaction
  const redactionRes = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Tu es un rédacteur expert en gestion d'entreprise pour auto-entrepreneurs français.

Titre : "${titre}" | Catégorie : "${categorie}" | Angle : "${angle}"
Mots-clés : ${mots_cles?.join(', ')}

Faits vérifiés à intégrer :
${recherche.faits_cles.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Points d'attention :
${recherche.points_attention.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Rédige un article complet de 1500 mots minimum en markdown.
Structure : Introduction → ## Contexte → ## Fonctionnement → ## Chiffres clés → ## Erreurs à éviter → ## Conseils pratiques → Conclusion CTA Vigie Pro

Termine par :
"---\\n*Article libre de droit — Vigie Pro 2026. Sources : ${recherche.sources.join(', ')}*"
"*Ces informations sont fournies à titre indicatif. Consultez un expert-comptable pour votre situation.*"

Réponds en markdown uniquement.`
    }],
    temperature: 0.5,
    max_tokens: 3000
  });

  const contenu = redactionRes.choices[0].message.content.trim();

  // Agent 4 — SEO + Fact-check
  const seoRes = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Expert SEO et fact-checker contenu juridique/fiscal français.

Titre : "${titre}" | Catégorie : "${categorie}" | Mots-clés : ${mots_cles?.join(', ')}
Extrait contenu : ${contenu.slice(0, 2000)}...

Réponds en JSON valide uniquement :
{
  "titre_seo": "Titre optimisé 55-60 caractères",
  "meta_description": "Description 150-160 caractères avec mot-clé principal",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "score_factuel": 8,
  "remarques": "Aucune anomalie"
}`
    }],
    temperature: 0.2,
    max_tokens: 400
  });

  const seo = JSON.parse(seoRes.choices[0].message.content.trim());

  // Agent 5 — Publication
  let slug = generateSlug(seo.titre_seo || titre);
  const { data: existing } = await supabase
    .from('blog_articles').select('id').eq('slug', slug).single();
  if (existing) slug = `${slug}-${Date.now()}`;

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
    .select().single();

  if (error) throw error;

  return {
    success: true,
    article_id: article.id,
    slug: article.slug,
    titre: article.titre,
    statut,
    score_factuel: seo.score_factuel,
    remarques: seo.remarques
  };
}

// ── ACTION : refresh (mise à jour articles > 30 jours) ─────────────
async function handleRefresh(req) {
  const { authorization } = req.headers;
  if (authorization !== `Bearer ${process.env.MAKE_WEBHOOK_SECRET}`) {
    throw new Error('Unauthorized');
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: articles } = await supabase
    .from('blog_articles')
    .select('id, titre, contenu, categorie')
    .eq('statut', 'publie')
    .lt('updated_at', thirtyDaysAgo.toISOString())
    .limit(3);

  if (!articles || articles.length === 0) {
    return { success: true, message: 'Aucun article à rafraîchir' };
  }

  const results = [];

  for (const article of articles) {
    const checkRes = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: `Expert veille juridique/fiscale auto-entrepreneurs français.

Titre : "${article.titre}" | Catégorie : "${article.categorie}"
Extrait contenu : ${article.contenu?.slice(0, 1500)}

En 2026, vérifie si des informations sont obsolètes (taux URSSAF, plafonds, e-invoicing, nouvelles lois).

Réponds en JSON valide uniquement :
{
  "necessite_update": true,
  "raisons": ["raison 1"],
  "nouveau_paragraphe": "Paragraphe de mise à jour à ajouter en tête d'article (ou null)"
}`
      }],
      temperature: 0.2,
      max_tokens: 600
    });

    const check = JSON.parse(checkRes.choices[0].message.content.trim());

    if (check.necessite_update && check.nouveau_paragraphe) {
      const updatedContenu = `> ⚠️ **Mis à jour le ${new Date().toLocaleDateString('fr-FR')}** — ${check.raisons.join('. ')}\n\n${check.nouveau_paragraphe}\n\n---\n\n${article.contenu}`;
      await supabase
        .from('blog_articles')
        .update({ contenu: updatedContenu, updated_at: new Date().toISOString() })
        .eq('id', article.id);
      results.push({ id: article.id, titre: article.titre, updated: true });
    } else {
      await supabase
        .from('blog_articles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', article.id);
      results.push({ id: article.id, titre: article.titre, updated: false });
    }
  }

  return { success: true, results };
}

// ── HANDLER PRINCIPAL ──────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, ...body } = req.body;

  try {
    let result;
    if (action === 'generate')      result = await handleGenerate(body);
    else if (action === 'topics')   result = await handleTopics();
    else if (action === 'pipeline') result = await handlePipeline(body);
    else if (action === 'refresh')  result = await handleRefresh(req);
    else return res.status(400).json({
      error: 'action invalide — utilise: generate | topics | pipeline | refresh'
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(`[blog-agent/${action}]`, error);
    return res.status(500).json({ error: error.message });
  }
}
