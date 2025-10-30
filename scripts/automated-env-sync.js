#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

class AutomatedEnvSync {
  constructor() {
    this.localEnvPath = path.join(process.cwd(), '.env.local');
    this.templatePath = path.join(process.cwd(), '.env.local.template');
    this.platforms = {
      vercel: {
        token: process.env.VERCEL_TOKEN,
        projectId: process.env.VERCEL_PROJECT_ID,
        apiBase: 'api.vercel.com'
      },
      netlify: {
        token: process.env.NETLIFY_TOKEN,
        siteId: process.env.NETLIFY_SITE_ID,
        apiBase: 'api.netlify.com'
      }
    };
    this.slackWebhook = process.env.SLACK_WEBHOOK_URL;
  }

  parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
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

  validateEnvironment(env) {
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'VITE_GOOGLE_MAPS_API_KEY',
      'RESEND_API_KEY'
    ];

    const validation = {
      valid: true,
      missing: [],
      invalid: [],
      warnings: []
    };

    requiredVars.forEach(varName => {
      const value = env[varName];
      
      if (!value || value === 'undefined') {
        validation.missing.push(varName);
        validation.valid = false;
      } else if (value.includes('placeholder') || value.includes('your_')) {
        validation.invalid.push(varName);
        validation.valid = false;
      } else if (varName === 'VITE_STRIPE_PUBLISHABLE_KEY') {
        if (!value.startsWith('pk_live_') && !value.startsWith('pk_test_')) {
          validation.warnings.push(`${varName}: Invalid Stripe key format`);
        } else if (value.startsWith('pk_live_')) {
          validation.warnings.push(`${varName}: Using LIVE Stripe key - ensure production ready`);
        }
      }
    });

