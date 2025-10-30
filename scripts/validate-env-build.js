#!/usr/bin/env node

/**
 * Pre-Build Environment Variable Validation Script
 * Fails the build if critical VITE_* variables are missing
 */

const fs = require('fs');
const path = require('path');

// Critical environment variables that MUST be present
const CRITICAL_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_STRIPE_PUBLISHABLE_KEY'
];

// All expected environment variables from .env.example
const EXPECTED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'GOOGLE_MAPS_API_KEY',
  'OPENAI_API_KEY'
];

console.log('🔍 Validating environment variables...\n');

const missingCritical = [];
const missingOptional = [];

// Check each variable
EXPECTED_VARS.forEach(varName => {
  const value = process.env[varName];
  const isCritical = CRITICAL_VARS.includes(varName);
  
  if (!value || value === '' || value.startsWith('your_')) {
    if (isCritical) {
      missingCritical.push(varName);
      console.error(`❌ CRITICAL: ${varName} is missing or invalid`);
    } else {
      missingOptional.push(varName);
      console.warn(`⚠️  OPTIONAL: ${varName} is missing`);
    }
  } else {
    console.log(`✅ ${varName} is set`);
  }
});

console.log('\n' + '='.repeat(60));

if (missingCritical.length > 0) {
  console.error('\n❌ BUILD FAILED: Critical environment variables are missing!\n');
  console.error('Missing critical variables:');
  missingCritical.forEach(v => console.error(`  - ${v}`));
  console.error('\nPlease configure these in Vercel Dashboard:');
  console.error('  1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  console.error('  2. Add each missing variable for Production, Preview, and Development');
  console.error('  3. Redeploy the application\n');
  process.exit(1);
}

if (missingOptional.length > 0) {
  console.warn('\n⚠️  Optional variables missing (build will continue):');
  missingOptional.forEach(v => console.warn(`  - ${v}`));
}

console.log('\n✅ All critical environment variables are configured!\n');
process.exit(0);
