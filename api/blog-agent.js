// /api/blog-agent.js
// Actions POST : 'generate' | 'topics' | 'pipeline' | 'refresh'
// Action GET   : sitemap XML

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.VITE_SUPABASE_PRO_URL,
  process.env.SUPABASE_PRO_SERVICE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function parseJSON(raw) {
  const clean = raw.trim().replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

const CATEGORIES = [
  "TVA & Régimes fiscaux", "Charges & Cotisations URSSAF", "Facturation & Devis",
  "Contrats & Assurances", "Comptabilité & Trésorerie", "Seuils & Plafonds",
  "Radiation & Cessation", "Création d'entreprise", "Droit du travail indépendant",
  "RGPD & Données personnelles", "Propriété intellectuelle", "Contrats clients & CGV",
  "Réglementation sectorielle", "Outils SaaS indépendants", "Automatisation & IA",
  "Gestion du temps", "Facturation électronique (e-invoicing 2026)", "Épargne & Prévoyance",
  "Financement & Aides", "Optimisation fiscale", "Trésorerie & Cash flow",
  "Trouver des clients", "Tarification & Positionnement", "Personal branding",
  "Réseaux sociaux pro", "Artisans & BTP", "Consultants & Freelances",
  "Créatifs & Développeurs", "Santé & Bien-être indépendant", "Nouveautés légales",
  "Actualité auto-entrepreneur", "Chiffres & Statistiques", "Europe & International",
  "Formation & Montée en compétences", "Cybersécurité & Protection données"
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

// ── Unsplash — query en anglais basée sur le titre ────────────────
async function fetchUnsplashImage(titre) {
  try {
    const titreLower = titre.toLowerCase();
    const keywordMap = [
      { keys: ['tva', 'taxe', 'fiscal', 'impôt'],          query: 'tax business accounting' },
      { keys: ['urssaf', 'cotisation', 'charge'],           query: 'entrepreneur office work' },
      { keys: ['factur', 'devis', 'invoice'],               query: 'invoice business document' },
      { keys: ['contrat', 'assurance', 'juridique'],        query: 'contract signing business' },
      { keys: ['trésorerie', 'cash', 'banque', 'finance'],  query: 'finance money business' },
      { keys: ['comptab'],                                   query: 'accounting office laptop' },
      { keys: ['client', 'prospect', 'commercial'],         query: 'business meeting client' },
      { keys: ['création', 'lancer', 'startup'],            query: 'startup entrepreneur launch' },
      { keys: ['numérique', 'ia', 'digital', 'outil'],      query: 'digital technology laptop' },
      { keys: ['marketing', 'brand', 'réseaux'],            query: 'marketing social media' },
      { keys: ['santé', 'bien-être'],                       query: 'health wellness work' },
      { keys: ['formation', 'compétence', 'apprendre'],     query: 'learning education training' },
      { keys: ['sécurité', 'rgpd', 'données'],              query: 'cybersecurity data protection' },
      { keys: ['retraite', 'épargne', 'prévoyance'],        query: 'savings retirement finance' },
      { keys: ['artisan', 'btp', 'chantier'],               query: 'craftsman workshop tools' },
    ];

    let query = 'small business entrepreneur france office';
    for (const { keys, query: q } of keywordMap) {
      if (keys.some(k => titreLower.includes(k))) { query = q; break; }
    }

    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
    );
    const data = await res.json();
    const photo = data?.results?.[0];
    if (!photo) return { image_url: null, image_credit: null, image_credit_url: null };
    return {
      image_url: photo.urls.regular,
      image_credit: photo.user.name,
      image_credit_url: photo.user.links.html,
    };
  } catch {
    return { image_url: null, image_credit: null, image_credit_url: null };
  }
}

// ── ACTION : sitemap (GET) ─────────────────────────────────────────
async function handleSitemap(res) {
  const BASE_URL = 'https://vigie-officiel.com';
  const STATIC_PAGES = [
    { url: '/',         priority: '1.0', changefreq: 'weekly'  },
    { url: '/blog',     priority: '0.9', changefreq: 'daily'   },
    { url: '/features', priority: '0.8', changefreq: 'monthly' },
    { url: '/pricing',  priority: '0.8', changefreq: 'monthly' },
    { url: '/contact',  priority: '0.6', changefreq: 'monthly' },
  ];

  const { data: articles } = await supabase
    .from('blog_articles')
    .select('slug, updated_at, created_at')
    .eq('statut', 'publie')
    .order('created_at', { ascending: false });

  const now = new Date().toISOString().split('T')[0];

  const staticUrls = STATIC_PAGES.map(p => `
  <url>
    <loc>${BASE_URL}${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

  const articleUrls = (articles || []).map(a => {
    const lastmod = (a.updated_at || a.created_at || now).split('T')[0];
    return `
  <url>
    <loc>${BASE_URL}/blog/${a.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${articleUrls}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(sitemap);
}

// ── ACTION : generate ──────────────────────────────────────────────
async function handleGenerate(body) {
  const { sujet, categorie = 'Guide pratique', publier = false } = body;
  if (!sujet) throw new Error('Sujet requis');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4000,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [{
      role: 'user',
      content: `Tu es un rédacteur SEO expert en gestion d'entreprise et fiscalité française pour auto-entrepreneurs et TPE.

Rédige un article de blog complet et optimisé SEO sur le sujet suivant : "${sujet}"

L'article doit :
- Cibler les auto-entrepreneurs, micro-entrepreneurs et TPE françaises
- Être informatif et pédagogique (pas de conseil personnalisé)
- Faire entre 1200 et 1800 mots
- Utiliser un ton professionnel mais accessible
- Inclure des exemples concrets chiffrés quand c'est pertinent
- Se terminer par un CTA naturel vers Vigie Pro

Réponds UNIQUEMENT en JSON valide :
{
  "titre": "Titre optimisé SEO (60 caractères max)",
  "meta_description": "Description meta SEO (155 caractères max)",
  "contenu": "Article complet en markdown avec ## H2 et ### H3",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Termine toujours l'article par :
"*Ces informations sont fournies à titre indicatif. Pour votre situation personnelle, consultez un expert-comptable ou un conseiller juridique.*"`
    }]
  });

  const article = parseJSON(completion.choices[0].message.content);
  const slug = generateSlug(article.titre) + '-' + Date.now().toString(36);
  const imageData = await fetchUnsplashImage(article.titre);

  const { data, error } = await supabase.from('blog_articles').insert([{
    slug, titre: article.titre, meta_description: article.meta_description,
    contenu: article.contenu, categorie, tags: article.tags || [],
    statut: publier ? 'publie' : 'brouillon',
    date_publication: publier ? new Date().toISOString() : null,
    auto_generated: false, ...imageData
  }]).select().single();

  if (error) throw error;
  return { ok: true, article: data };
}

// ── ACTION : topics ────────────────────────────────────────────────
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
    if (a.categorie && categoryCounts[a.categorie] !== undefined) categoryCounts[a.categorie]++;
  });

  const targetCategory = [...CATEGORIES].sort((a, b) => categoryCounts[a] - categoryCounts[b])[0];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: "json_object" },
    temperature: 0.7, max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Tu es un expert en gestion d'entreprise pour auto-entrepreneurs français.
