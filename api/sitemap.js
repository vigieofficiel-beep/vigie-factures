// /api/sitemap.js
// Génère un sitemap XML dynamique depuis Supabase

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_PRO_URL,
  process.env.SUPABASE_PRO_SERVICE_KEY
);

const BASE_URL = 'https://vigie-officiel.com';

const STATIC_PAGES = [
  { url: '/',           priority: '1.0', changefreq: 'weekly'  },
  { url: '/blog',       priority: '0.9', changefreq: 'daily'   },
  { url: '/features',   priority: '0.8', changefreq: 'monthly' },
  { url: '/pricing',    priority: '0.8', changefreq: 'monthly' },
  { url: '/contact',    priority: '0.6', changefreq: 'monthly' },
];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
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

  } catch (error) {
    console.error('[sitemap]', error);
    return res.status(500).json({ error: error.message });
  }
}
