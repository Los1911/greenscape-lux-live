import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Hard validation at build time
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL');
}

if (!publishableKey) {
  throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY');
}

// Create Supabase client using PUBLISHABLE key only
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  publishableKey,
  {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'greenscape-lux-auth',
      storage:
        typeof window !== 'undefined'
          ? window.localStorage
          : undefined,
    },
    global: {
      headers: {
        'x-application-name': 'greenscape-lux',
      },
    },
  }
);

// Helpers (safe, no secrets)
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && publishableKey);
};

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }
  return data.session;
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error.message);
    return null;
  }
  return data.user;
};

// Helper for edge-function fetch headers (publishable key)
export const getSupabasePublishableKeyForFetch = (): string => {
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY');
  }
  return key;
};
