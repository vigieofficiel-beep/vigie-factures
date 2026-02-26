import { supabase } from './supabaseClient';
import { supabasePro } from './supabasePro';

export function getSupabaseClient(mode) {
  return mode === 'pro' ? supabasePro : supabase;
}