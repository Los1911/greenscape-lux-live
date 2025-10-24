# GitHub Actions Vercel Auto-Deployment Setup Guide

## Overview
This guide sets up automated deployment of GreenScape Lux to Vercel using GitHub Actions, including environment variable synchronization and Slack notifications.

## 🚀 Quick Setup

### 1. Required GitHub Secrets
Add these secrets to your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

```bash
# Vercel Configuration
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_vercel_org_id_here  
VERCEL_PROJECT_ID=your_vercel_project_id_here

# Application Environment Variables
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Optional: Slack Notifications
SLACK_WEBHOOK_URL=your_slack_webhook_url_here
```

### 2. Get Vercel Configuration Values

#### Get Vercel Token:
1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Create new token with appropriate scopes
3. Copy token value

#### Get Organization and Project IDs:
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# In your project directory
vercel link

# Get project info
vercel project ls
```

Or find in Vercel Dashboard → Project Settings → General

### 3. Slack Webhook Setup (Optional)
1. Go to your Slack workspace
2. Create new app at [api.slack.com/apps](https://api.slack.com/apps)
3. Enable Incoming Webhooks
4. Create webhook for desired channel
5. Copy webhook URL

## 🔧 Workflow Features

### Automatic Triggers
- **Push to main branch**: Full production deployment
- **Pull requests**: Preview deployment (optional)

### Build Process
1. **Environment Validation**: Checks all required environment variables
2. **Dependency Installation**: Uses npm ci for consistent installs
3. **Application Build**: Runs `npm run build` with environment variables
4. **Vercel Sync**: Syncs GitHub Secrets to Vercel environment variables
5. **Deployment**: Deploys built artifacts to Vercel production

### Notifications
- **Success**: Slack notification with deployment URL and commit info
- **Failure**: Slack notification with error details
- **Console Logs**: Detailed logging throughout process

## 📁 File Structure
```
.github/workflows/
  └── vercel-auto-deployment.yml    # Main workflow file
scripts/
  ├── vercel-env-deployment.js      # Environment variable sync script
  ├── slack-webhook.js              # Slack notification script
  └── build-time-env-validator.js   # Environment validation script
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Missing Vercel Token
```
Error: VERCEL_TOKEN is required
```
**Solution**: Add VERCEL_TOKEN to GitHub Secrets

#### 2. Environment Variable Sync Fails
```
Failed to sync VITE_SUPABASE_URL: 409 Conflict
```
**Solution**: Environment variable already exists. Script will automatically update it.

#### 3. Build Failures
```
Build failed with exit code 1
```
**Solution**: Check build logs for missing environment variables or build errors

#### 4. Deployment URL Not Found
```
deployment_url is empty
```
**Solution**: Check Vercel CLI output and ensure proper authentication

### Manual Verification

#### Test Environment Sync:
```bash
# Local test
node scripts/vercel-env-deployment.js
```

#### Test Slack Notifications:
```bash
# Set environment variables
export SLACK_WEBHOOK_URL="your_webhook_url"
export DEPLOYMENT_URL="https://greenscapelux.com"
export GITHUB_SHA="abc1234"
export GITHUB_REF="refs/heads/main"

# Test notification
node scripts/slack-webhook.js
```

## 🚀 Deployment Process

### Automatic Deployment
1. Push code to main branch
2. GitHub Actions triggers workflow
3. Environment variables synced to Vercel
4. Application built and deployed
5. Success notification sent to Slack

### Manual Deployment (Backup)
```bash
# Build locally
npm run build

# Deploy to Vercel
vercel --prod
```

## 📊 Monitoring

### GitHub Actions
- View workflow runs in GitHub Actions tab
- Check logs for detailed deployment information
- Monitor success/failure rates

### Vercel Dashboard
- Monitor deployment status
- View build logs
- Check environment variable configuration

### Slack Notifications
- Receive real-time deployment notifications
- Get deployment URLs and commit information
- Monitor deployment success rates

## 🔒 Security Notes

- All secrets are encrypted in GitHub
- Vercel API tokens have limited scopes
- Environment variables are encrypted in Vercel
- Slack webhooks are scoped to specific channels

## 📝 Next Steps

1. **Set up GitHub Secrets** with all required values
2. **Test deployment** by pushing to main branch
3. **Configure Slack notifications** (optional)
4. **Monitor first deployment** in GitHub Actions
5. **Verify live site** at greenscapelux.com

The automated deployment system is now ready to deploy GreenScape Lux automatically on every push to main!