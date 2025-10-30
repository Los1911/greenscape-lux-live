// Consolidated configuration - single source of truth
// This replaces the multiple config files with one unified approach

interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  functionsUrl: string;
  adminEmail: string;
  source: 'environment' | 'fallback';
}

// Single function to get all configuration
// Single function to get all configuration
export const getAppConfig = (): AppConfig => {
  // Safe environment variable access with null checks
  const envUrl = globalThis.import?.meta?.env?.VITE_SUPABASE_URL || undefined;
  const envKey = globalThis.import?.meta?.env?.VITE_SUPABASE_PUBLISHABLE_KEY || undefined;
  const envAdmin = globalThis.import?.meta?.env?.VITE_ADMIN_EMAIL || undefined;
  
  // Fallback values (production-ready)
  const fallbackUrl = 'https://mwvcbedvnimabfwubazz.supabase.co';
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY';
  const fallbackAdmin = 'cmatthews@greenscapelux.com';
  
  const supabaseUrl = envUrl || fallbackUrl;
  const supabaseAnonKey = envKey || fallbackKey;
  const adminEmail = envAdmin || fallbackAdmin;
  const source = (envUrl && envKey) ? 'environment' : 'fallback';
  
  // Log configuration source (development only) - with safe check
  if (globalThis.import?.meta?.env?.DEV) {
    console.info(`[Config] Using ${source} configuration`);
    if (source === 'fallback') {
      console.warn('[Config] Environment variables not found - using fallback values');
    }
  }
  
  return {
    supabaseUrl,
    supabaseAnonKey,
    functionsUrl: supabaseUrl.replace('.supabase.co', '.functions.supabase.co'),
    adminEmail,
    source
  };
};

// Export singleton config
export const APP_CONFIG = getAppConfig();

// Legacy exports for backward compatibility
export const APP_ENV = {
  SUPABASE_URL: APP_CONFIG.supabaseUrl,
  SUPABASE_ANON_KEY: APP_CONFIG.supabaseAnonKey,
  FUNCTIONS_URL: APP_CONFIG.functionsUrl,
};

export const fn = {
  url: (name: string) => `${APP_CONFIG.functionsUrl}/${name}`,
};