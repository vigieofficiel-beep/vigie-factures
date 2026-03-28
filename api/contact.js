import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { nom, email, sujet, message } = req.body;
  if (!nom || !email || !sujet || !message) return res.status(400).json({ error: 'Champs manquants' });

  const SUJETS = {
    bug: '🐛 Signaler un bug',
    question: '❓ Question sur le service',
    facturation: '💳 Facturation / abonnement',
    suggestion: '💡 Suggestion d\'amélioration',
    rgpd: '🔒 Demande RGPD',
    autre: '📩 Autre',
  };

  try {
    await resend.emails.send({
      from: 'Vigie Pro <noreply@vigie.officiel.com>',
      to: 'vigie.officiel@gmail.com',
      replyTo: email,
      subject: `[Contact Vigie Pro] ${SUJETS[sujet] || sujet}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0F172A;padding:32px;border-radius:12px;color:#EDE8DB;">
          <h2 style="color:#5BA3C7;margin:0 0 20px;">Nouveau message de contact</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#94A3B8;width:120px;">Nom</td><td style="padding:8px 0;color:#EDE8DB;">${nom}</td></tr>
            <tr><td style="padding:8px 0;color:#94A3B8;">Email</td><td style="padding:8px 0;color:#EDE8DB;"><a href="mailto:${email}" style="color:#5BA3C7;">${email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#94A3B8;">Sujet</td><td style="padding:8px 0;color:#EDE8DB;">${SUJETS[sujet] || sujet}</td></tr>
          </table>
          <div style="margin-top:20px;padding:16px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.08);">
            <p style="color:#94A3B8;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
            <p style="color:#EDE8DB;font-size:14px;line-height:1.7;margin:0;">${message.replace(/\n/g, '<br/>')}</p>
          </div>
          <p style="margin-top:20px;font-size:11px;color:rgba(237,232,219,0.3);">Vigie Pro · vigie.officiel.com</p>
        </div>
      `,
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Contact]', err);
    return res.status(500).json({ error: err.message });
  }
}
