import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const STRIPE_LIVE_SECRET_KEY = Deno.env.get('STRIPE_LIVE_SECRET_KEY')
const VERCEL_DOMAIN = Deno.env.get('VERCEL_DOMAIN') || 'your-domain.vercel.app'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, webhookEndpointId } = await req.json()

    if (!STRIPE_LIVE_SECRET_KEY?.startsWith('sk_live_')) {
      throw new Error('Live Stripe secret key required')
    }

    const webhookEndpoints = [
      {
        url: `https://${VERCEL_DOMAIN}/api/webhooks/stripe/payment-intent`,
        enabled_events: ['payment_intent.succeeded', 'payment_intent.payment_failed']
      },
      {
        url: `https://${VERCEL_DOMAIN}/api/webhooks/stripe/subscription`,
        enabled_events: ['customer.subscription.updated', 'customer.subscription.deleted']
      },
      {
        url: `https://${VERCEL_DOMAIN}/api/webhooks/stripe/invoice`,
        enabled_events: ['invoice.payment_succeeded', 'invoice.payment_failed']
      }
    ]

    if (action === 'create') {
      const results = []
      
      for (const endpoint of webhookEndpoints) {
        const response = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STRIPE_LIVE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            url: endpoint.url,
            'enabled_events[]': endpoint.enabled_events.join(','),
            description: `Production webhook for ${endpoint.enabled_events[0].split('.')[0]} events`
          })
        })

        const webhookData = await response.json()
        results.push({
          endpoint: endpoint.url,
          webhook_id: webhookData.id,
          webhook_secret: webhookData.secret,
          events: endpoint.enabled_events
        })
      }

      return new Response(JSON.stringify({
        success: true,
        webhooks: results,
        message: 'Production webhooks configured successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'list') {
      const response = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
        headers: {
          'Authorization': `Bearer ${STRIPE_LIVE_SECRET_KEY}`
        }
      })

      const data = await response.json()
      return new Response(JSON.stringify({
        success: true,
        webhooks: data.data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Invalid action')

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})