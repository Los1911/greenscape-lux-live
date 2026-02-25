# Stripe Connect Onboarding - Body Parsing Fix

## ⚠️ CRITICAL ISSUE IDENTIFIED

The `stripe-connect-onboarding` edge function is receiving a **null/empty body** when called from the frontend. This is causing the onboarding flow to fail.

### Evidence from Supabase Logs
- Function boots successfully (shows "Listening on http://localhost:9999/")
- POST requests are reaching the function
- Body is coming in as `null` or empty
- Function shuts down after each invocation

---

## Root Cause Analysis

The edge function deployed in Supabase Dashboard is **not parsing the request body correctly**. 

When `supabase.functions.invoke()` sends a body, it:
1. Serializes the body object to JSON
2. Sends it with `Content-Type: application/json`
3. The edge function must use `await req.json()` or `await req.text()` + `JSON.parse()` to read it

**The deployed function is likely missing this body parsing step.**

---

## Frontend Verification ✅

All frontend components are correctly sending the body:

| Component | Body Sent | Status |
|-----------|-----------|--------|
| `BankingPanel.tsx` (line 118) | `{ userId, email }` | ✅ Correct |
| `StripeConnectOnboardingCard.tsx` (line 85) | `{ email, businessName, userId }` | ✅ Correct |
| `StripePaymentSetup.tsx` (line 23) | `{ userId }` | ✅ Correct |
| `ProfilePanel.tsx` (line 82) | `{ userId, email, businessName }` | ✅ Correct |

**The frontend is NOT the problem.**

---

## Fix Required: Update Edge Function Code

Go to **Supabase Dashboard → Edge Functions → stripe-connect-onboarding** and update the code:

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project (GreenScape Lux Landscaping Project)
3. Click **Edge Functions** in the left sidebar
4. Click on **stripe-connect-onboarding**

### Step 2: Replace the Code

