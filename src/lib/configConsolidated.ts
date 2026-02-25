// Consolidated configuration system with fallback support

interface AppConfig {
  supabaseUrl: string;
  supabaseKey: string;
  functionsUrl: string;
  adminEmail: string;
  source: 'environment' | 'fallback';
}

// Production fallback values
const fallbackUrl = 'https://mwvcbedvnimabfwubazz.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY';
const fallbackAdmin = 'cmatthews@greenscapelux.com';

// Get configuration
const getConfig = (): AppConfig => {
  const envUrl = import.meta.env?.VITE_SUPABASE_URL;
  const envKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;
  const envAdmin = import.meta.env?.VITE_ADMIN_EMAIL;
  
  const supabaseUrl = envUrl || fallbackUrl;
  const supabaseKey = envKey || fallbackKey;
  const adminEmail = envAdmin || fallbackAdmin;
  const source = (envUrl && envKey) ? 'environment' : 'fallback';

  if (source === 'fallback') {
    console.warn('[Config] Using fallback configuration');
  }

  return {
    supabaseUrl,
    supabaseKey,
    functionsUrl: supabaseUrl.replace('.supabase.co', '.functions.supabase.co'),
    adminEmail,
    source
  };
};

export const APP_CONFIG = getConfig();

export const APP_ENV = {
  SUPABASE_URL: APP_CONFIG.supabaseUrl,
  SUPABASE_KEY: APP_CONFIG.supabaseKey,
  FUNCTIONS_URL: APP_CONFIG.functionsUrl,
};

export default APP_CONFIG;
