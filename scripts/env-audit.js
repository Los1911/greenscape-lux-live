#!/usr/bin/env node

/**
 * GreenScape Lux Environment Variables Audit Script
 * Checks the status of all required environment variables
 */

const fs = require('fs');
const path = require('path');

// Expected environment variables
const ENV_VARS = [
  {
    name: 'VITE_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    format: 'https://*.supabase.co',
    example: 'https://your-project.supabase.co'
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key (JWT)',
    format: 'eyJ*',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  {
    name: 'VITE_STRIPE_PUBLISHABLE_KEY',
    required: true,
    description: 'Stripe publishable key',
    format: 'pk_test_* or pk_live_*',
    example: 'pk_test_your_key_here'
  },
  {
    name: 'VITE_STRIPE_SECRET_KEY',
    required: false, // Not used in frontend
    description: 'Stripe secret key (backend only)',
    format: 'sk_test_* or sk_live_*',
    example: 'sk_test_your_key_here'
  },
  {
    name: 'VITE_STRIPE_WEBHOOK_SECRET',
    required: false,
    description: 'Stripe webhook secret',
    format: 'whsec_*',
    example: 'whsec_your_secret_here'
  },
  {
    name: 'VITE_GOOGLE_MAPS_API_KEY',
    required: true,
    description: 'Google Maps API key',
    format: 'AIza*',
    example: 'AIzaSyDGAU0VsZYL67arpQfGy-1vWSANqe-mKo4'
  },
  {
    name: 'VITE_RESEND_API_KEY',
    required: false,
    description: 'Resend email API key',
    format: 're_*',
    example: 're_your_key_here'
  }
];

// Placeholder patterns
const PLACEHOLDERS = [
  'your-key',
  'your_key_here',
  'your-project',
  'your_publishable_key_here',
  'your_secret_key_here',
  'your_webhook_secret_here',
  'your_resend_api_key_here',
  'example-key',
  'test-key',
  'placeholder'
];

function isPlaceholder(value) {
  if (!value) return false;
  const lower = value.toLowerCase();
  return PLACEHOLDERS.some(pattern => lower.includes(pattern));
}

function validateFormat(varName, value) {
  const config = ENV_VARS.find(v => v.name === varName);
  if (!config) return true;

  switch (varName) {
    case 'VITE_SUPABASE_URL':
      return value.includes('.supabase.co');
    case 'VITE_SUPABASE_ANON_KEY':
      return value.startsWith('eyJ');
    case 'VITE_STRIPE_PUBLISHABLE_KEY':
      return value.startsWith('pk_');
    case 'VITE_STRIPE_SECRET_KEY':
      return value.startsWith('sk_');
    case 'VITE_STRIPE_WEBHOOK_SECRET':
      return value.startsWith('whsec_');
    case 'VITE_GOOGLE_MAPS_API_KEY':
      return value.startsWith('AIza');
    case 'VITE_RESEND_API_KEY':
      return value.startsWith('re_');
    default:
      return true;
  }
}

function checkEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

function auditEnvironment() {
  console.log('🔍 GreenScape Lux Environment Variables Audit\n');

  // Check different env files
  const envFiles = [
    { name: '.env.local', path: '.env.local' },
    { name: '.env.local.template', path: '.env.local.template' },
    { name: '.env.example', path: '.env.example' }
  ];

  const results = {};
  
  envFiles.forEach(file => {
    const env = checkEnvFile(file.path);
    if (env) {
      results[file.name] = env;
      console.log(`📄 Found ${file.name}`);
    } else {
      console.log(`❌ Missing ${file.name}`);
    }
  });

  console.log('\n📊 Environment Variables Status:\n');

  ENV_VARS.forEach(varConfig => {
    const { name, required, description } = varConfig;
    
    console.log(`🔧 ${name}`);
    console.log(`   Description: ${description}`);
    console.log(`   Required: ${required ? '✅ Yes' : '⚠️ Optional'}`);

    let found = false;
    let status = '❌ Not found';
    let value = null;

    // Check each env file for this variable
    Object.entries(results).forEach(([fileName, env]) => {
      if (env[name]) {
        found = true;
        value = env[name];
        
        if (isPlaceholder(value)) {
          status = `⚠️ Placeholder in ${fileName}`;
        } else if (!validateFormat(name, value)) {
          status = `❌ Invalid format in ${fileName}`;
        } else {
          status = `✅ Configured in ${fileName}`;
        }
      }
    });

    console.log(`   Status: ${status}`);
    
    if (value && !isPlaceholder(value)) {
      const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
      console.log(`   Value: ${preview}`);
    }
    
    console.log('');
  });

  // Summary
  const criticalMissing = ENV_VARS.filter(v => {
    if (!v.required) return false;
    
    let hasValidValue = false;
    Object.values(results).forEach(env => {
      if (env[v.name] && !isPlaceholder(env[v.name]) && validateFormat(v.name, env[v.name])) {
        hasValidValue = true;
      }
    });
    
    return !hasValidValue;
  });

  console.log('📋 Summary:');
  console.log(`   Total variables: ${ENV_VARS.length}`);
  console.log(`   Required variables: ${ENV_VARS.filter(v => v.required).length}`);
  console.log(`   Critical missing: ${criticalMissing.length}`);

  if (criticalMissing.length > 0) {
    console.log('\n🚨 Critical Issues:');
    criticalMissing.forEach(v => {
      console.log(`   - ${v.name}: ${v.description}`);
    });
    console.log('\n💡 Next Steps:');
    console.log('   1. Create .env.local file if missing');
    console.log('   2. Replace placeholder values with real API keys');
    console.log('   3. Verify all services are properly configured');
  } else {
    console.log('\n✅ All critical environment variables are configured!');
  }
}

// Run the audit
auditEnvironment();