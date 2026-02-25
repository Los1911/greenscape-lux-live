/**
 * Strict Environment Variable Validation
 * Validates format and presence of all required environment variables
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface EnvConfig {
  supabaseUrl: string;
  supabaseKey: string;
  stripeKey: string;
  googleMapsKey: string;
  resendKey?: string;
}

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check Supabase URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl === 'undefined' || supabaseUrl === 'null') {
    errors.push('VITE_SUPABASE_URL is missing or invalid');
  } else if (!supabaseUrl.includes('.supabase.co')) {
    errors.push('VITE_SUPABASE_URL must contain .supabase.co');
  }

  // Check Supabase Publishable Key
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseKey || supabaseKey === 'undefined' || supabaseKey === 'null') {
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY is missing or invalid');
  } else if (!supabaseKey.startsWith('sb_publishable_') && !supabaseKey.startsWith('sb-publishable_')) {
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY must start with sb_publishable_ or sb-publishable_');
  }

  // Check Stripe Key (optional but recommended)
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!stripeKey || stripeKey === 'undefined' || stripeKey === 'null') {
    warnings.push('VITE_STRIPE_PUBLISHABLE_KEY is not set - payment features will be disabled');
  } else if (!stripeKey.startsWith('pk_live_') && !stripeKey.startsWith('pk_test_')) {
    warnings.push('VITE_STRIPE_PUBLISHABLE_KEY should start with pk_live_ or pk_test_');
  }

  // Check Google Maps Key (optional but recommended)
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!googleMapsKey || googleMapsKey === 'undefined' || googleMapsKey === 'null') {
    warnings.push('VITE_GOOGLE_MAPS_API_KEY is not set - GPS and mapping features will be disabled');
  } else if (!googleMapsKey.startsWith('AIza')) {
    warnings.push('VITE_GOOGLE_MAPS_API_KEY should start with AIza');
  }

  // Check Resend Key (optional)
  const resendKey = import.meta.env.VITE_RESEND_API_KEY;
  if (!resendKey || resendKey === 'undefined' || resendKey === 'null') {
    warnings.push('VITE_RESEND_API_KEY is not set - email notifications may be limited');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function getEnvironmentConfig(): EnvConfig {
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
    stripeKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    googleMapsKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    resendKey: import.meta.env.VITE_RESEND_API_KEY
  };
}

export function logEnvironmentStatus(): void {
  const validation = validateEnvironment();
  
  console.log('🔍 Environment Validation Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (validation.valid) {
    console.log('✅ All required environment variables are valid');
  } else {
    console.error('❌ Environment validation failed');
    validation.errors.forEach(err => console.error(`  - ${err}`));
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    validation.warnings.forEach(warn => console.warn(`  - ${warn}`));
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}
