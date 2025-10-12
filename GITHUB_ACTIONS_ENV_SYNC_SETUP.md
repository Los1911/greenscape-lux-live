# GitHub Actions Environment Sync Setup Guide

## Overview
Automated GitHub Actions workflow that validates environment sync, syncs variables on main branch pushes, and fails builds if critical environment variables are missing or using placeholder values.

## Features
- ✅ Environment validation before deployment
- ✅ Automatic sync to Vercel on main branch pushes
- ✅ Build failure on missing/placeholder values
- ✅ Secure handling of sensitive environment variables
- ✅ Multi-environment support (main, develop)
- ✅ Manual workflow dispatch option

## Setup Instructions

### 1. Configure GitHub Secrets
Add these secrets to your GitHub repository:

**Repository Settings → Secrets and variables → Actions → New repository secret**

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_51...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51...
VITE_STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service
RESEND_API_KEY=re_...

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=AIza...

# Vercel API (for environment sync)
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

### 2. Get Vercel API Credentials

**Get Vercel Token:**
1. Go to https://vercel.com/account/tokens
2. Create new token with appropriate scope
3. Copy token value

**Get Organization ID:**
```bash
vercel teams list
# Copy your team/org ID
```

**Get Project ID:**
```bash
vercel project list
# Copy your project ID
```

### 3. Workflow Triggers

**Automatic Triggers:**
- Push to `main` branch → Full validation + sync + build
- Push to `develop` branch → Validation + build only
- Pull request to `main` → Validation + build only

**Manual Trigger:**
- Go to Actions tab → "Environment Sync & Deployment" → "Run workflow"

## Workflow Jobs

### 1. Environment Validation
- Validates all environment variables
- Detects placeholder values
- Checks API key formats
- Fails if critical variables missing

### 2. Environment Sync (main branch only)
- Syncs local environment to Vercel
- Only runs if validation passes
- Updates production environment variables

### 3. Build & Test
- Runs application build
- Executes test suite
- Validates deployment readiness

### 4. Deployment Ready Check
- Final validation before deployment
- Blocks deployment if any step fails
- Provides clear failure reasons

## Validation Rules

**Critical Variables (must be present):**
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY
- VITE_STRIPE_PUBLISHABLE_KEY

**Placeholder Detection:**
- `your_key_here`
- `your_secret_key_here`
- `your_webhook_secret_here`
- `your_api_key_here`

**Format Validation:**
- Stripe keys: Proper prefixes (sk_, pk_, whsec_)
- Supabase URLs: Valid URL format
- API keys: Minimum length requirements

## Usage Examples

**Check workflow status:**
```bash
# View recent workflow runs
gh run list --workflow="env-sync-deployment.yml"

# View specific run details
gh run view <run-id>
```

**Manual workflow dispatch:**
```bash
gh workflow run env-sync-deployment.yml
```

**Debug failed runs:**
```bash
# Download logs for failed run
gh run download <run-id>
```

## Security Features

1. **Secret Isolation**: Secrets never logged or exposed
2. **Environment Separation**: Different handling for different branches
3. **Validation Gates**: Multiple validation checkpoints
4. **Secure Sync**: Encrypted transmission to Vercel
5. **Access Control**: Only authorized pushes trigger sync

## Troubleshooting

**Common Issues:**

1. **Environment validation fails:**
   - Check GitHub secrets are properly set
   - Verify no placeholder values in secrets
   - Ensure all critical variables present

2. **Sync to Vercel fails:**
   - Verify Vercel token has correct permissions
   - Check organization and project IDs
   - Ensure Vercel CLI authentication

3. **Build fails:**
   - Check environment variables in build logs
   - Verify all dependencies installed
   - Review TypeScript compilation errors

**Debug Commands:**
```bash
# Local validation
npm run env:validate

# Local sync test
npm run env:sync

# Check environment status
npm run env:status
```

## Monitoring

**Workflow Notifications:**
- Enable email notifications for failed workflows
- Set up Slack/Discord webhooks for deployment status
- Monitor workflow duration and success rates

**Environment Drift Detection:**
- Workflow runs daily validation checks
- Alerts on environment mismatches
- Automatic sync attempts on drift detection

## Best Practices

1. **Secret Rotation**: Regularly rotate API keys and tokens
2. **Branch Protection**: Require workflow success for main branch merges
3. **Review Process**: Review environment changes in PRs
4. **Documentation**: Keep environment documentation updated
5. **Monitoring**: Set up alerts for workflow failures

This automated system ensures your deployment environment is always properly configured and synchronized!