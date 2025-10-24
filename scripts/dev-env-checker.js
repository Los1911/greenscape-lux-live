#!/usr/bin/env node

/**
 * Development Environment Checker
 * Warns developers about missing or misconfigured environment variables
 * Runs during development to help catch issues early
 */

const fs = require('fs');
const path = require('path');
const { EnvValidator, REQUIRED_ENV_VARS } = require('./build-time-env-validator');

class DevEnvChecker extends EnvValidator {
  constructor() {
    super();
    this.suggestions = [];
  }

  checkEnvFile() {
    const envPath = path.join(process.cwd(), '.env.local');
    const templatePath = path.join(process.cwd(), '.env.local.template');

    if (!fs.existsSync(envPath)) {
      this.warnings.push({
        type: 'MISSING_ENV_FILE',
        message: '⚠️  .env.local file not found',
        description: 'Create .env.local for local development'
      });

      if (fs.existsSync(templatePath)) {
        this.suggestions.push({
          type: 'COPY_TEMPLATE',
          message: '💡 Copy .env.local.template to .env.local to get started',
          command: 'cp .env.local.template .env.local'
        });
      }
      return false;
    }

    return true;
  }

  checkGitIgnore() {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      
      if (!gitignoreContent.includes('.env.local')) {
        this.warnings.push({
          type: 'ENV_NOT_GITIGNORED',
          message: '⚠️  .env.local should be in .gitignore',
          description: 'Prevent committing sensitive environment variables'
        });
        
        this.suggestions.push({
          type: 'ADD_TO_GITIGNORE',
          message: '💡 Add .env.local to .gitignore',
          command: 'echo ".env.local" >> .gitignore'
        });
      }
    }
  }

  checkEnvironmentSync() {
    const templatePath = path.join(process.cwd(), '.env.local.template');
    const envPath = path.join(process.cwd(), '.env.local');

    if (fs.existsSync(templatePath) && fs.existsSync(envPath)) {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const envContent = fs.readFileSync(envPath, 'utf8');

      // Extract variable names from template
      const templateVars = templateContent
        .split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => line.split('=')[0].trim());

      // Extract variable names from .env.local
      const envVars = envContent
        .split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => line.split('=')[0].trim());

      // Find missing variables
      const missingVars = templateVars.filter(v => !envVars.includes(v));
      
      if (missingVars.length > 0) {
        this.warnings.push({
          type: 'MISSING_TEMPLATE_VARS',
          message: `⚠️  Missing variables from template: ${missingVars.join(', ')}`,
          description: 'Your .env.local may be outdated'
        });

        this.suggestions.push({
          type: 'SYNC_TEMPLATE',
          message: '💡 Compare and sync your .env.local with .env.local.template',
          command: 'diff .env.local .env.local.template'
        });
      }
    }
  }

  checkDevelopmentSpecific() {
    // Check for development-specific configurations
    const nodeEnv = process.env.NODE_ENV;
    const viteAppEnv = process.env.VITE_APP_ENV;

    if (!nodeEnv || nodeEnv !== 'development') {
      this.suggestions.push({
        type: 'SET_NODE_ENV',
        message: '💡 Set NODE_ENV=development for local development',
        command: 'export NODE_ENV=development'
      });
    }

    if (viteAppEnv && viteAppEnv === 'production') {
      this.warnings.push({
        type: 'PRODUCTION_ENV_IN_DEV',
        message: '⚠️  VITE_APP_ENV is set to production in development',
        description: 'This might cause unexpected behavior'
      });
    }

    // Check for test keys in development
    const stripeKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (stripeKey && stripeKey.startsWith('pk_live_')) {
      this.warnings.push({
        type: 'LIVE_KEY_IN_DEV',
        message: '⚠️  Using live Stripe key in development',
        description: 'Consider using test keys for development'
      });
    }
  }

  runDevelopmentCheck() {
    console.log('🔍 Running development environment check...\n');

    // Check basic file structure
    this.checkEnvFile();
    this.checkGitIgnore();
    this.checkEnvironmentSync();
    this.checkDevelopmentSpecific();

    // Run standard validation
    const isValid = this.validateAll();

    // Print development-specific feedback
    this.printDevelopmentFeedback();

    return isValid && this.warnings.length === 0;
  }

  printDevelopmentFeedback() {
    if (this.warnings.length > 0) {
      console.log('\n⚠️  DEVELOPMENT WARNINGS:\n');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.message}`);
        if (warning.description) {
          console.log(`   ${warning.description}`);
        }
        console.log('');
      });
    }

    if (this.suggestions.length > 0) {
      console.log('\n💡 SUGGESTIONS:\n');
      this.suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion.message}`);
        if (suggestion.command) {
          console.log(`   Command: ${suggestion.command}`);
        }
        console.log('');
      });
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ Development environment looks good!\n');
    } else if (this.errors.length === 0) {
      console.log('\n✅ No critical issues found. Address warnings when convenient.\n');
    }
  }
}

// Main execution for development check
function main() {
  const checker = new DevEnvChecker();
  const isHealthy = checker.runDevelopmentCheck();

  // Don't exit with error in development - just warn
  if (!isHealthy && checker.errors.length > 0) {
    console.log('⚠️  Some environment variables need attention for full functionality.\n');
    checker.printFixInstructions();
  }

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { DevEnvChecker };