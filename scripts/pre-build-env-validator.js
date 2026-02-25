#!/usr/bin/env node

/**
 * Pre-Build Environment Validator
 * Runs before Vite build to ensure all required environment variables are present and valid
 */

const requiredEnvVars = {
  VITE_SUPABASE_URL: {
    pattern: /^https:\/\/.+\.supabase\.co$/,
    description: 'Supabase project URL (must start with https:// and end with .supabase.co)'
  },
  VITE_SUPABASE_PUBLISHABLE_KEY: {
    pattern: /^sb_publishable_[A-Za-z0-9_-]+$/,
    description: 'Supabase publishable key (must start with sb_publishable_)'
  },
  VITE_STRIPE_PUBLISHABLE_KEY: {
    pattern: /^pk_(live|test)_[A-Za-z0-9]+$/,
    description: 'Stripe publishable key (must start with pk_live_ or pk_test_)'
  },
  VITE_GOOGLE_MAPS_API_KEY: {
    pattern: /^AIza[A-Za-z0-9_-]{35}$/,
    description: 'Google Maps API key (must start with AIza and be 39 characters)'
  }
};

const placeholderValues = ['SET', 'null', 'undefined', 'YOUR_', 'REPLACE_', ''];

console.log('\n🔍 Pre-Build Environment Validation\n');

let hasErrors = false;
const errors = [];

for (const [key, config] of Object.entries(requiredEnvVars)) {
  const value = process.env[key];
  
  // Check if variable exists
  if (!value) {
    hasErrors = true;
    errors.push(`❌ ${key}: MISSING`);
    console.error(`❌ ${key}: MISSING`);
    console.error(`   Expected: ${config.description}\n`);
    continue;
  }
  
  // Check for placeholder values
  if (placeholderValues.some(placeholder => value.includes(placeholder))) {
    hasErrors = true;
    errors.push(`❌ ${key}: Contains placeholder value`);
    console.error(`❌ ${key}: Contains placeholder value`);
    console.error(`   Value: ${value.substring(0, 20)}...`);
    console.error(`   Expected: ${config.description}\n`);
    continue;
  }
  
  // Validate format
  if (!config.pattern.test(value)) {
    hasErrors = true;
    errors.push(`❌ ${key}: Invalid format`);
    console.error(`❌ ${key}: Invalid format`);
    console.error(`   Value: ${value.substring(0, 20)}...`);
    console.error(`   Expected: ${config.description}\n`);
    continue;
  }
  
  // Success
  const maskedValue = value.substring(0, 8) + '...' + value.substring(value.length - 4);
  console.log(`✅ ${key}: ${maskedValue}`);
}

if (hasErrors) {
  console.error('\n❌ Build aborted: Environment validation failed\n');
  console.error('Fix the errors above and try again.\n');
  console.error('For GitHub Pages deployment, update secrets at:');
  console.error('https://github.com/YOUR_USERNAME/YOUR_REPO/settings/environments/github-pages\n');
  process.exit(1);
}

console.log('\n✅ All environment variables validated successfully\n');
process.exit(0);
