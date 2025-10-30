// scripts/pre-build-env-validator.js
// -----------------------------------------------------
// 🧩 GreenScape Lux Pre-Build Environment Validator
// -----------------------------------------------------
// This script ensures all required environment variables
// are valid *before* building, to prevent “Load failed”
// errors or misconfigured deployments.
// -----------------------------------------------------

import fs from 'fs';
import dotenv from 'dotenv';

// Automatically detect environment file
const envFile =
  fs.existsSync('.env.production') && process.env.CI
    ? '.env.production'
    : fs.existsSync('.env.local')
    ? '.env.local'
    : '.env';
dotenv.config({ path: envFile });

// Helper: validate key format
function validateKey(name, value, prefix, required = true) {
  if (!value || value.trim() === '') {
    if (required) throw new Error(`❌ Missing environment variable: ${name}`);
    else return console.warn(`⚠️ Optional key missing: ${name}`);
  }

  if (!value.startsWith(prefix)) {
    throw new Error(`❌ Invalid format for ${name}: must start with ${prefix}`);
  }

  console.log(`✅ ${name} validated (${prefix}...)`);
}

// Validate required keys
try {
  console.log('🌱 Running GreenScape Lux Pre-Build Environment Validator');
  console.log(`🗂  Environment File Loaded: ${envFile}\n`);

  validateKey('VITE_SUPABASE_URL', process.env.VITE_SUPABASE_URL, 'https://');
  validateKey('VITE_SUPABASE_PUBLISHABLE_KEY', process.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'sb_publishable_');
  validateKey('VITE_STRIPE_PUBLISHABLE_KEY', process.env.VITE_STRIPE_PUBLISHABLE_KEY, 'pk_');
  validateKey('VITE_GOOGLE_MAPS_API_KEY', process.env.VITE_GOOGLE_MAPS_API_KEY, 'AIza');
  validateKey('VITE_RESEND_API_KEY', process.env.VITE_RESEND_API_KEY || '', 're_', false);

  console.log('\n✅ All environment variables validated successfully!\n');
} catch (err) {
  console.error('\n🚨 Environment validation failed!\n');
  console.error(err.message);
  console.error('\n🛑 Build aborted. Fix the issue above before retrying.\n');
  process.exit(1);
}
