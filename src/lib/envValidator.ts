// Environment Variable Validator and Debugger
// SAFE VERSION: Allows both legacy and publishable keys

interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  values: Record<string, string | undefined>;
}

export const validateEnvironment = (): EnvValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Safe access to Vite env vars
  const env =
    (typeof import !== "undefined" && import.meta?.env) || {};

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  console.group("🔍 Environment Variable Debug (Safe Mode)");
  console.log("All import.meta.env:", env);
  console.log("VITE_SUPABASE_URL:", supabaseUrl);
  console.log(
    "VITE_SUPABASE_PUBLISHABLE_KEY:",
    supabaseKey ? "***" + supabaseKey.slice(-8) : "undefined"
  );
  console.log("MODE:", env.MODE);
  console.log("DEV:", env.DEV);
  console.log("PROD:", env.PROD);
  console.groupEnd();

  // ---- SAFE VALIDATION ONLY ----
  // No hard failures. No strict length rules.

  // URL check
  if (!supabaseUrl) {
    errors.push("VITE_SUPABASE_URL is undefined");
  } else if (!supabaseUrl.startsWith("https://")) {
    warnings.push("VITE_SUPABASE_URL should start with https://");
  }

  // Key format checks (allow both formats)
  const isLegacyKey = supabaseKey?.startsWith("eyJ");
  const isNewKey =
    supabaseKey?.startsWith("sbp_") ||
    supabaseKey?.startsWith("sb_publishable_");

  if (!supabaseKey) {
    errors.push("VITE_SUPABASE_PUBLISHABLE_KEY is undefined");
  } else if (!isLegacyKey && !isNewKey) {
    warnings.push(
      "Supabase key format is non standard but may still be valid"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    values: {
      VITE_SUPABASE_URL: supabaseUrl,
      VITE_SUPABASE_PUBLISHABLE_KEY: supabaseKey,
      MODE: env.MODE,
      DEV: String(env.DEV),
      PROD: String(env.PROD)
    }
  };
};

// Auto validate only in development
const env =
  (typeof import !== "undefined" && import.meta?.env) || {};

if (env.DEV) {
  const validation = validateEnvironment();

  if (!validation.isValid) {
    console.error("❌ Environment validation failed:", validation.errors);
  }
  if (validation.warnings.length > 0) {
    console.warn("⚠️ Environment warnings:", validation.warnings);
  }
  if (validation.isValid && validation.warnings.length === 0) {
    console.log("✅ Environment validation passed");
  }
}