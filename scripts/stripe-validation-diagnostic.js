#!/usr/bin/env node

/**
 * GreenScape Lux Stripe Validation Diagnostic
 * Production-focused environment validation with security fixes
 */

console.log('🔍 GreenScape Lux Stripe Production Diagnostic');
console.log('===============================================');

// Environment validation
const requiredEnvVars = {
  client: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY'
  ],
  server: [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ]
};

console.log('\n🔧 Environment Variables Check:');
console.log('================================');

let hasIssues = false;

// Check client-safe variables
console.log('\n📱 Client Variables (browser-safe):');
requiredEnvVars.client.forEach(varName => {
  const value = process.env[varName];
  if (value && value !== '' && !value.includes('placeholder')) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING OR INVALID`);
    hasIssues = true;
  }
});

// Check server variables (don't expose values)
console.log('\n🖥️  Server Variables (secure):');
requiredEnvVars.server.forEach(varName => {
  const value = process.env[varName];
  if (value && value !== '' && !value.includes('placeholder')) {
    console.log(`✅ ${varName}: [CONFIGURED]`);
  } else {
    console.log(`❌ ${varName}: MISSING OR INVALID`);
    hasIssues = true;
  }
});

// Production-specific checks
console.log('\n🌐 Production Environment Analysis:');
console.log('===================================');

const nodeEnv = process.env.NODE_ENV || 'development';
const deployEnv = process.env.VITE_DEPLOY_ENV || 'development';

console.log(`📍 NODE_ENV: ${nodeEnv}`);
console.log(`📍 DEPLOY_ENV: ${deployEnv}`);

if (deployEnv === 'production') {
  console.log('✅ Running in production environment');
} else {
  console.log('⚠️  Not running in production environment');
}


// Security validation
console.log('\n🔒 Security Validation:');
console.log('=======================');

const stripePublishable = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (stripePublishable && stripePublishable.startsWith('pk_')) {
  console.log('✅ Stripe publishable key format valid');
} else {
  console.log('❌ Stripe publishable key invalid or missing');
  hasIssues = true;
}
if (stripeSecret && stripeSecret.startsWith('sk_')) {
  console.log('✅ Stripe secret key format valid');
} else {
  console.log('❌ Stripe secret key invalid or missing');
  hasIssues = true;
}

// Final assessment
console.log('\n📊 DIAGNOSTIC SUMMARY:');
console.log('======================');

if (hasIssues) {
  console.log('❌ ISSUES DETECTED - Production environment needs configuration');
  console.log('\n🔧 REQUIRED ACTIONS:');
  console.log('1. Set missing environment variables in your deployment platform');
  console.log('2. Ensure variables are configured for PRODUCTION environment');
  console.log('3. Redeploy application with updated environment variables');
  console.log('4. Monitor browser console for any configuration warnings');
  
  process.exit(1);
} else {
  console.log('✅ All environment variables configured correctly');
  console.log('🚀 Production environment ready');
  process.exit(0);
}
