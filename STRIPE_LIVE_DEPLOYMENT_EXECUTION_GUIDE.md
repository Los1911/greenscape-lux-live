<<<<<<< HEAD
# 🚀 GreenScape Lux - Stripe Live Key Deployment Guide

## Critical Issue Resolved
The Stripe public key was showing as "UNDEFINED" because the environment variable name in code (`VITE_STRIPE_PUBLISHABLE_KEY`) didn't match what was configured in Vercel/GitHub Pages (`VITE_STRIPE_PUBLISHABLE_KEY`).

## ✅ Code Changes Complete
All code has been updated to use: `VITE_STRIPE_PUBLISHABLE_KEY`

---

## 🎯 DEPLOYMENT OPTIONS

### Option 1: Automated Deployment (GitHub Actions) ⭐ RECOMMENDED

1. **Set GitHub Secret (one-time setup)**
   ```bash
   # Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
   # Add secret:
   Name: VERCEL_TOKEN
   Value: [Get from https://vercel.com/account/tokens]
   ```

2. **Run the Workflow**
   - Go to: `Actions` tab in GitHub
   - Select: "Update Vercel Stripe Key and Deploy"
   - Click: "Run workflow"
   - Confirm the Stripe key is correct
   - Click: "Run workflow" button

3. **Wait for completion** (~2-3 minutes)

---

### Option 2: Manual Script Execution

```bash
# 1. Set your Vercel token
export VERCEL_TOKEN="your_vercel_token_here"

# 2. Make script executable
chmod +x scripts/vercel-stripe-production-deployment.sh

# 3. Run the script
./scripts/vercel-stripe-production-deployment.sh
```

---

### Option 3: Manual Vercel Dashboard

1. **Login to Vercel**: https://vercel.com
2. **Select your project**: GreenScape Lux
3. **Go to Settings → Environment Variables**
4. **Delete old variable**:
   - Find: `VITE_STRIPE_PUBLISHABLE_KEY`
   - Click trash icon → Delete
5. **Add new variable**:
   - Name: `VITE_STRIPE_PUBLISHABLE_KEY`
   - Value: `pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK`
   - Environment: Production
   - Click: Save
6. **Redeploy**:
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

---

## 🔍 VERIFICATION

After deployment completes:

1. **Open your production site**
2. **Open DevTools** (F12 or Right-click → Inspect)
3. **Go to Console tab**
4. **Look for this log**:
   ```
   🔧 Environment Variables:
   VITE_STRIPE_PUBLISHABLE_KEY: pk_live_51S1Ht0K6kWkUsx...
   ```

### ✅ Success Indicators
- Stripe key shows `pk_live_51S1Ht0K6kWkUsx...` (not "UNDEFINED")
- No "Invalid API key" errors in console
- Payment forms load without errors

### ❌ If Still Showing "UNDEFINED"
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check Vercel environment variables are saved
4. Verify deployment completed successfully

---

## 📋 Environment Variable Checklist

Ensure ALL these are set in Vercel Production:

- ✅ `VITE_STRIPE_PUBLISHABLE_KEY` = pk_live_51S1Ht0K6kWkUsx...
- ✅ `VITE_SUPABASE_URL` = https://your-project.supabase.co
- ✅ `VITE_SUPABASE_ANON_KEY` = eyJhbGc...
- ✅ `VITE_GOOGLE_MAPS_API_KEY` = AIza...

---

## 🆘 Troubleshooting

**Q: GitHub Actions fails with "VERCEL_TOKEN not found"**
A: Add VERCEL_TOKEN to GitHub Secrets (see Option 1, step 1)

**Q: Script fails with "command not found: vercel"**
A: Install Vercel CLI: `npm install -g vercel@latest`

**Q: Still seeing UNDEFINED after deployment**
A: Wait 2-3 minutes for CDN cache to clear, then hard refresh browser

---

## 📞 Support

If issues persist after following this guide:
1. Check Vercel deployment logs for errors
2. Verify all environment variables in Vercel dashboard
3. Test in incognito/private browsing mode
=======
# 🎯 Stripe Live Deployment Execution Guide

## 🚨 CRITICAL: Execute in This Exact Order

### Phase 1: Gather Live Stripe Credentials (5 minutes)

