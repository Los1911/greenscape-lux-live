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
    const { userId, email, name, firstName, lastName } = await req.json()

    if (!userId || !email) {
      return new Response(JSON.stringify({ error: 'Missing userId or email' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripeResponse = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serverConfig.stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: email,
        name: name || `${firstName} ${lastName}`.trim() || email,
        metadata: JSON.stringify({ user_id: userId })
      })
    })

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text()
      return new Response(JSON.stringify({ error: 'Stripe customer creation failed' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const customer = await stripeResponse.json()

    await supabase.from('profiles').update({ 
      stripe_customer_id: customer.id 
    }).eq('id', userId)

    return new Response(JSON.stringify({ 
      success: true, 
      stripe_customer_id: customer.id
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
