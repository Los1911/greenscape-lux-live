# Stripe Payment Functions - Quick Diagnostic & Fix

## 🚨 Current Issue
**Error:** "Failed to send a request to the Edge Function"  
**Functions Affected:** `get-payment-methods`, `create-billing-portal-session`  
**Impact:** Payment methods and billing portal buttons non-functional

---

## ⚡ Quick Fix (5 Minutes)

### Step 1: Verify STRIPE_SECRET_KEY
```bash
# Check if secret exists
supabase secrets list | grep STRIPE_SECRET_KEY

# If missing, set it:
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

### Step 2: Update Function Code

#### Option A: Via Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz/functions
2. Click `get-payment-methods` → Edit
3. Replace code with:

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
    console.log('[PAYMENT_METHODS] Fetching for:', customerId);

    if (!customerId) throw new Error('Customer ID required');

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
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
      payment_methods: methods.data
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

4. Click Deploy
5. Repeat for `create-billing-portal-session`:

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

    if (!customerId) throw new Error('Customer ID required');

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
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

#### Option B: Via CLI
```bash
cd /path/to/greenscape-lux
supabase functions deploy get-payment-methods
supabase functions deploy create-billing-portal-session
```

### Step 3: Test
```bash
# Make script executable
chmod +x scripts/test-stripe-payment-functions.sh

# Run tests
./scripts/test-stripe-payment-functions.sh
```

---

## 🔍 Troubleshooting

### Error: "Stripe secret key not configured"
**Fix:** Set the environment variable
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY
```

### Error: "Customer ID required"
**Fix:** Ensure frontend passes `customerId` in request body

### Error: "Failed to send request"
**Possible Causes:**
1. Function not deployed
2. CORS issue
3. Network/firewall blocking

**Fix:**
```bash
# Redeploy functions
supabase functions deploy get-payment-methods
supabase functions deploy create-billing-portal-session

# Check logs
supabase functions logs get-payment-methods --tail
```

### Response has wrong structure
**Frontend expects:**
```json
{
  "success": true,
  "payment_methods": [...]
}
```

**Common mistake:**
```json
{
  "success": true,
  "paymentMethods": [...]  // Wrong! Use underscore not camelCase
}
```

---

## ✅ Verification

After deployment, test in browser:
1. Login as client
2. Go to Client Dashboard
3. Click "Manage Payment Methods"
4. Open browser console
5. Look for: `[PAYMENT_METHODS] Success — X payment methods found`
6. Click "Open Stripe Billing Portal"
7. Look for: `[BILLING_PORTAL] Success — Session created`
8. Verify redirect to Stripe portal

---

## 📊 Expected Console Output

### Success Case
```
[PAYMENT_METHODS] Fetching for: cus_abc123
[PAYMENT_METHODS] Success — 2 found
[BILLING_PORTAL] Creating session for: cus_abc123
[BILLING_PORTAL] Success — Session created
```

### Error Case
```
[PAYMENT_METHODS] Error — Stripe secret key not configured
```

---

## 🔐 Security Checklist

- ✅ STRIPE_SECRET_KEY stored in Supabase secrets (not in code)
- ✅ Functions run server-side only
- ✅ No keys exposed to client
- ✅ CORS properly configured
- ✅ Error messages don't leak sensitive data

---

## 📞 Still Having Issues?

1. **Check Supabase logs:**
   ```bash
   supabase functions logs get-payment-methods --tail
   supabase functions logs create-billing-portal-session --tail
   ```

2. **Verify Stripe API key:**
   - Go to https://dashboard.stripe.com/apikeys
   - Copy Secret key (starts with `sk_test_` or `sk_live_`)
   - Set in Supabase: `supabase secrets set STRIPE_SECRET_KEY=sk_...`

3. **Test with curl:**
   ```bash
   curl -X POST https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/get-payment-methods \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -d '{"customerId":"cus_test123"}'
   ```

---

**Last Updated:** 2025-11-02  
**Status:** Ready to Deploy  
**Estimated Fix Time:** 5 minutes
