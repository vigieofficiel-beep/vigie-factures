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

  // DEBUG — à supprimer après confirmation
  console.log('RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
  console.log('RESEND_API_KEY prefix:', process.env.RESEND_API_KEY?.substring(0, 8));

  try {
    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .insert({ email, source });

    const dejaInscrit = dbError?.code === '23505';
    if (dbError && !dejaInscrit) throw dbError;

    if (!dejaInscrit && process.env.RESEND_API_KEY) {
      const resendRes = await fetch('https://api.resend.com/emails', {
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
            <div style="font-family:sans-serif;background:#0F172A;padding:40px;border-radius:16px;max-width:520px;margin:0 auto;">
              <h1 style="color:#5BA3C7;font-size:24px;">Vigie Pro</h1>
              <h2 style="color:#F8FAFC;font-size:20px;">Bienvenue ! 🎉</h2>
              <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.7;">
                Merci de rejoindre Vigie Pro. Vous serez parmi les premiers informés de nos nouveautés et conseils.
              </p>
              <a href="https://www.vigie-officiel.com/pro/signup"
                 style="display:inline-block;margin-top:20px;padding:12px 28px;background:#5BA3C7;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;">
                Créer mon compte Pro gratuitement →
              </a>
              <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:28px;">
                Vous recevez cet email car vous vous êtes inscrit sur vigie-officiel.com.
              </p>
            </div>
          `,
        }),
      });

      if (!resendRes.ok) {
        const resendError = await resendRes.text();
        console.error('Resend error:', resendError);
      } else {
        console.log('Resend success - email envoyé à:', email);
      }
    } else {
      console.log('Resend skipped - dejaInscrit:', dejaInscrit, 'hasKey:', !!process.env.RESEND_API_KEY);
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
