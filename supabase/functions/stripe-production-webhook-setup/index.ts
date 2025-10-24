import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_LIVE_SECRET_KEY = Deno.env.get('STRIPE_LIVE_SECRET_KEY')
const VERCEL_TOKEN = Deno.env.get('VERCEL_TOKEN')
const VERCEL_PROJECT_ID = Deno.env.get('VERCEL_PROJECT_ID')
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { domain } = await req.json()
    
    if (!STRIPE_LIVE_SECRET_KEY?.startsWith('sk_live_')) {
      throw new Error('Live Stripe secret key required')
    }

    const productionDomain = domain || 'greenscape-lux.vercel.app'
    
    // Create production webhook endpoints
    const webhookConfigs = [
      {
        url: `https://${productionDomain}/api/webhooks/stripe/payment`,
        events: ['payment_intent.succeeded', 'payment_intent.payment_failed'],
        description: 'Payment processing webhook'
      },
      {
        url: `https://${productionDomain}/api/webhooks/stripe/subscription`,
        events: ['customer.subscription.updated', 'customer.subscription.deleted', 'customer.subscription.created'],
        description: 'Subscription management webhook'
      },
      {
        url: `https://${productionDomain}/api/webhooks/stripe/invoice`,
        events: ['invoice.payment_succeeded', 'invoice.payment_failed', 'invoice.finalized'],
        description: 'Invoice processing webhook'
      }
    ]

    const createdWebhooks = []

    for (const config of webhookConfigs) {
      // Create webhook endpoint in Stripe
      const webhookResponse = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_LIVE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          url: config.url,
          'enabled_events[]': config.events.join(','),
          description: config.description,
          api_version: '2023-10-16'
        })
      })

      const webhookData = await webhookResponse.json()
      
      if (webhookData.error) {
        throw new Error(`Stripe webhook creation failed: ${webhookData.error.message}`)
      }

      createdWebhooks.push({
        id: webhookData.id,
        url: webhookData.url,
        secret: webhookData.secret,
        events: config.events
      })

      // Store webhook secret in Supabase secrets
      const secretName = `STRIPE_WEBHOOK_SECRET_${config.events[0].split('.')[0].toUpperCase()}`
      
      // Update Vercel environment variables
      if (VERCEL_TOKEN && VERCEL_PROJECT_ID) {
        await updateVercelEnvVar(secretName, webhookData.secret)
      }
    }

    // Log webhook setup
    await supabase
      .from('webhook_configurations')
      .insert({
        provider: 'stripe',
        environment: 'production',
        webhooks: createdWebhooks,
        domain: productionDomain,
        configured_at: new Date().toISOString()
      })

    return new Response(JSON.stringify({
      success: true,
      webhooks: createdWebhooks,
      domain: productionDomain,
      message: 'Production Stripe webhooks configured successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

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

async function updateVercelEnvVar(key: string, value: string) {
  try {
    const response = await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key,
        value,
        type: 'encrypted',
        target: ['production']
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to update Vercel env var: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Failed to update ${key}:`, error)
    throw error
  }
}