# Vercel Environment Deployment Verification Guide

## Overview
Complete guide for verifying and troubleshooting environment variable deployment with GitHub Actions integration.

## GitHub Actions Workflow Status

### Checking Workflow Status
```bash
# View all workflow runs
gh run list --workflow="env-sync-deployment.yml"

# View specific run details
gh run view <run-id>

# Watch live workflow execution
gh run watch
```

### Workflow Triggers
- **Push to main**: Full validation + sync + build
- **Push to develop**: Validation + build only
- **Pull request to main**: Validation + build only
- **Manual dispatch**: On-demand execution

## Environment Validation Steps

### 1. Pre-Deployment Validation
```bash
# Local validation before push
npm run env:validate

# GitHub Actions specific validation
npm run env:github-validate

# Pre-deployment check
npm run env:pre-deploy
```

### 2. GitHub Secrets Verification
**Required GitHub Secrets:**
```bash
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
VITE_STRIPE_PUBLISHABLE_KEY
VITE_STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
VITE_GOOGLE_MAPS_API_KEY
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

**Verification Commands:**
```bash
# Check if secrets are properly set (in GitHub Actions)
echo "Secrets configured: ${{ secrets.VITE_SUPABASE_URL != '' }}"
```

### 3. Vercel Environment Sync
```bash
# Check current Vercel environment
vercel env ls

# Pull environment from Vercel
vercel env pull .env.vercel

# Compare local vs Vercel
npm run env:status
```

## Deployment Verification Checklist

### ✅ Pre-Deployment
- [ ] All GitHub secrets configured
- [ ] Local environment validates successfully
- [ ] No placeholder values detected
- [ ] Vercel API credentials working

### ✅ During Deployment
- [ ] Environment validation job passes
- [ ] Environment sync job completes
- [ ] Build job succeeds
- [ ] No critical errors in logs

### ✅ Post-Deployment
- [ ] Production environment variables match local
- [ ] Application loads without environment errors
- [ ] API integrations working (Stripe, Supabase, etc.)
- [ ] No console errors related to missing variables

## Troubleshooting Common Issues

### 1. Environment Validation Fails
**Symptoms:**
- GitHub Actions workflow fails at validation step
- Error: "Environment validation failed"

**Solutions:**
```bash
# Check for placeholder values
grep -r "your_.*_key_here" .env.local

# Validate locally first
npm run env:validate

# Check GitHub secrets
gh secret list
```

### 2. Sync to Vercel Fails
**Symptoms:**
- Validation passes but sync fails
- Error: "Environment sync failed"

**Solutions:**
```bash
# Verify Vercel credentials
vercel whoami

# Check project configuration
vercel project ls

# Manual sync test
npm run env:sync-to-vercel
```

### 3. Build Fails After Sync
**Symptoms:**
- Environment syncs but build fails
- Missing environment variables at build time

**Solutions:**
```bash
# Check build environment
vercel env ls --environment=production

# Verify environment in build logs
# Look for "Environment Variables" section in Vercel deployment logs
```

### 4. Production Runtime Errors
**Symptoms:**
- Build succeeds but app fails at runtime
- Console errors about undefined environment variables

**Solutions:**
```bash
# Check browser network tab for failed API calls
# Verify client-side environment variables (VITE_ prefixed)
# Check Vercel function logs for server-side errors
```

## Manual Verification Steps

### 1. Local Environment Check
```bash
# Validate all environment variables
npm run env:validate

# Generate detailed report
npm run env:validate report

# Check Stripe configuration specifically
npm run stripe-setup-check
```

### 2. GitHub Actions Environment Check
```bash
# Trigger manual workflow run
gh workflow run env-sync-deployment.yml

# Check workflow logs
gh run view --log
```

### 3. Vercel Environment Check
```bash
# List all environment variables
vercel env ls

# Check specific environment
vercel env ls --environment=production

# Pull current production environment
vercel env pull .env.production
```

### 4. Application Runtime Check
```bash
# Check application logs
vercel logs

# Monitor real-time logs
vercel logs --follow

# Check specific function logs
vercel logs --function=api/your-function
```

## Environment Drift Detection

### Automated Monitoring
The GitHub Actions workflow includes daily environment checks:

```yaml
# Runs daily at 9 AM UTC
schedule:
  - cron: '0 9 * * *'
```

### Manual Drift Check
```bash
# Compare local vs production
npm run env:status

# Force sync if drift detected
npm run env:sync-to-vercel
```

## Security Verification

### 1. Secret Exposure Check
```bash
# Check for accidentally committed secrets
git log --grep="key\|secret\|token" --oneline

# Scan for potential secret patterns
grep -r "sk_\|pk_\|whsec_" src/ --exclude-dir=node_modules
```

### 2. Environment Isolation
```bash
# Verify environment separation
vercel env ls --environment=preview
vercel env ls --environment=production
```

## Performance Monitoring

### Build Time Monitoring
```bash
# Check build duration trends
gh run list --workflow="env-sync-deployment.yml" --json | jq '.[] | {created_at, conclusion, run_number}'
```

### Sync Performance
```bash
# Monitor sync operation duration
# Check GitHub Actions logs for sync timing
```

## Emergency Procedures

### 1. Rollback Environment Changes
```bash
# Revert to previous environment state
git revert <commit-hash>

# Force sync previous configuration
npm run env:sync-to-vercel
```

### 2. Emergency Key Rotation
```bash
# Update GitHub secrets immediately
gh secret set STRIPE_SECRET_KEY --body="new_secret_key"

# Trigger immediate sync
gh workflow run env-sync-deployment.yml
```

### 3. Bypass Validation (Emergency Only)
```bash
# Temporarily disable validation in workflow
# Edit .github/workflows/env-sync-deployment.yml
# Comment out validation job dependencies
```

## Best Practices

1. **Regular Validation**: Run `npm run env:validate` before every deployment
2. **Secret Rotation**: Rotate API keys quarterly
3. **Environment Monitoring**: Monitor daily validation reports
4. **Documentation**: Keep environment documentation updated
5. **Access Control**: Limit who can modify GitHub secrets
6. **Backup**: Keep secure backup of environment configurations

This comprehensive verification system ensures your deployment environment is always properly configured and secure!