#!/usr/bin/env node

/**
 * Multi-Environment Build-Time Validator
 * Validates environment variables based on detected environment
 */

const fs = require('fs');
const path = require('path');

// Environment detection logic
function detectEnvironment() {
  // Check NODE_ENV first
  if (process.env.NODE_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'staging') return 'staging';
  if (process.env.NODE_ENV === 'development') return 'development';

  // Check for Vercel environment
  if (process.env.VERCEL_ENV === 'production') return 'production';
  if (process.env.VERCEL_ENV === 'preview') return 'staging';

  // Check for other CI/CD indicators
  if (process.env.CI && (process.env.GITHUB_REF === 'refs/heads/main' || process.env.GITHUB_REF === 'refs/heads/master')) {
    return 'production';
  }
  if (process.env.CI && process.env.GITHUB_REF && process.env.GITHUB_REF.includes('staging')) {
    return 'staging';
  }

  // Default to development
  return 'development';
}

// Environment-specific configurations
const ENVIRONMENT_CONFIGS = {
  development: {
    required: [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY'
    ],
    optional: [
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'VITE_GOOGLE_MAPS_API_KEY',
      'VITE_RESEND_API_KEY'
    ],
    validationRules: {
      VITE_SUPABASE_URL: (value) => value.startsWith('https://') && value.includes('supabase'),
      VITE_SUPABASE_PUBLISHABLE_KEY: (value) => value.length > 100,
      VITE_STRIPE_PUBLISHABLE_KEY: (value) => value.startsWith('pk_test_') || value === '',
      VITE_GOOGLE_MAPS_API_KEY: (value) => value.length > 20 || value === ''
    },
    placeholderPatterns: [
      'your_', 'YOUR_', 'placeholder', 'PLACEHOLDER', 'replace_me', 'REPLACE_ME',
      'sk_test_123', 'pk_test_123', 'example.com', 'localhost:3000'
    ]
  },
  staging: {
    required: [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'VITE_STRIPE_PUBLISHABLE_KEY'
    ],
    optional: [
      'VITE_GOOGLE_MAPS_API_KEY',
      'VITE_RESEND_API_KEY'
    ],
    validationRules: {
      VITE_SUPABASE_URL: (value) => value.startsWith('https://') && value.includes('supabase'),
      VITE_SUPABASE_PUBLISHABLE_KEY: (value) => value.length > 100,
      VITE_STRIPE_PUBLISHABLE_KEY: (value) => value.startsWith('pk_test_'),
      VITE_GOOGLE_MAPS_API_KEY: (value) => value.length > 20
    },
    placeholderPatterns: [
      'your_', 'YOUR_', 'placeholder', 'PLACEHOLDER', 'replace_me', 'REPLACE_ME',
      'sk_test_123', 'pk_test_123', 'example.com'
    ]
  },
  production: {
    required: [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'VITE_GOOGLE_MAPS_API_KEY'
    ],
    optional: [
      'VITE_RESEND_API_KEY'
    ],
    validationRules: {
      VITE_SUPABASE_URL: (value) => value.startsWith('https://') && value.includes('supabase'),
      VITE_SUPABASE_PUBLISHABLE_KEY: (value) => value.length > 100,
      VITE_STRIPE_PUBLISHABLE_KEY: (value) => value.startsWith('pk_live_'),
      VITE_GOOGLE_MAPS_API_KEY: (value) => value.length > 20
    },
    placeholderPatterns: [
      'your_', 'YOUR_', 'placeholder', 'PLACEHOLDER', 'replace_me', 'REPLACE_ME',
      'sk_test_', 'pk_test_', 'example.com', 'localhost', 'staging'
    ]
  }
};

function loadEnvironmentVariables() {
  const envFiles = ['.env.local', '.env'];
  const envVars = { ...process.env };

  for (const envFile of envFiles) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            if (!envVars[key]) { // Don't override existing env vars
              envVars[key] = value;
            }
          }
        }
      }
    }
  }

  return envVars;
}

