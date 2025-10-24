import { getBrowserEnv, isDevelopment, isProduction } from './browserEnv';
import { getSafeConfig } from './environmentFallback';

// 🔍 DEBUG: Log raw import.meta.env values to verify Vercel injection
console.log("🔍 Vercel Env Check (Build Time):", {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
<<<<<<< HEAD
  stripeKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
=======
  stripeKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
  googleMapsKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  mode: import.meta.env.MODE,
  prod: import.meta.env.PROD,
  dev: import.meta.env.DEV
});

<<<<<<< HEAD

=======
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
// Browser-safe configuration system with fallback protection
function createConfig() {
  try {
    // Try standard environment variable approach first
    const standardConfig = {
      supabase: {
        url: getBrowserEnv('VITE_SUPABASE_URL') || '',

        anonKey: getBrowserEnv('VITE_SUPABASE_ANON_KEY') || ''
      },
      stripe: {
<<<<<<< HEAD
        publishableKey: getBrowserEnv('VITE_STRIPE_PUBLIC_KEY') || ''

=======
        publishableKey: getBrowserEnv('VITE_STRIPE_PUBLISHABLE_KEY') || ''
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
        // SECURITY FIX: Removed secretKey and webhookSecret from client config
        // These should only be accessed server-side via Supabase Edge Functions
      },
      googleMaps: {
        apiKey: getBrowserEnv('VITE_GOOGLE_MAPS_API_KEY') || ''
      },
      resend: {
        apiKey: getBrowserEnv('VITE_RESEND_API_KEY') || ''
      },
      app: {
        name: 'GreenScape Lux',
        version: '1.0.0',
        environment: isProduction() ? 'production' : isDevelopment() ? 'development' : 'unknown'
      }
    };

    // Check if critical values are missing
    const hasCriticalValues = standardConfig.supabase.url && 
                             standardConfig.supabase.anonKey &&
                             !standardConfig.supabase.url.includes('placeholder') &&
                             !standardConfig.supabase.anonKey.includes('placeholder');

    if (hasCriticalValues) {
      console.log('✅ Using standard environment configuration');
      return standardConfig;
    } else {
      console.warn('⚠️ Critical environment variables missing, using fallback configuration');
      const fallbackConfig = getSafeConfig();
      return {
        ...standardConfig,
        ...fallbackConfig
      };
    }
  } catch (error) {
    console.error('🚨 Configuration error, using emergency fallback:', error);
    return getSafeConfig();
  }
}

export const config = createConfig();
export default config;