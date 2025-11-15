

// src/lib/env.ts
// Centralized environment variable validator for GreenScape Lux

interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  GOOGLE_MAPS_API_KEY: string;
  RESEND_API_KEY?: string;
  SITE_URL?: string;
  ADMIN_EMAIL?: string;
}

/**
 * Safely loads and validates all critical environment variables.
 */
export function loadEnv(): EnvConfig {
  const env = import.meta.env;

  const SUPABASE_URL = env.VITE_SUPABASE_URL || "";
  const STRIPE_PUBLISHABLE_KEY = env.VITE_STRIPE_PUBLISHABLE_KEY || "";
  const GOOGLE_MAPS_API_KEY = env.VITE_GOOGLE_MAPS_API_KEY || "";
  const RESEND_API_KEY = env.VITE_RESEND_API_KEY || "";
  const SITE_URL = env.VITE_SITE_URL || window.location.origin;
  const ADMIN_EMAIL = env.VITE_ADMIN_EMAIL || "support@greenscapelux.com";

  const missing: string[] = [];

  if (!SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
  if (!STRIPE_PUBLISHABLE_KEY) missing.push("VITE_STRIPE_PUBLISHABLE_KEY");
  if (!GOOGLE_MAPS_API_KEY) missing.push("VITE_GOOGLE_MAPS_API_KEY");

  if (missing.length > 0) {
    console.error(
      "❌ Missing required environment variables:",
      missing.join(", ")
    );
    throw new Error("Missing critical environment variables.");
  }

  if (!GOOGLE_MAPS_API_KEY.startsWith("AIza")) {
    console.warn("⚠️ GOOGLE_MAPS_API_KEY should start with 'AIza'");
  }

  if (!SUPABASE_ANON_KEY.startsWith("ey") && !SUPABASE_ANON_KEY.startsWith("sb_")) {
    console.warn("⚠️ SUPABASE_ANON_KEY may not be a valid JWT format.");
  }

  return {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    STRIPE_PUBLISHABLE_KEY,
    GOOGLE_MAPS_API_KEY,
    RESEND_API_KEY,
    SITE_URL,
    ADMIN_EMAIL,
  };
}

export const env = loadEnv();
console.log("✅ Environment loaded successfully:", {
  SUPABASE_URL: env.SUPABASE_URL,
  STRIPE_PUBLISHABLE_KEY: env.STRIPE_PUBLISHABLE_KEY ? "SET" : "MISSING",
  GOOGLE_MAPS_API_KEY: env.GOOGLE_MAPS_API_KEY ? "SET" : "MISSING",
  SITE_URL: env.SITE_URL,
});