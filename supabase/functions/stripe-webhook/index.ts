import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0'
import { corsHeaders } from '../_shared/cors.ts'
import { serverConfig, validateRequiredSecrets } from '../_shared/serverConfig.ts'

validateRequiredSecrets(['stripeSecretKey', 'supabaseServiceRoleKey', 'stripeWebhookSecret'])

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const stripeDebug = Deno.env.get('STRIPE_DEBUG')

const stripe = new Stripe(serverConfig.stripeSecretKey, { apiVersion: '2023-10-16' })
const supabase = createClient(supabaseUrl, serverConfig.supabaseServiceRoleKey)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let event: Stripe.Event

    if (stripeDebug === '1') {
      console.log('🟢 [DEBUG] Debug mode enabled')
      const payload = await req.json()
      event = payload
    } else {
      const signature = req.headers.get('stripe-signature')
      const body = await req.text()

      if (!signature) throw new Error('Missing Stripe signature')

      event = stripe.webhooks.constructEvent(body, signature, serverConfig.stripeWebhookSecret)
      console.log('🔔 Verified Event:', event.type)
    }

    await supabase.from('webhook_logs').insert({
      event_id: event.id,
      event_type: event.type,
      payload: event
    })

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent)
        break
<<<<<<< HEAD
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`)
    }


=======
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break
    }

>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  await supabase.from('payments').update({
    status: 'completed',
    updated_at: new Date().toISOString()
  }).eq('stripe_payment_intent_id', paymentIntent.id)
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  await supabase.from('payments').update({
    status: 'failed',
    updated_at: new Date().toISOString()
  }).eq('stripe_payment_intent_id', paymentIntent.id)
}

<<<<<<< HEAD
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('💰 Processing refund for charge:', charge.id)
  await supabase.from('payments').update({
    status: 'refunded',
    updated_at: new Date().toISOString()
  }).eq('stripe_charge_id', charge.id)
}

=======
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  await supabase.from('subscriptions').upsert({
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    updated_at: new Date().toISOString()
  })
}
<<<<<<< HEAD

=======
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
