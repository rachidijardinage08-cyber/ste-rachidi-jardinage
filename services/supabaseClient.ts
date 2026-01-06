import { createClient } from '@supabase/supabase-js';

// Fonction de récupération sécurisée (Vercel/Vite/Browser compatible)
const getEnv = (key: string): string => {
  // Tentative de récupération depuis process.env ou localStorage
  try {
    return process.env[key] || localStorage.getItem(`RACHIDI_FALLBACK_${key}`) || '';
  } catch {
    return localStorage.getItem(`RACHIDI_FALLBACK_${key}`) || '';
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = supabaseUrl.length > 10 && supabaseAnonKey.length > 20;

// On crée le client seulement si configuré, sinon null
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Interface de secours : Mock Database
 * Si Supabase n'est pas là, on utilise LocalStorage pour que le site reste "fonctionnel"
 */
export const mockDb = {
  getMessages: () => JSON.parse(localStorage.getItem('rachidi_mock_messages') || '[]'),
  saveMessage: (msg: any) => {
    const msgs = mockDb.getMessages();
    const newMsg = { ...msg, id: Date.now().toString(), timestamp: new Date().toISOString() };
    localStorage.setItem('rachidi_mock_messages', JSON.stringify([newMsg, ...msgs]));
    return { data: [newMsg], error: null };
  },
  deleteMessage: (id: string) => {
    const msgs = mockDb.getMessages().filter((m: any) => m.id !== id);
    localStorage.setItem('rachidi_mock_messages', JSON.stringify(msgs));
  }
};

export const getSafeConfigStatus = () => ({
  hasUrl: supabaseUrl.length > 10,
  hasKey: supabaseAnonKey.length > 20,
  urlValue: supabaseUrl,
  keyValue: supabaseAnonKey,
  configured: isSupabaseConfigured
});

export const saveFallbackKeys = (url: string, key: string) => {
  localStorage.setItem('RACHIDI_FALLBACK_SUPABASE_URL', url);
  localStorage.setItem('RACHIDI_FALLBACK_SUPABASE_ANON_KEY', key);
  window.location.reload();
};

export const clearFallbackKeys = () => {
  localStorage.removeItem('RACHIDI_FALLBACK_SUPABASE_URL');
  localStorage.removeItem('RACHIDI_FALLBACK_SUPABASE_ANON_KEY');
  window.location.reload();
};
