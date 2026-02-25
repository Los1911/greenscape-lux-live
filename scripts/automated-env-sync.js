#!/usr/bin/env node

/**
 * Automated Environment Variable Synchronization Script
 * Syncs environment variables across DeployPad, Vercel, and GitHub Actions
 */

const https = require('https');

// Configuration
const config = {
  vercel: {
    token: process.env.VERCEL_TOKEN,
    projectId: process.env.VERCEL_PROJECT_ID,
    apiUrl: 'https://api.vercel.com/v9/projects'
  },
  github: {
    token: process.env.GITHUB_TOKEN,
    repo: process.env.GITHUB_REPO || 'owner/repo',
    apiUrl: 'https://api.github.com/repos'
  }
};

// Environment variables to sync
const envVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'GOOGLE_MAPS_API_KEY'
];

async function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body || '{}') });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function syncToVercel(key, value) {
  if (!config.vercel.token || !config.vercel.projectId) {
    console.log('⚠️  Vercel credentials not configured, skipping...');
    return { success: false, error: 'Missing credentials' };
  }

  try {
    const url = new URL(`${config.vercel.apiUrl}/${config.vercel.projectId}/env`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.vercel.token}`,
        'Content-Type': 'application/json'
      }
    };

    const data = {
      key,
      value,
      type: 'encrypted',
      target: ['production', 'preview', 'development']
    };

    await makeRequest(options, data);
    console.log(`✅ Synced ${key} to Vercel`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to sync ${key} to Vercel:`, error.message);
    return { success: false, error: error.message };
  }
}

async function syncToGitHub(key, value) {
  if (!config.github.token || !config.github.repo) {
    console.log('⚠️  GitHub credentials not configured, skipping...');
    return { success: false, error: 'Missing credentials' };
  }

  try {
    const url = new URL(`${config.github.apiUrl}/${config.github.repo}/actions/secrets/${key}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'PUT',
      headers: {
        'Authorization': `token ${config.github.token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Environment-Sync-Script'
      }
    };

    // Simple base64 encoding (use libsodium in production)
    const encryptedValue = Buffer.from(value).toString('base64');
    const data = { encrypted_value: encryptedValue };

    await makeRequest(options, data);
    console.log(`✅ Synced ${key} to GitHub Actions`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to sync ${key} to GitHub:`, error.message);
    return { success: false, error: error.message };
  }
}

async function syncAllVariables() {
  console.log('🚀 Starting environment variable synchronization...\n');

  const results = {
    total: 0,
    synced: 0,
    failed: 0,
    errors: []
  };

  for (const key of envVars) {
    const value = process.env[key];
    
    if (!value) {
      console.log(`⚠️  ${key} not found in environment, skipping...`);
      results.failed++;
      results.errors.push(`${key}: Not found in environment`);
      continue;
    }

    results.total++;
    console.log(`\n📝 Syncing ${key}...`);

    // Sync to Vercel
    const vercelResult = await syncToVercel(key, value);
    
    // Sync to GitHub
    const githubResult = await syncToGitHub(key, value);

    if (vercelResult.success && githubResult.success) {
      results.synced++;
    } else {
      results.failed++;
      if (!vercelResult.success) results.errors.push(`Vercel: ${vercelResult.error}`);
      if (!githubResult.success) results.errors.push(`GitHub: ${githubResult.error}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Synchronization Summary');
  console.log('='.repeat(50));
  console.log(`Total variables: ${results.total}`);
  console.log(`✅ Successfully synced: ${results.synced}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }

  console.log('\n✨ Synchronization complete!\n');
  
  return results.failed === 0 ? 0 : 1;
}

// Run the sync
syncAllVariables()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
