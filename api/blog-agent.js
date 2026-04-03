// /api/blog-agent.js
// Actions POST : 'generate' | 'topics' | 'pipeline' | 'refresh' | 'subscribe' | 'newsletter-send'
// Action GET   : sitemap XML

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.VITE_SUPABASE_PRO_URL,
  process.env.SUPABASE_PRO_SERVICE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Vigie Blog <vigie.officiel@vigie-officiel.com>';

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

// ── Images fixes par catégorie ─────────────────────────────────────
function fetchUnsplashImage(titre) {
  const t = titre.toLowerCase();
  const imageMap = [
    { keys: ['tva', 'taxe', 'fiscal', 'impôt'],          url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200' },
    { keys: ['urssaf', 'cotisation', 'charge'],           url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200' },
    { keys: ['factur', 'devis'],                          url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200' },
    { keys: ['contrat', 'assurance', 'juridique'],        url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200' },
    { keys: ['trésorerie', 'cash', 'banque', 'finance'],  url: 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=1200' },
    { keys: ['comptab'],                                   url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200' },
    { keys: ['client', 'prospect', 'commercial'],         url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200' },
    { keys: ['création', 'créer', 'lancer', 'startup'],   url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200' },
    { keys: ['numérique', 'ia', 'digital', 'outil'],      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
    { keys: ['marketing', 'brand', 'réseaux'],            url: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f5c9a8?w=1200' },
    { keys: ['formation', 'compétence', 'apprendre'],     url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200' },
    { keys: ['sécurité', 'rgpd', 'données'],              url: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=1200' },
    { keys: ['artisan', 'btp', 'chantier'],               url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200' },
    { keys: ['seuil', 'plafond', 'chiffre'],              url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200' },
    { keys: ['santé', 'bien-être'],                       url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200' },
    { keys: ['retraite', 'épargne', 'prévoyance'],        url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200' },
    { keys: ['radiation', 'cessation', 'fermer'],         url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200' },
    { keys: ['propriété', 'intellectuelle', 'brevet'],    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200' },
  ];
  for (const { keys, url } of imageMap) {
    if (keys.some(k => t.includes(k))) {
      return { image_url: url, image_credit: 'Unsplash', image_credit_url: 'https://unsplash.com' };
    }
  }
  return { image_url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200', image_credit: 'Unsplash', image_credit_url: 'https://unsplash.com' };
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
  const staticUrls = STATIC_PAGES.map(p => `\n  <url><loc>${BASE_URL}${p.url}</loc><lastmod>${now}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`).join('');
  const articleUrls = (articles || []).map(a => {
    const lastmod = (a.updated_at || a.created_at || now).split('T')[0];
    return `\n  <url><loc>${BASE_URL}/blog/${a.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`;
  }).join('');
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${articleUrls}\n</urlset>`);
}

// ── ACTION : subscribe ─────────────────────────────────────────────
async function handleSubscribe(body) {
  const { email } = body;
  if (!email || !email.includes('@')) throw new Error('Email invalide');

  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert({ email, active: true }, { onConflict: 'email' });
  if (error) throw error;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: '✅ Inscription confirmée — Vigie Blog',
    html: `<div style="font-family:sans-serif;background:#06080B;color:#EDE8DB;padding:40px;max-width:560px;margin:0 auto;border-radius:16px">
      <h1 style="font-size:24px;color:#5BC78A;margin-bottom:16px">Bienvenue sur Vigie Blog !</h1>
      <p style="font-size:15px;color:rgba(237,232,219,0.7);line-height:1.7;margin-bottom:20px">Vous recevrez désormais nos nouveaux articles directement dans votre boîte mail.</p>
      <p style="font-size:13px;color:rgba(237,232,219,0.4)">Guides pratiques, actualités fiscales — articles libres de droit.</p>
      <div style="margin-top:24px;font-size:12px;color:rgba(237,232,219,0.3)">
        <a href="https://vigie-officiel.com/blog" style="color:#5BC78A;text-decoration:none">vigie-officiel.com/blog</a>
      </div>
    </div>`
  });

  return { success: true };
}

// ── ACTION : newsletter-send ───────────────────────────────────────
async function handleNewsletterSend(body) {
  const { article_id } = body;
  if (!article_id) throw new Error('article_id requis');

  const { data: article } = await supabase
    .from('blog_articles')
    .select('titre, meta_description, slug, categorie, image_url')
    .eq('id', article_id).single();
  if (!article) throw new Error('Article introuvable');

  const { data: subscribers } = await supabase
    .from('newsletter_subscribers')
    .select('email').eq('active', true);
  if (!subscribers || subscribers.length === 0) return { success: true, sent: 0 };

  const articleUrl = `https://vigie-officiel.com/blog/${article.slug}`;
  const imageHtml = article.image_url
    ? `<img src="${article.image_url}" alt="${article.titre}" style="width:100%;height:200px;object-fit:cover;border-radius:10px;margin-bottom:20px"/>`
    : '';

  const emails = subscribers.map(s => s.email);
  let sent = 0;
  for (let i = 0; i < emails.length; i += 50) {
    const batch = emails.slice(i, i + 50);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: batch,
      subject: `📖 ${article.titre}`,
      html: `<div style="font-family:sans-serif;background:#06080B;color:#EDE8DB;padding:40px;max-width:560px;margin:0 auto;border-radius:16px">
        ${imageHtml}
        <span style="font-size:10px;font-weight:700;color:#5BC78A;background:rgba(91,199,138,0.1);padding:4px 12px;border-radius:20px;text-transform:uppercase">${article.categorie}</span>
        <h1 style="font-size:24px;color:#EDE8DB;margin:16px 0 12px;line-height:1.2">${article.titre}</h1>
        <p style="font-size:14px;color:rgba(237,232,219,0.6);line-height:1.7;margin-bottom:24px">${article.meta_description}</p>
        <a href="${articleUrl}" style="display:inline-block;padding:12px 28px;border-radius:10px;background:#5BA3C7;color:#fff;font-size:14px;font-weight:700;text-decoration:none">Lire l'article →</a>
        <div style="margin-top:24px;font-size:12px;color:rgba(237,232,219,0.3)">
          Article libre de droit · <a href="https://vigie-officiel.com/blog" style="color:#5BC78A;text-decoration:none">vigie-officiel.com/blog</a>
        </div>
      </div>`
    });
    sent += batch.length;
  }
  return { success: true, sent };
}

// ── ACTION : generate ──────────────────────────────────────────────
async function handleGenerate(body) {
  const { sujet, categorie = 'Guide pratique', publier = false } = body;
  if (!sujet) throw new Error('Sujet requis');

  const imageData = fetchUnsplashImage(sujet);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o', max_tokens: 4000, temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [{
      role: 'user',
      content: `Tu es un rédacteur SEO expert en gestion d'entreprise et fiscalité française pour auto-entrepreneurs et TPE.
Rédige un article de blog complet et optimisé SEO sur : "${sujet}"
- Entre 1200 et 1800 mots, ton professionnel mais accessible
- Se termine par un CTA vers Vigie Pro
Réponds UNIQUEMENT en JSON valide :
{"titre":"Titre SEO 60 car max","meta_description":"Description 155 car max","contenu":"Article markdown ## H2 ### H3","tags":["t1","t2","t3","t4","t5"]}
Termine par : "*Ces informations sont fournies à titre indicatif. Consultez un expert-comptable.*"`
    }]
  });

  const article = parseJSON(completion.choices[0].message.content);
  const slug = generateSlug(article.titre) + '-' + Date.now().toString(36);

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

  const imageData = fetchUnsplashImage(titre);

  const rechercheRes = await openai.chat.completions.create({
    model: 'gpt-4o', response_format: { type: "json_object" },
    temperature: 0.2, max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Agent recherche droit/gestion auto-entrepreneurs.
Sujet:"${titre}"|Angle:"${angle}"|Catégorie:"${categorie}"
Sources: URSSAF,Service-Public.fr,Legifrance,INPI,Bpifrance,impots.gouv.fr
JSON:{"faits_cles":["f1","f2","f3","f4","f5"],"sources":["url1","url2"],"points_attention":["p1","p2"]}`
    }]
  });
  const recherche = parseJSON(rechercheRes.choices[0].message.content);

  const redactionRes = await openai.chat.completions.create({
    model: 'gpt-4o', temperature: 0.5, max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Rédacteur expert auto-entrepreneurs français.
Titre:"${titre}"|Cat:"${categorie}"|Angle:"${angle}"
Mots-clés:${Array.isArray(mots_cles)?mots_cles.join(','):mots_cles}
Faits:${recherche.faits_cles.map((f,i)=>`${i+1}.${f}`).join('\n')}
Points:${recherche.points_attention.map((p,i)=>`${i+1}.${p}`).join('\n')}
1500 mots markdown. Intro→##Contexte→##Fonctionnement→##Chiffres→##Erreurs→##Conseils→Conclusion CTA Vigie Pro
Fin:"---\\n*Article libre de droit — Vigie Pro 2026. Sources:${recherche.sources.join(',')}*\\n*Informations indicatives.*"
Markdown uniquement.`
    }]
  });
  const contenu = redactionRes.choices[0].message.content.trim();

  const seoRes = await openai.chat.completions.create({
    model: 'gpt-4o', response_format: { type: "json_object" },
    temperature: 0.2, max_tokens: 400,
    messages: [{
      role: 'user',
      content: `SEO fact-checker juridique/fiscal.
Titre:"${titre}"|Cat:"${categorie}"|Mots-clés:${Array.isArray(mots_cles)?mots_cles.join(','):mots_cles}
Extrait:${contenu.slice(0,2000)}...
JSON:{"titre_seo":"55-60 car","meta_description":"150-160 car","tags":["t1","t2","t3","t4","t5"],"score_factuel":8,"remarques":"ok"}`
    }]
  });
  const seo = parseJSON(seoRes.choices[0].message.content);

  let slug = generateSlug(seo.titre_seo || titre);
  const { data: existing } = await supabase.from('blog_articles').select('id').eq('slug', slug).single();
  if (existing) slug = `${slug}-${Date.now()}`;

  const statut = auto_generated ? 'a_relire' : 'publie';
  const { data: article, error } = await supabase.from('blog_articles').insert({
    slug, titre: seo.titre_seo || titre, meta_description: seo.meta_description,
    contenu, categorie, tags: seo.tags, statut,
    source_urls: recherche.sources, auto_generated,
    date_publication: statut === 'publie' ? new Date().toISOString() : null,
    ...imageData
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
        content: `Veille juridique/fiscale 2026.
Titre:"${article.titre}"|Cat:"${article.categorie}"
Extrait:${article.contenu?.slice(0,1500)}
Vérifie obsolescence (URSSAF,plafonds,e-invoicing).
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
    if (action === 'generate')             result = await handleGenerate(body);
    else if (action === 'topics')          result = await handleTopics();
    else if (action === 'pipeline')        result = await handlePipeline(body);
    else if (action === 'refresh')         result = await handleRefresh(req);
    else if (action === 'subscribe')       result = await handleSubscribe(body);
    else if (action === 'newsletter-send') result = await handleNewsletterSend(body);
    else return res.status(400).json({ error: 'action invalide' });
    return res.status(200).json(result);
  } catch (error) {
    console.error(`[blog-agent/${action}]`, error);
    return res.status(500).json({ error: error.message });
  }
}
