# GreenScape Lux Stripe Integration Deployment Guide

## Status: Ready for Manual Deployment
**Date:** November 3, 2025  
**Project:** mwvcbedvnimabfwubazz  
**Issue:** API connectivity preventing automated deployment

---

## 🚨 Critical Fixes Required

### Issue Summary
- Frontend expects `payment_methods` (snake_case) but function returns `paymentMethods` (camelCase)
- Missing Stripe SDK imports (using fetch API instead)
- Missing [PAYMENT_METHODS] and [BILLING_PORTAL] logging tags
- STRIPE_SECRET_KEY may not be configured

---

## 📋 Manual Deployment Steps

### Step 1: Update get-payment-methods Function

Navigate to Supabase Dashboard → Edge Functions → `get-payment-methods`

Replace entire function code with:

```typescript
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { customerId } = await req.json();
    console.log('[PAYMENT_METHODS] Fetching payment methods for customer:', customerId);

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('[PAYMENT_METHODS] Error: STRIPE_SECRET_KEY not configured');
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    console.log('[PAYMENT_METHODS] Success — Found', paymentMethods.data.length, 'payment methods');

    return new Response(JSON.stringify({
      success: true,
      payment_methods: paymentMethods.data || []
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('[PAYMENT_METHODS] Error:', error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      payment_methods: []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
```

Click **Deploy** button.

---

### Step 2: Update create-billing-portal-session Function

Navigate to Supabase Dashboard → Edge Functions → `create-billing-portal-session`

Replace entire function code with:

```typescript
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { customerId, returnUrl } = await req.json();
    console.log('[BILLING_PORTAL] Creating billing portal session for customer:', customerId);

    if (!customerId) {
      console.error('[BILLING_PORTAL] Error: Customer ID is required');
      return new Response(
        JSON.stringify({ error: 'Customer ID is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('[BILLING_PORTAL] Error: STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${req.headers.get('origin')}/client-dashboard`
    });

    console.log('[BILLING_PORTAL] Success — Session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('[BILLING_PORTAL] Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});
```

Click **Deploy** button.

---

## 🔐 Step 3: Verify STRIPE_SECRET_KEY

1. Go to Supabase Dashboard → Project Settings → Edge Functions
2. Click **Manage secrets**
3. Verify `STRIPE_SECRET_KEY` exists
4. If missing, add it:
   - Name: `STRIPE_SECRET_KEY`
   - Value: Your Stripe secret key (starts with `sk_live_` or `sk_test_`)
5. Click **Save**

---

## ✅ Step 4: Test Deployment

Run test script:
```bash
bash scripts/test-stripe-payment-functions.sh
```

Or test manually with curl:

```bash
# Test get-payment-methods
curl -X POST https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/get-payment-methods \
  -H "Content-Type: application/json" \
  -d '{"customerId":"cus_test123"}'

# Expected: {"success":true,"payment_methods":[...]}

# Test create-billing-portal-session
curl -X POST https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/create-billing-portal-session \
  -H "Content-Type: application/json" \
  -d '{"customerId":"cus_test123"}'

# Expected: {"url":"https://billing.stripe.com/..."}
```

---

## 📊 Expected Results

### Success Indicators
- ✅ Both functions return HTTP 200
- ✅ Console shows `[PAYMENT_METHODS]` and `[BILLING_PORTAL]` logs
- ✅ Response structure matches frontend expectations
- ✅ No CORS errors in browser console
- ✅ "Manage Payment" button works
- ✅ "Open Stripe Billing Portal" button works

### Failure Indicators
- ❌ "Failed to send a request to the Edge Function"
- ❌ CORS errors in console
- ❌ "STRIPE_SECRET_KEY not configured"
- ❌ Response structure mismatch

---

## 🔍 Troubleshooting

### Issue: "STRIPE_SECRET_KEY not configured"
**Solution:** Add secret in Supabase Dashboard → Edge Functions → Manage secrets

### Issue: "Failed to send request"
**Solution:** Check CORS headers and function deployment status

### Issue: Response structure mismatch
**Solution:** Verify function returns `payment_methods` (not `paymentMethods`)

---

## 📝 Next Steps

After successful deployment:
1. Document deployment in STRIPE_INTEGRATION_VERIFICATION_LOG.md
2. Test in production with real customer
3. Monitor logs for [PAYMENT_METHODS] and [BILLING_PORTAL] tags
4. Verify no console errors

---

**Deployment Status:** Awaiting manual deployment due to API connectivity issue  
**Priority:** HIGH - Blocking payment functionality
