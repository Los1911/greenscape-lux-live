#!/usr/bin/env node

/**
 * Environment Variable Injection Verification Script
 * Verifies that VITE_ variables are properly embedded in the production build
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const DIST_DIR = resolve(process.cwd(), 'dist');
const REQUIRED_VARS = [
  'VITE_STRIPE_PUBLIC_KEY',
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

console.log('🔍 Environment Variable Injection Verification');
console.log('===============================================\n');

// Check if dist directory exists
if (!existsSync(DIST_DIR)) {
  console.error('❌ dist/ directory not found!');
  console.error('   Run "npm run build" first.');
  process.exit(1);
}

// Find all JS files in dist/assets
const assetsDir = join(DIST_DIR, 'assets');
if (!existsSync(assetsDir)) {
  console.error('❌ dist/assets/ directory not found!');
  process.exit(1);
}

const jsFiles = readdirSync(assetsDir).filter(f => f.endsWith('.js'));
console.log(`📦 Found ${jsFiles.length} JavaScript files in dist/assets/\n`);

const results = {};
REQUIRED_VARS.forEach(varName => results[varName] = { found: false, files: [] });

// Search for environment variables in built files
jsFiles.forEach(file => {
  const filePath = join(assetsDir, file);
  const content = readFileSync(filePath, 'utf8');
  
  REQUIRED_VARS.forEach(varName => {
    const envValue = process.env[varName];
    if (envValue && content.includes(envValue)) {
      results[varName].found = true;
      results[varName].files.push(file);
    }
  });
});

// Display results
console.log('📊 Verification Results:\n');
let allPassed = true;

REQUIRED_VARS.forEach(varName => {
  const result = results[varName];
  if (result.found) {
    console.log(`✅ ${varName}`);
    console.log(`   Found in: ${result.files[0]}`);
  } else {
    console.log(`❌ ${varName}`);
    console.log(`   NOT FOUND in build output!`);
    allPassed = false;
  }
  console.log('');
});

if (allPassed) {
  console.log('🎉 All environment variables successfully injected!\n');
  process.exit(0);
} else {
  console.log('⚠️  Some environment variables are missing from the build.\n');
  console.log('Troubleshooting:');
  console.log('1. Ensure variables are set before running build');
  console.log('2. Check that variable names start with VITE_');
  console.log('3. Verify .env.production contains the correct values\n');
  process.exit(1);
}
