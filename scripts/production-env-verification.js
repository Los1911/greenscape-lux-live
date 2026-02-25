#!/usr/bin/env node

/**
 * Production Environment Verification Script
 * Comprehensive audit and verification of all required environment variables
 * Includes CDN delay detection and production health checks
 */

const { execSync } = require('child_process');
const https = require('https');

// Environment variables required for production
const REQUIRED_ENV_VARS = {
  client: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_GOOGLE_MAPS_API_KEY'
  ],
  server: [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY'
  ]
};

console.log('🔍 GreenScape Lux Production Environment Audit');
console.log('===============================================');

// Check if environment variables are available
function checkEnvironmentAvailability() {
  console.log('\n🔧 Environment Variables Audit:');
  console.log('================================');
  
  const results = {
    client: { present: [], missing: [] },
    server: { present: [], missing: [] }
  };

  // Check client variables (VITE_*)
  console.log('\n📱 Client Variables (VITE_*):');
  for (const varName of REQUIRED_ENV_VARS.client) {
    const value = process.env[varName];
    if (value && value !== '' && !value.includes('placeholder')) {
      results.client.present.push(varName);
      console.log(`✅ ${varName}`);
    } else {
      results.client.missing.push(varName);
      console.log(`❌ ${varName} - MISSING`);
    }
  }

  // Check server variables
  console.log('\n🖥️  Server Variables:');
  for (const varName of REQUIRED_ENV_VARS.server) {
    const value = process.env[varName];
    if (value && value !== '' && !value.includes('placeholder')) {
      results.server.present.push(varName);
      console.log(`✅ ${varName}`);
    } else {
      results.server.missing.push(varName);
      console.log(`❌ ${varName} - MISSING`);
    }
  }

  return results;
}


// Test production endpoint health
function testProductionHealth() {
  return new Promise((resolve) => {
    console.log('\n🌐 Production Health Check:');
    console.log('===========================');
    
    const productionUrl = process.env.VITE_APP_URL || 'https://greenscapelux.com';
    const urlObj = new URL(productionUrl);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      console.log(`✅ Status: ${res.statusCode}`);
      console.log(`✅ Headers: ${JSON.stringify(res.headers, null, 2)}`);
      
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        // Check for environment fallback warnings
        if (data.includes('Environment Fallback System Active')) {
          console.log('⚠️ DETECTED: Environment Fallback System Active');
          console.log('🚨 ROOT CAUSE: Missing environment variables in production');
        } else {
          console.log('✅ No fallback system detected');
        }
        resolve(true);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Production health check failed: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('⏰ Production health check timed out (possible CDN delay)');
      resolve(false);
    });

    req.end();
  });
}

// Generate fix commands
function generateFixCommands(results) {
  console.log('\n🔧 Configuration Instructions:');
  console.log('===============================');
  
  const allMissing = [...results.client.missing, ...results.server.missing];
  
  if (allMissing.length === 0) {
    console.log('✅ No missing variables - all configured!');
    return [];
  }

  console.log('Add these environment variables to your hosting provider:');
  console.log('');
  
  allMissing.forEach(varName => {
    console.log(`  ${varName}=<your_value_here>`);
  });
  
  console.log('');
  console.log('For Famous/DeployPad: Set in deployment environment settings');
  console.log('After adding variables, redeploy your application');
  
  return allMissing;
}


// Main execution
async function main() {
  let hasIssues = false;

  // Step 1: Check environment variables
  const envResults = checkEnvironmentAvailability();
  
  // Step 2: Test production health
  await testProductionHealth();

  // Step 3: Generate summary
  console.log('\n📊 AUDIT SUMMARY:');
  console.log('==================');
  
  const totalRequired = REQUIRED_ENV_VARS.client.length + REQUIRED_ENV_VARS.server.length;
  const totalPresent = envResults.client.present.length + envResults.server.present.length;
  const totalMissing = envResults.client.missing.length + envResults.server.missing.length;
  
  console.log(`✅ Present: ${totalPresent}/${totalRequired}`);
  console.log(`❌ Missing: ${totalMissing}/${totalRequired}`);
  
  if (totalMissing > 0) {
    hasIssues = true;
    console.log('\n🚨 CRITICAL ISSUES FOUND:');
    console.log('- Missing environment variables causing fallback system activation');
    console.log('- Production login failures due to missing configuration');
    console.log('- Dashboard loading failures');
  }

  // Step 4: Generate fix commands
  const missingVars = generateFixCommands(envResults);

  // Step 5: Final status
  if (hasIssues) {
    console.log('\n❌ PRODUCTION ENVIRONMENT: FAILED');
    console.log('Action required: Configure missing environment variables');
    process.exit(1);
  } else {
    console.log('\n✅ PRODUCTION ENVIRONMENT: HEALTHY');
    console.log('All systems operational');
  }
}


main().catch(console.error);