#!/usr/bin/env node

/**
 * Security Audit Script - Prevents client-side API key exposure
 * Checks for direct imports of sensitive packages in frontend code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Packages that should NEVER be imported in frontend code
const FORBIDDEN_IMPORTS = [
  'resend',
  '@resend/node',
  'nodemailer',
  'stripe', // Only @stripe/stripe-js is allowed
];

// Directories to scan (frontend code only)
const FRONTEND_DIRS = [
  'src/components',
  'src/pages', 
  'src/hooks',
  'src/lib',
  'src/utils',
  'src/contexts',
  'src/emails', // This should use edge functions only
];

// Files/directories to exclude
const EXCLUDED_PATHS = [
  'supabase/functions', // Edge functions are server-side
  'scripts/',
  'tests/',
  'node_modules/',
  '.git/',
];

class SecurityAuditor {
  constructor() {
    this.violations = [];
    this.projectRoot = path.resolve(__dirname, '..');
  }

  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.projectRoot, filePath);
      
      // Skip excluded paths
      if (EXCLUDED_PATHS.some(excluded => relativePath.includes(excluded))) {
        return;
      }

      // Check for forbidden imports
      FORBIDDEN_IMPORTS.forEach(forbiddenPkg => {
        const importPatterns = [
          new RegExp(`import.*from\\s+['"\`]${forbiddenPkg}['"\`]`, 'g'),
          new RegExp(`import\\s+['"\`]${forbiddenPkg}['"\`]`, 'g'),
          new RegExp(`require\\s*\\(\\s*['"\`]${forbiddenPkg}['"\`]\\s*\\)`, 'g'),
        ];

        importPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              const lines = content.substring(0, content.indexOf(match)).split('\n');
              const lineNumber = lines.length;
              
              this.violations.push({
                file: relativePath,
                line: lineNumber,
                violation: match.trim(),
                package: forbiddenPkg,
                severity: 'CRITICAL'
              });
            });
          }
        });
      });

    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
    }
  }

  scanDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          this.scanDirectory(fullPath);
        } else if (item.match(/\.(ts|tsx|js|jsx)$/)) {
          this.scanFile(fullPath);
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dirPath}: ${error.message}`);
    }
  }

  run() {
    console.log('🔒 Running Security Audit for Client-Side API Key Exposure...\n');
    
    FRONTEND_DIRS.forEach(dir => {
      const fullPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(fullPath)) {
        this.scanDirectory(fullPath);
      }
    });

    return this.generateReport();
  }

  generateReport() {
    if (this.violations.length === 0) {
      console.log('✅ Security Audit PASSED');
      console.log('No forbidden API key imports found in frontend code.\n');
      return true;
    }

    console.log('❌ Security Audit FAILED');
    console.log(`Found ${this.violations.length} security violation(s):\n`);

    this.violations.forEach((violation, index) => {
      console.log(`${index + 1}. ${violation.severity} - ${violation.file}:${violation.line}`);
      console.log(`   Package: ${violation.package}`);
      console.log(`   Code: ${violation.violation}`);
      console.log(`   Fix: Use Supabase Edge Functions instead of direct API calls\n`);
    });

    console.log('🛡️  Security Guidelines:');
    console.log('- API keys should NEVER be used in frontend code');
    console.log('- Use Supabase Edge Functions for server-side API calls');
    console.log('- Only @stripe/stripe-js is allowed for Stripe (not "stripe" package)');
    console.log('- Email sending must use edge functions, not direct Resend/Nodemailer\n');

    return false;
  }
}

// Run the audit
const auditor = new SecurityAuditor();
const passed = auditor.run();

// Exit with error code if violations found
process.exit(passed ? 0 : 1);