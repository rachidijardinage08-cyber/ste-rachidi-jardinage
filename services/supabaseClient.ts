import { createClient } from '@supabase/supabase-js';

// Configuration du client Supabase
// On utilise process.env car c'est le standard dans cet environnement
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

// Export du client unique pour toute l'application
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }) 
  : null;