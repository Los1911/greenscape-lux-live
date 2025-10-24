# 🚨 CRITICAL: Stripe Production Keys Setup Guide

## IMMEDIATE ACTION REQUIRED - BLOCKING PRODUCTION LAUNCH

GreenScape Lux payment processing is **COMPLETELY BROKEN** due to placeholder Stripe keys. This must be fixed immediately.

## Current Status ❌
```bash
# PLACEHOLDER VALUES (BREAKING PAYMENTS)
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
VITE_STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# LIVE KEY READY ✅
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK
```

## Step 1: Get Stripe Live Keys 🔑

### 1.1 Access Stripe Dashboard
1. Go to https://dashboard.stripe.com/apikeys
2. Ensure you're in **LIVE** mode (toggle in top-left)
3. Copy the **Secret key** (starts with `sk_live_`)

### 1.2 Create Webhook Endpoint
1. Go to https://dashboard.stripe.com/webhooks
2. Click **+ Add endpoint**
3. Set URL: `https://mwvcbedvnimabfwubazz.functions.supabase.co/stripe-webhook-handler`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)

## Step 2: Update Environment Variables 🔧

### 2.1 Vercel Production Environment
```bash
# Go to: https://vercel.com/your-team/greenscapelux/settings/environment-variables

# Replace these IMMEDIATELY:
STRIPE_SECRET_KEY=sk_live_[YOUR_ACTUAL_SECRET_KEY]
VITE_STRIPE_WEBHOOK_SECRET=whsec_[YOUR_ACTUAL_WEBHOOK_SECRET]
```

### 2.2 Supabase Edge Functions
```bash
# Go to: https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz/settings/secrets

# Add these secrets:
STRIPE_SECRET_KEY=sk_live_[YOUR_ACTUAL_SECRET_KEY]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR_ACTUAL_WEBHOOK_SECRET]
```

## Step 3: Deploy Changes 🚀

### 3.1 Trigger Vercel Redeploy
```bash
# Force redeploy with new environment variables
git commit --allow-empty -m "Force redeploy with live Stripe keys"
git push origin main
```

### 3.2 Verify Deployment
1. Check Vercel deployment logs
2. Test payment flow end-to-end
3. Verify webhook receives events

## Step 4: Test Payment Flow 💳

### 4.1 Test Cards (Safe for Live Mode)
```bash
# Visa (Success)
4242 4242 4242 4242

# Visa (Decline)
4000 0000 0000 0002
```

### 4.2 Verification Checklist
- [ ] Payment form loads without errors
- [ ] Test payment processes successfully
- [ ] Webhook receives payment events
- [ ] Commission calculation works correctly
- [ ] Email notifications sent

## CRITICAL TIMELINE ⏰

**MUST BE COMPLETED WITHIN 2 HOURS**

- **0-30 min**: Get live keys from Stripe dashboard
- **30-60 min**: Update Vercel + Supabase environment variables
- **60-90 min**: Deploy and test payment flow
- **90-120 min**: Verify webhook functionality

## Emergency Contacts 📞

If issues arise:
1. Check Vercel deployment logs
2. Check Supabase Edge Function logs
3. Check Stripe webhook logs
4. Contact development team immediately

**STATUS**: 🚨 CRITICAL - BLOCKING PRODUCTION LAUNCH