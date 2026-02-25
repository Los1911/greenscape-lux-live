# Stripe Integration Deployment Execution Guide
**GreenScape Lux - Final Deployment Sequence**  
**Project ID:** mwvcbedvnimabfwubazz  
**Date:** November 3, 2025, 11:59 AM UTC  
**Status:** ⚠️ Manual Deployment Required (API Connectivity Issue)

---

## 🎯 Deployment Status

**API Status:** ❌ Supabase API connectivity issues detected  
**Solution:** ✅ Manual deployment via Supabase Dashboard  
**Functions Ready:** ✅ Both functions code prepared and verified  
**Environment:** ✅ STRIPE_SECRET_KEY confirmed in secrets

---

## 📋 Quick Deployment Steps

### Step 1: Access Supabase Dashboard
1. Navigate to: https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz
2. Click **"Edge Functions"** in the left sidebar
3. Locate the functions list

### Step 2: Deploy get-payment-methods
1. Find **"get-payment-methods"** (currently v2)
2. Click the function name to open editor
3. Click **"Edit Function"** button
4. **Replace entire code** with the code below
5. Click **"Deploy"** and wait for success confirmation

### Step 3: Deploy create-billing-portal-session
1. Find **"create-billing-portal-session"** (currently v2)
2. Click the function name to open editor
3. Click **"Edit Function"** button
4. **Replace entire code** with the code below
5. Click **"Deploy"** and wait for success confirmation

---

## 📝 Function Code to Deploy

### Function 1: get-payment-methods
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { customerId } = await req.json();
    console.log("[PAYMENT_METHODS] Fetching for customer:", customerId);

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const methods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card"
    });

    console.log("[PAYMENT_METHODS] Success —", methods.data.length, "methods found");

    return new Response(
      JSON.stringify({ payment_methods: methods.data }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("[PAYMENT_METHODS] Error —", error.message);
    return new Response(
      JSON.stringify({ error: error.message, payment_methods: [] }),
      {
        status: 400,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        }
      }
    );
  }
});
```

### Function 2: create-billing-portal-session
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { customerId, returnUrl } = await req.json();
    console.log("[BILLING_PORTAL] Creating session for customer:", customerId);

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    const origin = req.headers.get('origin') || 'https://greenscapelux.com';
    const finalReturnUrl = returnUrl || `${origin}/client-dashboard`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: finalReturnUrl,
    });

    console.log("[BILLING_PORTAL] Success — Session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        }
      }
    );
  } catch (error) {
    console.error("[BILLING_PORTAL] Error —", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        }
      }
    );
  }
});
```

---

## ✅ Post-Deployment Verification

### Run Automated Tests
```bash
bash scripts/test-stripe-payment-functions.sh
```

### Manual Verification Commands
```bash
# Test get-payment-methods
curl -X POST \
  'https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/get-payment-methods' \
  -H 'Content-Type: application/json' \
  -d '{"customerId":"cus_test123"}'

# Test create-billing-portal-session
curl -X POST \
  'https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/create-billing-portal-session' \
  -H 'Content-Type: application/json' \
  -d '{"customerId":"cus_test123","returnUrl":"https://greenscapelux.com/client-dashboard"}'
```

---

## 📊 Deployment Checklist

- [ ] Access Supabase Dashboard
- [ ] Deploy get-payment-methods (v3)
- [ ] Deploy create-billing-portal-session (v3)
- [ ] Verify STRIPE_SECRET_KEY in Edge Function Secrets
- [ ] Run test-stripe-payment-functions.sh
- [ ] Confirm HTTP 200 responses
- [ ] Verify JSON structure: `payment_methods` (snake_case)
- [ ] Check console logs for [PAYMENT_METHODS] and [BILLING_PORTAL] tags
- [ ] Test frontend "Manage Payment" button
- [ ] Test frontend "Billing Portal" button
- [ ] Update STRIPE_INTEGRATION_VERIFICATION_LOG.md with results

---

## 🎉 Expected Results

✅ **get-payment-methods** returns: `{"payment_methods": []}`  
✅ **create-billing-portal-session** returns: `{"url": "https://billing.stripe.com/..."}`  
✅ Console logs show proper tags  
✅ Frontend payment buttons work without errors  
✅ No "Failed to send request" errors in browser console
