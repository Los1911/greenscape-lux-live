import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { serverConfig, validateRequiredSecrets } from '../_shared/serverConfig.ts'

validateRequiredSecrets(['stripeSecretKey'])

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { paymentMethodId, customerId } = await req.json()

    if (!paymentMethodId || !customerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: paymentMethodId, customerId' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const stripeResponse = await fetch(`https://api.stripe.com/v1/payment_methods/${paymentMethodId}/attach`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serverConfig.stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId
      })
    })

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text()
      console.error('Stripe payment method attach failed:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to attach payment method', details: error }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const attachedPaymentMethod = await stripeResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        payment_method: attachedPaymentMethod
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in attach-payment-method:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
