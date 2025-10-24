#!/usr/bin/env node

/**
<<<<<<< HEAD
 * Stripe Production Validation Script
 * Verifies Stripe key is correctly loaded in production environment
=======
 * Stripe Production Configuration Validator
 * Run this after updating environment variables to confirm setup
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
 */

const https = require('https');

<<<<<<< HEAD
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://greenscape-lux.vercel.app';

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
          console.log('   1. Update VITE_STRIPE_PUBLIC_KEY in Vercel');
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
=======
// Configuration check
const requiredEnvVars = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY', 
  'STRIPE_WEBHOOK_SECRET'
];

console.log('🔍 Validating Stripe Production Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    const maskedValue = value.substring(0, 12) + '...';
    console.log(`✅ ${envVar}: ${maskedValue}`);
  } else {
    console.log(`❌ ${envVar}: MISSING`);
  }
});

// Validate Stripe key formats
const validateStripeKeys = () => {
  console.log('\n🔑 Stripe Key Format Validation:');
  
  const publishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  // Check publishable key
  if (publishableKey && publishableKey.startsWith('pk_live_')) {
    console.log('✅ Publishable key format: VALID (Live mode)');
  } else if (publishableKey && publishableKey.startsWith('pk_test_')) {
    console.log('⚠️  Publishable key format: TEST MODE (should be live)');
  } else {
    console.log('❌ Publishable key format: INVALID');
  }
  
  // Check secret key
  if (secretKey && secretKey.startsWith('sk_live_')) {
    console.log('✅ Secret key format: VALID (Live mode)');
  } else if (secretKey && secretKey.startsWith('sk_test_')) {
    console.log('⚠️  Secret key format: TEST MODE (should be live)');
  } else {
    console.log('❌ Secret key format: INVALID');
  }
  
  // Check webhook secret
  if (webhookSecret && webhookSecret.startsWith('whsec_')) {
    console.log('✅ Webhook secret format: VALID');
  } else {
    console.log('❌ Webhook secret format: INVALID');
  }
};

// Test Stripe API connectivity
const testStripeAPI = async () => {
  console.log('\n🌐 Testing Stripe API Connectivity...');
  
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.log('❌ Cannot test API - STRIPE_SECRET_KEY missing');
    return;
  }
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.stripe.com',
      path: '/v1/payment_methods',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Stripe API connectivity: SUCCESS');
      } else {
        console.log(`❌ Stripe API connectivity: FAILED (${res.statusCode})`);
      }
      resolve();
    });
    
    req.on('error', (error) => {
      console.log(`❌ Stripe API connectivity: ERROR (${error.message})`);
      resolve();
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Stripe API connectivity: TIMEOUT');
      req.destroy();
      resolve();
    });
    
    req.end();
  });
};

// Main validation function
const runValidation = async () => {
  validateStripeKeys();
  await testStripeAPI();
  
  console.log('\n📊 Validation Summary:');
  console.log('1. Update environment variables in Vercel Dashboard');
  console.log('2. Add secrets to Supabase Vault');
  console.log('3. Redeploy application');
  console.log('4. Test payment flow at /profile#payment');
  console.log('\n🚀 Ready for production payment processing!');
};

runValidation().catch(console.error);
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
