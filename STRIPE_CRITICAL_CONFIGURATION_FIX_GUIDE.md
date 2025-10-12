# 🚨 STRIPE CRITICAL CONFIGURATION FIX GUIDE
*Immediate Action Required - Payment System Currently Broken*

## 🎯 OVERVIEW
Your GreenScape Lux payment system is currently broken due to missing Stripe environment variables. This guide provides step-by-step instructions to fix all critical issues immediately.

## 🔥 CRITICAL ISSUES IDENTIFIED

### 1. **VERCEL ENVIRONMENT VARIABLE MISSING** ❌ BREAKING
- **Issue**: `VITE_STRIPE_PUBLISHABLE_KEY` not set in Vercel production
- **Impact**: Frontend falls back to incorrect hardcoded key
- **Status**: CRITICAL - Payments completely broken

### 2. **SUPABASE SECRETS MISSING** ❌ BREAKING  
- **Issue**: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` not configured
- **Impact**: Backend payment processing fails
- **Status**: CRITICAL - Payment webhooks broken

### 3. **HARDCODED FALLBACK KEY INCORRECT** ⚠️ HIGH
- **Issue**: Wrong fallback key in StripePaymentMethodManager.tsx
- **Impact**: Even when env var is missing, wrong key is used
- **Status**: HIGH - Causes "Invalid API Key" errors

## 🔧 IMMEDIATE FIX INSTRUCTIONS

### STEP 1: Fix Vercel Environment Variables (5 minutes)

1. **Go to Vercel Dashboard**:
   ```
   https://vercel.com/dashboard → Your Project → Settings → Environment Variables
   ```

2. **Add Missing Variable**:
   - **Name**: `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Value**: `pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK`
   - **Environment**: Production (and Preview if needed)
   - **Click**: "Save"

3. **Trigger Redeploy**:
   - Go to Deployments tab
   - Click "Redeploy" on latest deployment
   - OR push any commit to trigger auto-deploy

### STEP 2: Configure Supabase Secrets (10 minutes)

1. **Get Your Stripe Keys**:
   - Go to: https://dashboard.stripe.com/apikeys
   - Copy your **Secret Key** (starts with `sk_live_`)
   - Note: You already have the publishable key configured

2. **Create Webhook (if not exists)**:
   - Go to: https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - URL: `https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/stripe-webhook`
   - Events: Select `payment_intent.succeeded` and `payment_intent.payment_failed`
   - Click "Add endpoint"
   - Copy the **Webhook Secret** (starts with `whsec_`)

3. **Add to Supabase**:
   - Go to: https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz/settings/secrets
   - Add secret: `STRIPE_SECRET_KEY` = `sk_live_[YOUR_ACTUAL_SECRET_KEY]`
   - Add secret: `STRIPE_WEBHOOK_SECRET` = `whsec_[YOUR_ACTUAL_WEBHOOK_SECRET]`
   - Click "Save"

### STEP 3: Fix Hardcoded Fallback Key (2 minutes)

**File to Update**: `src/components/client/StripePaymentMethodManager.tsx`

**Current Line 12**:
```typescript
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51S1Ht0K6kWkUsxtpyGP3sA3D3F15hFYBvYRoO65PzWD8qeZIx9ucf6S3wAGthJjZMlaBYTXGinrA5cCAGL4Soz00DoQWMmBu');
```

**Update to**:
```typescript
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK');
```

## 🧪 VERIFICATION STEPS

### 1. Test Environment Variables
```bash
# In browser console on production site:
console.log('VITE_STRIPE_PUBLISHABLE_KEY:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
# Should output: pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK
```

### 2. Test Payment Method Addition
- Go to your production site
- Navigate to payment method management
- Try to add a payment method
- Should complete without "Invalid API Key" errors

### 3. Check Supabase Edge Functions
- Go to Supabase Dashboard → Edge Functions → Logs
- Look for any Stripe-related errors
- Should see successful API calls

## 📋 COMPLETION CHECKLIST

### ✅ Immediate Fixes (Complete Today):
- [ ] Added `VITE_STRIPE_PUBLISHABLE_KEY` to Vercel production environment
- [ ] Redeployed application from Vercel dashboard
- [ ] Added `STRIPE_SECRET_KEY` to Supabase secrets
- [ ] Added `STRIPE_WEBHOOK_SECRET` to Supabase secrets
- [ ] Updated hardcoded fallback key in StripePaymentMethodManager.tsx
- [ ] Verified payment method addition works without errors

### ✅ Verification Tests:
- [ ] Browser console shows correct publishable key
- [ ] Payment method addition completes successfully
- [ ] No "Invalid API Key" errors in browser console
- [ ] Supabase edge function logs show successful Stripe calls
- [ ] Stripe dashboard shows API activity from your domain

## 🚨 TROUBLESHOOTING

### If Payment Method Addition Still Fails:

1. **Clear Browser Cache**:
   - Hard refresh (Ctrl+F5 or Cmd+Shift+R)
   - Clear site data in browser dev tools

2. **Check Network Tab**:
   - Open browser dev tools → Network tab
   - Try adding payment method
   - Look for failed requests with 401/403 status codes

3. **Verify Key Format**:
   - Publishable key should be exactly 107 characters
   - Should start with `pk_live_51S1Ht0K6kWkUsxtpuh`

### If Webhooks Still Fail:

1. **Check Supabase Logs**:
   - Go to Supabase → Edge Functions → stripe-webhook → Logs
   - Look for authentication errors

2. **Verify Webhook URL**:
   - Should be: `https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/stripe-webhook`
   - Test URL accessibility in browser

## 📞 SUPPORT

If issues persist after following this guide:
1. Check browser console for specific error messages
2. Review Supabase edge function logs
3. Verify all keys are copied exactly without extra spaces
4. Ensure webhook endpoint is accessible and responding

---

**⏰ ESTIMATED TIME TO COMPLETE**: 15-20 minutes
**🎯 PRIORITY**: CRITICAL - Fix immediately to restore payment functionality