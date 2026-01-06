import { createClient } from '@supabase/supabase-js';

// Récupération intelligente : Supporte Vercel (process.env), Vite (import.meta.env) et le Fallback manuel
const getEnv = (key: string): string => {
  let value = '';
  
  // 1. Tentative via import.meta.env (Vite standard)
  try {
    // @ts-ignore
    value = import.meta.env[`VITE_${key}`] || import.meta.env[key];
  } catch (e) {}

  // 2. Tentative via process.env (Vercel standard)
  if (!value) {
    try {
      value = process.env[key] || '';
    } catch (e) {}
  }

  // 3. Tentative via localStorage (Setup manuel du gérant)
  if (!value) {
    try {
      value = localStorage.getItem(`RACHIDI_FALLBACK_${key}`) || '';
    } catch (e) {}
  }

  return value;
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

// Mock DB pour éviter les crashs si pas de config
export const mockDb = {
  getMessages: () => JSON.parse(localStorage.getItem('rachidi_mock_messages') || '[]'),
  saveMessage: (msg: any) => {
    const msgs = mockDb.getMessages();
    const newMsg = { ...msg, id: 'local_' + Date.now(), timestamp: new Date().toISOString() };
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
  localStorage.setItem('RACHIDI_FALLBACK_SUPABASE_URL', url.trim());
  localStorage.setItem('RACHIDI_FALLBACK_SUPABASE_ANON_KEY', key.trim());
  window.location.reload();
};

export const clearFallbackKeys = () => {
  localStorage.removeItem('RACHIDI_FALLBACK_SUPABASE_URL');
  localStorage.removeItem('RACHIDI_FALLBACK_SUPABASE_ANON_KEY');
  window.location.reload();
};