Catégorie cible : "${targetCategory}"
Articles déjà publiés (ÉVITE tout sujet similaire) :
${existingTitles}
Propose UN sujet d'article factuel, utile, pratique sur "${targetCategory}" différent de tous les articles existants.
Réponds UNIQUEMENT en JSON valide :
{
  "titre": "Titre de l'article (60 caractères max)",
  "categorie": "${targetCategory}",
  "angle": "En une phrase, l'angle précis de l'article",
  "mots_cles": ["mot1", "mot2", "mot3"]
}`
    }]
  });

  const topic = parseJSON(completion.choices[0].message.content);
  return { success: true, topic };
}

// ── ACTION : pipeline ──────────────────────────────────────────────
async function handlePipeline(body) {
  const { titre, categorie, angle, mots_cles, auto_generated = true } = body;
  if (!titre || !categorie) throw new Error('titre et categorie requis');

  const rechercheRes = await openai.chat.completions.create({
    model: 'gpt-4o', response_format: { type: "json_object" },
    temperature: 0.2, max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Agent de recherche droit/gestion auto-entrepreneurs français.
Sujet : "${titre}" | Angle : "${angle}" | Catégorie : "${categorie}"
Sources : URSSAF, Service-Public.fr, Legifrance, INPI, Bpifrance, impots.gouv.fr.
Réponds en JSON :
{
  "faits_cles": ["fait 1", "fait 2", "fait 3", "fait 4", "fait 5"],
  "sources": ["https://url1.fr", "https://url2.fr"],
  "points_attention": ["piège 1", "piège 2"]
}`
    }]
  });
  const recherche = parseJSON(rechercheRes.choices[0].message.content);

  const redactionRes = await openai.chat.completions.create({
    model: 'gpt-4o', temperature: 0.5, max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Rédacteur expert gestion auto-entrepreneurs français.
Titre : "${titre}" | Catégorie : "${categorie}" | Angle : "${angle}"
Mots-clés : ${Array.isArray(mots_cles) ? mots_cles.join(', ') : mots_cles}
Faits : ${recherche.faits_cles.map((f, i) => `${i + 1}. ${f}`).join('\n')}
Points attention : ${recherche.points_attention.map((p, i) => `${i + 1}. ${p}`).join('\n')}
Rédige 1500 mots minimum en markdown.
Structure : Introduction → ## Contexte → ## Fonctionnement → ## Chiffres clés → ## Erreurs à éviter → ## Conseils pratiques → Conclusion CTA Vigie Pro
Termine par : "---\\n*Article libre de droit — Vigie Pro 2026. Sources : ${recherche.sources.join(', ')}*"
"*Ces informations sont fournies à titre indicatif. Consultez un expert-comptable pour votre situation.*"
Réponds en markdown uniquement.`
    }]
  });
  const contenu = redactionRes.choices[0].message.content.trim();

  const seoRes = await openai.chat.completions.create({
    model: 'gpt-4o', response_format: { type: "json_object" },
    temperature: 0.2, max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Expert SEO fact-checker juridique/fiscal français.
Titre : "${titre}" | Catégorie : "${categorie}" | Mots-clés : ${Array.isArray(mots_cles) ? mots_cles.join(', ') : mots_cles}
Extrait : ${contenu.slice(0, 2000)}...
Réponds en JSON :
{
  "titre_seo": "Titre 55-60 caractères",
  "meta_description": "Description 150-160 caractères",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "score_factuel": 8,
  "remarques": "Aucune anomalie"
}`
    }]
  });
  const seo = parseJSON(seoRes.choices[0].message.content);
  const imageData = await fetchUnsplashImage(seo.titre_seo || titre);

  let slug = generateSlug(seo.titre_seo || titre);
  const { data: existing } = await supabase.from('blog_articles').select('id').eq('slug', slug).single();
  if (existing) slug = `${slug}-${Date.now()}`;

  const statut = auto_generated ? 'a_relire' : 'publie';
  const { data: article, error } = await supabase.from('blog_articles').insert({
    slug, titre: seo.titre_seo || titre, meta_description: seo.meta_description,
    contenu, categorie, tags: seo.tags, statut, source_urls: recherche.sources,
    auto_generated, date_publication: statut === 'publie' ? new Date().toISOString() : null,
    ...imageData
  }).select().single();

  if (error) throw error;
  return { success: true, article_id: article.id, slug: article.slug, titre: article.titre, statut, score_factuel: seo.score_factuel, remarques: seo.remarques, image_url: imageData.image_url };
}

