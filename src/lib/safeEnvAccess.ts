// Safe environment variable access utility
// Prevents "undefined is not an object" errors when accessing import.meta.env

export const safeGetEnv = (key: string, fallback?: string): string | undefined => {
  try {
    // Check if import.meta is available
    if (globalThis.import?.meta?.env) {
      return globalThis.import.meta.env[key] || fallback;
    }
    
    // Return fallback if import.meta not available
    return fallback;
  } catch (error) {
    console.warn(`[SafeEnvAccess] Error accessing ${key}:`, error);
    return fallback;
  }
};

export const safeGetEnvBoolean = (key: string, fallback: boolean = false): boolean => {
  const value = safeGetEnv(key);
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
};

// Pre-configured getters for common environment variables
export const getSupabaseUrl = () => safeGetEnv('VITE_SUPABASE_URL', 'https://mwvcbedvnimabfwubazz.supabase.co');
export const getSupabaseAnonKey = () => safeGetEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY');
export const getAdminEmail = () => safeGetEnv('VITE_ADMIN_EMAIL', 'cmatthews@greenscapelux.com');
export const isDev = () => safeGetEnvBoolean('DEV') || safeGetEnv('MODE') === 'development';