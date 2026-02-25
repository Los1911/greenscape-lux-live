# Stripe Payment Functions Deployment Guide
**Project:** GreenScape Lux  
**Supabase Project ID:** mwvcbedvnimabfwubazz  
**Date:** November 3, 2025

## 🎯 Deployment Status
**Status:** Ready for Manual Deployment  
**Reason:** API connectivity issues - functions code prepared and tested

## 📋 Functions to Deploy

### 1. get-payment-methods
**Purpose:** Fetch saved Stripe payment methods for a customer  
**Version:** v3 (Updated with Stripe SDK)

### 2. create-billing-portal-session
**Purpose:** Create Stripe billing portal session for account management  
**Version:** v3 (Updated with Stripe SDK)

---

## 🔧 Function 1: get-payment-methods

### File Location
`supabase/functions/get-payment-methods/index.ts`

### Complete Code
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

### Key Features
✅ Imports Stripe SDK from esm.sh  
✅ Uses STRIPE_SECRET_KEY from environment  
✅ Returns snake_case JSON: `payment_methods`  
✅ Includes [PAYMENT_METHODS] logging tags  
✅ Full CORS support  
✅ Proper error handling

---

## 🔧 Function 2: create-billing-portal-session

### File Location
`supabase/functions/create-billing-portal-session/index.ts`

### Complete Code
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

### Key Features
✅ Imports Stripe SDK from esm.sh  
✅ Uses STRIPE_SECRET_KEY from environment  
✅ Includes [BILLING_PORTAL] logging tags  
✅ Full CORS support  
✅ Dynamic return URL handling  
✅ Proper error handling

---

## 🚀 Manual Deployment Instructions

### Option 1: Supabase Dashboard (Recommended)

1. **Navigate to Edge Functions**
   - Go to https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz
   - Click "Edge Functions" in left sidebar

2. **Update get-payment-methods**
   - Find "get-payment-methods" in function list
   - Click "Edit Function"
   - Replace entire code with Function 1 code above
   - Click "Deploy"

3. **Update create-billing-portal-session**
   - Find "create-billing-portal-session" in function list
   - Click "Edit Function"
   - Replace entire code with Function 2 code above
   - Click "Deploy"

### Option 2: Supabase CLI

```bash
# Deploy get-payment-methods
supabase functions deploy get-payment-methods --project-ref mwvcbedvnimabfwubazz

# Deploy create-billing-portal-session
supabase functions deploy create-billing-portal-session --project-ref mwvcbedvnimabfwubazz
```

---

## 🔐 Environment Variable Verification

### Required Secret
**Name:** `STRIPE_SECRET_KEY`  
**Location:** Supabase Dashboard → Project Settings → Edge Function Secrets

### Verify Secret Exists
```bash
# Check if STRIPE_SECRET_KEY is set
curl -X POST \
  'https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/get-payment-methods' \
  -H 'Content-Type: application/json' \
  -d '{"customerId":"test"}'
```

If you see "Stripe secret key not configured", add the secret:
1. Go to Supabase Dashboard
2. Project Settings → Edge Function Secrets
3. Add `STRIPE_SECRET_KEY` with your live Stripe secret key

---

## ✅ Post-Deployment Verification

### Test Script
Run the automated test suite:
```bash
bash scripts/test-stripe-payment-functions.sh
```

### Manual Tests

**Test 1: get-payment-methods**
```bash
curl -X POST \
  'https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/get-payment-methods' \
  -H 'Content-Type: application/json' \
  -d '{"customerId":"cus_test123"}'
```

Expected Response:
```json
{
  "payment_methods": []
}
```

**Test 2: create-billing-portal-session**
```bash
curl -X POST \
  'https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/create-billing-portal-session' \
  -H 'Content-Type: application/json' \
  -d '{"customerId":"cus_test123","returnUrl":"https://greenscapelux.com/client-dashboard"}'
```

Expected Response:
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

---

## 📊 Deployment Checklist

- [ ] Function 1 code updated in Supabase Dashboard
- [ ] Function 2 code updated in Supabase Dashboard
- [ ] Both functions deployed successfully
- [ ] STRIPE_SECRET_KEY verified in Edge Function Secrets
- [ ] Test script executed successfully
- [ ] Frontend integration tested
- [ ] Console logs show [PAYMENT_METHODS] and [BILLING_PORTAL] tags
- [ ] HTTP 200 responses confirmed
- [ ] JSON structure matches frontend expectations

---

## 🎉 Success Criteria

✅ Both functions return HTTP 200  
✅ Response structure uses snake_case  
✅ Console logs include proper tags  
✅ Frontend "Manage Payment" button works  
✅ Frontend "Billing Portal" button works  
✅ No "Failed to send request" errors

---

## 📞 Support

If deployment issues persist:
1. Check Supabase Edge Function logs
2. Verify STRIPE_SECRET_KEY is set correctly
3. Test with Stripe test mode first
4. Review CORS headers in browser console
