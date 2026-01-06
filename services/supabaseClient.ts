import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  let value = '';
  
  // 1. Vite / Vercel Environment (Priorité absolue pour le Global Sync)
  try {
    // @ts-ignore
    value = import.meta.env[`VITE_${key}`] || import.meta.env[key] || '';
  } catch (e) {}

  if (!value) {
    try {
      // @ts-ignore
      value = process.env[key] || '';
    } catch (e) {}
  }

  // 2. Admin Manual Fallback (Pour le test du gérant)
  if (!value) {
    try {
      value = localStorage.getItem(`RACHIDI_FORCE_SYNC_${key}`) || '';
    } catch (e) {}
  }

  return value.trim();
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = supabaseUrl.length > 10 && supabaseAnonKey.length > 20;

// Création du client avec gestion des erreurs
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }) 
  : null;

// Système de stockage local (si le cloud n'est pas configuré au build)
export const mockDb = {
  getMessages: () => JSON.parse(localStorage.getItem('rachidi_local_msgs') || '[]'),
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
  localStorage.setItem('RACHIDI_FORCE_SYNC_SUPABASE_URL', url.trim());
  localStorage.setItem('RACHIDI_FORCE_SYNC_SUPABASE_ANON_KEY', key.trim());
  window.location.reload();
};

export const resetAdminKeys = () => {
  localStorage.removeItem('RACHIDI_FORCE_SYNC_SUPABASE_URL');
  localStorage.removeItem('RACHIDI_FORCE_SYNC_SUPABASE_ANON_KEY');
  window.location.reload();
};