// ── ACTION : refresh ───────────────────────────────────────────────
async function handleRefresh(req) {
  const { authorization } = req.headers;
  if (authorization !== `Bearer ${process.env.MAKE_WEBHOOK_SECRET}`) throw new Error('Unauthorized');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: articles } = await supabase.from('blog_articles')
    .select('id, titre, contenu, categorie')
    .eq('statut', 'publie')
    .lt('updated_at', thirtyDaysAgo.toISOString())
    .limit(3);

  if (!articles || articles.length === 0) return { success: true, message: 'Aucun article à rafraîchir' };

  const results = [];
  for (const article of articles) {
    const checkRes = await openai.chat.completions.create({
      model: 'gpt-4o', response_format: { type: "json_object" },
      temperature: 0.2, max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Expert veille juridique/fiscale auto-entrepreneurs français.
Titre : "${article.titre}" | Catégorie : "${article.categorie}"
Extrait : ${article.contenu?.slice(0, 1500)}
En 2026, vérifie si des infos sont obsolètes (URSSAF, plafonds, e-invoicing).
Réponds en JSON :
{
  "necessite_update": true,
  "raisons": ["raison 1"],
  "nouveau_paragraphe": "Paragraphe à ajouter en tête (ou null)"
}`
      }]
    });
    const check = parseJSON(checkRes.choices[0].message.content);
    if (check.necessite_update && check.nouveau_paragraphe) {
      const updatedContenu = `> ⚠️ **Mis à jour le ${new Date().toLocaleDateString('fr-FR')}** — ${check.raisons.join('. ')}\n\n${check.nouveau_paragraphe}\n\n---\n\n${article.contenu}`;
      await supabase.from('blog_articles').update({ contenu: updatedContenu, updated_at: new Date().toISOString() }).eq('id', article.id);
      results.push({ id: article.id, titre: article.titre, updated: true });
    } else {
      await supabase.from('blog_articles').update({ updated_at: new Date().toISOString() }).eq('id', article.id);
      results.push({ id: article.id, titre: article.titre, updated: false });
    }
  }
  return { success: true, results };
}

// ── HANDLER PRINCIPAL ──────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method === 'GET') {
    try { return await handleSitemap(res); }
    catch (error) { return res.status(500).json({ error: error.message }); }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, ...body } = req.body;
  try {
    let result;
    if (action === 'generate')        result = await handleGenerate(body);
    else if (action === 'topics')     result = await handleTopics();
    else if (action === 'pipeline')   result = await handlePipeline(body);
    else if (action === 'refresh')    result = await handleRefresh(req);
    else return res.status(400).json({ error: 'action invalide — utilise: generate | topics | pipeline | refresh' });
    return res.status(200).json(result);
  } catch (error) {
    console.error(`[blog-agent/${action}]`, error);
    return res.status(500).json({ error: error.message });
  }
}
