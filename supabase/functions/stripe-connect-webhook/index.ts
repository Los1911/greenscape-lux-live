import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature'
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()

    if (!signature) throw new Error('Missing Stripe signature')

    const event = stripe.webhooks.constructEvent(
      body, 
      signature, 
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )

    console.log('🔔 Connect Event:', event.type)

    await supabase.from('webhook_logs').insert({
      event_id: event.id,
      event_type: event.type,
      payload: event
    })

    if (event.type === 'account.updated') {
      await handleAccountUpdated(event.data.object as Stripe.Account)
    } else if (event.type === 'capability.updated') {
      await handleCapabilityUpdated(event.data.object as any)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handleAccountUpdated(account: Stripe.Account) {
  const { data: landscaper } = await supabase
    .from('landscapers')
    .select('id, user_id, stripe_charges_enabled, stripe_payouts_enabled')
    .eq('stripe_connect_id', account.id)
    .single()
  
  if (!landscaper) return

  const wasActive = landscaper.stripe_charges_enabled && landscaper.stripe_payouts_enabled
  const isNowActive = account.charges_enabled && account.payouts_enabled
  
  await supabase.from('landscapers').update({
    stripe_charges_enabled: account.charges_enabled || false,
    stripe_payouts_enabled: account.payouts_enabled || false,
    stripe_details_submitted: account.details_submitted || false,
    stripe_onboarding_complete: isNowActive,
    updated_at: new Date().toISOString()
  }).eq('stripe_connect_id', account.id)

  await supabase.from('stripe_connect_notifications').insert({
    landscaper_id: landscaper.id,
    event_type: 'account.updated',
    stripe_connect_id: account.id,
    charges_enabled: account.charges_enabled || false,
    payouts_enabled: account.payouts_enabled || false,
    requirements: account.requirements || {}
  })


  const { data: user } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', landscaper.user_id)
    .single()
  
  if (!user) return

  if (!wasActive && isNowActive) {
    await sendOnboardingCompleteEmail(user, landscaper)
  }
  
  const requiresAction = account.requirements?.currently_due?.length > 0 || 
                        account.requirements?.past_due?.length > 0
  
  if (requiresAction) {
    await sendVerificationRequiredEmail(user, account.requirements)
  }
}

async function handleCapabilityUpdated(capability: any) {
  const { data: landscaper } = await supabase
    .from('landscapers')
    .select('id, user_id')
    .eq('stripe_connect_id', capability.account)
    .single()
  
  if (!landscaper) return

  await supabase.from('stripe_connect_notifications').insert({
    landscaper_id: landscaper.id,
    event_type: 'capability.updated',
    stripe_connect_id: capability.account,
    charges_enabled: capability.id === 'card_payments' && capability.status === 'active',
    payouts_enabled: capability.id === 'transfers' && capability.status === 'active',
    requirements: capability.requirements || {}
  })


  if (capability.status === 'active') {
    const capName = capability.id === 'card_payments' ? 'Card Payments' : 
                   capability.id === 'transfers' ? 'Payouts' : capability.id
    
    await supabase.from('notifications').insert({
      user_id: landscaper.user_id,
      type: 'stripe_capability_enabled',
      title: `${capName} Enabled`,
      message: `Your ${capName} capability is now active.`,
      read: false
    })
  }
}

async function sendOnboardingCompleteEmail(user: any, landscaper: any) {
  await supabase.functions.invoke('unified-email', {
    body: {
      to: user.email,
      subject: '🎉 Stripe Connect Setup Complete!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Congratulations ${user.full_name}!</h2>
          <p>Your Stripe Connect account is fully verified.</p>
          <p><strong>You can now receive payments!</strong></p>
          <a href="https://greenscapelux.com/landscaper-dashboard" 
             style="display: inline-block; background: #10b981; color: white; 
                    padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Dashboard
          </a>
        </div>
      `
    }
  })
  
  await supabase.from('notifications').insert({
    user_id: landscaper.user_id,
    type: 'stripe_onboarding_complete',
    title: 'Stripe Setup Complete!',
    message: 'Your account is verified and ready.',
    read: false
  })
}

async function sendVerificationRequiredEmail(user: any, requirements: any) {
  const fields = [...(requirements.currently_due || []), 
                  ...(requirements.past_due || [])].join(', ')
  
  await supabase.functions.invoke('unified-email', {
    body: {
      to: user.email,
      subject: '⚠️ Action Required: Stripe Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Verification Needed</h2>
          <p>Hi ${user.full_name},</p>
          <p>Please complete: ${fields}</p>
          <a href="https://greenscapelux.com/landscaper-dashboard" 
             style="display: inline-block; background: #10b981; color: white; 
                    padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Complete Now
          </a>
        </div>
      `
    }
  })
}
