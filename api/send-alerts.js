/**
 * Agent 5 — Email d'alertes automatiques
 * Endpoint : POST /api/send-alerts
 * Appelé par un cron Vercel ou manuellement
 * Utilise Supabase pour récupérer les données et envoyer via Resend (ou SMTP)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_PRO_URL,
  process.env.SUPABASE_PRO_SERVICE_KEY // clé service (pas anon) pour bypass RLS
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL     = 'alertes@vigie-officiel.com';

// ── Logique dates (dupliquée côté serveur, pas d'import possible en API Vercel)
function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function niveauUrgence(days) {
  if (days === null) return null;
  if (days <= 7)  return 'critique';
  if (days <= 30) return 'attention';
  if (days <= 60) return 'info';
  return null;
}

// ── Génère le HTML de l'email
function buildEmailHTML(alertes, userName) {
  const couleurs = { critique: '#C75B4E', attention: '#D4A853', info: '#5BA3C7' };
  const emojis   = { critique: '🔴', attention: '🟡', info: '🔵' };

  const lignes = alertes.map(a => `
    <tr>
      <td style="padding: 10px 16px; border-bottom: 1px solid #F0F2F5;">
        <span style="color:${couleurs[a.niveau]}; font-weight:700;">${emojis[a.niveau]} ${a.titre}</span>
        ${a.detail ? `<br><span style="color:#94A3B8; font-size:12px;">${a.detail}</span>` : ''}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'Helvetica Neue',sans-serif; background:#F8FAFC; margin:0; padding:0;">
  <div style="max-width:560px; margin:32px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,0.06);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0F172A,#1E293B); padding:28px 32px;">
      <div style="font-family:Georgia,serif; font-size:22px; color:#fff; font-weight:700;">
        Vigie <span style="color:#5BA3C7;">Pro</span>
      </div>
      <div style="color:#94A3B8; font-size:13px; margin-top:4px;">Rapport d'alertes du ${new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}</div>
    </div>

    <!-- Corps -->
    <div style="padding:24px 32px;">
      <p style="color:#1A1C20; font-size:14px; margin-bottom:20px;">
        Bonjour ${userName || 'Professionnel'},<br>
        Voici vos <strong>${alertes.length} alerte${alertes.length > 1 ? 's' : ''}</strong> du moment :
      </p>

      <table style="width:100%; border-collapse:collapse; border:1px solid #E8EAF0; border-radius:10px; overflow:hidden;">
        ${lignes}
      </table>

      <div style="margin-top:24px; text-align:center;">
        <a href="https://vigie-officiel.com/pro" 
           style="display:inline-block; background:#5BA3C7; color:#fff; padding:11px 28px; border-radius:9px; font-weight:700; font-size:13px; text-decoration:none;">
          Voir mon tableau de bord →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#F8FAFC; border-top:1px solid #E8EAF0; padding:16px 32px; text-align:center;">
      <p style="color:#94A3B8; font-size:11px; margin:0;">
        Vigie Pro · <a href="https://vigie-officiel.com" style="color:#5BA3C7;">vigie-officiel.com</a><br>
        Pour modifier vos préférences d'alertes, rendez-vous dans Mon profil.
      </p>
    </div>

  </div>
</body>
</html>`;
}

// ── Envoi via Resend
async function sendEmail(to, subject, html) {
  if (!RESEND_API_KEY) {
    console.warn('[AlertesAgent] RESEND_API_KEY manquant — email non envoyé');
    return { ok: false, reason: 'no_api_key' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  return { ok: res.ok, status: res.status };
}

// ── Handler principal
export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Clé secrète pour sécuriser l'endpoint (optionnel)
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Récupérer tous les utilisateurs avec email d'alerte activé
    const { data: profils, error: errProfils } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, alert_email, alert_threshold_percent')
      .not('alert_email', 'is', null);

    if (errProfils) throw errProfils;

    const results = [];

    for (const profil of (profils || [])) {
      const userId = profil.id;
      const email  = profil.alert_email;
      if (!email) continue;

      // Récupérer les données
      const [
        { data: contrats },
        { data: devis    },
        { data: formalites },
      ] = await Promise.all([
        supabase.from('contrats').select('*').eq('user_id', userId),
        supabase.from('devis').select('*, clients(nom)').eq('user_id', userId),
        supabase.from('formalites').select('*').eq('user_id', userId),
      ]);

      // Calculer les alertes
      const alertes = [];

      // Contrats
      for (const c of (contrats || [])) {
        const days = daysUntil(c.date_fin || c.date_echeance || c.date_renouvellement);
        const niveau = niveauUrgence(days);
        if (niveau) alertes.push({ titre: `Contrat "${c.nom || ''}" expire dans ${days}j`, detail: c.fournisseur || '', niveau });
      }

      // TVA mensuelle (par défaut)
      const now = new Date(); const month = now.getMonth(); const year = now.getFullYear();
      let prochaineVTA = new Date(year, month, 19);
      if (prochaineVTA < now) prochaineVTA = new Date(year, month + 1, 19);
      const daysTVA = Math.ceil((prochaineVTA - now) / (1000 * 60 * 60 * 24));
      const niveauTVA = niveauUrgence(daysTVA);
      if (niveauTVA) alertes.push({ titre: `Déclaration TVA dans ${daysTVA}j`, detail: `Échéance le ${prochaineVTA.toLocaleDateString('fr-FR')}`, niveau: niveauTVA });

      // Devis en retard
      const retard = (devis || []).filter(d => (d.statut === 'envoye' || d.statut === 'signe') && d.date_echeance && daysUntil(d.date_echeance) < 0);
      if (retard.length > 0) {
        const total = retard.reduce((s, d) => s + (d.montant_ttc || 0), 0);
        alertes.push({ titre: `${retard.length} devis en retard`, detail: `Total : ${new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(total)}`, niveau: 'critique' });
      }

      // Formalités
      for (const f of (formalites || [])) {
        if (f.statut === 'fait') continue;
        const days = daysUntil(f.date_echeance || f.prochaine_echeance);
        const niveau = niveauUrgence(days);
        if (niveau) alertes.push({ titre: `Formalité "${f.nom || ''}" dans ${days}j`, detail: f.organisme || '', niveau });
      }

      if (alertes.length === 0) { results.push({ userId, email, sent: false, reason: 'no_alerts' }); continue; }

      const userName = `${profil.first_name || ''} ${profil.last_name || ''}`.trim() || undefined;
      const subject  = `⚠️ ${alertes.length} alerte${alertes.length > 1 ? 's' : ''} Vigie Pro`;
      const html     = buildEmailHTML(alertes, userName);

      const { ok, status, reason } = await sendEmail(email, subject, html);

      // Log dans Supabase
      await supabase.from('reminders').insert({
        user_id : userId,
        context : 'pro',
        type    : 'alerte_email',
        message : `Email alertes envoyé (${alertes.length} alertes)`,
        sent_at : new Date().toISOString(),
      });

      results.push({ userId, email, sent: ok, status, reason });
    }

    return res.status(200).json({ ok: true, processed: results.length, results });

  } catch (err) {
    console.error('[AlertesAgent]', err);
    return res.status(500).json({ error: err.message });
  }
}
