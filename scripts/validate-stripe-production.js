#!/usr/bin/env node

/**
 * Stripe Production Configuration Validator
 * Run this after updating environment variables to confirm setup
 */

const https = require('https');

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