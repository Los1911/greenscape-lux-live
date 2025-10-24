// Runtime configuration with environment variables priority
const getRuntimeConfig = () => {
  // Production-safe environment variable access
  const getEnvVar = (key: string): string | undefined => {
    // Check import.meta.env first (Vite build-time injection)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key];
    }
    
    // Fallback for edge cases where import.meta is not available
    if (typeof window !== 'undefined' && (window as any).import?.meta?.env) {
      return (window as any).import.meta.env[key];
    }
    
    return undefined;
  };
  
  // Get environment variables with production fallbacks
  const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL') || 'https://mwvcbedvnimabfwubazz.supabase.co';
  const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY';

  // Check if we're using environment variables or fallbacks
  const isUsingEnvVars = !!getEnvVar('VITE_SUPABASE_URL');
  
  return {
    supabase: {
      url: SUPABASE_URL,
      anonKey: SUPABASE_ANON_KEY,
      isConfigured: true
    },
    url: SUPABASE_URL, // Legacy support
    anon: SUPABASE_ANON_KEY, // Legacy support
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