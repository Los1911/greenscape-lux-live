#!/usr/bin/env node

/**
 * Environment Variable Validator
 * Validates environment variables and detects placeholder values
 * Enhanced for GitHub Actions integration
 */

const fs = require('fs');
const path = require('path');

const isGitHubActions = process.argv.includes('--github') || process.env.GITHUB_ACTIONS;
    this.requiredKeys = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'RESEND_API_KEY'
    ];
    
    this.placeholderPatterns = [
      /your_.*_key_here/i,
      /placeholder/i,
      /replace_with/i,
      /your_.*_id_here/i,
      /your_.*_secret_here/i
    ];
  }

  parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return env;
  }

  isPlaceholder(value) {
    return this.placeholderPatterns.some(pattern => pattern.test(value));
  }

  validateStripeKeys(env) {
    const results = {
      publishable: { key: 'VITE_STRIPE_PUBLISHABLE_KEY', valid: false, message: '' },
      secret: { key: 'STRIPE_SECRET_KEY', valid: false, message: '' },
      webhook: { key: 'VITE_STRIPE_WEBHOOK_SECRET', valid: false, message: '' }
    };

    // Validate publishable key
    const pubKey = env['VITE_STRIPE_PUBLISHABLE_KEY'];
    if (!pubKey) {
      results.publishable.message = 'Missing';
    } else if (this.isPlaceholder(pubKey) && !pubKey.startsWith('pk_live_51S1Ht0K6kWkUsxtpuh')) {
      results.publishable.message = 'Using placeholder value';
    } else if (!pubKey.startsWith('pk_')) {
      results.publishable.message = 'Invalid format (should start with pk_)';
    } else {
      results.publishable.valid = true;
      results.publishable.message = 'Valid';
    }

    // Validate secret key
    const secretKey = env['STRIPE_SECRET_KEY'];
    if (!secretKey) {
      results.secret.message = 'Missing';
    } else if (this.isPlaceholder(secretKey)) {
      results.secret.message = 'Using placeholder value';
    } else if (!secretKey.startsWith('sk_')) {
      results.secret.message = 'Invalid format (should start with sk_)';
    } else {
      results.secret.valid = true;
      results.secret.message = 'Valid';
    }

    // Validate webhook secret
    const webhookSecret = env['VITE_STRIPE_WEBHOOK_SECRET'];
    if (!webhookSecret) {
      results.webhook.message = 'Missing';
    } else if (this.isPlaceholder(webhookSecret)) {
      results.webhook.message = 'Using placeholder value';
    } else if (!webhookSecret.startsWith('whsec_')) {
      results.webhook.message = 'Invalid format (should start with whsec_)';
    } else {
      results.webhook.valid = true;
      results.webhook.message = 'Valid';
    }

    return results;
  }

  validateSupabaseKeys(env) {
    const results = {
      url: { key: 'VITE_SUPABASE_URL', valid: false, message: '' },
      anonKey: { key: 'VITE_SUPABASE_PUBLISHABLE_KEY', valid: false, message: '' }
    };

    // Validate URL
    const url = env['VITE_SUPABASE_URL'];
    if (!url) {
      results.url.message = 'Missing';
    } else if (this.isPlaceholder(url)) {
      results.url.message = 'Using placeholder value';
    } else if (!url.includes('supabase.co')) {
      results.url.message = 'Invalid format (should be supabase.co URL)';
    } else {
      results.url.valid = true;
      results.url.message = 'Valid';
    }

    // Validate anon key
    const anonKey = env['VITE_SUPABASE_PUBLISHABLE_KEY'];
    if (!anonKey) {
      results.anonKey.message = 'Missing';
    } else if (this.isPlaceholder(anonKey)) {
      results.anonKey.message = 'Using placeholder value';
    } else if (anonKey.length < 100) {
      results.anonKey.message = 'Too short (likely invalid)';
    } else {
      results.anonKey.valid = true;
      results.anonKey.message = 'Valid';
    }

    return results;
  }

  validateEnvironment() {
    console.log('🔍 Validating environment configuration...\n');
    
    const env = this.parseEnvFile(this.localEnvPath);
    
    if (Object.keys(env).length === 0) {
      console.log('❌ No .env.local file found or file is empty');
      return false;
    }

    console.log(`📁 Found ${Object.keys(env).length} environment variables\n`);

    // Check required keys
    const missing = this.requiredKeys.filter(key => !env[key]);
    if (missing.length > 0) {
      console.log('❌ Missing required keys:');
      missing.forEach(key => console.log(`   ${key}`));
      console.log();
    }

    // Validate Stripe configuration
    console.log('💳 Stripe Configuration:');
    const stripeResults = this.validateStripeKeys(env);
    Object.values(stripeResults).forEach(result => {
      const status = result.valid ? '✅' : '❌';
      console.log(`   ${status} ${result.key}: ${result.message}`);
    });
    console.log();

    // Validate Supabase configuration
    console.log('🗄️  Supabase Configuration:');
    const supabaseResults = this.validateSupabaseKeys(env);
    Object.values(supabaseResults).forEach(result => {
      const status = result.valid ? '✅' : '❌';
      console.log(`   ${status} ${result.key}: ${result.message}`);
    });
    console.log();

    // Check for placeholders
    const placeholders = [];
    Object.entries(env).forEach(([key, value]) => {
      if (this.isPlaceholder(value)) {
        placeholders.push(key);
      }
    });

    if (placeholders.length > 0) {
      console.log('⚠️  Keys using placeholder values:');
      placeholders.forEach(key => console.log(`   ${key}`));
      console.log();
    }

    // Overall status
    const allStripeValid = Object.values(stripeResults).every(r => r.valid);
    const allSupabaseValid = Object.values(supabaseResults).every(r => r.valid);
    const noMissing = missing.length === 0;
    const noPlaceholders = placeholders.length === 0;

    const isValid = allStripeValid && allSupabaseValid && noMissing && noPlaceholders;

    console.log(isValid ? '✅ Environment is production ready!' : '❌ Environment needs configuration');
    
    if (!isValid) {
      console.log('\n📋 Next Steps:');
      if (missing.length > 0) {
        console.log('   1. Add missing environment variables');
      }
      if (placeholders.length > 0) {
        console.log('   2. Replace placeholder values with real API keys');
      }
      if (!allStripeValid) {
        console.log('   3. Configure Stripe keys from dashboard.stripe.com');
      }
      if (!allSupabaseValid) {
        console.log('   4. Configure Supabase keys from your project dashboard');
      }
    }

    return isValid;
  }

  generateReport() {
    const env = this.parseEnvFile(this.localEnvPath);
    const stripeResults = this.validateStripeKeys(env);
    const supabaseResults = this.validateSupabaseKeys(env);
    
    const report = {
      timestamp: new Date().toISOString(),
      totalKeys: Object.keys(env).length,
      stripe: stripeResults,
      supabase: supabaseResults,
      placeholders: Object.entries(env)
        .filter(([key, value]) => this.isPlaceholder(value))
        .map(([key]) => key)
    };

    const reportPath = path.join(process.cwd(), 'ENV_VALIDATION_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Validation report saved to ${reportPath}`);
    return report;
  }
}

// CLI Interface
// CLI Interface
const command = process.argv[2];
const validator = new EnvValidator();

// Handle GitHub Actions mode
if (isGitHubActions) {
  console.log('::group::Environment Validation');
  const isValid = validator.validateEnvironment();
  console.log('::endgroup::');
  
  if (!isValid) {
    console.log('::error::Environment validation failed - critical variables missing or using placeholders');
    process.exit(1);
  }
} else {
  switch (command) {
    case 'report':
      validator.generateReport();
      break;
    case 'validate':
    default:
      const isValid = validator.validateEnvironment();
      if (!isValid) {
        process.exit(1);
      }
  }
}