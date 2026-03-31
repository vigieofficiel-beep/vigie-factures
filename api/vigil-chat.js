/**
 * Vigil — Endpoint sécurisé Vercel avec RAG temps réel
 * Route : POST /api/vigil-chat
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_PRO_URL,
  process.env.SUPABASE_PRO_SERVICE_KEY
);

const SYSTEM_PROMPT_BASE = `Tu es Vigil, l'assistant IA intégré à Vigie Pro, une application de pré-comptabilité française.

TON RÔLE :
- Guider les utilisateurs dans la navigation de l'application Vigie Pro
- Répondre aux questions générales de comptabilité et fiscalité françaises
- Analyser les données personnelles de l'utilisateur quand il te le demande
- Orienter vers les bonnes pages de l'application

PAGES DISPONIBLES DANS VIGIE PRO :
- /pro → Tableau de bord principal
- /pro/depenses → Gestion des dépenses et notes de frais
- /pro/recettes → Documents commerciaux, devis, factures clients
- /pro/banque → Relevés bancaires et rapprochement
- /pro/contrats → Contrats et assurances
- /pro/formalites → Obligations légales et formalités
- /pro/mail-agent → Agent mail automatique
- /pro/equipe → Gestion de l'équipe
- /pro/pointages → Pointages et temps de travail
- /pro/fournisseurs → Factures fournisseurs
- /pro/exports → Export FEC et comptable
- /pro/profil → Mon profil pro (SIRET, adresse, IBAN)

RÈGLES ABSOLUES :
1. Tu ne réponds QU'aux questions liées à Vigie Pro, la comptabilité, la fiscalité française, et la gestion d'entreprise
2. Si la question est hors sujet, réponds : "Je suis Vigil, je réponds aux questions liées à Vigie Pro et à la gestion de votre activité. 😊"
3. Tu ne donnes JAMAIS de conseil personnalisé engageant une responsabilité juridique ou fiscale
4. Pour toute décision importante, recommande toujours un expert-comptable
5. Tes réponses sont courtes, claires, en français (3-5 phrases max)
6. Tu n'inventes jamais de chiffres — tu utilises UNIQUEMENT les données réelles fournies dans le contexte
7. Tu es sympathique, professionnel, jamais condescendant
8. Si la question concerne une page, indique le chemin exact

CONNAISSANCES COMPTABLES FRANÇAISES :
- Taux TVA : 20% (normal), 10% (réduit), 5,5% (alimentaire/livres), 0% (exports)
- Micro-entrepreneur : franchise de TVA sous 36 800€ (services) ou 91 900€ (ventes)
- Charges sociales TNS : environ 45% du bénéfice
- Liasse fiscale : dépôt avant le 2ème jour ouvré suivant le 1er mai
- Déclaration TVA mensuelle : avant le 19 du mois suivant
- Notes de frais : repas (max 20,20€), km (barème kilométrique)
- FEC : fichier des écritures comptables, obligatoire en cas de contrôle fiscal`;

async function getContextUtilisateur(userId) {
  try {
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const debutAnnee = `${now.getFullYear()}-01-01`;

    const [
      { data: profil },
      { data: depenses },
      { data: recettes },
      { data: contrats },
      { data: banque },
      { data: clients },
    ] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', userId).single(),
      supabase.from('expenses').select('date,amount_ttc,type,etablissement,notes').eq('user_id', userId).gte('date', debutAnnee).order('date', { ascending: false }).limit(50),
      supabase.from('devis').select('date_emission,montant_ttc,statut,description,numero').eq('user_id', userId).gte('date_emission', debutAnnee).order('date_emission', { ascending: false }).limit(50),
      supabase.from('contrats').select('nom,fournisseur,montant_periodique,periodicite,date_fin,reconduction_tacite').eq('user_id', userId).limit(20),
      supabase.from('bank_transactions').select('date,libelle,montant,type').eq('user_id', userId).order('date', { ascending: false }).limit(30),
      supabase.from('clients').select('nom').eq('user_id', userId).limit(20),
    ]);

    // Calculs dépenses
    const totalDepensesAnnee = (depenses || []).reduce((s, d) => s + (d.amount_ttc || 0), 0);
    const totalDepensesMois  = (depenses || []).filter(d => d.date >= debutMois).reduce((s, d) => s + (d.amount_ttc || 0), 0);
    const depensesParType    = (depenses || []).reduce((acc, d) => { acc[d.type] = (acc[d.type] || 0) + (d.amount_ttc || 0); return acc; }, {});

    // Calculs recettes
    const totalRecettesAnnee    = (recettes || []).reduce((s, r) => s + (r.montant_ttc || 0), 0);
    const totalEncaisse         = (recettes || []).filter(r => r.statut === 'encaisse').reduce((s, r) => s + (r.montant_ttc || 0), 0);
    const totalEnAttente        = (recettes || []).filter(r => ['envoye','signe'].includes(r.statut)).reduce((s, r) => s + (r.montant_ttc || 0), 0);
    const recettesEnRetard      = (recettes || []).filter(r => r.statut === 'en_retard');

    // Solde banque estimé
    const soldeBanque = (banque || []).reduce((s, t) => t.type === 'credit' ? s + (t.montant || 0) : s - (t.montant || 0), 0);

    // Contrats actifs
    const contratsActifs = (contrats || []);
    const chargesContrats = contratsActifs.reduce((s, c) => {
      const m = c.montant_periodique || 0;
      if (c.periodicite === 'mensuel') return s + m;
      if (c.periodicite === 'annuel')  return s + m / 12;
      return s;
    }, 0);

    const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

    return `
=== DONNÉES RÉELLES DE L'UTILISATEUR (${now.toLocaleDateString('fr-FR')}) ===

PROFIL :
- Nom : ${profil?.company_name || `${profil?.first_name || ''} ${profil?.last_name || ''}`.trim() || 'Non renseigné'}
- SIRET : ${profil?.siret || 'Non renseigné'}
- Plan : ${profil?.plan || 'gratuit'}
- Ville : ${profil?.ville || 'Non renseignée'}

DÉPENSES (année ${now.getFullYear()}) :
- Total annuel : ${fmt(totalDepensesAnnee)}
- Total ce mois : ${fmt(totalDepensesMois)}
- Par catégorie : ${Object.entries(depensesParType).map(([k,v]) => `${k}: ${fmt(v)}`).join(', ') || 'Aucune'}
- Dernières dépenses : ${(depenses || []).slice(0,5).map(d => `${d.etablissement || '?'} (${fmt(d.amount_ttc)}) le ${d.date}`).join(', ') || 'Aucune'}

RECETTES (année ${now.getFullYear()}) :
- Total annuel : ${fmt(totalRecettesAnnee)}
- Encaissé : ${fmt(totalEncaisse)}
- En attente : ${fmt(totalEnAttente)}
- En retard : ${recettesEnRetard.length} document(s)
- Clients : ${(clients || []).map(c => c.nom).join(', ') || 'Aucun'}

BANQUE (30 dernières transactions) :
- Solde estimé : ${fmt(soldeBanque)}
- Dernières opérations : ${(banque || []).slice(0,5).map(t => `${t.libelle} (${t.type === 'credit' ? '+' : '-'}${fmt(t.montant)}) le ${t.date}`).join(', ') || 'Aucune'}

CONTRATS :
- Nombre actifs : ${contratsActifs.length}
- Charge mensuelle estimée : ${fmt(chargesContrats)}
- Liste : ${contratsActifs.map(c => `${c.nom} - ${c.fournisseur} (${fmt(c.montant_periodique)}/${c.periodicite})`).join(', ') || 'Aucun'}

RÉSULTAT ESTIMÉ :
- Recettes encaissées - Dépenses = ${fmt(totalEncaisse - totalDepensesAnnee)}
=== FIN DES DONNÉES ===`;

  } catch (e) {
    console.error('[Vigil RAG]', e);
    return '(Données utilisateur non disponibles)';
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, userId } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'messages requis' });

  try {
    let contextData = '';
    if (userId) {
      contextData = await getContextUtilisateur(userId);
    }

    const systemPrompt = SYSTEM_PROMPT_BASE + (contextData ? `\n\n${contextData}` : '');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model      : 'gpt-4o-mini',
        max_tokens : 600,
        temperature: 0.7,
        messages   : [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('[Vigil]', err);
      return res.status(500).json({ error: 'Erreur OpenAI', detail: err });
    }

    const data  = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Je n'ai pas pu répondre, réessayez.";
    return res.status(200).json({ reply });

  } catch (err) {
    console.error('[Vigil]', err);
    return res.status(500).json({ error: err.message });
  }
}
