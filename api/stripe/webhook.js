import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_PRO_URL,
  process.env.SUPABASE_PRO_SERVICE_KEY // clé service (pas anon) pour bypasser RLS
);

// Mapping Price ID → nom du plan
const PLAN_MAP = {
  [process.env.STRIPE_PRICE_STARTER]: 'starter',
  [process.env.STRIPE_PRICE_PRO]:     'pro',
  [process.env.STRIPE_PRICE_PREMIUM]: 'premium',
};

// Désactive le body parser Vercel — Stripe a besoin du raw body pour vérifier la signature
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end',  () => resolve(Buffer.concat(chunks)));
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
  else console.log(`✅ Plan mis à jour → user ${userId} : ${plan}`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig     = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  console.log('Stripe event reçu:', event.type);

  try {
    switch (event.type) {

      // ── Paiement initial réussi ──────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId  = session.metadata?.userId;
        const plan    = session.metadata?.plan;

        if (userId && plan) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await updateUserPlan(userId, plan, session.customer, session.subscription);
        }
        break;
      }

      // ── Abonnement modifié (upgrade / downgrade / renouvellement) ─
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
            // Abonnement suspendu/impayé → retour gratuit
            await updateUserPlan(userId, 'gratuit', sub.customer, null);
          }
        }
        break;
      }

      // ── Abonnement annulé ─────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub    = event.data.object;
        const userId = sub.metadata?.userId;

        if (userId) {
          await updateUserPlan(userId, 'gratuit', sub.customer, null);
          console.log(`Abonnement annulé → user ${userId} repassé en gratuit`);
        }
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
}
