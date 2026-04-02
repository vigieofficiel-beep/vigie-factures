// /api/blog-topics.js
// Agent 1 — Sélection du sujet + vérification anti-doublon
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Récupère tous les titres existants pour anti-doublon
    const { data: existingArticles } = await supabase
      .from('blog_articles')
      .select('titre, categorie')
      .order('created_at', { ascending: false })
      .limit(200);

    const existingTitles = existingArticles?.map(a => a.titre).join('\n') || '';

    // Choisit une catégorie peu couverte
    const categoryCounts = {};
    CATEGORIES.forEach(c => categoryCounts[c] = 0);
    existingArticles?.forEach(a => {
      if (a.categorie && categoryCounts[a.categorie] !== undefined) {
        categoryCounts[a.categorie]++;
      }
    });

    // Trie par catégories les moins couvertes
    const sortedCategories = CATEGORIES.sort((a, b) => categoryCounts[a] - categoryCounts[b]);
    const targetCategory = sortedCategories[0];

    const prompt = `Tu es un expert en gestion d'entreprise pour auto-entrepreneurs français.

Catégorie cible : "${targetCategory}"

Articles déjà publiés (ÉVITE tout sujet similaire) :
${existingTitles}

Ta mission : Propose UN sujet d'article factuel, utile, pratique sur la catégorie "${targetCategory}".
Le sujet doit être DIFFÉRENT de tous les articles existants.
Il doit répondre à une vraie question qu'un auto-entrepreneur se pose en 2026.

Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "titre": "Titre de l'article (60 caractères max)",
  "categorie": "${targetCategory}",
  "angle": "En une phrase, l'angle précis de l'article",
  "mots_cles": ["mot1", "mot2", "mot3"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300
    });

    const raw = completion.choices[0].message.content.trim();
    const topic = JSON.parse(raw);

    return res.status(200).json({ success: true, topic });
  } catch (error) {
    console.error('blog-topics error:', error);
    return res.status(500).json({ error: error.message });
  }
}