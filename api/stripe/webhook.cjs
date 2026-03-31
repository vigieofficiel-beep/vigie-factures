const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const stripe   = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend   = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_PRO_URL,
  process.env.SUPABASE_PRO_SERVICE_KEY
);

const PLAN_MAP = {
  [process.env.STRIPE_PRICE_STARTER]: 'starter',
  [process.env.STRIPE_PRICE_PRO]:     'pro',
  [process.env.STRIPE_PRICE_PREMIUM]: 'premium',
};

const FONDATEUR = 'vigie.officiel@gmail.com';
const FROM      = 'Vigie Pro <vigie.officiel@vigie-officiel.com>';

module.exports.config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data',  chunk => chunks.push(chunk));
    req.on('end',   () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function updateUserPlan(userId, plan, customerId, subscriptionId) {
  const { error } = await supabase
    .from('user_profiles')
    .update({
      plan,
      stripe_customer_id:     customerId     || null,
      stripe_subscription_id: subscriptionId || null,
    })
    .eq('id', userId);
  if (error) console.error('Supabase update error:', error);
}

async function notifier(sujet, html) {
  try {
    await resend.emails.send({ from: FROM, to: FONDATEUR, subject: sujet, html });
  } catch (e) {
    console.error('[notify] Resend error:', e.message);
  }
}

const now = () => new Date().toLocaleDateString('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sig     = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId  = session.metadata?.userId;
        const plan    = session.metadata?.plan;
        const email   = session.customer_details?.email || '—';
        const montant = session.amount_total ? `${(session.amount_total / 100).toFixed(2)} €` : '—';
        if (userId && plan) {
          await updateUserPlan(userId, plan, session.customer, session.subscription);
        }
        await notifier(`💳 Nouveau paiement Vigie Pro — ${plan || '?'} — ${email}`, `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#0E0D0B;color:#EDE8DB;border-radius:12px;">
            <h2 style="color:#5BC78A;margin-bottom:8px;">Nouveau paiement 💳</h2>
            <p style="color:rgba(237,232,219,0.6);font-size:13px;margin-bottom:20px;">${now()}</p>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr><td style="padding:8px 0;color:rgba(237,232,219,0.5);border-bottom:1px solid rgba(255,255,255,0.06);">Email</td><td style="padding:8px 0;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.06);">${email}</td></tr>
              <tr><td style="padding:8px 0;color:rgba(237,232,219,0.5);border-bottom:1px solid rgba(255,255,255,0.06);">Plan</td><td style="padding:8px 0;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.06);">${plan || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:rgba(237,232,219,0.5);">Montant</td><td style="padding:8px 0;font-weight:700;">${montant}</td></tr>
            </table>
          </div>
        `);
        break;
      }

      case 'customer.subscription.updated': {
        const sub      = event.data.object;
        const userId   = sub.metadata?.userId;
        const priceId  = sub.items?.data?.[0]?.price?.id;
        const plan     = PLAN_MAP[priceId];
        const isActive = ['active', 'trialing'].includes(sub.status);
        if (userId) {
          if (isActive && plan) {
            await updateUserPlan(userId, plan, sub.customer, sub.id);
          } else if (!isActive) {
            await updateUserPlan(userId, 'gratuit', sub.customer, null);
          }
        }
        await notifier(`🔄 Abonnement mis à jour — ${plan || sub.status}`, `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#0E0D0B;color:#EDE8DB;border-radius:12px;">
            <h2 style="color:#5BA3C7;margin-bottom:8px;">Abonnement modifié 🔄</h2>
            <p style="color:rgba(237,232,219,0.6);font-size:13px;margin-bottom:20px;">${now()}</p>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr><td style="padding:8px 0;color:rgba(237,232,219,0.5);border-bottom:1px solid rgba(255,255,255,0.06);">Customer Stripe</td><td style="padding:8px 0;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.06);">${sub.customer}</td></tr>
              <tr><td style="padding:8px 0;color:rgba(237,232,219,0.5);border-bottom:1px solid rgba(255,255,255,0.06);">Nouveau plan</td><td style="padding:8px 0;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.06);">${plan || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:rgba(237,232,219,0.5);">Statut</td><td style="padding:8px 0;font-weight:700;">${sub.status}</td></tr>
            </table>
          </div>
        `);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub    = event.data.object;
        const userId = sub.metadata?.userId;
        if (userId) {
          await updateUserPlan(userId, 'gratuit', sub.customer, null);
        }
        await notifier(`❌ Résiliation abonnement Vigie Pro`, `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#0E0D0B;color:#EDE8DB;border-radius:12px;">
            <h2 style="color:#C75B4E;margin-bottom:8px;">Résiliation ❌</h2>
            <p style="color:rgba(237,232,219,0.6);font-size:13px;margin-bottom:20px;">${now()}</p>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr><td style="padding:8px 0;color:rgba(237,232,219,0.5);border-bottom:1px solid rgba(255,255,255,0.06);">Customer Stripe</td><td style="padding:8px 0;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.06);">${sub.customer}</td></tr>
              <tr><td style="padding:8px 0;color:rgba(237,232,219,0.5);">User ID</td><td style="padding:8px 0;font-weight:700;">${userId || '—'}</td></tr>
            </table>
          </div>
        `);
        break;
      }

      default:
        console.log(`Événement ignoré: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: err.message });
  }

  return res.status(200).json({ received: true });
};
