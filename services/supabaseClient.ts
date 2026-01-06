import { createClient } from '@supabase/supabase-js';

/**
 * Récupère une variable d'environnement de manière sécurisée.
 * Supporte Vite (import.meta.env) et les environnements classiques (process.env).
 * Fallback sur le localStorage pour la configuration manuelle du gérant.
 */
const getEnvValue = (key: string): string => {
  // 1. Essayer Vite (Statique pour le remplacement au build)
  try {
    // Cast import.meta to any to avoid Property 'env' does not exist on type 'ImportMeta' errors
    const meta = import.meta as any;
    if (typeof meta !== 'undefined' && meta.env) {
      if (key === 'VITE_SUPABASE_URL') return meta.env.VITE_SUPABASE_URL || '';
      if (key === 'VITE_SUPABASE_ANON_KEY') return meta.env.VITE_SUPABASE_ANON_KEY || '';
    }
  } catch (e) {}

  // 2. Essayer process.env (Fallback pour certains environnements de déploiement)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      const val = process.env[key] || process.env[key.replace('VITE_', '')];
      if (val) return val;
    }
  } catch (e) {}

  // 3. Fallback sur le stockage local (Mode Force Sync Admin)
  try {
    const localKey = `RACHIDI_FORCE_SYNC_${key}`;
    return localStorage.getItem(localKey) || '';
  } catch (e) {}

  return '';
};

const supabaseUrl = getEnvValue('VITE_SUPABASE_URL').trim();
const supabaseAnonKey = getEnvValue('VITE_SUPABASE_ANON_KEY').trim();

export const isSupabaseConfigured = supabaseUrl.length > 10 && supabaseAnonKey.length > 20;

// Création du client avec gestion d'absence de configuration
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }) 
  : null;

export const mockDb = {
  getMessages: () => {
    try {
      return JSON.parse(localStorage.getItem('rachidi_local_msgs') || '[]');
    } catch (e) { return []; }
  },
  saveMessage: (msg: any) => {
    const msgs = mockDb.getMessages();
    const newMsg = { ...msg, id: 'local_' + Date.now(), timestamp: new Date().toISOString() };
    localStorage.setItem('rachidi_local_msgs', JSON.stringify([newMsg, ...msgs]));
    return { data: [newMsg], error: null };
  },
  deleteMessage: (id: string) => {
    const msgs = mockDb.getMessages().filter((m: any) => m.id !== id);
    localStorage.setItem('rachidi_local_msgs', JSON.stringify(msgs));
  }
};

export const getSafeConfigStatus = () => ({
  url: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'VIDE',
  configured: isSupabaseConfigured
});

export const saveAdminKeys = (url: string, key: string) => {
  localStorage.setItem('RACHIDI_FORCE_SYNC_VITE_SUPABASE_URL', url.trim());
  localStorage.setItem('RACHIDI_FORCE_SYNC_VITE_SUPABASE_ANON_KEY', key.trim());
  window.location.reload();
};

export const resetAdminKeys = () => {
  localStorage.removeItem('RACHIDI_FORCE_SYNC_VITE_SUPABASE_URL');
  localStorage.removeItem('RACHIDI_FORCE_SYNC_VITE_SUPABASE_ANON_KEY');
  window.location.reload();
};
