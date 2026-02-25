// Auto-injecting configuration system
// This ensures Supabase credentials are always available regardless of environment

interface AutoConfig {
  supabaseUrl: string;
  supabaseKey: string;
  functionsUrl: string;
  adminEmail: string;
  isConfigured: boolean;
  source: 'env' | 'fallback' | 'runtime';
}

// Production-ready fallback values
const FALLBACK_CONFIG = {
  url: 'https://mwvcbedvnimabfwubazz.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY',
  admin: 'cmatthews@greenscapelux.com'
};

// Auto-configuration function
export const getAutoConfig = (): AutoConfig => {
  let supabaseUrl: string;
  let supabaseKey: string;
  let source: 'env' | 'fallback' | 'runtime';

  // Try environment variables first
  const envUrl = import.meta.env?.VITE_SUPABASE_URL;
  const envKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;
  const envAdmin = import.meta.env?.VITE_ADMIN_EMAIL;

  if (envUrl && envKey) {
    supabaseUrl = envUrl;
    supabaseKey = envKey;
    source = 'env';
  } else {
    // Auto-inject fallback values
    supabaseUrl = FALLBACK_CONFIG.url;
    supabaseKey = FALLBACK_CONFIG.key;
    source = 'fallback';
    
    // Inject into window for runtime access
    if (typeof window !== 'undefined') {
      (window as any).__SUPABASE_CONFIG__ = {
        url: supabaseUrl,
        key: supabaseKey
      };
    }
  }

  const adminEmail = envAdmin || FALLBACK_CONFIG.admin;
  const functionsUrl = supabaseUrl.replace('.supabase.co', '.functions.supabase.co');
  
  return {
    supabaseUrl,
    supabaseKey,
    functionsUrl,
    adminEmail,
    isConfigured: true,
    source
  };
};

// Global singleton
export const AUTO_CONFIG = getAutoConfig();

export default AUTO_CONFIG;
