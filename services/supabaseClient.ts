import { createClient } from '@supabase/supabase-js';

// Récupération depuis process.env ou localStorage pour le développement/test
const getEnv = (key: string): string => {
  return process.env[key] || localStorage.getItem(`RACHIDI_FALLBACK_${key}`) || '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = supabaseUrl.length > 10 && supabaseAnonKey.length > 20;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }) 
  : null;

export const getSafeConfigStatus = () => ({
  hasUrl: supabaseUrl.length > 10,
  hasKey: supabaseAnonKey.length > 20,
  urlValue: supabaseUrl,
  keyValue: supabaseAnonKey,
  configured: isSupabaseConfigured
});

/**
 * Permet de sauvegarder manuellement les clés si elles manquent dans l'environnement
 */
export const saveFallbackKeys = (url: string, key: string) => {
  localStorage.setItem('RACHIDI_FALLBACK_SUPABASE_URL', url);
  localStorage.setItem('RACHIDI_FALLBACK_SUPABASE_ANON_KEY', key);
  window.location.reload(); // Recharger pour réinitialiser le client Supabase
};

export const clearFallbackKeys = () => {
  localStorage.removeItem('RACHIDI_FALLBACK_SUPABASE_URL');
  localStorage.removeItem('RACHIDI_FALLBACK_SUPABASE_ANON_KEY');
  window.location.reload();
};
