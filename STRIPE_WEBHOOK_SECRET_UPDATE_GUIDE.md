# Stripe Webhook Secret Update Guide

## Current Status
The `stripe-webhook` Edge Function is properly configured to use the `STRIPE_WEBHOOK_SECRET` environment variable.

## New Webhook Secret
```
whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o
```

## Steps to Update

### Option 1: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** → **Secrets**
4. Find `STRIPE_WEBHOOK_SECRET`
5. Click **Edit** and update the value to: `whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o`
6. Click **Save**
7. The function will automatically use the new secret on next invocation

### Option 2: Supabase CLI
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o
```

## Verification
The stripe-webhook function at `supabase/functions/stripe-webhook/index.ts` already:
- ✅ Uses `serverConfig.stripeWebhookSecret` which reads from `STRIPE_WEBHOOK_SECRET`
- ✅ Validates the secret is present via `validateRequiredSecrets()`
- ✅ Uses it to verify webhook signatures: `stripe.webhooks.constructEvent(body, signature, serverConfig.stripeWebhookSecret)`

## No Code Changes Needed
The function code is already correct and will automatically use the updated secret once you change it in Supabase.

## Testing
After updating the secret, test with:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/stripe-webhook \
  -H "stripe-signature: test" \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```
