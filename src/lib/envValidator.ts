// Environment Variable Validator and Debugger
// This helps diagnose why environment variables might be undefined

interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  values: Record<string, string | undefined>;
}

export const validateEnvironment = (): EnvValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Safe access to environment variables
  const env = (typeof import !== 'undefined' && import.meta?.env) || {};
  
  // Check for required Vite environment variables
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
  // Log all available environment variables for debugging
  console.group('🔍 Environment Variable Debug');
  console.log('All import.meta.env:', env);
  console.log('VITE_SUPABASE_URL:', supabaseUrl);
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '***' + supabaseKey.slice(-8) : 'undefined');
  console.log('MODE:', env.MODE);
  console.log('DEV:', env.DEV);
  console.log('PROD:', env.PROD);
  console.groupEnd();
  
  // Validate required variables
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is undefined');
  } else if (!supabaseUrl.startsWith('https://')) {
    warnings.push('VITE_SUPABASE_URL should start with https://');
  }
  
  if (!supabaseKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is undefined');
  } else if (supabaseKey.length < 100) {
    warnings.push('VITE_SUPABASE_ANON_KEY seems too short');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    values: {
      VITE_SUPABASE_URL: supabaseUrl,
      VITE_SUPABASE_ANON_KEY: supabaseKey,
      MODE: env.MODE,
      DEV: String(env.DEV),
      PROD: String(env.PROD)
    }
  };
};

// Auto-validate on import in development with safe access
const env = (typeof import !== 'undefined' && import.meta?.env) || {};
if (env.DEV) {
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    console.error('❌ Environment validation failed:', validation.errors);
    console.warn('⚠️ Environment warnings:', validation.warnings);
  } else {
    console.log('✅ Environment validation passed');
  }
}