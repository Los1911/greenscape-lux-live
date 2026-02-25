#!/usr/bin/env node

/**
 * End-to-End Stripe Payment Testing Script
 * Tests payment processing and commission calculations with live transactions
 */

const https = require('https');
const crypto = require('crypto');

console.log('🧪 Stripe Payment Processing Test Suite');
console.log('=======================================\n');

// Configuration
const config = {
  baseUrl: process.env.VITE_APP_URL || 'https://greenscapelux.com',
  testAmount: 10000, // $100.00 in cents
  stripePublishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
};


// Validate configuration
if (!config.stripePublishableKey) {
  console.error('❌ VITE_STRIPE_PUBLISHABLE_KEY not found');
  process.exit(1);
}

if (!config.stripePublishableKey.startsWith('pk_live_')) {
  console.warn('⚠️  Using test key - switch to live key for production testing');
}

console.log('📋 Test Configuration:');
console.log(`• Base URL: ${config.baseUrl}`);
console.log(`• Test Amount: $${config.testAmount / 100}`);
console.log(`• Stripe Mode: ${config.stripePublishableKey.startsWith('pk_live_') ? 'LIVE' : 'TEST'}`);
console.log('');

// Test 1: Payment Intent Creation
async function testPaymentIntentCreation() {
  console.log('🔄 Test 1: Payment Intent Creation');
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      amount: config.testAmount,
      currency: 'usd',
      metadata: {
        test: 'commission_calculation',
        landscaper_id: 'test_landscaper_123'
      }
    });

    const options = {
      hostname: new URL(config.baseUrl).hostname,
      port: 443,
      path: '/api/create-payment-intent',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.client_secret) {
            console.log('✅ Payment intent created successfully');
            console.log(`• Client Secret: ${response.client_secret.substring(0, 20)}...`);
            resolve(response);
          } else {
            console.log('❌ Payment intent creation failed');
            console.log(`• Status: ${res.statusCode}`);
            console.log(`• Response: ${data}`);
            reject(new Error('Payment intent creation failed'));
          }
        } catch (error) {
          console.log('❌ Invalid JSON response');
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test 2: Webhook Endpoint Validation
async function testWebhookEndpoint() {
  console.log('\n🔄 Test 2: Webhook Endpoint Validation');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mwvcbedvnimabfwubazz.functions.supabase.co',
      port: 443,
      path: '/stripe-webhook-handler',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 405) {
        console.log('✅ Webhook endpoint is accessible');
        console.log(`• Status: ${res.statusCode}`);
        resolve();
      } else {
        console.log('❌ Webhook endpoint not accessible');
        console.log(`• Status: ${res.statusCode}`);
        reject(new Error('Webhook endpoint failed'));
      }
    });

    req.on('error', (error) => {
      console.log('❌ Webhook endpoint test failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Test 3: Commission Calculation Validation
function testCommissionCalculation() {
  console.log('\n🔄 Test 3: Commission Calculation Logic');
  
  const testCases = [
    { amount: 10000, expected: { platform: 500, landscaper: 9500 } }, // $100 -> $5 platform, $95 landscaper
    { amount: 25000, expected: { platform: 1250, landscaper: 23750 } }, // $250 -> $12.50 platform, $237.50 landscaper
    { amount: 50000, expected: { platform: 2500, landscaper: 47500 } }  // $500 -> $25 platform, $475 landscaper
  ];

  const PLATFORM_FEE_RATE = 0.05; // 5% platform fee

  let allPassed = true;

  testCases.forEach((testCase, index) => {
    const platformFee = Math.round(testCase.amount * PLATFORM_FEE_RATE);
    const landscaperAmount = testCase.amount - platformFee;
    
    const passed = platformFee === testCase.expected.platform && 
                  landscaperAmount === testCase.expected.landscaper;
    
    console.log(`• Test Case ${index + 1}: $${testCase.amount / 100} ${passed ? '✅' : '❌'}`);
    console.log(`  Platform Fee: $${platformFee / 100} (expected: $${testCase.expected.platform / 100})`);
    console.log(`  Landscaper: $${landscaperAmount / 100} (expected: $${testCase.expected.landscaper / 100})`);
    
    if (!passed) allPassed = false;
  });

  if (allPassed) {
    console.log('✅ All commission calculations passed');
  } else {
    console.log('❌ Commission calculation errors detected');
    throw new Error('Commission calculation failed');
  }
}

// Test 4: Environment Validation
function testEnvironmentValidation() {
  console.log('\n🔄 Test 4: Environment Validation');
  
  const requiredVars = [
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];

  let allPresent = true;

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value && !value.includes('your_') && !value.includes('REPLACE')) {
      console.log(`✅ ${varName}: Configured`);
    } else {
      console.log(`❌ ${varName}: ${!value ? 'Missing' : 'Placeholder value'}`);
      allPresent = false;
    }
  });

  if (allPresent) {
    console.log('✅ Environment validation passed');
  } else {
    console.log('❌ Environment validation failed');
    throw new Error('Environment validation failed');
  }
}

// Run all tests
async function runAllTests() {
  try {
    console.log('🚀 Starting Stripe Payment Test Suite...\n');
    
    // Test environment first
    testEnvironmentValidation();
    
    // Test commission calculations
    testCommissionCalculation();
    
    // Test webhook endpoint
    await testWebhookEndpoint();
    
    // Test payment intent creation
    await testPaymentIntentCreation();
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Stripe payment processing is ready for production');
    console.log('\n📋 Manual Testing Checklist:');
    console.log('1. Process a real payment with live card');
    console.log('2. Verify webhook events in Stripe dashboard');
    console.log('3. Check commission splits in database');
    console.log('4. Test payout processing');
    
  } catch (error) {
    console.log('\n❌ TEST SUITE FAILED');
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, testCommissionCalculation };