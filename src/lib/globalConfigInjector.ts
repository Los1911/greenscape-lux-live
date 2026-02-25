// Global configuration injector - runs at app startup
// Ensures environment variables are available everywhere

const PRODUCTION_CONFIG = {
  VITE_SUPABASE_URL: 'https://mwvcbedvnimabfwubazz.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY',
  VITE_ADMIN_EMAIL: 'cmatthews@greenscapelux.com'
};


// Safe environment variable access
const safeEnvAccess = (callback: () => void) => {
  try {
    if (globalThis.import?.meta?.env) {
      callback();
    }
  } catch (error) {
    console.warn('[GlobalConfig] import.meta.env not available, using fallback');
  }
};

// Inject configuration globally
export const injectGlobalConfig = () => {
  // Check if running in browser
  if (typeof window === 'undefined') return;

  // Create global config object
  (window as any).__APP_CONFIG__ = PRODUCTION_CONFIG;

  // Safely inject into import.meta.env if available and missing
  safeEnvAccess(() => {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      Object.defineProperty(import.meta.env, 'VITE_SUPABASE_URL', {
        value: PRODUCTION_CONFIG.VITE_SUPABASE_URL,
        writable: false,
        configurable: false
      });
    }

    if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
      Object.defineProperty(import.meta.env, 'VITE_SUPABASE_PUBLISHABLE_KEY', {
        value: PRODUCTION_CONFIG.VITE_SUPABASE_PUBLISHABLE_KEY,
        writable: false,
        configurable: false
      });
    }


    if (!import.meta.env.VITE_ADMIN_EMAIL) {
      Object.defineProperty(import.meta.env, 'VITE_ADMIN_EMAIL', {
        value: PRODUCTION_CONFIG.VITE_ADMIN_EMAIL,
        writable: false,
        configurable: false
      });
    }
  });

  console.info('[GlobalConfig] Configuration injected globally');
};

// Auto-run injection
injectGlobalConfig();

export default PRODUCTION_CONFIG;