function isPlaceholderValue(value, placeholderPatterns) {
  return placeholderPatterns.some(pattern => 
    value.toLowerCase().includes(pattern.toLowerCase())
  );
}

function validateEnvironment() {
  const environment = detectEnvironment();
  const config = ENVIRONMENT_CONFIGS[environment];
  const envVars = loadEnvironmentVariables();
  
  console.log(`\n🔍 Multi-Environment Validation`);
  console.log(`Environment: ${environment.toUpperCase()}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const results = {
    isValid: true,
    errors: [],
    warnings: [],
    missingRequired: [],
    invalidValues: {},
    placeholderValues: {}
  };

  // Validate required variables
  console.log('📋 Required Variables:');
  for (const varName of config.required) {
    const value = envVars[varName];
    
    if (!value) {
      results.missingRequired.push(varName);
      results.errors.push(`Missing required variable: ${varName}`);
      results.isValid = false;
      console.log(`  ❌ ${varName}: MISSING`);
      continue;
    }

    if (isPlaceholderValue(value, config.placeholderPatterns)) {
      results.placeholderValues[varName] = value;
      results.errors.push(`${varName} contains placeholder value`);
      results.isValid = false;
      console.log(`  ⚠️  ${varName}: PLACEHOLDER (${value})`);
      continue;
    }

    const validator = config.validationRules[varName];
    if (validator && !validator(value)) {
      results.invalidValues[varName] = 'Invalid format';
      results.errors.push(`${varName} has invalid format`);
      results.isValid = false;
      console.log(`  ❌ ${varName}: INVALID FORMAT`);
    } else {
      console.log(`  ✅ ${varName}: OK`);
    }
  }

  // Validate optional variables
  console.log('\n📋 Optional Variables:');
  for (const varName of config.optional) {
    const value = envVars[varName];
    
    if (!value) {
      console.log(`  ⚪ ${varName}: NOT SET`);
      continue;
    }

    if (isPlaceholderValue(value, config.placeholderPatterns)) {
      results.placeholderValues[varName] = value;
      results.warnings.push(`${varName} contains placeholder value`);
      console.log(`  ⚠️  ${varName}: PLACEHOLDER (${value})`);
      continue;
    }

    const validator = config.validationRules[varName];
    if (validator && !validator(value)) {
      results.invalidValues[varName] = 'Invalid format';
      results.warnings.push(`${varName} has invalid format`);
      console.log(`  ⚠️  ${varName}: INVALID FORMAT`);
    } else {
      console.log(`  ✅ ${varName}: OK`);
    }
  }

  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`Environment: ${environment.toUpperCase()}`);
  console.log(`Status: ${results.isValid ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`Warnings: ${results.warnings.length}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  • ${error}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(warning => console.log(`  • ${warning}`));
  }

  // Environment-specific guidance
  console.log(`\n💡 ${environment.toUpperCase()} Environment Guidance:`);
  switch (environment) {
    case 'development':
      console.log('  • Use test keys (pk_test_) for Stripe');
      console.log('  • Google Maps API key is optional');
      console.log('  • Focus on core functionality');
      break;
    case 'staging':
      console.log('  • Use test keys (pk_test_) for Stripe');
      console.log('  • All integrations should be functional');
      console.log('  • Test all payment flows');
      break;
    case 'production':
      console.log('  • Use live keys (pk_live_) for Stripe');
      console.log('  • All integrations must be configured');
      console.log('  • Security is critical');
      break;
  }

  if (!results.isValid) {
    console.log('\n🚫 Build failed due to environment validation errors.');
    console.log('Please fix the issues above and try again.');
    process.exit(1);
  } else {
    console.log('\n🎉 Environment validation passed!');
    console.log('Build can proceed safely.');
  }

  return results;
}

// Run validation if called directly
if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment, detectEnvironment };