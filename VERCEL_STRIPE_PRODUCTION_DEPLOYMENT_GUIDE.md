# 🚀 Vercel Stripe Production Deployment Guide

## ⚡ IMMEDIATE ACTION REQUIRED

### Step 1: Get Live Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Switch to **Live mode** (toggle in top-left)
3. Navigate to **Developers > API Keys**
4. Copy these values:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`) - Click "Reveal"

### Step 2: Get Webhook Secret
1. In Stripe Dashboard, go to **Developers > Webhooks**
2. Find your production webhook endpoint
3. Click on it and copy the **Signing secret** (starts with `whsec_`)

### Step 3: Update Vercel Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings > Environment Variables**
4. Add/Update these variables for **Production**:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_[your_key_here]
STRIPE_SECRET_KEY=sk_live_[your_key_here]  
STRIPE_WEBHOOK_SECRET=whsec_[your_key_here]
```

### Step 4: Update Supabase Secrets
1. Go to Supabase Dashboard
2. Navigate to **Settings > Vault**
3. Add these secrets:
```
STRIPE_SECRET_KEY=sk_live_[your_key_here]
STRIPE_WEBHOOK_SECRET=whsec_[your_key_here]
```

### Step 5: Redeploy Application
```bash
# Option 1: Git push (triggers auto-deploy)
git add .
git commit -m "Update Stripe production configuration"
git push origin main

# Option 2: Manual redeploy in Vercel
# Go to Vercel Dashboard > Deployments > Redeploy
```

### Step 6: Verify Payment Flow
1. Visit your production site
2. Navigate to `/profile#payment`
3. Try adding a payment method
4. Confirm no "Invalid API Key" errors appear

## ✅ Success Criteria
- [ ] No console errors about invalid API keys
- [ ] Payment method addition works
- [ ] Stripe Elements load correctly
- [ ] Webhook events process successfully

## 🔧 Troubleshooting
If issues persist:
1. Check browser console for errors
2. Verify environment variables are set in Vercel
3. Confirm Supabase secrets are properly configured
4. Check Stripe webhook logs for failures