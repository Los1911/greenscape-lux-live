# Automated Environment Variable Sync System - Complete Implementation

## 🎯 Overview

A comprehensive automated system that validates Vercel environment variables match `.env.example` on every deployment, with Slack notifications for missing or mismatched variables, and pre-build validation that fails the build if critical `VITE_*` variables are missing.

## 📦 Components Created

### 1. Pre-Build Validation Script
**File:** `scripts/validate-env-build.js`

- Runs before every build
- Checks for critical `VITE_*` variables
- **FAILS THE BUILD** if critical variables are missing
- Warns about optional variables

**Critical Variables:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

### 2. Vercel Environment Sync Script
**File:** `scripts/vercel-env-sync.js`

- Compares current env vars with `.env.example`
- Sends Slack notifications for mismatches
- Runs on deployment

### 3. Slack Notification Helper
**File:** `scripts/slack-webhook.js`

- Reusable Slack webhook integration
- Formatted notifications with emojis and colors
- CLI usage support

### 4. GitHub Actions Workflow
**File:** `.github/workflows/env-validation.yml`

- Runs on push to main/master/production branches
- Validates environment variables in CI/CD
- Sends Slack notifications on failure

## 🚀 Setup Instructions

### Step 1: Configure Slack Webhook

1. Go to your Slack workspace
2. Create an Incoming Webhook:
   - Visit https://api.slack.com/messaging/webhooks
   - Click "Create New App" → "From scratch"
   - Name it "GreenScape Lux Deployment"
   - Select your workspace
   - Go to "Incoming Webhooks" → Enable
   - Click "Add New Webhook to Workspace"
   - Select channel (e.g., #deployments)
   - Copy the webhook URL

### Step 2: Configure Vercel Environment Variables

Add to **Vercel Dashboard → Settings → Environment Variables**:

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_live_your_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
RESEND_API_KEY=re_your_api_key
```

**Important:** Set for all environments (Production, Preview, Development)

### Step 3: Configure GitHub Secrets

Add to **GitHub Repository → Settings → Secrets and Variables → Actions**:

```
SLACK_WEBHOOK_URL
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRIPE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
```

### Step 4: Update package.json

Add pre-build validation to your build script:

```json
{
  "scripts": {
    "prebuild": "node scripts/validate-env-build.js",
    "build": "vite build",
    "validate:env": "node scripts/validate-env-build.js",
    "sync:env": "node scripts/vercel-env-sync.js",
    "test:slack": "node scripts/slack-webhook.js 'Test notification from GreenScape Lux'"
  }
}
```

### Step 5: Update Vercel Build Settings

In **Vercel Dashboard → Settings → General → Build & Development Settings**:

**Build Command:**
```bash
npm run build
```

The `prebuild` script will automatically run before `build`.

## 🔍 How It Works

### Build-Time Validation Flow

```
1. Developer pushes code to GitHub
2. Vercel starts deployment
3. `prebuild` script runs (validate-env-build.js)
4. Script checks for critical VITE_* variables
5a. If missing → Build FAILS ❌ → Slack notification sent
5b. If present → Build continues ✅
6. Vite build process runs
7. Post-deployment validation (vercel-env-sync.js)
8. Slack notification with results
```

### GitHub Actions Validation Flow

```
1. Code pushed to main/master/production
2. GitHub Actions workflow triggers
3. Checks out code
4. Validates .env.example exists
5. Runs validate-env-build.js with GitHub Secrets
6a. If validation fails → Slack notification sent
6b. If validation passes → Workflow succeeds
```

## 📊 Slack Notification Examples

### Success Notification
```
✅ Environment Variables Valid

Validation Results

• Present: 8/8
• Missing: 0/8

All environment variables are properly configured!
```

### Error Notification
```
🚨 Environment Variable Mismatch

Validation Results

• Present: 5/8
• Missing: 3/8

Missing Variables:
• `VITE_SUPABASE_URL`
• `VITE_SUPABASE_ANON_KEY`
• `VITE_STRIPE_PUBLISHABLE_KEY`

Configure in Vercel Dashboard → Settings → Environment Variables
```

## 🧪 Testing the System

### Test Pre-Build Validation
```bash
npm run validate:env
```

### Test Slack Notifications
```bash
export SLACK_WEBHOOK_URL="your_webhook_url"
npm run test:slack
```

### Test Full Sync
```bash
export SLACK_WEBHOOK_URL="your_webhook_url"
npm run sync:env
```

### Test in CI/CD
Push to main branch and check GitHub Actions tab

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use Vercel Environment Variables** - Not `.env.local`
3. **Rotate secrets regularly** - Update in Vercel Dashboard
4. **Limit Slack webhook access** - Use private channels
5. **Use GitHub Secrets** - Never hardcode in workflows

## 🐛 Troubleshooting

### Build Fails with "Missing Critical Variables"

**Solution:** Add variables to Vercel Dashboard:
1. Go to Vercel Dashboard → Your Project → Settings
2. Click "Environment Variables"
3. Add each missing variable
4. Select "Production", "Preview", and "Development"
5. Click "Save"
6. Redeploy: `vercel --prod`

### Slack Notifications Not Sending

**Check:**
1. `SLACK_WEBHOOK_URL` is set in Vercel
2. Webhook URL is valid (test with curl)
3. Slack app has permissions
4. Channel exists and app is added

**Test:**
```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test notification"}'
```

### GitHub Actions Failing

**Check:**
1. All secrets are added to GitHub repository
2. Workflow file is in `.github/workflows/`
3. Branch name matches trigger (main/master/production)

## 📈 Monitoring

### View Validation History

**GitHub Actions:**
- Repository → Actions tab → "Environment Variable Validation"

**Slack:**
- Check your configured channel for notifications

**Vercel:**
- Dashboard → Deployments → Select deployment → Build logs

## 🎉 Benefits

✅ **Prevents production failures** - Build fails before deployment
✅ **Immediate alerts** - Slack notifications in real-time
✅ **CI/CD integration** - Validates in GitHub Actions
✅ **Developer-friendly** - Clear error messages
✅ **Automated** - No manual checks required
✅ **Comprehensive** - Validates all environment variables

## 📝 Next Steps

1. Configure Slack webhook
2. Add environment variables to Vercel
3. Add secrets to GitHub
4. Test the system with a deployment
5. Monitor Slack for notifications

## 🔗 Related Documentation

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
