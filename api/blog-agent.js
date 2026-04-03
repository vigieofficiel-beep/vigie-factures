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

// ── Unsplash ───────────────────────────────────────────────────────
function getUnsplashQuery(titre) {
  const t = titre.toLowerCase();
  const map = [
    { keys: ['tva', 'taxe', 'fiscal', 'impôt'],         q: 'tax business accounting' },
    { keys: ['urssaf', 'cotisation', 'charge'],          q: 'entrepreneur office work' },
    { keys: ['factur', 'devis'],                         q: 'invoice business document' },
    { keys: ['contrat', 'assurance', 'juridique'],       q: 'contract signing business' },
    { keys: ['trésorerie', 'cash', 'banque', 'finance'], q: 'finance money business' },
    { keys: ['comptab'],                                  q: 'accounting office laptop' },
    { keys: ['client', 'prospect', 'commercial'],        q: 'business meeting client' },
    { keys: ['création', 'créer', 'lancer', 'startup'],  q: 'startup entrepreneur launch' },
    { keys: ['numérique', 'ia', 'digital', 'outil'],     q: 'digital technology laptop' },
    { keys: ['marketing', 'brand', 'réseaux'],           q: 'marketing social media' },
    { keys: ['santé', 'bien-être'],                      q: 'health wellness work' },
    { keys: ['formation', 'compétence', 'apprendre'],    q: 'learning education training' },
    { keys: ['sécurité', 'rgpd', 'données'],             q: 'cybersecurity data protection' },
    { keys: ['retraite', 'épargne', 'prévoyance'],       q: 'savings retirement finance' },
    { keys: ['artisan', 'btp', 'chantier'],              q: 'craftsman workshop tools' },
    { keys: ['seuil', 'plafond', 'chiffre'],             q: 'business revenue growth' },
  ];
  for (const { keys, q } of map) {
    if (keys.some(k => t.includes(k))) return q;
  }
  return 'small business entrepreneur office';
}

async function fetchUnsplashImage(titre) {
  try {
    const query = getUnsplashQuery(titre);
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
  } catch (e) {
    console.error('[unsplash]', e.message);
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
    .from('blog_articles').select('slug, updated_at, created_at')
    .eq('statut', 'publie').order('created_at', { ascending: false });
  const now = new Date().toISOString().split('T')[0];
  const staticUrls = STATIC_PAGES.map(p => `
  <url><loc>${BASE_URL}${p.url}</loc><lastmod>${now}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`).join('');
  const articleUrls = (articles || []).map(a => {
    const lastmod = (a.updated_at || a.created_at || now).split('T')[0];
    return `\n  <url><loc>${BASE_URL}/blog/${a.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`;
  }).join('');
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${articleUrls}\n</urlset>`);
}

// ── ACTION : generate ──────────────────────────────────────────────
async function handleGenerate(body) {
  const { sujet, categorie = 'Guide pratique', publier = false } = body;
  if (!sujet) throw new Error('Sujet requis');

  // Lance OpenAI et Unsplash en parallèle
  const [completion, imageData] = await Promise.all([
    openai.chat.completions.create({
      model: 'gpt-4o', max_tokens: 4000, temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [{
        role: 'user',
        content: `Tu es un rédacteur SEO expert en gestion d'entreprise et fiscalité française pour auto-entrepreneurs et TPE.
Rédige un article de blog complet et optimisé SEO sur : "${sujet}"
- Entre 1200 et 1800 mots, ton professionnel mais accessible
- Se termine par un CTA vers Vigie Pro
Réponds UNIQUEMENT en JSON valide :
{
  "titre": "Titre optimisé SEO (60 caractères max)",
  "meta_description": "Description meta SEO (155 caractères max)",
  "contenu": "Article complet en markdown avec ## H2 et ### H3",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}
Termine par : "*Ces informations sont fournies à titre indicatif. Consultez un expert-comptable ou un conseiller juridique.*"`
      }]
    }),
    fetchUnsplashImage(sujet)
  ]);

  const article = parseJSON(completion.choices[0].message.content);
  const slug = generateSlug(article.titre) + '-' + Date.now().toString(36);

  console.log('[generate] image_url:', imageData.image_url);

  const { data, error } = await supabase.from('blog_articles').insert([{
    slug, titre: article.titre, meta_description: article.meta_description,
    contenu: article.contenu, categorie, tags: article.tags || [],
    statut: publier ? 'publie' : 'brouillon',
    date_publication: publier ? new Date().toISOString() : null,
    auto_generated: false,
    image_url: imageData.image_url,
    image_credit: imageData.image_credit,
    image_credit_url: imageData.image_credit_url,
  }]).select().single();

  if (error) throw error;
  return { ok: true, article: data };
}

// ── ACTION : topics ────────────────────────────────────────────────
async function handleTopics() {
  const { data: existingArticles } = await supabase
    .from('blog_articles').select('titre, categorie')
    .order('created_at', { ascending: false }).limit(200);

  const existingTitles = existingArticles?.map(a => a.titre).join('\n') || '';
  const categoryCounts = {};
  CATEGORIES.forEach(c => categoryCounts[c] = 0);
  existingArticles?.forEach(a => {
    if (a.categorie && categoryCounts[a.categorie] !== undefined) categoryCounts[a.categorie]++;
  });
  const targetCategory = [...CATEGORIES].sort((a, b) => categoryCounts[a] - categoryCounts[b])[0];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o', response_format: { type: "json_object" },
    temperature: 0.7, max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Expert gestion auto-entrepreneurs français.
Catégorie : "${targetCategory}"
Articles existants (ÉVITE) : ${existingTitles}
Propose UN sujet différent. JSON :
{"titre":"60 car max","categorie":"${targetCategory}","angle":"une phrase","mots_cles":["mot1","mot2","mot3"]}`
    }]
  });
  const topic = parseJSON(completion.choices[0].message.content);
  return { success: true, topic };
}

