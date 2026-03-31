// api/notify-signup.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, firstName, lastName, city } = req.body;
console.log('[notify-signup] appelé avec:', email, firstName);
  if (!email) return res.status(400).json({ error: 'Email manquant' });
  try {
    await resend.emails.send({
      from: 'Vigie Pro <vigie.officiel@vigie-officiel.com>',
      to:   'vigie.officiel@gmail.com',
      subject: `🆕 Nouvel inscrit Vigie Pro — ${email}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#0E0D0B;color:#EDE8DB;border-radius:12px;">
          <h2 style="color:#5BC78A;margin-bottom:8px;">Nouvel inscrit 🎉</h2>
          <p style="color:rgba(237,232,219,0.6);font-size:13px;margin-bottom:20px;">
            ${new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr><td style="padding:8px 0;color:rgba(237,232,219,0.5);border-bottom:1px solid rgba(255,255,255,0.06);">Prénom</td><td style="padding:8px 0;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.06);">${firstName || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(237,232,219,0.5);border-bottom:1px solid rgba(255,255,255,0.06);">Nom</td><td style="padding:8px 0;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.06);">${lastName || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(237,232,219,0.5);border-bottom:1px solid rgba(255,255,255,0.06);">Email</td><td style="padding:8px 0;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.06);">${email}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(237,232,219,0.5);">Ville</td><td style="padding:8px 0;font-weight:700;">${city || '—'}</td></tr>
          </table>
        </div>
      `,
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[notify-signup]', e);
    return res.status(500).json({ error: e.message });
  }
}
