// Runtime configuration with environment variables priority

// Fallback values (valid Supabase JWT)
const FALLBACK_URL = 'https://mwvcbedvnimabfwubazz.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY';

// Validate that a key looks like a valid Supabase JWT
function isValidSupabaseKey(key: string | undefined): boolean {
  return Boolean(key && key.startsWith('eyJ') && key.length > 100);
}

const getRuntimeConfig = () => {
  // Production-safe environment variable access
  const getEnvVar = (key: string): string | undefined => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key];
    }
    if (typeof window !== 'undefined' && (window as any).import?.meta?.env) {
      return (window as any).import.meta.env[key];
    }
    return undefined;
  };
  
  // Get and validate Supabase URL
  const envUrl = getEnvVar('VITE_SUPABASE_URL');
  const SUPABASE_URL = (envUrl && envUrl.includes('supabase.co')) ? envUrl : FALLBACK_URL;
  
  // Get and validate Supabase anon key - MUST be a valid JWT
  const envKey = getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY');
  const SUPABASE_ANON_KEY = isValidSupabaseKey(envKey) ? envKey! : FALLBACK_ANON_KEY;

  const isUsingEnvVars = !!(envUrl && isValidSupabaseKey(envKey));
  
  return {
    supabase: {
      url: SUPABASE_URL,
      anonKey: SUPABASE_ANON_KEY,
      isConfigured: true
    },
    url: SUPABASE_URL,
    anon: SUPABASE_ANON_KEY,
    source: isUsingEnvVars ? 'environment' : 'fallback',
    domain: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
  };
};

export function mask(v: string) {
  if (!v) return "(missing)";
  if (v.length <= 10) return v[0] + "***" + v.slice(-2);
  return v.slice(0,6) + "…" + v.slice(-4);
}

export { getRuntimeConfig };
export default getRuntimeConfig;
