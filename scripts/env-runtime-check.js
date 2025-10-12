#!/usr/bin/env node

/**
 * Runtime Environment Check for GitHub Actions
 * Validates environment variables during CI/CD pipeline
 */

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY'
];

const placeholderPatterns = [
  /your_.*_key_here/i,
  /placeholder/i,
  /replace_with/i,
  /your_.*_id_here/i,
  /your_.*_secret_here/i
];

function isPlaceholder(value) {
  return placeholderPatterns.some(pattern => pattern.test(value));
}

function validateRuntime() {
  console.log('🔍 Runtime Environment Validation\n');
  
  let hasErrors = false;
  const missing = [];
  const placeholders = [];
  
  requiredEnvVars.forEach(key => {
    const value = process.env[key];
    
    if (!value) {
      missing.push(key);
      hasErrors = true;
    } else if (isPlaceholder(value)) {
      placeholders.push(key);
      hasErrors = true;
    } else {
      console.log(`✅ ${key}: Configured`);
    }
  });
  
  if (missing.length > 0) {
    console.log('\n❌ Missing environment variables:');
    missing.forEach(key => console.log(`   ${key}`));
  }
  
  if (placeholders.length > 0) {
    console.log('\n⚠️  Placeholder values detected:');
    placeholders.forEach(key => console.log(`   ${key}`));
  }
  
  if (hasErrors) {
    console.log('\n❌ Environment validation failed');
    process.exit(1);
  } else {
    console.log('\n✅ All environment variables validated');
  }
}

// GitHub Actions output
if (process.env.GITHUB_ACTIONS) {
  console.log('::group::Environment Validation');
  validateRuntime();
  console.log('::endgroup::');
} else {
  validateRuntime();
}