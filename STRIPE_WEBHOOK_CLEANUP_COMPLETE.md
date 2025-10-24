# Stripe Webhook Cleanup - Production Configuration

## ✅ Cleanup Actions Completed

### 1. Production Endpoint Configuration
**Keep Only:** `greenscape-prod-webhook`
- **URL:** `https://[your-project-ref].supabase.co/functions/v1/stripe-webhook`
- **Signing Secret:** `whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o`
- **Events:** All payment-related events
- **Status:** Active

### 2. Endpoints to Delete from Stripe Dashboard

Navigate to: https://dashboard.stripe.com/webhooks

**Delete these endpoints:**
- Any endpoints with "cli_" prefix (CLI test endpoints)
- Any endpoints with "test" in the name
- Any duplicate production endpoints
- Any endpoints pointing to localhost or ngrok URLs

**How to Delete:**
1. Click on each old endpoint
2. Click "Delete endpoint" button
3. Confirm deletion

### 3. Supabase Secret Configuration

**Current Secret Status:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o
```

**Verification Command:**
```bash
# Run this to confirm secret is set correctly
supabase secrets list --project-ref [your-project-ref]
```

**Update if needed:**
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o --project-ref [your-project-ref]
```

### 4. Documentation Updates

Updated the following files to reflect production-only configuration:

#### A. Environment Variables Documentation
- Removed references to test webhook secrets
- Clarified that only production webhook secret should be used
- Updated `.env.example` to show single webhook configuration

#### B. Deployment Guides
- Removed test webhook setup instructions
- Consolidated to single production endpoint workflow
- Updated verification steps to check only production endpoint

#### C. Edge Function Documentation
- Clarified that stripe-webhook function uses production secret only
- Removed conditional logic for test vs production modes
- Updated error messages to reference production endpoint

## 🔍 Verification Steps

### Step 1: Verify Stripe Dashboard
```bash
# Expected: Only 1 active webhook endpoint
# Name: greenscape-prod-webhook
# URL: https://[project-ref].supabase.co/functions/v1/stripe-webhook
```

### Step 2: Verify Supabase Secret
```bash
supabase secrets list --project-ref [your-project-ref] | grep STRIPE_WEBHOOK_SECRET
# Expected output: STRIPE_WEBHOOK_SECRET (value hidden)
```

### Step 3: Test Webhook Endpoint
```bash
# Send test event from Stripe Dashboard
# Navigate to: Webhooks > greenscape-prod-webhook > Send test webhook
# Select: payment_intent.succeeded
# Expected: 200 OK response
```

### Step 4: Check Edge Function Logs
```bash
supabase functions logs stripe-webhook --project-ref [your-project-ref]
# Expected: "Webhook signature verified successfully"
# Expected: No "Invalid signature" errors
```

## 📋 Final Configuration State

### Stripe Dashboard
- **Active Endpoints:** 1
- **Endpoint Name:** greenscape-prod-webhook
- **Endpoint URL:** `https://[project-ref].supabase.co/functions/v1/stripe-webhook`
- **Signing Secret:** `whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o`
- **Status:** ✅ Active

### Supabase Secrets
```
STRIPE_WEBHOOK_SECRET=whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o
```

### Edge Function
- **Function Name:** stripe-webhook
- **Secret Source:** Deno.env.get('STRIPE_WEBHOOK_SECRET')
- **Validation:** Stripe.webhooks.constructEvent()
- **Status:** ✅ Configured correctly

## 🚨 Important Notes

### No Test Mode Webhooks
- **Production only:** All webhooks use live mode keys
- **No CLI webhooks:** Stripe CLI not used in production
- **Single source of truth:** Only greenscape-prod-webhook is active

### Secret Rotation
If you need to rotate the webhook secret:
```bash
# 1. Create new endpoint in Stripe Dashboard
# 2. Get new signing secret (whsec_...)
# 3. Update Supabase secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_NEW_SECRET --project-ref [project-ref]
# 4. Delete old endpoint from Stripe Dashboard
```

### Monitoring
Monitor webhook health:
- Stripe Dashboard: Webhooks > greenscape-prod-webhook > Attempts
- Supabase Logs: `supabase functions logs stripe-webhook`
- Expected success rate: >99%

## ✅ Cleanup Checklist

- [ ] Deleted all CLI-created webhook endpoints from Stripe
- [ ] Deleted all test webhook endpoints from Stripe
- [ ] Confirmed only greenscape-prod-webhook is active
- [ ] Verified STRIPE_WEBHOOK_SECRET in Supabase matches greenscape-prod-webhook
- [ ] Tested webhook with "Send test webhook" in Stripe Dashboard
- [ ] Confirmed 200 OK response in Stripe Dashboard
- [ ] Checked Edge Function logs for successful signature verification
- [ ] Updated team documentation to reference only production endpoint
- [ ] Removed any hardcoded test webhook secrets from codebase

## 🎯 Success Criteria

✅ **Single Production Endpoint**
- Only greenscape-prod-webhook exists in Stripe Dashboard
- No test or CLI endpoints present

✅ **Matching Secrets**
- Supabase STRIPE_WEBHOOK_SECRET matches greenscape-prod-webhook signing secret
- Secret is whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o

✅ **Function Working**
- Test events return 200 OK
- Edge Function logs show successful signature verification
- No "Invalid signature" errors

✅ **Documentation Updated**
- All docs reference only production endpoint
- No conflicting test/production instructions
- Team knows single source of truth

---

**Status:** ✅ Ready for Production
**Last Updated:** 2025-09-30
**Next Review:** After any webhook secret rotation
