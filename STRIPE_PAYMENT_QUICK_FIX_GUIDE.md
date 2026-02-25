# 🚀 Stripe Payment Quick Fix Guide
**GreenScape Lux - 5-Minute Fix**

## ⚡ Quick Summary
**Problem:** Payment methods not loading, billing portal button fails  
**Root Cause:** Response structure mismatch (camelCase vs snake_case)  
**Fix Time:** 5 minutes  
**Status:** Ready to deploy

---

## 🎯 3-Step Fix

### Step 1: Open Supabase Dashboard (1 min)
1. Go to https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz
2. Click "Edge Functions" in left sidebar
3. You'll see both functions listed

### Step 2: Update get-payment-methods (2 min)
1. Click on "get-payment-methods"
2. Click "Edit Function"
3. Replace ALL code with this:

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

4. Click "Deploy" button
5. Wait for green success message

### Step 3: Update create-billing-portal-session (2 min)
1. Click on "create-billing-portal-session"
2. Click "Edit Function"
3. Replace ALL code with this:

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

4. Click "Deploy" button
5. Wait for green success message

---

## ✅ Verify Fix Works

### Test in Browser Console
1. Open your GreenScape Lux site
2. Open browser console (F12)
3. Go to Client Dashboard
4. Click "Manage Payment Methods"
5. You should see:
   - ✅ No errors
   - ✅ Payment methods load (or empty state if none)
   - ✅ Console shows: `[PAYMENT_METHODS] Fetching for customer: cus_...`

### Test Billing Portal
1. Click "Billing Portal" button
2. You should see:
   - ✅ Redirects to Stripe billing portal
   - ✅ Console shows: `[BILLING_PORTAL] Creating session for customer: cus_...`

---

## 🔧 What Changed?

### Key Fix #1: Response Structure
**Before:** `{ paymentMethods: [...] }` (camelCase)  
**After:** `{ payment_methods: [...] }` (snake_case)

**Why:** Frontend expects snake_case, was getting camelCase

### Key Fix #2: Stripe SDK
**Before:** Manual fetch API calls  
**After:** Official Stripe SDK from esm.sh

**Why:** More reliable, better error handling, type-safe

### Key Fix #3: Logging
**Before:** Generic console logs  
**After:** Tagged logs with [PAYMENT_METHODS] and [BILLING_PORTAL]

**Why:** Easier debugging and monitoring

---

## 🚨 Troubleshooting

### Error: "Stripe secret key not configured"
**Fix:** Add STRIPE_SECRET_KEY to Edge Function Secrets
1. Supabase Dashboard → Project Settings
2. Edge Function Secrets
3. Add new secret: `STRIPE_SECRET_KEY`
4. Value: Your live Stripe secret key (starts with `sk_live_`)

### Error: "Customer ID is required"
**Fix:** Ensure user has `stripe_customer_id` in database
1. Check `users` or `clients` table
2. Verify `stripe_customer_id` column exists and has value

### Still Not Working?
1. Check Supabase Edge Function logs
2. Look for [PAYMENT_METHODS] or [BILLING_PORTAL] in logs
3. Verify STRIPE_SECRET_KEY is set correctly
4. Try with Stripe test mode first (use `sk_test_` key)

---

## 📊 Success Checklist

- [ ] Deployed get-payment-methods v3
- [ ] Deployed create-billing-portal-session v3
- [ ] Tested "Manage Payment Methods" button
- [ ] Tested "Billing Portal" button
- [ ] No console errors
- [ ] Logs show proper tags
- [ ] Payment methods load correctly

---

## 🎉 Done!

Your Stripe payment integration is now fixed and ready to use!

**Next Steps:**
- Monitor Edge Function logs for any issues
- Test with real customers
- Consider adding payment method management features

**Need Help?**
- Check full documentation: `STRIPE_PAYMENT_FUNCTIONS_DEPLOYMENT.md`
- Review verification log: `STRIPE_INTEGRATION_VERIFICATION_LOG.md`
- Run test suite: `bash scripts/test-stripe-payment-functions.sh`
