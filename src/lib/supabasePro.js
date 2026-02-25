import { createClient } from '@supabase/supabase-js';

const SUPABASE_PRO_URL = import.meta.env.VITE_SUPABASE_PRO_URL;
const SUPABASE_PRO_ANON_KEY = import.meta.env.VITE_SUPABASE_PRO_ANON_KEY;

export const supabasePro = createClient(SUPABASE_PRO_URL, SUPABASE_PRO_ANON_KEY, {
  auth: {
    storageKey: 'vigie-pro-auth',
    persistSession: true,
    autoRefreshToken: true,
  },
});