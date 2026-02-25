# Automated Environment Variable Synchronization - Setup Guide

## Overview
This guide explains how to set up and use the automated environment variable synchronization system that keeps your variables in sync across DeployPad, Vercel, and GitHub Actions.

## System Components

### 1. Frontend Dashboard
- **Location**: Admin Panel → Environment Variables
- **Features**: 
  - Real-time sync status
  - One-click sync button
  - Alert notifications
  - Platform status overview

### 2. Backend Services
- **EnvironmentSyncService**: Core sync logic
- **AutomatedEnvSyncService**: Health checks and alerts
- **EnvKeySyncer**: Platform-specific API integrations

### 3. Automation Scripts
- **Node.js Script**: `scripts/automated-env-sync.js`
- **GitHub Workflow**: `.github/workflows/automated-env-sync.yml`

## Initial Setup

### Step 1: Configure API Credentials

#### Add to Supabase Secrets
```bash
# Vercel credentials
VERCEL_TOKEN=<your_vercel_api_token>
VERCEL_PROJECT_ID=<your_project_id>

# GitHub credentials (optional, uses GITHUB_TOKEN from Actions)
GITHUB_REPO=owner/repository-name
```

#### Add to GitHub Secrets
1. Go to repository Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `GOOGLE_MAPS_API_KEY`
   - `VERCEL_TOKEN`
   - `VERCEL_PROJECT_ID`

### Step 2: Get API Tokens

#### Vercel Token
1. Go to https://vercel.com/account/tokens
2. Create new token with name "Environment Sync"
3. Copy token and add to secrets

#### Vercel Project ID
1. Go to your Vercel project settings
2. Copy Project ID from General tab
3. Add to secrets

#### GitHub Token
- Automatically provided by GitHub Actions
- No manual setup required

### Step 3: Enable Automated Sync

The GitHub Actions workflow runs automatically:
- **Daily**: At 2 AM UTC
- **On Push**: When env files change
- **Manual**: Via GitHub Actions UI

To manually trigger:
1. Go to Actions tab in GitHub
2. Select "Automated Environment Variable Sync"
3. Click "Run workflow"

## Using the Dashboard

### Access the Dashboard
1. Log in as admin
2. Navigate to Admin Panel
3. Click "Environment Variables" in sidebar

### Dashboard Features

#### Sync Status Cards
- Shows status for each platform (DeployPad, Vercel, GitHub)
- Displays last sync time
- Shows number of variables synced

#### Alert System
- Red alerts for missing variables
- Yellow alerts for outdated variables
- Orange alerts for sync errors

#### One-Click Sync
1. Click "Sync All Platforms" button
2. Wait for confirmation message
3. Review sync results

#### Health Check
1. Click "Check Status" button
2. System validates all variables
3. Generates alerts for issues

## Manual Synchronization

### Using Node.js Script

```bash
# Set environment variables
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export VITE_SUPABASE_PUBLISHABLE_KEY="your-key"
export STRIPE_PUBLISHABLE_KEY="pk_live_..."
export GOOGLE_MAPS_API_KEY="your-key"
export VERCEL_TOKEN="your-token"
export VERCEL_PROJECT_ID="prj_..."
export GITHUB_TOKEN="ghp_..."
export GITHUB_REPO="owner/repo"

# Run sync script
node scripts/automated-env-sync.js
```

### Expected Output
```
🚀 Starting environment variable synchronization...

📝 Syncing VITE_SUPABASE_URL...
✅ Synced VITE_SUPABASE_URL to Vercel
✅ Synced VITE_SUPABASE_URL to GitHub Actions

📝 Syncing VITE_SUPABASE_PUBLISHABLE_KEY...
✅ Synced VITE_SUPABASE_PUBLISHABLE_KEY to Vercel
✅ Synced VITE_SUPABASE_PUBLISHABLE_KEY to GitHub Actions

==================================================
📊 Synchronization Summary
==================================================
Total variables: 4
✅ Successfully synced: 4
❌ Failed: 0

✨ Synchronization complete!
```

## Monitoring & Alerts

