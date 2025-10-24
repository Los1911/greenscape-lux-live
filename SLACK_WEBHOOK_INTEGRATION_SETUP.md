# Slack Webhook Integration Setup Guide

## 🎯 Quick Start

This guide walks you through setting up Slack notifications for environment variable validation and deployment alerts.

## 📋 Prerequisites

- Slack workspace with admin access
- Vercel account with project deployed
- GitHub repository with Actions enabled

## 🔧 Step-by-Step Setup

### 1. Create Slack Incoming Webhook

1. **Visit Slack API Dashboard**
   - Go to https://api.slack.com/apps
   - Click "Create New App"

2. **Choose "From scratch"**
   - App Name: `GreenScape Lux Deployment`
   - Workspace: Select your workspace
   - Click "Create App"

3. **Enable Incoming Webhooks**
   - In the left sidebar, click "Incoming Webhooks"
   - Toggle "Activate Incoming Webhooks" to **ON**
   - Click "Add New Webhook to Workspace"

4. **Select Channel**
   - Choose channel: `#deployments` (or create new)
   - Click "Allow"

5. **Copy Webhook URL**
   - You'll see a URL like: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`
   - Copy this URL (you'll need it in next steps)

### 2. Configure Vercel Environment Variables

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Click "Settings" → "Environment Variables"

2. **Add SLACK_WEBHOOK_URL**
   - Variable Name: `SLACK_WEBHOOK_URL`
   - Value: Paste your webhook URL
   - Environments: Check all (Production, Preview, Development)
   - Click "Save"

3. **Verify Other Variables**
   Ensure these are also configured:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_STRIPE_PUBLISHABLE_KEY
   SUPABASE_SERVICE_ROLE_KEY
   STRIPE_SECRET_KEY
   STRIPE_WEBHOOK_SECRET
   RESEND_API_KEY
   ```

### 3. Configure GitHub Secrets

1. **Go to GitHub Repository**
   - Navigate to your repository
   - Click "Settings" → "Secrets and variables" → "Actions"

2. **Add Repository Secrets**
   Click "New repository secret" for each:
   
   ```
   Name: SLACK_WEBHOOK_URL
   Value: [Your Slack webhook URL]
   
   Name: VITE_SUPABASE_URL
   Value: [Your Supabase URL]
   
   Name: VITE_SUPABASE_ANON_KEY
   Value: [Your Supabase anon key]
   
   Name: VITE_STRIPE_PUBLISHABLE_KEY
   Value: [Your Stripe publishable key]
   ```

### 4. Test the Integration

#### Test Slack Webhook Directly
```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{"text":"🧪 Test notification from GreenScape Lux"}'
```

#### Test with npm Script
```bash
export SLACK_WEBHOOK_URL="your_webhook_url"
npm run test:slack
```

#### Test Environment Validation
```bash
npm run validate:env
```

### 5. Deploy and Verify

1. **Trigger Deployment**
   ```bash
   git add .
   git commit -m "Add automated env sync system"
   git push origin main
   ```

2. **Check Slack Channel**
   - You should receive a notification about the deployment
   - If validation fails, you'll get an error notification

3. **Check GitHub Actions**
   - Go to repository → Actions tab
   - Click on latest workflow run
   - Verify it completed successfully

## 📊 Notification Examples

### ✅ Success Notification
```
✅ Environment Variables Valid

Validation Results

• Present: 8/8
• Missing: 0/8

All environment variables are properly configured!

2025-10-01T06:51:00.000Z
GreenScape Lux Deployment System
```

### 🚨 Error Notification
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

2025-10-01T06:51:00.000Z
GreenScape Lux Deployment System
```

## 🔍 Troubleshooting

### Notifications Not Appearing

**Check Webhook URL:**
```bash
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test"}'
```

Expected response: `ok`

**Verify Environment Variable:**
```bash
# In Vercel deployment logs
echo $SLACK_WEBHOOK_URL
```

**Check Slack App Permissions:**
- Go to Slack API Dashboard → Your App
- Verify "Incoming Webhooks" is enabled
- Verify webhook is active

### Build Failing

**Check Vercel Build Logs:**
1. Go to Vercel Dashboard → Deployments
2. Click on failed deployment
3. Check build logs for error messages

**Common Issues:**
- Missing `VITE_*` variables → Add to Vercel Dashboard
- Invalid webhook URL → Regenerate in Slack
- Script permission errors → Check file permissions

### GitHub Actions Failing

**Check Secrets:**
1. Repository → Settings → Secrets
2. Verify all required secrets are present
3. Re-add any missing secrets

**Check Workflow File:**
```bash
cat .github/workflows/env-validation.yml
```

## 🎨 Customizing Notifications

### Change Notification Channel

1. Go to Slack API Dashboard → Your App
2. Click "Incoming Webhooks"
3. Remove old webhook
4. Add new webhook to different channel
5. Update `SLACK_WEBHOOK_URL` in Vercel and GitHub

### Customize Message Format

Edit `scripts/slack-webhook.js`:

```javascript
const payload = {
  text: `${emoji} ${title}`,
  blocks: [
    // Customize blocks here
  ]
};
```

## 📈 Best Practices

1. **Use Dedicated Channel**
   - Create `#deployments` or `#alerts` channel
   - Keep separate from general chat

2. **Set Up Alerts**
   - Configure Slack to notify you on mentions
   - Set up keywords: "failed", "missing", "error"

3. **Regular Testing**
   - Test webhook monthly
   - Verify notifications after config changes

4. **Rotate Webhooks**
   - Regenerate webhook URLs periodically
   - Update in Vercel and GitHub immediately

5. **Monitor Logs**
   - Check Slack for all deployment notifications
   - Review GitHub Actions results
   - Monitor Vercel deployment logs

## 🔗 Resources

- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## ✅ Verification Checklist

- [ ] Slack webhook created and tested
- [ ] `SLACK_WEBHOOK_URL` added to Vercel
- [ ] All environment variables configured in Vercel
- [ ] GitHub secrets configured
- [ ] Test notification sent successfully
- [ ] Deployment triggered and notification received
- [ ] GitHub Actions workflow passed
- [ ] Error notifications working (test by removing a variable)

## 🎉 You're All Set!

Your automated environment variable sync system is now active. You'll receive Slack notifications for:

- ✅ Successful deployments with valid env vars
- 🚨 Failed validations with missing variables
- 📊 Environment sync status updates
- ⚠️ Build failures due to configuration issues
