#!/usr/bin/env node

const { execSync } = require('child_process');

// Staging environment variables mapping
const STAGING_ENV_VARS = {
  'VITE_SUPABASE_URL': process.env.STAGING_SUPABASE_URL,
  'VITE_SUPABASE_PUBLISHABLE_KEY': process.env.STAGING_SUPABASE_ANON_KEY,
  'VITE_STRIPE_PUBLISHABLE_KEY': process.env.STAGING_STRIPE_PUBLISHABLE_KEY,
  'STRIPE_SECRET_KEY': process.env.STAGING_STRIPE_SECRET_KEY,
  'STRIPE_WEBHOOK_SECRET': process.env.STAGING_STRIPE_WEBHOOK_SECRET,
  'VITE_GOOGLE_MAPS_API_KEY': process.env.STAGING_GOOGLE_MAPS_API_KEY,
  'VITE_SITE_URL': process.env.STAGING_SITE_URL || 'https://staging.greenscapelux.com',
  'NODE_ENV': 'staging'
};

async function syncEnvironmentVariables() {
  console.log('🔄 Syncing staging environment variables to Vercel...');
  
  let syncedCount = 0;
  let errorCount = 0;

  for (const [key, value] of Object.entries(STAGING_ENV_VARS)) {
    if (!value) {
      console.warn(`⚠️  Warning: ${key} is not set`);
      continue;
    }

    try {
      // Set environment variable for preview environment
      execSync(
        `vercel env add ${key} preview <<< "${value}"`,
        { 
          stdio: 'pipe',
          env: { ...process.env, VERCEL_TOKEN: process.env.VERCEL_TOKEN }
        }
      );
      
      console.log(`✅ ${key} synced to staging`);
      syncedCount++;
    } catch (error) {
      console.error(`❌ Failed to sync ${key}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Sync Summary:`);
  console.log(`   ✅ Successfully synced: ${syncedCount}`);
  console.log(`   ❌ Failed to sync: ${errorCount}`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

// Validate required secrets
function validateSecrets() {
  const requiredSecrets = [
    'VERCEL_TOKEN',
    'STAGING_SUPABASE_URL',
    'STAGING_SUPABASE_ANON_KEY',
    'STAGING_STRIPE_PUBLISHABLE_KEY'
  ];

  const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);
  
  if (missingSecrets.length > 0) {
    console.error('❌ Missing required secrets:');
    missingSecrets.forEach(secret => console.error(`   - ${secret}`));
    process.exit(1);
  }
}

if (require.main === module) {
  validateSecrets();
  syncEnvironmentVariables().catch(console.error);
}

module.exports = { syncEnvironmentVariables, validateSecrets };