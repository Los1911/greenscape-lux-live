#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

class EnvSyncAutomation {
  constructor() {
    this.requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY', 
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'VITE_GOOGLE_MAPS_API_KEY'
    ];
  }

  async validateAndSync() {
    console.log('🔄 Starting environment sync automation...\n');
    
    const localEnv = this.parseEnvFile('.env.local');
    const validation = this.validateEnv(localEnv);
    
    if (!validation.valid) {
      console.error('❌ Validation failed:', validation.errors);
      await this.sendAlert('validation_failed', validation);
      return false;
    }

    // Sync to Vercel
    if (process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID) {
      await this.syncToVercel(localEnv);
    }

    console.log('✅ Environment sync completed successfully!');
    return true;
  }

  parseEnvFile(path) {
    if (!fs.existsSync(path)) return {};
    
    const content = fs.readFileSync(path, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const [key, ...value] = line.split('=');
      if (key && value.length) {
        env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
    
    return env;
  }

  validateEnv(env) {
    const missing = [];
    const invalid = [];
    
    this.requiredVars.forEach(key => {
      if (!env[key]) {
        missing.push(key);
      } else if (key === 'VITE_STRIPE_PUBLISHABLE_KEY' && !env[key].startsWith('pk_')) {
        invalid.push(`${key}: Invalid format`);
      }
    });
    
    return {
      valid: missing.length === 0 && invalid.length === 0,
      errors: [...missing, ...invalid]
    };
  }

  async syncToVercel(env) {
    const token = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;
    
    console.log('📤 Syncing to Vercel...');
    
    for (const [key, value] of Object.entries(env)) {
      if (this.requiredVars.includes(key)) {
        await this.setVercelEnv(token, projectId, key, value);
      }
    }
  }

  async setVercelEnv(token, projectId, key, value) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        key,
        value,
        type: 'encrypted',
        target: ['production', 'preview']
      });

      const options = {
        hostname: 'api.vercel.com',
        path: `/v10/projects/${projectId}/env`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        console.log(`  ${res.statusCode === 200 ? '✅' : '❌'} ${key}`);
        resolve();
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  async sendAlert(type, data) {
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook) return;

    let message = '';
    if (type === 'validation_failed') {
      message = `🚨 Environment validation failed!\nErrors: ${data.errors.join(', ')}`;
    }

    const url = new URL(webhook);
    const postData = JSON.stringify({ text: message });

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    return new Promise((resolve) => {
      const req = https.request(options, () => resolve());
      req.on('error', () => resolve());
      req.write(postData);
      req.end();
    });
  }
}

// CLI
const automation = new EnvSyncAutomation();
automation.validateAndSync().catch(console.error);