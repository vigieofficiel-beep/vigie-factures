const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_MAP = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro:     process.env.STRIPE_PRICE_PRO,
  premium: process.env.STRIPE_PRICE_PREMIUM,
};
console.log('PRICE IDs chargés:', {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  premium: process.env.STRIPE_PRICE_PREMIUM,
});
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plan, userId, userEmail, customerId } = req.body;

  if (!plan || !PRICE_MAP[plan]) {
    return res.status(400).json({ error: 'Plan invalide' });
  }

  try {
    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_MAP[plan], quantity: 1 }],
      success_url: `${process.env.VITE_APP_URL || 'https://www.vigie-officiel.com'}/pro?stripe=success&plan=${plan}`,
      cancel_url:  `${process.env.VITE_APP_URL || 'https://www.vigie-officiel.com'}/tarifs?stripe=cancel`,
      metadata: { userId, plan },
      subscription_data: { metadata: { userId, plan } },
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      locale: 'fr',
    };

    if (customerId) {
      sessionParams.customer = customerId;
    } else if (userEmail) {
      sessionParams.customer_email = userEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
};
