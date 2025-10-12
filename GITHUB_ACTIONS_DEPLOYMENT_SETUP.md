# GitHub Actions Deployment Automation Setup Guide

## Overview
This guide sets up automated Vercel deployment with environment variable synchronization and Slack notifications on every push to the main branch.

## Required GitHub Secrets

### Vercel Configuration
```bash
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_vercel_org_id_here
VERCEL_PROJECT_ID=your_vercel_project_id_here
```

### Environment Variables (Production Values)
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (Live Keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_WYzlz4lNprcuStBwYV2BbIhOiiq0pj8n

# Additional Services
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_SITE_URL=https://your-domain.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/your/webhook/url
```

## Setup Instructions

### 1. Get Vercel Credentials
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Get your organization and project IDs
vercel project ls
```

### 2. Create Vercel Token
1. Go to Vercel Dashboard → Settings → Tokens
2. Create new token with full access
3. Copy token for GitHub secrets

### 3. Add GitHub Secrets
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add all required secrets listed above
3. Ensure all values are production-ready

### 4. Configure Slack Webhook
1. Create Slack app or use existing webhook
2. Add webhook URL to GitHub secrets
3. Test webhook functionality

## Workflow Features

### Environment Validation
- Validates all required environment variables
- Runs custom validation scripts
- Fails deployment if validation errors occur

### Automatic Environment Sync
- Syncs all environment variables to Vercel production
- Updates existing variables with new values
- Ensures production environment stays current

### Deployment Automation
- Triggers on every push to main branch
- Can be manually triggered via workflow_dispatch
- Deploys to Vercel production environment

### Slack Notifications
- Success notifications with deployment details
- Failure notifications with error context
- Sends to #deployments channel (configurable)

## Manual Trigger
```bash
# Trigger workflow manually via GitHub CLI
gh workflow run "Vercel Deployment Automation"
```

## Monitoring and Debugging

### Check Workflow Status
1. Go to GitHub repository → Actions tab
2. View workflow runs and logs
3. Debug failed deployments

### Verify Environment Variables
```bash
# Check Vercel environment variables
vercel env ls --environment=production
```

### Test Slack Integration
```bash
# Test webhook manually
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test deployment notification"}' \
  YOUR_SLACK_WEBHOOK_URL
```

## Security Considerations

### Secret Management
- Never commit secrets to repository
- Use GitHub encrypted secrets only
- Rotate tokens regularly

### Environment Isolation
- Production secrets separate from development
- Use different Stripe keys for live environment
- Validate all URLs and endpoints

## Troubleshooting

### Common Issues
1. **Invalid Vercel token**: Regenerate token with full permissions
2. **Missing secrets**: Verify all required secrets are set
3. **Slack webhook fails**: Test webhook URL manually
4. **Environment sync fails**: Check Vercel CLI permissions

### Debug Commands
```bash
# Check Vercel project status
vercel project ls

# Validate environment locally
npm run validate-env

# Test Slack webhook
node scripts/slack-webhook.js
```

## Next Steps
1. Test workflow with a small commit
2. Monitor first few deployments
3. Set up additional notification channels if needed
4. Consider adding staging environment workflow