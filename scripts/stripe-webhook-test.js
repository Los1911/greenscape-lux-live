#!/usr/bin/env node

/**
 * 🧪 Stripe Webhook Test Suite for GreenScape Lux
 * Tests webhook configuration and payment flow
 */

const https = require('https');

const WEBHOOK_URL = 'https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/stripe-webhook';
const PRODUCTION_URL = 'https://greenscapelux.com';

console.log('🧪 Stripe Webhook Test Suite');
console.log('============================\n');

// Test 1: Webhook endpoint accessibility
async function testWebhookEndpoint() {
  console.log('📋 Test 1: Webhook Endpoint Accessibility');
  
  return new Promise((resolve) => {
    const req = https.request(WEBHOOK_URL, { method: 'POST' }, (res) => {
      if (res.statusCode === 400 || res.statusCode === 200) {
        console.log('✅ Webhook endpoint is accessible (HTTP ' + res.statusCode + ')');
        resolve(true);
      } else {
        console.log('❌ Unexpected status code: ' + res.statusCode);
        resolve(false);
      }
    });
    
    req.on('error', (error) => {
      console.log('❌ Webhook endpoint error:', error.message);
      resolve(false);
    });
    
    req.end();
  });
}

// Test 2: Production site accessibility
async function testProductionSite() {
  console.log('\n📋 Test 2: Production Site Accessibility');
  
  return new Promise((resolve) => {
    https.get(PRODUCTION_URL, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Production site is accessible');
        resolve(true);
      } else {
        console.log('❌ Production site returned: ' + res.statusCode);
        resolve(false);
      }
    }).on('error', (error) => {
      console.log('❌ Production site error:', error.message);
      resolve(false);
    });
  });
}

// Test 3: Environment variables check
function testEnvironmentVariables() {
  console.log('\n📋 Test 3: Environment Variables Check');
  
  const requiredVars = [
    'VITE_STRIPE_PUBLIC_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`⚠️  ${varName} is not set (check .env.local)`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

// Run all tests
async function runTests() {
  const test1 = await testWebhookEndpoint();
  const test2 = await testProductionSite();
  const test3 = testEnvironmentVariables();
  
  console.log('\n============================');
  console.log('📊 Test Results Summary');
  console.log('============================');
  console.log('Webhook Endpoint:', test1 ? '✅ PASS' : '❌ FAIL');
  console.log('Production Site:', test2 ? '✅ PASS' : '❌ FAIL');
  console.log('Environment Vars:', test3 ? '✅ PASS' : '⚠️  INCOMPLETE');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Configure webhook in Stripe Dashboard');
  console.log('2. Add STRIPE_WEBHOOK_SECRET to Supabase');
  console.log('3. Test payment at ' + PRODUCTION_URL);
  console.log('4. Verify events in Stripe Dashboard → Events\n');
  
  process.exit(test1 && test2 ? 0 : 1);
}

runTests();
