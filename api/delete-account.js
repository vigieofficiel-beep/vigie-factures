import { createClient } from '@supabase/supabase-js';

// Nécessite SUPABASE_SERVICE_ROLE_KEY dans les variables Vercel
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId requis' });

  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[delete-account]', err);
    return res.status(500).json({ error: err.message });
  }
}
