# Stripe Webhook Secret Update Instructions

## Current Status
- **Project ID**: mwvcbedvnimabfwubazz
- **New Webhook Secret**: `whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o`
- **Function**: stripe-webhook (already configured to use STRIPE_WEBHOOK_SECRET)

## Important Note
The stripe-webhook function is already properly configured to read `STRIPE_WEBHOOK_SECRET` from environment variables. **No code changes or redeployment are needed** - the function will automatically use the new secret once you update it in Supabase.

## Method 1: Update via Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz)
2. Navigate to **Edge Functions** in the left sidebar
3. Click on **Manage Secrets** or **Secrets** tab
4. Find `STRIPE_WEBHOOK_SECRET` in the list
5. Click **Edit** or the pencil icon
6. Replace the value with: `whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o`
7. Click **Save** or **Update**

## Method 2: Update via Supabase CLI

```bash
# Set the new webhook secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o --project-ref mwvcbedvnimabfwubazz
```

## Verification

After updating the secret, test the webhook:

```bash
# Test webhook endpoint
curl -X POST https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=1234567890,v1=test" \
  -d '{"type":"test.event","data":{"object":{}}}'
```

## Stripe Dashboard Configuration

After updating the secret in Supabase, configure the webhook in Stripe:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Set endpoint URL: `https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. The webhook signing secret shown should match: `whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o`

## Function Details

The stripe-webhook function automatically reads the secret:
```typescript
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
```

This means it will immediately use the updated value without any redeployment.
