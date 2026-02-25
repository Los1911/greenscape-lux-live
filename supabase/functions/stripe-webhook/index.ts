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

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`)
    }

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

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('💰 Processing refund for charge:', charge.id)
  await supabase.from('payments').update({
    status: 'refunded',
    updated_at: new Date().toISOString()
  }).eq('stripe_charge_id', charge.id)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  await supabase.from('subscriptions').upsert({
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    updated_at: new Date().toISOString()
  })
}

async function handleAccountUpdated(account: Stripe.Account) {
  console.log('🔄 Stripe Connect account updated:', account.id)

  const { data: landscaper } = await supabase
    .from('landscapers')
    .select('id, user_id')
    .eq('stripe_connect_id', account.id)
    .single()

  if (!landscaper) {
    console.log('⚠️ No landscaper found for account:', account.id)
    return
  }

  const charges_enabled = account.charges_enabled || false
  const payouts_enabled = account.payouts_enabled || false
  const details_submitted = account.details_submitted || false

  let verification_status = 'pending'
  if (charges_enabled && payouts_enabled && details_submitted) {
    verification_status = 'verified'
  } else if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) {
    verification_status = 'requires_action'
  }

  await supabase
    .from('landscapers')
    .update({
      stripe_charges_enabled: charges_enabled,
      stripe_payouts_enabled: payouts_enabled,
      stripe_details_submitted: details_submitted,
      verification_status,
      updated_at: new Date().toISOString()
    })
    .eq('id', landscaper.id)

  console.log('✅ Updated landscaper status:', verification_status)
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 Checkout session completed:', session.id)

  const jobId = session.metadata?.job_id

  if (!jobId) {
    console.log('⚠️ No job_id found in session metadata')
    return
  }

  // LIFECYCLE FIX: Set status to 'scheduled' (NOT 'assigned').
  // The job becomes 'assigned' only when a landscaper explicitly accepts it.
  // Flow: payment → scheduled → (landscaper accepts) → assigned → active → completed
  await supabase
    .from('jobs')
    .update({
      status: 'scheduled',
      stripe_session_id: session.id,
      payment_status: 'paid',
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)

  console.log('✅ Job marked scheduled after payment:', jobId)
}
