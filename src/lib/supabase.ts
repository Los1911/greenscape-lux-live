<<<<<<< HEAD
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Load environment variables with reliable fallbacks
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://mwvcbedvnimabfwubazz.supabase.co";

// ✅ Use your correct anon key from Supabase dashboard
=======
// src/lib/config.ts
import { createClient } from '@supabase/supabase-js';

// Load environment variables (fallbacks set to your real values)
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://mwvcbedvnimabfwubazz.supabase.co";

>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY";

<<<<<<< HEAD
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
=======
const stripePublishableKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  "pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK";

// ✅ Validation (production only)
if (import.meta.env.MODE === 'production') {
  if (!supabaseUrl || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl)) {
    throw new Error('❌ Invalid or missing VITE_SUPABASE_URL in production');
  }
  if (!supabaseAnonKey || supabaseAnonKey.split('.').length < 3) {
    throw new Error('❌ Invalid or missing VITE_SUPABASE_ANON_KEY in production');
  }
  if (!stripePublishableKey || !/^pk_live_[A-Za-z0-9]+$/.test(stripePublishableKey)) {
    throw new Error('❌ Invalid or missing VITE_STRIPE_PUBLISHABLE_KEY in production');
  }
}

// 🛠 Logs in development
if (import.meta.env.DEV) {
  console.log('🔧 Supabase URL:', supabaseUrl);
  console.log('🔧 Supabase key present:', !!supabaseAnonKey);
  console.log('🔧 Stripe key present:', !!stripePublishableKey);
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export safe config status
export const config = {
  supabaseUrl: supabaseUrl ? 'CONFIGURED' : 'MISSING',
  supabaseAnonKey: supabaseAnonKey ? 'CONFIGURED' : 'MISSING',
  stripePublishableKey: stripePublishableKey ? 'CONFIGURED' : 'MISSING'
};
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
