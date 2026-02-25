# Stripe Connect Onboarding - Complete Fix Guide

## Issues Identified & Fixed

### Issue 1: CORS Headers Missing Required Headers
The edge function's CORS headers were missing `x-client-info` and `apikey` which the Supabase client sends with every request.

### Issue 2: Frontend Bug - Wrong User ID (FIXED IN CODE)
`StripeConnectOnboardingCard.tsx` was sending `landscaperId` (the landscapers table primary key) instead of `user.id` (the auth user ID). **This has been fixed in the codebase.**

### Issue 3: Shared CORS Headers Updated
Updated `supabase/functions/_shared/cors.ts` with the correct headers.

---

## Deploy This Edge Function Code

Go to **Supabase Dashboard → Edge Functions → stripe-connect-onboarding** and deploy this code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CRITICAL: CORS headers must include all headers the Supabase client sends
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth, accept, origin, x-requested-with',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // CRITICAL: Handle CORS preflight requests FIRST
  if (req.method === 'OPTIONS') {
    console.log('[stripe-connect-onboarding] Handling OPTIONS preflight request')
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    console.log('[stripe-connect-onboarding] Request received, Method:', req.method)
    
    // Parse the request body
    let body: { userId?: string; email?: string; businessName?: string } = {}
    
    try {
      const rawBody = await req.text()
      console.log('[stripe-connect-onboarding] Raw body:', rawBody)
      if (rawBody && rawBody.trim()) {
        body = JSON.parse(rawBody)
      }
    } catch (parseError) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const { userId, email, businessName } = body

    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: 'Missing userId' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check for existing Stripe account
    const { data: landscaper } = await supabase
      .from('landscapers')
      .select('id, stripe_connect_id')
      .eq('user_id', userId)
      .single()

    let stripeAccountId = landscaper?.stripe_connect_id
    let isNewAccount = false

    // Create new Stripe Connect account if needed
    if (!stripeAccountId) {
      const accountParams = new URLSearchParams({
        'type': 'express', 'country': 'US', 'email': email || '',
        'business_type': 'individual',
        'capabilities[card_payments][requested]': 'true',
        'capabilities[transfers][requested]': 'true',
        'metadata[user_id]': userId
      })
      if (businessName) accountParams.append('business_profile[name]', businessName)
      
      const res = await fetch('https://api.stripe.com/v1/accounts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${stripeSecretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: accountParams
      })

      if (!res.ok) throw new Error('Failed to create Stripe account')
      const account = await res.json()
      stripeAccountId = account.id
      isNewAccount = true

      if (landscaper?.id) {
        await supabase.from('landscapers').update({ 
          stripe_connect_id: stripeAccountId, stripe_account_status: 'pending'
        }).eq('id', landscaper.id)
      }
    }

    // Generate onboarding link
    const siteUrl = Deno.env.get('SITE_URL') || 'https://greenscapelux.com'
    const linkRes = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeSecretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'account': stripeAccountId,
        'refresh_url': `${siteUrl}/landscaper-dashboard?banking_refresh=true`,
        'return_url': `${siteUrl}/landscaper-dashboard?banking_success=true`,
        'type': 'account_onboarding'
      })
    })

    if (!linkRes.ok) throw new Error('Failed to create onboarding link')
    const accountLink = await linkRes.json()

    return new Response(JSON.stringify({ 
      success: true, accountId: stripeAccountId, onboardingUrl: accountLink.url, url: accountLink.url, isNewAccount
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

---

## Deployment Checklist

1. ✅ Go to **Supabase Dashboard → Edge Functions**
2. ✅ Create/update `stripe-connect-onboarding` with the code above
3. ✅ **CRITICAL**: Set **Verify JWT** to **OFF**
4. ✅ Verify secrets are set: `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`

---

## Frontend Code Already Fixed

The following file was updated to fix the user ID mismatch:
- `src/components/landscaper/StripeConnectOnboardingCard.tsx` - Now uses `user.id` from auth context instead of `landscaperId`

---

## Document Info
- **Created**: December 9, 2025
- **Status**: Frontend fixed, edge function deployment required
