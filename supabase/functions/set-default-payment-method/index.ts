import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { serverConfig } from '../_shared/serverConfig.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerId, paymentMethodId } = await req.json()

    if (!customerId || !paymentMethodId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: customerId and paymentMethodId' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const stripeResponse = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serverConfig.stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'invoice_settings[default_payment_method]': paymentMethodId
      })
    })

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text()
      console.error('Stripe set default payment method failed:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to set default payment method', details: error }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const customer = await stripeResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Default payment method updated successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in set-default-payment-method:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
