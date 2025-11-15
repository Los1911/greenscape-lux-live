// ---------------------------------------------------------------------------
// GreenScape Lux – Clean Runtime Config
// This file now ONLY reads Vite environment variables.
// No fallback logic, no multi environment system, no diagnostics.
// ---------------------------------------------------------------------------

console.log("🔍 Config Loaded:", {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  stripeKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  googleMapsKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  resendKey: import.meta.env.VITE_RESEND_API_KEY,
  mode: import.meta.env.MODE,
});

// Small helper for reading browser env vars
const readEnv = (key: string): string => {
  return import.meta.env[key] || "";
};

// ---------------------------------------------------------------------------
// The ONLY config your app needs going forward
// ---------------------------------------------------------------------------

export const config = {
  supabase: {
    url: readEnv("VITE_SUPABASE_URL"),
    anonKey: readEnv("VITE_SUPABASE_PUBLISHABLE_KEY")
  },

  stripe: {
    publishableKey: readEnv("VITE_STRIPE_PUBLISHABLE_KEY")
  },

  googleMaps: {
    apiKey: readEnv("VITE_GOOGLE_MAPS_API_KEY")
  },

  resend: {
    apiKey: readEnv("VITE_RESEND_API_KEY")
  },

  app: {
    name: "GreenScape Lux",
    version: "1.0.0",
    environment: import.meta.env.MODE,
  }
};

export default config;