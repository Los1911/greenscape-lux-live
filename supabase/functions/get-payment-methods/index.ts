import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { serverConfig, validateRequiredSecrets } from '../_shared/serverConfig.ts'

validateRequiredSecrets(['stripeSecretKey'])

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerId } = await req.json()

    if (!customerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: customerId' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const stripeResponse = await fetch(`https://api.stripe.com/v1/payment_methods?customer=${customerId}&type=card`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serverConfig.stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    })

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text()
      console.error('Stripe payment methods fetch failed:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch payment methods', details: error }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const paymentMethods = await stripeResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        payment_methods: paymentMethods.data || []
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in get-payment-methods:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
