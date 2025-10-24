// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Load environment variables with reliable fallbacks
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://mwvcbedvnimabfwubazz.supabase.co";

// ✅ Use your correct anon key from Supabase dashboard
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY";

// ✅ Make sure to support either naming for Stripe public key
const stripePublishableKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
  "pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK";

// Create the Supabase client with session persistence and custom headers
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'greenscape-lux',
    },
  },
});

// Export configuration summary (for console verification)
export const config = {
  supabaseUrl,
  supabaseAnonKey: supabaseAnonKey ? 'CONFIGURED' : 'MISSING',
  stripePublishableKey: stripePublishableKey ? 'CONFIGURED' : 'MISSING',
};

// Log configuration during development for quick validation
if (import.meta.env.DEV) {
  console.log('🌿 Supabase URL:', supabaseUrl);
  console.log('🌿 Configuration:', config);
}