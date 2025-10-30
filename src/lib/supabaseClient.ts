import { createClient } from '@supabase/supabase-js';

// Browser-safe environment variable access
const getEnvironmentVariable = (key: string, fallback: string): string => {
  // Use import.meta.env for Vite environment variables
  if (import.meta?.env?.[key]) {
    console.info(`[Supabase] Using ${key} from import.meta.env`);
    return import.meta.env[key];
  }
  
  // Fallback to hardcoded values
  console.warn(`[Supabase] Using fallback value for ${key}`);
  return fallback;
};

// Production-ready fallback configuration
const FALLBACK_CONFIG = {
  VITE_SUPABASE_URL: 'https://mwvcbedvnimabfwubazz.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY'
};

// Get configuration with robust fallback system
const supabaseUrl = getEnvironmentVariable('VITE_SUPABASE_URL', FALLBACK_CONFIG.VITE_SUPABASE_URL);
const supabaseAnonKey = getEnvironmentVariable('VITE_SUPABASE_PUBLISHABLE_KEY', FALLBACK_CONFIG.VITE_SUPABASE_PUBLISHABLE_KEY);

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('[Supabase] Configuration error: URL or ANON_KEY is missing');
}

// Create Supabase client with robust configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Development logging
if (import.meta.env?.DEV) {
  console.info('[Supabase] Client initialized successfully');
  console.info(`[Supabase] URL: ${supabaseUrl}`);
  console.info(`[Supabase] Key configured: ${supabaseAnonKey ? 'Yes' : 'No'}`);
}

export default supabase;