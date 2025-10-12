#!/usr/bin/env node

/**
 * Environment Variables Debug Script
 * Helps diagnose Vite environment variable issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Environment Variables Debug Report\n');

// Check for .env files
const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
const projectRoot = process.cwd();

console.log('📁 Environment Files Check:');
envFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${file}: ${exists ? '✅ Found' : '❌ Missing'}`);
  
  if (exists) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      console.log(`    Variables: ${lines.length}`);
      
      // Check for required Vite variables
      const hasSupabaseUrl = content.includes('VITE_SUPABASE_URL');
      const hasSupabaseKey = content.includes('VITE_SUPABASE_ANON_KEY');
      console.log(`    VITE_SUPABASE_URL: ${hasSupabaseUrl ? '✅' : '❌'}`);
      console.log(`    VITE_SUPABASE_ANON_KEY: ${hasSupabaseKey ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`    Error reading file: ${error.message}`);
    }
  }
});

console.log('\n🔧 Vite Configuration Check:');
const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  console.log('  vite.config.ts: ✅ Found');
  
  try {
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    const hasEnvConfig = viteConfig.includes('envDir') || viteConfig.includes('envPrefix');
    console.log(`  Custom env config: ${hasEnvConfig ? '✅ Present' : '❌ Using defaults'}`);
  } catch (error) {
    console.log(`  Error reading vite config: ${error.message}`);
  }
} else {
  console.log('  vite.config.ts: ❌ Missing');
}

console.log('\n📋 Quick Fixes:');
console.log('1. Create .env.local file:');
console.log('   cp .env.local.template .env.local');
console.log('');
console.log('2. Restart development server:');
console.log('   npm run dev (or yarn dev)');
console.log('');
console.log('3. For Vercel deployment:');
console.log('   vercel env add VITE_SUPABASE_URL');
console.log('   vercel env add VITE_SUPABASE_ANON_KEY');
console.log('');
console.log('4. Verify in browser console:');
console.log('   Look for "Environment Variables Check" logs');

// Check if we're in a Node.js environment and can check process.env
console.log('\n🌍 Current Process Environment:');
const viteVars = Object.keys(process.env).filter(key => key.startsWith('VITE_'));
if (viteVars.length > 0) {
  viteVars.forEach(key => {
    const value = process.env[key];
    console.log(`  ${key}: ${value ? '✅ Set' : '❌ Empty'}`);
  });
} else {
  console.log('  No VITE_ variables found in process.env');
  console.log('  (This is normal for Node.js - Vite handles these in browser)');
}

console.log('\n✨ Debug complete! Follow the quick fixes above if issues found.');