// ── ACTION : pipeline ──────────────────────────────────────────────
async function handlePipeline(body) {
  const { titre, categorie, angle, mots_cles, auto_generated = true } = body;
  if (!titre || !categorie) throw new Error('titre et categorie requis');

  // Agent 2 — Recherche + Unsplash en parallèle
  const [rechercheRes, imageData] = await Promise.all([
    openai.chat.completions.create({
      model: 'gpt-4o', response_format: { type: "json_object" },
      temperature: 0.2, max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Agent recherche droit/gestion auto-entrepreneurs.
Sujet:"${titre}"|Angle:"${angle}"|Catégorie:"${categorie}"
Sources: URSSAF,Service-Public.fr,Legifrance,INPI,Bpifrance,impots.gouv.fr
JSON: {"faits_cles":["f1","f2","f3","f4","f5"],"sources":["url1","url2"],"points_attention":["p1","p2"]}`
      }]
    }),
    fetchUnsplashImage(titre)
  ]);
  const recherche = parseJSON(rechercheRes.choices[0].message.content);

  // Agent 3 — Rédaction
  const redactionRes = await openai.chat.completions.create({
    model: 'gpt-4o', temperature: 0.5, max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Rédacteur expert auto-entrepreneurs français.
Titre:"${titre}"|Cat:"${categorie}"|Angle:"${angle}"
Mots-clés: ${Array.isArray(mots_cles) ? mots_cles.join(', ') : mots_cles}
Faits: ${recherche.faits_cles.map((f,i)=>`${i+1}.${f}`).join('\n')}
Points: ${recherche.points_attention.map((p,i)=>`${i+1}.${p}`).join('\n')}
1500 mots markdown. Structure: Intro→##Contexte→##Fonctionnement→##Chiffres→##Erreurs→##Conseils→Conclusion CTA Vigie Pro
Fin: "---\\n*Article libre de droit — Vigie Pro 2026. Sources: ${recherche.sources.join(', ')}*\\n*Informations indicatives. Consultez un expert-comptable.*"
Markdown uniquement.`
    }]
  });
  const contenu = redactionRes.choices[0].message.content.trim();

  // Agent 4 — SEO
  const seoRes = await openai.chat.completions.create({
    model: 'gpt-4o', response_format: { type: "json_object" },
    temperature: 0.2, max_tokens: 400,
    messages: [{
      role: 'user',
      content: `SEO fact-checker juridique/fiscal français.
Titre:"${titre}"|Cat:"${categorie}"|Mots-clés:${Array.isArray(mots_cles)?mots_cles.join(','):mots_cles}
Extrait:${contenu.slice(0,2000)}...
JSON:{"titre_seo":"55-60 car","meta_description":"150-160 car","tags":["t1","t2","t3","t4","t5"],"score_factuel":8,"remarques":"ok"}`
    }]
  });
  const seo = parseJSON(seoRes.choices[0].message.content);

  console.log('[pipeline] image_url:', imageData.image_url);

  // Agent 5 — Publication
  let slug = generateSlug(seo.titre_seo || titre);
  const { data: existing } = await supabase.from('blog_articles').select('id').eq('slug', slug).single();
  if (existing) slug = `${slug}-${Date.now()}`;

  const statut = auto_generated ? 'a_relire' : 'publie';
  const { data: article, error } = await supabase.from('blog_articles').insert({
    slug, titre: seo.titre_seo || titre, meta_description: seo.meta_description,
    contenu, categorie, tags: seo.tags, statut,
    source_urls: recherche.sources, auto_generated,
    date_publication: statut === 'publie' ? new Date().toISOString() : null,
    image_url: imageData.image_url,
    image_credit: imageData.image_credit,
    image_credit_url: imageData.image_credit_url,
  }).select().single();

  if (error) throw error;
  return { success: true, article_id: article.id, slug: article.slug, titre: article.titre, statut, score_factuel: seo.score_factuel, image_url: imageData.image_url };
}

// ── ACTION : refresh ───────────────────────────────────────────────
async function handleRefresh(req) {
  const { authorization } = req.headers;
  if (authorization !== `Bearer ${process.env.MAKE_WEBHOOK_SECRET}`) throw new Error('Unauthorized');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: articles } = await supabase.from('blog_articles')
    .select('id, titre, contenu, categorie').eq('statut', 'publie')
    .lt('updated_at', thirtyDaysAgo.toISOString()).limit(3);

  if (!articles || articles.length === 0) return { success: true, message: 'Aucun article à rafraîchir' };

  const results = [];
  for (const article of articles) {
    const checkRes = await openai.chat.completions.create({
      model: 'gpt-4o', response_format: { type: "json_object" },
      temperature: 0.2, max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Veille juridique/fiscale auto-entrepreneurs 2026.
Titre:"${article.titre}"|Cat:"${article.categorie}"
Extrait:${article.contenu?.slice(0,1500)}
Vérifie si infos obsolètes (URSSAF,plafonds,e-invoicing).
JSON:{"necessite_update":true,"raisons":["r1"],"nouveau_paragraphe":"texte ou null"}`
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
    else return res.status(400).json({ error: 'action invalide' });
    return res.status(200).json(result);
  } catch (error) {
    console.error(`[blog-agent/${action}]`, error);
    return res.status(500).json({ error: error.message });
  }
}
