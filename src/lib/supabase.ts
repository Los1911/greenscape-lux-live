// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// ✅ Load environment variables with safe fallbacks
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://mwvcbedvnimabfwubazz.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY";

// ✅ Support both naming conventions for Stripe publishable key
const stripePublishableKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  "pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK";

// ✅ Validate required environment variables in production
if (import.meta.env.MODE === 'production') {
  if (!supabaseUrl || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl)) {
    throw new Error('❌ Invalid or missing VITE_SUPABASE_URL in production');
  }
  if (!supabaseAnonKey || supabaseAnonKey.split('.').length < 3) {
    throw new Error('❌ Invalid or missing VITE_SUPABASE_PUBLISHABLE_KEY in production');
  }
  if (!stripePublishableKey || !/^pk_live_[A-Za-z0-9]+$/.test(stripePublishableKey)) {
    throw new Error('❌ Invalid or missing VITE_STRIPE_PUBLISHABLE_KEY in production');
  }
}

// ✅ Create the Supabase client with session persistence and custom headers
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

// ✅ Export configuration summary for validation
export const config = {
  supabaseUrl: supabaseUrl ? 'CONFIGURED' : 'MISSING',
  supabaseAnonKey: supabaseAnonKey ? 'CONFIGURED' : 'MISSING',
  stripePublishableKey: stripePublishableKey ? 'CONFIGURED' : 'MISSING',
};

// 🛠 Log configuration details in development
if (import.meta.env.DEV) {
  console.log('🌿 Supabase URL:', supabaseUrl);
  console.log('🌿 Configuration:', config);
  console.log('🌿 Stripe Publishable Key Present:', !!stripePublishableKey);
}