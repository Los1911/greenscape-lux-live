import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { corsHeaders } from '../_shared/cors.ts'
import { serverConfig, validateRequiredSecrets } from '../_shared/serverConfig.ts'

validateRequiredSecrets(['stripeSecretKey', 'supabaseServiceRoleKey'])

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const stripe = new Stripe(serverConfig.stripeSecretKey, { apiVersion: '2023-10-16' })
const supabase = createClient(supabaseUrl, serverConfig.supabaseServiceRoleKey)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency = 'usd', customer_id, job_id, metadata = {} } = await req.json()

    if (!amount || amount < 50) {
      throw new Error('Amount must be at least $0.50')
    }

    let stripeCustomerId = null
    if (customer_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email, full_name')
        .eq('id', customer_id)
        .single()

      if (profile) {
        if (!profile.stripe_customer_id) {
          const customer = await stripe.customers.create({
            email: profile.email,
            name: profile.full_name,
            metadata: { supabase_user_id: customer_id }
          })

          await supabase
            .from('profiles')
            .update({ stripe_customer_id: customer.id })
            .eq('id', customer_id)

          stripeCustomerId = customer.id
        } else {
          stripeCustomerId = profile.stripe_customer_id
        }
      }
    }

    const platformFee = Math.round(amount * 0.15)
    const landscaperAmount = amount - platformFee

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      customer: stripeCustomerId || undefined,
      metadata: {
        job_id: job_id || '',
        customer_id: customer_id || '',
        platform_fee: platformFee.toString(),
        landscaper_amount: landscaperAmount.toString(),
        ...metadata
      },
      automatic_payment_methods: { enabled: true },
    })

    await supabase.from('payments').insert({
      stripe_payment_intent_id: paymentIntent.id,
      customer_id: customer_id,
      job_id: job_id,
      amount: amount / 100,
      platform_fee: platformFee / 100,
      landscaper_amount: landscaperAmount / 100,
      status: 'pending',
      currency: currency,
      created_at: new Date().toISOString()
    })

    return new Response(JSON.stringify({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: amount,
      platform_fee: platformFee,
      landscaper_amount: landscaperAmount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to create payment intent'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
