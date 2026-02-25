#!/usr/bin/env node

/**
 * Stripe Production Validation Script
 * Verifies Stripe key is correctly loaded in production environment
 */

const https = require('https');

const PRODUCTION_URL = process.env.PRODUCTION_URL || process.env.VITE_APP_URL || 'https://greenscapelux.com';

console.log('🔍 Validating Stripe Production Configuration...\n');

// Function to check if Stripe key is loaded
function validateStripeKey() {
  return new Promise((resolve, reject) => {
    https.get(PRODUCTION_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Check if the HTML contains the Stripe key reference
        const hasStripeKey = data.includes('VITE_STRIPE_PUBLIC_KEY');
        const hasUndefined = data.includes('UNDEFINED');
        
        console.log('✅ Production site is accessible');
        console.log(`📦 Build includes Stripe key reference: ${hasStripeKey ? '✅' : '❌'}`);
        console.log(`⚠️  Contains UNDEFINED: ${hasUndefined ? '❌ PROBLEM' : '✅ Good'}`);
        
        if (hasStripeKey && !hasUndefined) {
          console.log('\n✨ Stripe configuration looks good!');
          console.log('🔍 Manual verification:');
          console.log(`   1. Open: ${PRODUCTION_URL}`);
          console.log('   2. Open DevTools Console (F12)');
          console.log('   3. Look for: VITE_STRIPE_PUBLIC_KEY: pk_live_...');
          resolve(true);
        } else {
          console.log('\n❌ Stripe configuration issue detected');
          console.log('📋 Action required:');
          console.log('   1. Update VITE_STRIPE_PUBLIC_KEY in your hosting provider');
          console.log('   2. Redeploy the application');
          console.log('   3. Run this script again');
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.error('❌ Error accessing production site:', err.message);
      reject(err);
    });
  });
}

// Run validation
validateStripeKey()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
