import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { serverConfig, validateRequiredSecrets } from '../_shared/serverConfig.ts'

validateRequiredSecrets(['stripeSecretKey', 'supabaseServiceRoleKey'])

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabase = createClient(supabaseUrl, serverConfig.supabaseServiceRoleKey)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, email, businessName } = await req.json()

    if (!userId || !email) {
      return new Response(JSON.stringify({ error: 'Missing userId or email' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create Stripe Connect Express account
    const accountResponse = await fetch('https://api.stripe.com/v1/accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serverConfig.stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        type: 'express',
        email: email,
        'business_type': 'individual',
        'capabilities[card_payments][requested]': 'true',
        'capabilities[transfers][requested]': 'true',
        ...(businessName && { 'business_profile[name]': businessName })
      })
    })

    if (!accountResponse.ok) {
      const error = await accountResponse.text()
      console.error('Stripe account creation failed:', error)
      return new Response(JSON.stringify({ error: 'Failed to create Connect account', details: error }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const account = await accountResponse.json()

    // Create Account Link for onboarding
    const linkResponse = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serverConfig.stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        account: account.id,
        refresh_url: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/landscaper-dashboard`,
        return_url: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/landscaper-dashboard`,
        type: 'account_onboarding'
      })
    })

    if (!linkResponse.ok) {
      const error = await linkResponse.text()
      console.error('Account link creation failed:', error)
      return new Response(JSON.stringify({ error: 'Failed to create onboarding link' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const link = await linkResponse.json()

    return new Response(JSON.stringify({ 
      success: true, 
      accountId: account.id,
      onboardingUrl: link.url
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
