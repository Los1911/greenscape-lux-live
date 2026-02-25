#!/usr/bin/env node

/**
 * GreenScape Lux - Environment Security Validator
 * 
 * Prevents Stripe key exposures in source code and workflows
 * Run during build to fail if any sensitive keys are found
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🔒 [ENV_SECURITY] Starting security validation...\n');

const SENSITIVE_PATTERNS = [
  { pattern: /pk_live_[a-zA-Z0-9]{99,}/g, name: 'Stripe Live Publishable Key' },
  { pattern: /sk_live_[a-zA-Z0-9]{99,}/g, name: 'Stripe Live Secret Key' },
  { pattern: /pk_test_[a-zA-Z0-9]{99,}/g, name: 'Stripe Test Publishable Key' },
  { pattern: /sk_test_[a-zA-Z0-9]{99,}/g, name: 'Stripe Test Secret Key' }
];

const SCAN_DIRECTORIES = ['src', '.github/workflows'];
const EXCLUDE_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.md', // Exclude all markdown documentation files
  'GREENSCAPE_LUX_SECURITY_AUDIT_REPORT.md',
  'STRIPE_SETUP_INSTRUCTIONS.md'
];


let violations = [];

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    SENSITIVE_PATTERNS.forEach(({ pattern, name }) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          violations.push({
            file: filePath,
            type: name,
            preview: `${match.substring(0, 20)}...`
          });
        });
      }
    });
  } catch (err) {
    // Skip files that can't be read
  }
}

function scanDirectory(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      
      // Skip excluded patterns
      if (EXCLUDE_PATTERNS.some(pattern => fullPath.includes(pattern))) {
        return;
      }
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile()) {
        // Only scan code files
        if (/\.(ts|tsx|js|jsx|yml|yaml|json|env)$/.test(entry.name)) {
          scanFile(fullPath);
        }
      }
    });
  } catch (err) {
    console.error(`❌ Error scanning ${dir}:`, err.message);
  }
}

// Run scans
SCAN_DIRECTORIES.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`🔍 Scanning ${dir}/...`);
    scanDirectory(dir);
  }
});

// Report results
console.log('\n📊 [ENV_SECURITY] Scan Results:\n');

if (violations.length === 0) {
  console.log('✅ No sensitive keys found in source code');
  console.log('✅ Security validation passed\n');
  process.exit(0);
} else {
  console.error('❌ SECURITY VIOLATION: Exposed sensitive keys detected!\n');
  
  violations.forEach(({ file, type, preview }) => {
    console.error(`   File: ${file}`);
    console.error(`   Type: ${type}`);
    console.error(`   Preview: ${preview}`);
    console.error('');
  });
  
  console.error('🚨 BUILD FAILED: Remove all exposed keys before deployment\n');
  console.error('💡 Use environment variables instead:');
  console.error('   - VITE_STRIPE_PUBLISHABLE_KEY (frontend)');
  console.error('   - STRIPE_SECRET_KEY (backend/Supabase)\n');
  
  process.exit(1);
}