#### Step 1.1: Get Stripe Live Keys
```bash
# 1. Open Stripe Dashboard: https://dashboard.stripe.com/
# 2. Switch to LIVE mode (toggle top-left)
# 3. Go to Developers > API Keys
# 4. Copy these values:

PUBLISHABLE_KEY=pk_live_[copy_from_stripe]
SECRET_KEY=sk_live_[reveal_and_copy]
```

#### Step 1.2: Get Webhook Secret
```bash
# 1. In Stripe Dashboard: Developers > Webhooks
# 2. Find your production webhook
# 3. Copy signing secret:

WEBHOOK_SECRET=whsec_[copy_from_webhook_settings]
```

### Phase 2: Update Vercel Environment (3 minutes)

#### Step 2.1: Set Vercel Variables
```bash
# 1. Go to: https://vercel.com/dashboard
# 2. Select your project
# 3. Settings > Environment Variables
# 4. Add/Update for PRODUCTION environment:

VITE_STRIPE_PUBLISHABLE_KEY=pk_live_[your_key]
STRIPE_SECRET_KEY=sk_live_[your_key]
STRIPE_WEBHOOK_SECRET=whsec_[your_secret]
```

#### Step 2.2: Verify Variables Set
- [ ] VITE_STRIPE_PUBLISHABLE_KEY (starts with pk_live_)
- [ ] STRIPE_SECRET_KEY (starts with sk_live_)
- [ ] STRIPE_WEBHOOK_SECRET (starts with whsec_)

### Phase 3: Update Supabase Secrets (2 minutes)

#### Step 3.1: Add Supabase Vault Secrets
```bash
# 1. Go to Supabase Dashboard
# 2. Settings > Vault
# 3. Add these secrets:

Name: STRIPE_SECRET_KEY
Value: sk_live_[your_key]

Name: STRIPE_WEBHOOK_SECRET  
Value: whsec_[your_secret]
```

### Phase 4: Deploy Application (2 minutes)

#### Step 4.1: Trigger Deployment
```bash
# Option A: Git Push
git add .
git commit -m "Configure live Stripe keys for production"
git push origin main

# Option B: Manual Redeploy
# Vercel Dashboard > Deployments > Redeploy Latest
```

#### Step 4.2: Wait for Deployment
- [ ] Vercel deployment completes successfully
- [ ] No build errors in deployment logs

### Phase 5: Validate Payment Flow (3 minutes)

#### Step 5.1: Test Payment Page
```bash
# 1. Visit: https://[your-domain]/profile#payment
# 2. Open browser console (F12)
# 3. Check for errors:
```

#### Step 5.2: Success Criteria
- [ ] No "Invalid API Key" errors in console
- [ ] Stripe Elements load correctly
- [ ] Payment method form appears
- [ ] No 401/403 errors in network tab

#### Step 5.3: Test Payment Method Addition
- [ ] Click "Add Payment Method"
- [ ] Enter test card: 4242 4242 4242 4242
- [ ] Form submits without errors
- [ ] Success message appears

### Phase 6: Production Validation (2 minutes)

#### Step 6.1: Run Validation Script
```bash
npm run validate-stripe-production
```

#### Step 6.2: Check Stripe Dashboard
- [ ] Webhook events appear in Stripe logs
- [ ] No failed webhook deliveries
- [ ] Customer/payment method created successfully

## ✅ Deployment Complete Checklist

- [ ] Live Stripe keys obtained from dashboard
- [ ] Vercel environment variables updated
- [ ] Supabase secrets configured
- [ ] Application redeployed successfully
- [ ] Payment flow tested end-to-end
- [ ] No API key errors in production
- [ ] Stripe webhook events processing

## 🚨 If Issues Occur

### Common Problems:
1. **"Invalid API Key"** → Check key format (pk_live_, sk_live_)
2. **"No such customer"** → Verify webhook secret matches
3. **CORS errors** → Check Stripe domain settings
4. **Deployment fails** → Check environment variable syntax

### Emergency Rollback:
```bash
# If production breaks, quickly revert to test keys:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_[backup_key]
```

## 📞 Support Resources
- Stripe Dashboard: https://dashboard.stripe.com/
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard

**Total Execution Time: ~15 minutes**
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
