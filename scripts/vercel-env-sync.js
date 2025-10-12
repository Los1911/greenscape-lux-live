#!/usr/bin/env node

/**
 * Vercel Environment Variable Sync & Validation Script
 * Compares Vercel env vars with .env.example and sends Slack notifications
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

// Parse .env.example
function parseEnvExample() {
  const envPath = path.join(__dirname, '..', '.env.example');
  const content = fs.readFileSync(envPath, 'utf8');
  const vars = [];
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key] = line.split('=');
      if (key) vars.push(key.trim());
    }
  });
  
  return vars;
}

// Send Slack notification
function sendSlackNotification(message, isError = false) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('⚠️  SLACK_WEBHOOK_URL not configured, skipping notification');
    return Promise.resolve();
  }

  const payload = JSON.stringify({
    text: isError ? '🚨 Environment Variable Sync Alert' : '✅ Environment Variable Sync',
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: message }
      }
    ]
  });

  return new Promise((resolve, reject) => {
    const url = new URL(SLACK_WEBHOOK_URL);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve());
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Main validation
async function validateEnvironment() {
  console.log('🔍 Validating Vercel environment variables...\n');
  
  const expectedVars = parseEnvExample();
  const currentVars = Object.keys(process.env);
  
  const missing = expectedVars.filter(v => !currentVars.includes(v));
  const present = expectedVars.filter(v => currentVars.includes(v));
  
  console.log(`✅ Present: ${present.length}/${expectedVars.length}`);
  console.log(`❌ Missing: ${missing.length}/${expectedVars.length}\n`);
  
  if (missing.length > 0) {
    console.error('Missing variables:');
    missing.forEach(v => console.error(`  - ${v}`));
    
    const message = `*Environment Variable Mismatch Detected*\n\n` +
      `Missing ${missing.length} variables:\n` +
      missing.map(v => `• \`${v}\``).join('\n') +
      `\n\n_Configure in Vercel Dashboard → Settings → Environment Variables_`;
    
    await sendSlackNotification(message, true);
    process.exit(1);
  }
  
  await sendSlackNotification('✅ All environment variables are properly configured!');
  console.log('✅ Validation passed!\n');
}

validateEnvironment().catch(err => {
  console.error('❌ Validation failed:', err);
  process.exit(1);
});