    return validation;
  }

  async makeHttpRequest(hostname, path, method = 'GET', headers = {}, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            resolve({ data: parsed, status: res.statusCode, headers: res.headers });
          } catch (e) {
            resolve({ body, status: res.statusCode, headers: res.headers });
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async syncToVercel(envVars) {
    const { token, projectId } = this.platforms.vercel;
    
    if (!token || !projectId) {
      throw new Error('Missing VERCEL_TOKEN or VERCEL_PROJECT_ID');
    }

    console.log('📤 Syncing to Vercel...');
    const results = { success: [], failed: [] };

    for (const [key, value] of Object.entries(envVars)) {
      try {
        const response = await this.makeHttpRequest(
          'api.vercel.com',
          `/v10/projects/${projectId}/env`,
          'POST',
          { 'Authorization': `Bearer ${token}` },
          {
            key,
            value,
            type: 'encrypted',
            target: ['production', 'preview']
          }
        );

        if (response.status === 200 || response.status === 201) {
          results.success.push(key);
          console.log(`  ✅ ${key}`);
        } else {
          results.failed.push({ key, error: `HTTP ${response.status}` });
          console.log(`  ❌ ${key}: HTTP ${response.status}`);
        }
      } catch (error) {
        results.failed.push({ key, error: error.message });
        console.log(`  ❌ ${key}: ${error.message}`);
      }
    }

    return results;
  }

  async syncToNetlify(envVars) {
    const { token, siteId } = this.platforms.netlify;
    
    if (!token || !siteId) {
      throw new Error('Missing NETLIFY_TOKEN or NETLIFY_SITE_ID');
    }

    console.log('📤 Syncing to Netlify...');

    try {
      const response = await this.makeHttpRequest(
        'api.netlify.com',
        `/api/v1/sites/${siteId}`,
        'PATCH',
        { 'Authorization': `Bearer ${token}` },
        {
          build_settings: {
            env: envVars
          }
        }
      );

      if (response.status === 200) {
        console.log(`  ✅ Synced ${Object.keys(envVars).length} variables`);
        return { success: Object.keys(envVars), failed: [] };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ Netlify sync failed: ${error.message}`);
      return { success: [], failed: [{ platform: 'netlify', error: error.message }] };
    }
  }

  async sendSlackNotification(type, data) {
    if (!this.slackWebhook) return;

    let message = '';
    switch (type) {
      case 'sync_success':
        message = `✅ Environment sync completed successfully!\n` +
                 `Platforms: ${data.platforms.join(', ')}\n` +
                 `Variables synced: ${data.totalSynced}`;
        break;
      case 'sync_failed':
        message = `🚨 Environment sync failed!\n` +
                 `Platform: ${data.platform}\n` +
                 `Errors: ${data.errors.join(', ')}`;
        break;
      case 'validation_failed':
        message = `⚠️ Environment validation failed!\n` +
                 `Missing: ${data.missing.join(', ')}\n` +
                 `Invalid: ${data.invalid.join(', ')}`;
        break;
    }

    try {
      await this.makeHttpRequest(
        new URL(this.slackWebhook).hostname,
        new URL(this.slackWebhook).pathname,
        'POST',
        {},
        { text: message }
      );
    } catch (error) {
      console.error('Failed to send Slack notification:', error.message);
    }
  }

  async performFullSync() {
    console.log('🔄 Starting automated environment sync...\n');

    // Load and validate local environment
    const localEnv = this.parseEnvFile(this.localEnvPath);
    const validation = this.validateEnvironment(localEnv);

    if (!validation.valid) {
      console.error('❌ Environment validation failed:');
      if (validation.missing.length > 0) {
        console.error(`  Missing: ${validation.missing.join(', ')}`);
      }
      if (validation.invalid.length > 0) {
        console.error(`  Invalid: ${validation.invalid.join(', ')}`);
      }
      
      await this.sendSlackNotification('validation_failed', validation);
      process.exit(1);
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️  Warnings:');
      validation.warnings.forEach(warning => console.warn(`  ${warning}`));
    }

    console.log(`✅ Environment validation passed (${Object.keys(localEnv).length} variables)\n`);

    // Sync to platforms
    const syncResults = [];
    const enabledPlatforms = [];

    // Sync to Vercel if configured
    if (this.platforms.vercel.token && this.platforms.vercel.projectId) {
      enabledPlatforms.push('vercel');
      try {
        const result = await this.syncToVercel(localEnv);
        syncResults.push({ platform: 'vercel', ...result });
      } catch (error) {
        console.error(`❌ Vercel sync failed: ${error.message}`);
        await this.sendSlackNotification('sync_failed', {
          platform: 'vercel',
          errors: [error.message]
        });
      }
    }

    // Sync to Netlify if configured
    if (this.platforms.netlify.token && this.platforms.netlify.siteId) {
      enabledPlatforms.push('netlify');
      try {
        const result = await this.syncToNetlify(localEnv);
        syncResults.push({ platform: 'netlify', ...result });
      } catch (error) {
        console.error(`❌ Netlify sync failed: ${error.message}`);
        await this.sendSlackNotification('sync_failed', {
          platform: 'netlify',
          errors: [error.message]
        });
      }
    }

    // Summary
    const totalSynced = syncResults.reduce((sum, result) => sum + result.success.length, 0);
    const totalFailed = syncResults.reduce((sum, result) => sum + result.failed.length, 0);

    console.log('\n📊 Sync Summary:');
    console.log(`  Platforms: ${enabledPlatforms.join(', ')}`);
    console.log(`  Variables synced: ${totalSynced}`);
    console.log(`  Failures: ${totalFailed}`);

    if (totalFailed === 0) {
      console.log('\n✅ All syncs completed successfully!');
      await this.sendSlackNotification('sync_success', {
        platforms: enabledPlatforms,
        totalSynced
      });
    } else {
      console.log('\n⚠️  Some syncs failed. Check logs above.');
      process.exit(1);
    }
  }

  async validateOnly() {
    console.log('🔍 Validating environment configuration...\n');

    const localEnv = this.parseEnvFile(this.localEnvPath);
    const validation = this.validateEnvironment(localEnv);

    console.log('📊 Validation Report:');
    console.log(`  Total variables: ${Object.keys(localEnv).length}`);
    console.log(`  Valid: ${validation.valid ? 'Yes' : 'No'}`);

    if (validation.missing.length > 0) {
      console.log(`  Missing (${validation.missing.length}): ${validation.missing.join(', ')}`);
    }

    if (validation.invalid.length > 0) {
      console.log(`  Invalid (${validation.invalid.length}): ${validation.invalid.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      console.log(`  Warnings (${validation.warnings.length}):`);
      validation.warnings.forEach(warning => console.log(`    ${warning}`));
    }

    console.log(`\n${validation.valid ? '✅' : '❌'} Environment ${validation.valid ? 'is valid' : 'needs attention'}`);

    return validation.valid;
  }
}

// CLI Interface
const command = process.argv[2];
const sync = new AutomatedEnvSync();

async function main() {
  try {
    switch (command) {
      case 'validate':
        const isValid = await sync.validateOnly();
        process.exit(isValid ? 0 : 1);
        break;
      case 'sync':
        await sync.performFullSync();
        break;
      default:
        console.log(`
🔧 Automated Environment Sync Tool

Usage:
  node scripts/automated-env-sync.js validate  - Validate environment configuration
  node scripts/automated-env-sync.js sync      - Perform full sync to all platforms

Required environment variables:
  VERCEL_TOKEN       - Your Vercel API token (optional)
  VERCEL_PROJECT_ID  - Your Vercel project ID (optional)
  NETLIFY_TOKEN      - Your Netlify API token (optional)
  NETLIFY_SITE_ID    - Your Netlify site ID (optional)
  SLACK_WEBHOOK_URL  - Slack webhook for notifications (optional)

At least one platform must be configured for sync to work.
`);
        break;
    }
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

main();