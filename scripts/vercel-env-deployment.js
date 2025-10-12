#!/usr/bin/env node

/**
 * Vercel Environment Variable Deployment Script
 * Syncs GitHub Secrets to Vercel Environment Variables
 */

const https = require('https');

const VERCEL_API_BASE = 'https://api.vercel.com';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

// Environment variables to sync
const ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY', 
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_GOOGLE_MAPS_API_KEY'
];

async function makeVercelRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
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

async function syncEnvironmentVariable(key, value, target = 'production') {
  console.log(`🔄 Syncing ${key} to Vercel...`);
  
  try {
    const response = await makeVercelRequest(
      `/v10/projects/${VERCEL_PROJECT_ID}/env`,
      'POST',
      {
        key: key,
        value: value,
        target: [target],
        type: 'encrypted'
      }
    );

    if (response.status === 200 || response.status === 201) {
      console.log(`✅ Successfully synced ${key}`);
    } else if (response.status === 409) {
      console.log(`⚠️  ${key} already exists, updating...`);
      await updateEnvironmentVariable(key, value, target);
    } else {
      console.error(`❌ Failed to sync ${key}:`, response.data);
    }
  } catch (error) {
    console.error(`❌ Error syncing ${key}:`, error.message);
  }
}

async function updateEnvironmentVariable(key, value, target = 'production') {
  try {
    // Get existing env var ID
    const listResponse = await makeVercelRequest(`/v10/projects/${VERCEL_PROJECT_ID}/env`);
    
    if (listResponse.status !== 200) {
      throw new Error(`Failed to list environment variables: ${listResponse.data}`);
    }

    const existingVar = listResponse.data.envs?.find(env => env.key === key);
    
    if (!existingVar) {
      console.log(`⚠️  ${key} not found for update, creating new...`);
      return await syncEnvironmentVariable(key, value, target);
    }

    const updateResponse = await makeVercelRequest(
      `/v9/projects/${VERCEL_PROJECT_ID}/env/${existingVar.id}`,
      'PATCH',
      {
        value: value,
        target: [target]
      }
    );

    if (updateResponse.status === 200) {
      console.log(`✅ Successfully updated ${key}`);
    } else {
      console.error(`❌ Failed to update ${key}:`, updateResponse.data);
    }
  } catch (error) {
    console.error(`❌ Error updating ${key}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting Vercel Environment Variable Sync...');
  
  if (!VERCEL_TOKEN) {
    console.error('❌ VERCEL_TOKEN is required');
    process.exit(1);
  }
  
  if (!VERCEL_PROJECT_ID) {
    console.error('❌ VERCEL_PROJECT_ID is required');
    process.exit(1);
  }

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar];
    
    if (!value) {
      console.warn(`⚠️  ${envVar} not found in environment, skipping...`);
      continue;
    }
    
    await syncEnvironmentVariable(envVar, value);
  }
  
  console.log('✅ Environment variable sync completed!');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  });
}

module.exports = { syncEnvironmentVariable, updateEnvironmentVariable };