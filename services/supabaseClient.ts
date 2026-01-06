import { createClient } from '@supabase/supabase-js';

// Tentative de récupération des clés avec plusieurs formats possibles (standard et fallback)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = supabaseUrl.length > 10 && supabaseAnonKey.length > 20;

if (!isSupabaseConfigured) {
  console.warn("Supabase: Clés manquantes ou invalides dans process.env. Le mode Real-time sera désactivé.");
}

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    }) 
  : null;