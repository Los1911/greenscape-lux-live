#!/usr/bin/env node

/**
 * Build-time Environment Variable Validator
 * Validates critical environment variables before build/deployment
 * Prevents deployment with missing or malformed configuration
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ERROR: ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ SUCCESS: ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  INFO: ${message}`, 'blue');
}

// Environment validation rules
const validationRules = {
  // Stripe Configuration
  VITE_STRIPE_PUBLISHABLE_KEY: {
    required: true,
    validator: (value) => {
      if (!value) return { valid: false, error: 'Stripe publishable key is required' };
      if (!value.startsWith('pk_')) return { valid: false, error: 'Stripe publishable key must start with "pk_"' };
      if (value.length < 20) return { valid: false, error: 'Stripe publishable key appears to be too short' };
      return { valid: true };
    },
    description: 'Stripe publishable key for frontend payment processing'
  },
  
  STRIPE_SECRET_KEY: {
    required: true,
    validator: (value) => {
      if (!value) return { valid: false, error: 'Stripe secret key is required' };
      if (!value.startsWith('sk_')) return { valid: false, error: 'Stripe secret key must start with "sk_"' };
      if (value.length < 20) return { valid: false, error: 'Stripe secret key appears to be too short' };
      return { valid: true };
    },
    description: 'Stripe secret key for backend payment processing'
  }
};

// Additional validation for environment consistency
function validateStripeKeyConsistency() {
  const publishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!publishableKey || !secretKey) return { valid: true }; // Individual validation will catch missing keys

  const pubIsLive = publishableKey.startsWith('pk_live_');
  const pubIsTest = publishableKey.startsWith('pk_test_');
  const secretIsLive = secretKey.startsWith('sk_live_');
  const secretIsTest = secretKey.startsWith('sk_test_');

  // Check for environment mismatch
  if ((pubIsLive && secretIsTest) || (pubIsTest && secretIsLive)) {
    return {
      valid: false,
      error: 'Stripe key environment mismatch: publishable and secret keys must both be test or both be live'
    };
  }

  // Check for test keys in production
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  if (isProduction && pubIsTest && secretIsTest) {
    return {
      valid: false,
      error: 'Production builds must use live Stripe keys (pk_live_... and sk_live_...)'
    };
  }

  return { valid: true };
}

// Main validation function
function validateEnvironment() {
  logInfo('🔍 Validating Stripe environment configuration...');
  
  let hasErrors = false;
  const errors = [];
  const warnings = [];

  // Validate each Stripe key individually
  for (const [key, rule] of Object.entries(validationRules)) {
    const value = process.env[key];
    
    logInfo(`Checking ${key}...`);
    
    if (rule.required && !value) {
      logError(`${key} is required but not set`);
      errors.push(`Missing required environment variable: ${key}`);
      hasErrors = true;
      continue;
    }
    
    if (value && rule.validator) {
      const validation = rule.validator(value);
      if (!validation.valid) {
        logError(`${key}: ${validation.error}`);
        errors.push(`${key}: ${validation.error}`);
        hasErrors = true;
      } else {
        logSuccess(`${key} is valid`);
      }
    }
  }

  // Validate Stripe key consistency
  const consistencyCheck = validateStripeKeyConsistency();
  if (!consistencyCheck.valid) {
    logError(`Stripe Key Consistency: ${consistencyCheck.error}`);
    errors.push(consistencyCheck.error);
    hasErrors = true;
  } else {
    logSuccess('Stripe key consistency check passed');
  }

  // Print results
  if (hasErrors) {
    logError('❌ Environment validation failed!');
    logError('The following issues must be fixed before deployment:');
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    
    console.log('\n🔧 How to fix:');
    console.log('1. Set the correct environment variables in your deployment platform');
    console.log('2. Ensure VITE_STRIPE_PUBLISHABLE_KEY starts with "pk_" (pk_live_... for production)');
    console.log('3. Ensure STRIPE_SECRET_KEY starts with "sk_" (sk_live_... for production)');
    console.log('4. Make sure both keys are from the same Stripe environment (both test or both live)');
    
    process.exit(1);
  } else {
    logSuccess('✅ All Stripe environment variables are properly configured!');
    process.exit(0);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment, validateStripeKeyConsistency, validationRules };