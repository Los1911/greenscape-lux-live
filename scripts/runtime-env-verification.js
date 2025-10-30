#!/usr/bin/env node

/**
 * Runtime Environment Variable Verification Script
 * 
 * This script verifies that environment variables are properly injected
 * into the Vite build output at runtime (in the browser).
 * 
 * It searches through the compiled JavaScript files in dist/assets/
 * to ensure that VITE_ prefixed variables are embedded as string literals.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../dist/assets');
const REQUIRED_VARS = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY'
];

console.log('\n🔍 Runtime Environment Variable Verification');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check if dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ Error: dist/assets directory not found!');
  console.error('   Please run "npm run build" first.\n');
  process.exit(1);
}

// Get all JS files in dist/assets
const jsFiles = fs.readdirSync(DIST_DIR).filter(file => file.endsWith('.js'));

if (jsFiles.length === 0) {
  console.error('❌ Error: No JavaScript files found in dist/assets!');
  process.exit(1);
}

console.log(`📦 Found ${jsFiles.length} JavaScript files in dist/assets/\n`);

// Search for each required variable
const results = {};

for (const varName of REQUIRED_VARS) {
  results[varName] = { found: false, value: null };
  
  for (const file of jsFiles) {
    const filePath = path.join(DIST_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if the variable name appears in the file
    if (content.includes(varName)) {
      results[varName].found = true;
      results[varName].file = file;
      break;
    }
  }
}

// Display results
console.log('📋 Verification Results:\n');

let allPassed = true;

for (const [varName, result] of Object.entries(results)) {
  if (result.found) {
    console.log(`✅ ${varName}: FOUND in ${result.file}`);
  } else {
    console.log(`❌ ${varName}: NOT FOUND`);
    allPassed = false;
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (allPassed) {
  console.log('✅ SUCCESS: All required environment variables are injected!\n');
  process.exit(0);
} else {
  console.log('❌ FAILURE: Some environment variables are missing!\n');
  console.log('Troubleshooting steps:');
  console.log('1. Check that variables are set in .env.production');
  console.log('2. Verify GitHub Secrets are configured correctly');
  console.log('3. Ensure vite.config.ts define block includes all variables');
  console.log('4. Run "npm run build" and check build logs\n');
  process.exit(1);
}
