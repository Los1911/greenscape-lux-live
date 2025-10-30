// STRICT CONFIGURATION SYSTEM - NO FALLBACKS
// Forces proper environment variable configuration in production

export interface StrictConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  stripe: {
    publishableKey: string;
  };
  googleMaps: {
    apiKey: string;
  };
  app: {
    name: string;
    version: string;
    environment: string;
  };
}

// Debug logging for Vercel env var injection
console.log("🔍 Vercel Env Check (Build Time):", {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  stripeKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  googleMapsKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  mode: import.meta.env.MODE,
  prod: import.meta.env.PROD,
  dev: import.meta.env.DEV
});

export function getStrictConfig(): StrictConfig {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Critical validation - fail fast if missing
  if (!supabaseUrl || !anonKey) {
    const error = '🚨 CRITICAL: Missing Supabase environment variables. Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel Dashboard.';
    console.error(error);
    throw new Error(error);
  }

  // Warn about optional keys
  if (!stripeKey) {
    console.warn('⚠️ VITE_STRIPE_PUBLISHABLE_KEY is missing - payment features will not work');
  }

  if (!googleMapsKey) {
    console.warn('⚠️ VITE_GOOGLE_MAPS_API_KEY is missing - map features will not work');
  }

  console.log('✅ All critical environment variables present');

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: anonKey
    },
    stripe: {
      publishableKey: stripeKey || ''
    },
    googleMaps: {
      apiKey: googleMapsKey || ''
    },
    app: {
      name: 'GreenScape Lux',
      version: '1.0.0',
      environment: import.meta.env.MODE || 'production'
    }
  };
}

export const strictConfig = getStrictConfig();
export default strictConfig;
