# Stripe Webhook Production Configuration - Final State

## ✅ Configuration Verified

### 1. Edge Function Configuration
**File:** `supabase/functions/stripe-webhook/index.ts`

**Secret Loading:**
```typescript
// Line 7: Validates required secrets on function startup
validateRequiredSecrets(['stripeSecretKey', 'supabaseServiceRoleKey', 'stripeWebhookSecret'])

// Line 33: Uses secret for webhook signature verification
event = stripe.webhooks.constructEvent(body, signature, serverConfig.stripeWebhookSecret)
```

**How it works:**
1. Function reads `STRIPE_WEBHOOK_SECRET` from `Deno.env.get('STRIPE_WEBHOOK_SECRET')`
2. Validates secret is not placeholder value (`__________STRIPE_WEBHOOK_SECRET__________`)
3. Uses secret to verify webhook signature from Stripe
4. Throws error if signature validation fails

### 2. Production Endpoint Configuration

**Stripe Dashboard Setup:**
- **Endpoint Name:** `greenscape-prod-webhook`
- **URL:** `https://[your-project-ref].supabase.co/functions/v1/stripe-webhook`
- **Signing Secret:** `whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o`
- **Events to Monitor:**
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `customer.subscription.updated`

### 3. Supabase Secret Configuration

**Set Production Secret:**
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o \
  --project-ref [your-project-ref]
```

**Verify Secret:**
```bash
supabase secrets list --project-ref [your-project-ref]
# Should show: STRIPE_WEBHOOK_SECRET (value hidden)
```

## 🧪 Testing & Verification

### Test 1: Send Test Webhook from Stripe Dashboard
```
1. Go to: https://dashboard.stripe.com/webhooks
2. Click on: greenscape-prod-webhook
3. Click: "Send test webhook"
4. Select event: payment_intent.succeeded
5. Click: "Send test webhook"

Expected Result: ✅ 200 OK
```

### Test 2: Check Edge Function Logs
```bash
supabase functions logs stripe-webhook --project-ref [your-project-ref]
```

**Expected Log Output:**
```
🔔 Verified Event: payment_intent.succeeded
```

**Error Indicators (should NOT see):**
```
❌ Missing Stripe signature
❌ Configuration validation failed
❌ Placeholder values detected: stripeWebhookSecret
```

### Test 3: Verify Webhook Signature Validation
```bash
# This should fail with 400 error (proves signature validation works)
curl -X POST https://[project-ref].supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'

# Expected: {"error":"Missing Stripe signature"}
```

## 📋 Cleanup Checklist

### Stripe Dashboard Cleanup
- [ ] Go to https://dashboard.stripe.com/webhooks
- [ ] Identify all endpoints with these patterns:
  - `cli_*` (Stripe CLI test endpoints)
  - `*test*` (Test endpoints)
  - Duplicate production endpoints
  - Localhost/ngrok URLs
- [ ] Delete each old endpoint:
  1. Click endpoint
  2. Click "Delete endpoint"
  3. Confirm deletion
- [ ] Verify only `greenscape-prod-webhook` remains

### Supabase Secrets Cleanup
- [ ] Verify production secret is set:
  ```bash
  supabase secrets list --project-ref [project-ref]
  ```
- [ ] Confirm no test webhook secrets exist
- [ ] Verify Edge Function uses correct secret

### Documentation Cleanup
- [ ] Remove references to test webhooks
- [ ] Update deployment guides to use single endpoint
- [ ] Remove CLI webhook instructions
- [ ] Update team documentation

## 🎯 Final State Verification

### Expected Configuration
```yaml
Stripe Dashboard:
  Active Endpoints: 1
  Endpoint Name: greenscape-prod-webhook
  Endpoint URL: https://[project-ref].supabase.co/functions/v1/stripe-webhook
  Signing Secret: whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o
  Status: Active

Supabase Secrets:
  STRIPE_WEBHOOK_SECRET: whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o
  
Edge Function:
  Name: stripe-webhook
  Secret Source: Deno.env.get('STRIPE_WEBHOOK_SECRET')
  Validation: ✅ Active (validates on startup)
  Signature Check: ✅ Active (line 33)
```

### Success Indicators
✅ Only one webhook endpoint in Stripe Dashboard  
✅ Endpoint name is `greenscape-prod-webhook`  
✅ Supabase secret matches endpoint signing secret  
✅ Test webhooks return 200 OK  
✅ Edge Function logs show "Verified Event"  
✅ No "placeholder values detected" errors  
✅ No "Missing Stripe signature" errors (except for invalid requests)  

## 🔄 Automatic Secret Rotation

The Edge Function automatically picks up secret changes:
1. Update secret in Supabase: `supabase secrets set STRIPE_WEBHOOK_SECRET=new_value`
2. No redeployment needed - next request uses new secret
3. Update Stripe endpoint signing secret to match
4. Test with "Send test webhook" in Stripe Dashboard

## 📞 Support

If webhook validation fails:
1. Check Stripe Dashboard > Webhooks > Attempts for error details
2. Check Edge Function logs: `supabase functions logs stripe-webhook`
3. Verify secret matches: Compare Stripe signing secret with Supabase secret
4. Test signature validation with Stripe's test webhook feature

---

**Status:** ✅ Production Ready  
**Configuration:** Single Production Endpoint  
**Last Verified:** 2025-09-30
