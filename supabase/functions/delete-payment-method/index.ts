import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { serverConfig, validateRequiredSecrets } from '../_shared/serverConfig.ts'

validateRequiredSecrets(['stripeSecretKey'])

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { paymentMethodId } = await req.json()

    if (!paymentMethodId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: paymentMethodId' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const stripeResponse = await fetch(`https://api.stripe.com/v1/payment_methods/${paymentMethodId}/detach`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serverConfig.stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    })

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text()
      console.error('Stripe payment method detach failed:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to delete payment method', details: error }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const detachedPaymentMethod = await stripeResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        payment_method: detachedPaymentMethod
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in delete-payment-method:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
