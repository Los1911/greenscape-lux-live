#!/usr/bin/env node

/**
 * GitHub Environment Variable Loader for Production Builds
 * Loads .env.production and injects VITE_ variables into the build process
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const ENV_FILE = resolve(process.cwd(), '.env.production');

console.log('🔧 GitHub Environment Loader');
console.log('================================\n');

// Check if .env.production exists
if (!existsSync(ENV_FILE)) {
  console.error('❌ .env.production not found!');
  console.error('   Create this file with your production environment variables.');
  process.exit(1);
}

// Load .env.production
const envContent = readFileSync(ENV_FILE, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');
    if (key && value && key.startsWith('VITE_')) {
      envVars[key] = value;
    }
  }
});

console.log('✅ Loaded environment variables:');
Object.keys(envVars).forEach(key => {
  const value = envVars[key];
  const preview = value.length > 30 ? value.substring(0, 30) + '...' : value;
  console.log(`   ${key}: ${preview}`);
});

console.log('\n🏗️  Building with production environment...\n');

// Build with environment variables
const envString = Object.entries(envVars)
  .map(([key, value]) => `${key}=${value}`)
  .join(' ');

try {
  execSync(`${envString} npm run build`, { 
    stdio: 'inherit',
    env: { ...process.env, ...envVars }
  });
  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.error('\n❌ Build failed!');
  process.exit(1);
}