### Automated Health Checks
- Run every 5 minutes
- Check for missing variables
- Detect outdated configurations
- Generate alerts automatically

### Alert Types

#### Missing Variable Alert
```
❌ Missing environment variable: VITE_SUPABASE_URL
Platform: current
Action: Add variable to environment
```

#### Sync Error Alert
```
⚠️ Sync failed for STRIPE_PUBLISHABLE_KEY
Platform: vercel
Error: API authentication failed
Action: Check API token validity
```

#### Outdated Variable Alert
```
⏰ Variable outdated: GOOGLE_MAPS_API_KEY
Platform: github
Last synced: 7 days ago
Action: Run sync to update
```

## Troubleshooting

### Common Issues

#### 1. "Missing credentials" Error
**Problem**: API tokens not configured
**Solution**: 
- Check Supabase secrets for VERCEL_TOKEN
- Verify VERCEL_PROJECT_ID is set
- Ensure GitHub secrets are configured

#### 2. "API authentication failed"
**Problem**: Invalid or expired token
**Solution**:
- Generate new Vercel token
- Update token in secrets
- Re-run sync

#### 3. "Variable not found in environment"
**Problem**: Variable not set in current environment
**Solution**:
- Add variable to .env.production
- Set in deployment platform
- Re-run sync

#### 4. Sync succeeds but variables not updating
**Problem**: Platform caching or propagation delay
**Solution**:
- Wait 5-10 minutes for propagation
- Trigger new deployment
- Clear platform cache

### Verification Steps

1. **Check Dashboard**
   - All platforms show "OK" status
   - No active alerts
   - Recent sync timestamp

2. **Verify in Vercel**
   - Go to project settings
   - Check Environment Variables tab
   - Confirm values match

3. **Verify in GitHub**
   - Go to repository settings
   - Check Secrets and variables
   - Confirm secrets exist

4. **Test in Application**
   - Deploy new version
   - Check browser console for env values
   - Verify features work correctly

## Best Practices

### 1. Regular Monitoring
- Check dashboard weekly
- Review alerts promptly
- Run manual health checks before deployments

### 2. Secure Credentials
- Never commit API tokens to git
- Use Supabase secrets for sensitive values
- Rotate tokens regularly (quarterly)

### 3. Sync Timing
- Run sync before major deployments
- Schedule during low-traffic periods
- Allow time for propagation

### 4. Documentation
- Document any manual changes
- Keep this guide updated
- Share access with team

## Maintenance Schedule

### Daily
- Automated sync runs at 2 AM UTC
- Health checks every 5 minutes
- Alert generation as needed

### Weekly
- Review dashboard for alerts
- Verify sync status
- Check platform consoles

### Monthly
- Review sync logs
- Update documentation
- Audit API token access

### Quarterly
- Rotate API tokens
- Review and update variables
- Test disaster recovery

## Support & Resources

### Documentation
- [Vercel API Docs](https://vercel.com/docs/rest-api)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase Environment Variables](https://supabase.com/docs/guides/cli/managing-environments)

### Getting Help
1. Check dashboard alerts for specific errors
2. Review sync logs in GitHub Actions
3. Verify API token validity
4. Contact platform support if needed

## Disaster Recovery

### If Sync Completely Fails

1. **Manual Backup**
   ```bash
   # Export current variables
   vercel env pull .env.backup
   ```

2. **Manual Restore**
   - Copy variables from .env.backup
   - Manually add to each platform
   - Verify in platform console

3. **Re-enable Automation**
   - Fix underlying issue
   - Test with manual sync
   - Re-enable automated workflow

### Emergency Contacts
- Platform Support: [Contact links]
- Team Lead: [Contact info]
- On-Call Engineer: [Contact info]

## Conclusion

The automated environment variable synchronization system ensures:
- ✅ Consistent configuration across platforms
- ✅ Automated monitoring and alerts
- ✅ One-click synchronization
- ✅ Audit trail and logging
- ✅ Reduced manual configuration errors

Follow this guide to maintain a reliable, synchronized environment across all deployment platforms.
