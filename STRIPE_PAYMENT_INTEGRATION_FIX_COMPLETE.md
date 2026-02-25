# GreenScape Lux - Stripe Payment Integration Fix

## 🎯 Executive Summary

**Status:** ✅ Functions Exist | ⚠️ Configuration Required  
**Root Cause:** Response structure mismatch + Missing Stripe SDK  
**Impact:** Payment methods and billing portal buttons fail with edge function errors  
**Fix Time:** 5 minutes (environment variable + function update)

---

## 🔍 Audit Results

### Function Status
| Function | Status | Version | Endpoint |
|----------|--------|---------|----------|
| `get-payment-methods` | ✅ Deployed | v2 | `5659a7e9-3436-49e8-9bef-ecb8e28950fb` |
| `create-billing-portal-session` | ✅ Deployed | v2 | `6dff836e-7447-4f89-8fbb-7d7f14664ce7` |

### Issues Identified

#### 1. Response Structure Mismatch ❌
**Frontend Expects:**
```typescript
{ success: true, payment_methods: [...] }
```

**Current Function Returns:**
```typescript
{ success: true, paymentMethods: [...] }  // Wrong key name!
```

#### 2. Missing Stripe SDK ❌
- Current: Uses raw `fetch()` API calls
- Required: Stripe SDK from `https://esm.sh/stripe@12.0.0?target=deno`

#### 3. Missing Logging Tags ❌
- No `[PAYMENT_METHODS]` or `[BILLING_PORTAL]` console tags
- Makes debugging difficult

---

## 🔧 Required Fixes

### Fix 1: Update `get-payment-methods` Function

**File:** `supabase/functions/get-payment-methods/index.ts`

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { customerId } = await req.json();
    console.log('[PAYMENT_METHODS] Fetching for customer:', customerId);

    if (!customerId) {
      throw new Error('Customer ID required');
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const methods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    console.log('[PAYMENT_METHODS] Success —', methods.data.length, 'found');

    return new Response(JSON.stringify({
      success: true,
      payment_methods: methods.data  // Correct key name!
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('[PAYMENT_METHODS] Error —', error.message);
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

### Fix 2: Update `create-billing-portal-session` Function

**File:** `supabase/functions/create-billing-portal-session/index.ts`

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { customerId, returnUrl } = await req.json();
    console.log('[BILLING_PORTAL] Creating session for:', customerId);

    if (!customerId) {
      throw new Error('Customer ID required');
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${req.headers.get('origin')}/client-dashboard`
    });

    console.log('[BILLING_PORTAL] Success — Session created');

    return new Response(JSON.stringify({
      success: true,
      url: session.url
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('[BILLING_PORTAL] Error —', error.message);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
```

---

## 🔐 Environment Variable Setup

### Step 1: Verify STRIPE_SECRET_KEY

```bash
# Check if secret exists
supabase secrets list

# Should show:
# STRIPE_SECRET_KEY | sk_live_... or sk_test_...
```

### Step 2: Set STRIPE_SECRET_KEY (if missing)

```bash
# For test mode
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# For production
supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
```

### Step 3: Get Your Stripe Secret Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
3. **NEVER** commit this to git or expose client-side

---

## 🚀 Deployment Instructions

### Option A: Via Supabase CLI

```bash
# Navigate to project
cd /path/to/greenscape-lux

# Deploy updated functions
supabase functions deploy get-payment-methods
supabase functions deploy create-billing-portal-session

# Verify deployment
supabase functions list
```

### Option B: Via Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project `mwvcbedvnimabfwubazz`
3. Navigate to **Edge Functions**
4. Click on `get-payment-methods` → **Edit**
5. Paste updated code → **Deploy**
6. Repeat for `create-billing-portal-session`

---

## ✅ Verification Checklist

### Test 1: Payment Methods Fetch
```bash
curl -X POST \
  https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/get-payment-methods \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{"customerId":"cus_test123"}'

# Expected response:
# {"success":true,"payment_methods":[...]}
```

### Test 2: Billing Portal Session
```bash
curl -X POST \
  https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/create-billing-portal-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{"customerId":"cus_test123","returnUrl":"https://app.deploypad.app/client-dashboard"}'

# Expected response:
# {"success":true,"url":"https://billing.stripe.com/session/..."}
```

### Test 3: Frontend Integration
1. Log in as a client
2. Go to Client Dashboard
3. Click **"Manage Payment Methods"**
4. Check browser console for `[PAYMENT_METHODS] Success` log
5. Click **"Open Stripe Billing Portal"**
6. Check console for `[BILLING_PORTAL] Success` log
7. Verify redirect to Stripe portal

---

## 🐛 Troubleshooting

### Error: "Stripe secret key not configured"
**Solution:** Set STRIPE_SECRET_KEY environment variable
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY
```

### Error: "Failed to send request to Edge Function"
**Causes:**
1. Function not deployed
2. CORS headers missing
3. Network/firewall blocking request

**Solution:**
```bash
# Redeploy functions
supabase functions deploy get-payment-methods
supabase functions deploy create-billing-portal-session
```

### Error: "payment_methods is undefined"
**Cause:** Response structure mismatch  
**Solution:** Ensure function returns `payment_methods` not `paymentMethods`

### Console shows 401 Unauthorized
**Cause:** Missing or invalid Supabase anon key  
**Solution:** Check `VITE_SUPABASE_ANON_KEY` in `.env`

---

## 📊 Success Metrics

After deployment, you should see:
- ✅ No console errors when clicking "Manage Payment Methods"
- ✅ Payment methods list loads successfully
- ✅ "Open Stripe Billing Portal" redirects to Stripe
- ✅ Console logs show `[PAYMENT_METHODS] Success` and `[BILLING_PORTAL] Success`
- ✅ No "Failed to send request" errors

---

## 🔒 Security Notes

### ✅ Secure (Current Implementation)
- STRIPE_SECRET_KEY stored in Supabase secrets
- Edge functions run server-side
- No keys exposed to client
- CORS properly configured

### ⚠️ Never Do This
```typescript
// ❌ NEVER expose secret key client-side
const stripe = new Stripe('sk_live_EXPOSED_KEY');

// ❌ NEVER commit keys to git
STRIPE_SECRET_KEY=sk_live_abc123

// ❌ NEVER use secret key in frontend
import { STRIPE_SECRET_KEY } from './config';
```

---

## 📞 Support

If issues persist after following this guide:

1. Check Supabase Edge Function logs:
   ```bash
   supabase functions logs get-payment-methods
   supabase functions logs create-billing-portal-session
   ```

2. Verify Stripe Dashboard for API errors:
   - [Stripe Logs](https://dashboard.stripe.com/logs)

3. Check browser console for detailed error messages

---

**Last Updated:** 2025-11-02  
**Status:** Ready for Deployment  
**Estimated Fix Time:** 5 minutes