Click the **Code** tab and replace the ENTIRE code with:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[stripe-connect-onboarding] Request received')
    console.log('[stripe-connect-onboarding] Method:', req.method)
    
    // CRITICAL FIX: Parse the request body correctly
    let body: { userId?: string; email?: string; businessName?: string } = {}
    
    try {
      const rawBody = await req.text()
      console.log('[stripe-connect-onboarding] Raw body received:', rawBody)
      
      if (rawBody && rawBody.trim()) {
        body = JSON.parse(rawBody)
        console.log('[stripe-connect-onboarding] Parsed body:', JSON.stringify(body))
      } else {
        console.log('[stripe-connect-onboarding] WARNING: Empty body received')
      }
    } catch (parseError) {
      console.error('[stripe-connect-onboarding] Body parse error:', parseError)
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid request body - could not parse JSON' 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const { userId, email, businessName } = body

    // Validate required fields
    if (!userId) {
      console.error('[stripe-connect-onboarding] Missing userId in body:', JSON.stringify(body))
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required field: userId. Received body: ' + JSON.stringify(body)
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('[stripe-connect-onboarding] Processing for userId:', userId)
    console.log('[stripe-connect-onboarding] Email:', email || 'not provided')
    console.log('[stripe-connect-onboarding] Business Name:', businessName || 'not provided')

    // Get Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      console.error('[stripe-connect-onboarding] STRIPE_SECRET_KEY not configured')
      throw new Error('STRIPE_SECRET_KEY not configured in Edge Function secrets')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[stripe-connect-onboarding] Missing Supabase configuration')
      throw new Error('Missing Supabase configuration')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if landscaper already has a Stripe Connect account
    console.log('[stripe-connect-onboarding] Looking up landscaper for user_id:', userId)
    const { data: landscaper, error: landscaperError } = await supabase
      .from('landscapers')
      .select('id, stripe_connect_id, stripe_onboarding_complete')
      .eq('user_id', userId)
      .single()

    if (landscaperError && landscaperError.code !== 'PGRST116') {
      console.error('[stripe-connect-onboarding] Landscaper lookup error:', landscaperError)
      throw new Error(`Failed to lookup landscaper: ${landscaperError.message}`)
    }

    console.log('[stripe-connect-onboarding] Landscaper found:', landscaper ? 'yes' : 'no')

    let stripeAccountId = landscaper?.stripe_connect_id
    let isNewAccount = false

    // If no existing account, create a new Stripe Connect Express account
    if (!stripeAccountId) {
      console.log('[stripe-connect-onboarding] Creating new Stripe Connect Express account')
      
      const accountParams = new URLSearchParams({
        'type': 'express',
        'country': 'US',
        'email': email || '',
        'business_type': 'individual',
        'capabilities[card_payments][requested]': 'true',
        'capabilities[transfers][requested]': 'true',
        'metadata[user_id]': userId,
        'metadata[platform]': 'greenscape_lux'
      })
      
      if (businessName) {
        accountParams.append('business_profile[name]', businessName)
      }
      
      const createAccountResponse = await fetch('https://api.stripe.com/v1/accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: accountParams
      })

      if (!createAccountResponse.ok) {
        const errorText = await createAccountResponse.text()
        console.error('[stripe-connect-onboarding] Stripe account creation failed:', errorText)
        throw new Error(`Failed to create Stripe Connect account: ${errorText}`)
      }

      const account = await createAccountResponse.json()
      stripeAccountId = account.id
      isNewAccount = true
      
      console.log('[stripe-connect-onboarding] Created Stripe account:', stripeAccountId)

      // Update landscaper record with new Stripe account ID
      if (landscaper?.id) {
        const { error: updateError } = await supabase
          .from('landscapers')
          .update({ 
            stripe_connect_id: stripeAccountId,
            stripe_account_status: 'pending',
            stripe_onboarding_complete: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', landscaper.id)
          
        if (updateError) {
          console.error('[stripe-connect-onboarding] Failed to update landscaper:', updateError)
        } else {
          console.log('[stripe-connect-onboarding] Updated landscaper record with Stripe account ID')
        }
      }
    } else {
      console.log('[stripe-connect-onboarding] Using existing Stripe account:', stripeAccountId)
    }

    // Generate Account Link for onboarding
    const siteUrl = Deno.env.get('SITE_URL') || 'https://greenscapelux.com'
    const returnUrl = `${siteUrl}/landscaper-dashboard?banking_success=true`
    const refreshUrl = `${siteUrl}/landscaper-dashboard?banking_refresh=true`

    console.log('[stripe-connect-onboarding] Generating account link')
    console.log('[stripe-connect-onboarding] Return URL:', returnUrl)

    const accountLinkResponse = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'account': stripeAccountId,
        'refresh_url': refreshUrl,
        'return_url': returnUrl,
        'type': 'account_onboarding',
        'collect': 'eventually_due'
      })
    })

    if (!accountLinkResponse.ok) {
      const errorText = await accountLinkResponse.text()
      console.error('[stripe-connect-onboarding] Account link creation failed:', errorText)
      throw new Error(`Failed to create account link: ${errorText}`)
    }

    const accountLink = await accountLinkResponse.json()
    
    console.log('[stripe-connect-onboarding] ✅ SUCCESS! Onboarding URL generated')
    console.log('[stripe-connect-onboarding] URL:', accountLink.url)

    return new Response(JSON.stringify({ 
      success: true,
      accountId: stripeAccountId,
      onboardingUrl: accountLink.url,
      url: accountLink.url, // Backward compatibility
      isNewAccount,
      expiresAt: accountLink.expires_at
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[stripe-connect-onboarding] ❌ ERROR:', error.message || error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'An unexpected error occurred'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

### Step 3: Deploy
Click the **Deploy** button to deploy the updated function.

---

## Required Secrets

Ensure these secrets are configured in **Supabase Dashboard → Edge Functions → Secrets**:

| Secret Name | Required | Description |
|-------------|----------|-------------|
| `STRIPE_SECRET_KEY` | ✅ Yes | Your Stripe secret key (sk_live_... or sk_test_...) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Supabase service role key |
| `SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `SITE_URL` | Optional | Your site URL (defaults to https://greenscapelux.com) |

---

## Verify JWT is Disabled

Make sure JWT verification is **OFF** for this function:

1. Go to **Edge Functions → stripe-connect-onboarding → Details**
2. Check that **Verify JWT** is set to **OFF**

---

## Testing After Deployment

After deploying, test by:

1. Log in as a landscaper
2. Go to the dashboard
3. Click "Complete Banking Setup" or "Connect with Stripe"
4. Check Supabase logs for these messages:
   - `[stripe-connect-onboarding] Raw body received: {"userId":"...","email":"..."}`
   - `[stripe-connect-onboarding] Parsed body: {"userId":"...","email":"..."}`
   - `[stripe-connect-onboarding] ✅ SUCCESS! Onboarding URL generated`

If you see `WARNING: Empty body received` or `Missing userId`, the body parsing is still not working.

---

## The Key Fix

The critical fix is in how the body is parsed:

```typescript
// CORRECT: Read body as text, then parse as JSON
const rawBody = await req.text()
console.log('[stripe-connect-onboarding] Raw body received:', rawBody)

if (rawBody && rawBody.trim()) {
  body = JSON.parse(rawBody)
}
```

This ensures the JSON body sent by `supabase.functions.invoke()` is properly received and parsed.

---

## Document Info
- **Created**: December 9, 2025
- **Issue**: Body coming in as null in stripe-connect-onboarding function
- **Root Cause**: Edge function not parsing request body
- **Solution**: Update edge function code with proper body parsing
- **Status**: ⏳ Awaiting deployment by user
