# 🚀 DeployPad Environment Variables Setup Guide

## ❌ Current Issue
Login is failing with "TypeError: Load failed" because the deployment platform (DeployPad) doesn't have the required environment variables configured.

## ✅ Required Environment Variables

### 1. Supabase Configuration
```bash
VITE_SUPABASE_URL=https://mwvcbedvnimabfwubazz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_EPF-r4VsfAE13EBn6SNwTQ_QS-5h6ex
```

### 2. Stripe Configuration
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51QKq3wP3bxLVqyWmfQQNJCYWLFOWUVJdOQPcFYLdZHrJKRpPGH8sOCqYLxAYPRvOLqjLuqLOqLOqLOqLOqLO
```

### 3. Google Maps (Optional)
```bash
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## 📋 How to Set in DeployPad

### Step 1: Access Environment Variables
1. Log into DeployPad dashboard
2. Navigate to your project: `landscape-luxury-design`
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Variables
For each variable above, click **Add Variable** and enter:
- **Name**: Exact variable name (e.g., `VITE_SUPABASE_URL`)
- **Value**: The value from above
- **Environment**: Select **All** (or Production if separate staging)

### Step 3: Redeploy
After adding all variables:
1. Click **Save Changes**
2. Trigger a new deployment (redeploy)
3. Wait for build to complete

## 🔍 Verification

The app now includes startup checks that will log:
```
✅ Environment Check: All variables loaded
🌿 Supabase: https://mwvcbed...azz.supabase.co
🔑 Supabase Key: sb_pub...***
💳 Stripe Key: pk_live...***
```

If variables are missing, you'll see:
```
❌ Environment Check: Missing variables
```

## 🆘 Troubleshooting

### Variables Not Loading?
1. Ensure variable names are EXACT (case-sensitive)
2. Verify no extra spaces in values
3. Check variables are set for correct environment
4. Clear build cache and redeploy

### Still Getting Errors?
1. Check browser console for environment validation messages
2. Look for red banner at top of page showing missing vars
3. Contact DeployPad support if variables aren't injecting

## 📞 Support
If issues persist after setting variables, check:
- DeployPad build logs for environment injection
- Browser DevTools → Console for detailed error messages
- Network tab to see if Supabase requests are being made
