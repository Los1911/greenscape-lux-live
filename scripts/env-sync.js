#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

class VercelEnvSync {
  constructor() {
    this.localEnvPath = path.join(process.cwd(), '.env.local');
    this.templatePath = path.join(process.cwd(), '.env.local.template');
    this.vercelToken = process.env.VERCEL_TOKEN;
    this.projectId = process.env.VERCEL_PROJECT_ID;
    
    if (!this.vercelToken) {
      console.error('❌ VERCEL_TOKEN environment variable required');
      process.exit(1);
    }
    
    if (!this.projectId) {
      console.error('❌ VERCEL_PROJECT_ID environment variable required');
      process.exit(1);
    }
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

  async makeVercelRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.vercel.com',
        path: endpoint,
        method,
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve(parsed);
          } catch (e) {
            resolve({ body, status: res.statusCode });
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

  async getVercelEnvVars() {
    try {
      const response = await this.makeVercelRequest(`/v9/projects/${this.projectId}/env`);
      
      if (response.envs) {
        const env = {};
        response.envs.forEach(envVar => {
          env[envVar.key] = envVar.value;
        });
        return env;
      }
      
      throw new Error('Failed to fetch Vercel environment variables');
    } catch (error) {
      console.error('❌ Error fetching Vercel env vars:', error.message);
      return {};
    }
  }

  async setVercelEnvVar(key, value, target = 'production') {
    try {
      const data = {
        key,
        value,
        type: 'encrypted',
        target: [target]
      };
      
      const response = await this.makeVercelRequest(
        `/v10/projects/${this.projectId}/env`,
        'POST',
        data
      );
      
      return response.uid ? true : false;
    } catch (error) {
      console.error(`❌ Error setting ${key}:`, error.message);
      return false;
    }
  }

  compareEnvironments(local, vercel) {
    const comparison = {
      missing_in_vercel: [],
      missing_in_local: [],
      mismatched: [],
      matched: []
    };

    // Check for keys in local but not in Vercel
    Object.keys(local).forEach(key => {
      if (!(key in vercel)) {
        comparison.missing_in_vercel.push(key);
      } else if (local[key] !== vercel[key]) {
        comparison.mismatched.push({
          key,
          local: local[key],
          vercel: vercel[key]
        });
      } else {
        comparison.matched.push(key);
      }
    });

    // Check for keys in Vercel but not in local
    Object.keys(vercel).forEach(key => {
      if (!(key in local)) {
        comparison.missing_in_local.push(key);
      }
    });

    return comparison;
  }

  async sync(direction = 'local-to-vercel') {
    console.log('🔄 Starting environment sync...\n');
    
    const localEnv = this.parseEnvFile(this.localEnvPath);
    const vercelEnv = await this.getVercelEnvVars();
    
    console.log(`📁 Local env vars: ${Object.keys(localEnv).length}`);
    console.log(`☁️  Vercel env vars: ${Object.keys(vercelEnv).length}\n`);
    
    const comparison = this.compareEnvironments(localEnv, vercelEnv);
    
    if (direction === 'local-to-vercel') {
      console.log('📤 Syncing from local to Vercel...\n');
      
      for (const key of comparison.missing_in_vercel) {
        console.log(`➕ Adding ${key} to Vercel...`);
        await this.setVercelEnvVar(key, localEnv[key]);
      }
      
      for (const mismatch of comparison.mismatched) {
        console.log(`🔄 Updating ${mismatch.key} in Vercel...`);
        await this.setVercelEnvVar(mismatch.key, localEnv[mismatch.key]);
      }
    }
    
    console.log('\n✅ Sync complete!');
    return comparison;
  }

  async validate() {
    console.log('🔍 Validating environment configuration...\n');
    
    const localEnv = this.parseEnvFile(this.localEnvPath);
    const vercelEnv = await this.getVercelEnvVars();
    const comparison = this.compareEnvironments(localEnv, vercelEnv);
    
    console.log('📊 Environment Comparison Report:\n');
    
    if (comparison.matched.length > 0) {
      console.log(`✅ Matched keys (${comparison.matched.length}):`);
      comparison.matched.forEach(key => console.log(`   ${key}`));
      console.log();
    }
    
    if (comparison.missing_in_vercel.length > 0) {
      console.log(`❌ Missing in Vercel (${comparison.missing_in_vercel.length}):`);
      comparison.missing_in_vercel.forEach(key => console.log(`   ${key}`));
      console.log();
    }
    
    if (comparison.missing_in_local.length > 0) {
      console.log(`⚠️  Missing in local (${comparison.missing_in_local.length}):`);
      comparison.missing_in_local.forEach(key => console.log(`   ${key}`));
      console.log();
    }
    
    if (comparison.mismatched.length > 0) {
      console.log(`🔄 Mismatched values (${comparison.mismatched.length}):`);
      comparison.mismatched.forEach(({ key, local, vercel }) => {
        console.log(`   ${key}:`);
        console.log(`     Local:  ${local.substring(0, 50)}${local.length > 50 ? '...' : ''}`);
        console.log(`     Vercel: ${vercel.substring(0, 50)}${vercel.length > 50 ? '...' : ''}`);
      });
      console.log();
    }
    
    const isValid = comparison.missing_in_vercel.length === 0 && 
                   comparison.mismatched.length === 0;
    
    console.log(isValid ? '✅ Environments are in sync!' : '❌ Environments need synchronization');
    
    return { comparison, isValid };
  }
}

// CLI Interface
const command = process.argv[2];
const sync = new VercelEnvSync();

switch (command) {
  case 'validate':
    sync.validate();
    break;
  case 'sync':
    sync.sync('local-to-vercel');
    break;
  case 'sync-from-vercel':
    sync.sync('vercel-to-local');
    break;
  default:
    console.log(`
🔧 Environment Sync Tool

Usage:
  node scripts/env-sync.js validate           - Compare local and Vercel environments
  node scripts/env-sync.js sync              - Sync from local to Vercel
  node scripts/env-sync.js sync-from-vercel  - Sync from Vercel to local

Required environment variables:
  VERCEL_TOKEN      - Your Vercel API token
  VERCEL_PROJECT_ID - Your Vercel project ID
`);
}