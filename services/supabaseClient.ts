import { createClient } from '@supabase/supabase-js';

// Récupération des variables d'environnement
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// On vérifie si les credentials sont présents avant d'initialiser
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

// Si configuré, on crée le client, sinon on exporte null (géré dans l'App)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
