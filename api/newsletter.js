const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_PRO_URL,
  process.env.SUPABASE_PRO_SERVICE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, source = 'exit_intent' } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  try {
    // Sauvegarder dans Supabase
    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .insert({ email, source });

    // Si email déjà inscrit — pas une erreur bloquante
    if (dbError && dbError.code !== '23505') {
      throw dbError;
    }

    const dejaInscrit = dbError?.code === '23505';

    // Envoyer email de bienvenue via Resend (seulement si nouvel inscrit)
    if (!dejaInscrit && process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Vigie Pro <noreply@vigie-officiel.com>',
          to: [email],
          subject: 'Bienvenue dans la communauté Vigie Pro 🎯',
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"/></head>
            <body style="font-family:'Segoe UI',sans-serif;background:#0F172A;margin:0;padding:40px 20px;">
              <div style="max-width:520px;margin:0 auto;background:#1E293B;border-radius:16px;padding:40px;border:1px solid rgba(91,163,199,0.2);">
                <h1 style="font-family:Georgia,serif;color:#EDE8DB;font-size:28px;margin:0 0 8px;">Vigie</h1>
                <p style="color:#5BA3C7;font-size:13px;font-weight:600;margin:0 0 28px;">Espace Pro</p>

                <h2 style="color:#F8FAFC;font-size:20px;margin:0 0 16px;">Bienvenue dans la communauté ! 🎉</h2>

                <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.7;margin:0 0 20px;">
                  Merci de rejoindre Vigie Pro. Vous serez parmi les premiers informés de nos nouveautés,
                  conseils de gestion et offres exclusives.
                </p>

                <div style="background:rgba(91,163,199,0.08);border:1px solid rgba(91,163,199,0.2);border-radius:12px;padding:20px;margin:0 0 28px;">
                  <p style="color:#5BA3C7;font-size:13px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.06em;">Ce qui vous attend</p>
                  <ul style="color:rgba(255,255,255,0.6);font-size:13px;line-height:1.8;margin:0;padding-left:16px;">
                    <li>Conseils pratiques de gestion pour indépendants</li>
                    <li>Nouveautés Vigie Pro en avant-première</li>
                    <li>Offres exclusives réservées aux abonnés</li>
                    <li>Actualités fiscales et comptables françaises</li>
                  </ul>
                </div>

                <a href="https://www.vigie-officiel.com/pro/signup"
                   style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#5BA3C7,#3d7fa8);color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;">
                  Créer mon compte Pro gratuitement →
                </a>

                <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:28px 0 0;line-height:1.6;">
                  Vous recevez cet email car vous vous êtes inscrit sur vigie-officiel.com.<br/>
                  <a href="https://www.vigie-officiel.com" style="color:rgba(91,163,199,0.6);text-decoration:none;">Se désinscrire</a>
                </p>
              </div>
            </body>
            </html>
          `,
        }),
      });
    }

    return res.status(200).json({
      success: true,
      dejaInscrit,
      message: dejaInscrit ? 'Vous êtes déjà inscrit !' : 'Inscription confirmée !',
    });

  } catch (err) {
    console.error('Newsletter error:', err);
    return res.status(500).json({ error: err.message });
  }
};
