# Stripe Connect Webhook Deployment Guide

## Status: DEPLOYMENT API UNAVAILABLE - Manual Deployment Required

The Supabase edge function deployment API is currently experiencing connectivity issues. 
Deploy manually using the Supabase CLI with the code below.

## Fixed Issues

1. **Column Name Fix**: Changed `stripe_account_id` → `stripe_connect_id` (3 locations: lines 64, 78, 113)
2. **Added `calculateAccountStatus` Helper**: Determines status based on Stripe account state
3. **Added `stripe_account_status` Field**: Now included in database updates

3. **Added `stripe_account_status` Field**: Now included in database updates

## Complete Fixed Code

Copy this to `supabase/functions/stripe-connect-webhook/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature'
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// NEW: Calculate account status based on Stripe account state
function calculateAccountStatus(account: Stripe.Account): string {
  if (account.charges_enabled && account.payouts_enabled) return 'active'
  if (account.requirements?.disabled_reason) return 'restricted'
  if ((account.requirements?.past_due?.length ?? 0) > 0 || 
      (account.requirements?.currently_due?.length ?? 0) > 0) return 'pending_verification'
  if (account.details_submitted) return 'pending_verification'
  return 'pending'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    if (!signature) throw new Error('Missing Stripe signature')

    const event = stripe.webhooks.constructEvent(
      body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )

    console.log('🔔 Connect Event:', event.type)
    await supabase.from('webhook_logs').insert({
      event_id: event.id,
      event_type: event.type,
      payload: event
    })

    if (event.type === 'account.updated') {
      await handleAccountUpdated(event.data.object as Stripe.Account, event.id)
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

async function handleAccountUpdated(account: Stripe.Account, eventId: string) {
  // FIXED: Use stripe_connect_id (not stripe_account_id)
  const { data: landscaper } = await supabase
    .from('landscapers')
    .select('id, user_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_account_status')
    .eq('stripe_connect_id', account.id)  // FIXED LINE 64
    .single()

  if (!landscaper) {
    console.log(`No landscaper found for Stripe account: ${account.id}`)
    return
  }

  const wasActive = landscaper.stripe_charges_enabled && landscaper.stripe_payouts_enabled
  const isNowActive = account.charges_enabled && account.payouts_enabled
  const newStatus = calculateAccountStatus(account)  // NEW

  // FIXED: Include stripe_account_status in update
  const { error } = await supabase.from('landscapers').update({
    stripe_account_status: newStatus,  // NEW FIELD
    stripe_charges_enabled: account.charges_enabled || false,
    stripe_payouts_enabled: account.payouts_enabled || false,
    stripe_details_submitted: account.details_submitted || false,
    stripe_onboarding_complete: isNowActive,
    updated_at: new Date().toISOString()
  }).eq('stripe_connect_id', account.id)  // FIXED LINE 78

  if (error) console.error('Update error:', error)
  else console.log(`✅ Updated landscaper ${landscaper.id} - Status: ${newStatus}`)

  // Log to approval_logs for audit trail
  await supabase.from('approval_logs').insert({
    landscaper_id: landscaper.id,
    stripe_connect_id: account.id,
    event_type: 'account.updated',
    previous_status: {
      charges_enabled: landscaper.stripe_charges_enabled,
      payouts_enabled: landscaper.stripe_payouts_enabled,
      account_status: landscaper.stripe_account_status
    },
    new_status: {
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      account_status: newStatus
    },
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
    webhook_event_id: eventId,
    metadata: { requirements: account.requirements }
  })

  await supabase.from('stripe_connect_notifications').insert({
    landscaper_id: landscaper.id,
    event_type: 'account.updated',
    stripe_account_id: account.id,
    charges_enabled: account.charges_enabled || false,
    payouts_enabled: account.payouts_enabled || false,
    requirements: account.requirements || {}
  })

  // Send emails on status change
  const { data: user } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', landscaper.user_id)
    .single()

  if (user && !wasActive && isNowActive) {
    await sendOnboardingCompleteEmail(user, landscaper)
  }

  const requiresAction = (account.requirements?.currently_due?.length ?? 0) > 0 ||
                        (account.requirements?.past_due?.length ?? 0) > 0
  if (user && requiresAction) {
    await sendVerificationRequiredEmail(user, account.requirements)
  }
}

async function handleCapabilityUpdated(capability: any) {
  // FIXED: Use stripe_connect_id (not stripe_account_id)
  const { data: landscaper } = await supabase
    .from('landscapers')
    .select('id, user_id')
    .eq('stripe_connect_id', capability.account)  // FIXED LINE 113
    .single()

  if (!landscaper) return

  await supabase.from('stripe_connect_notifications').insert({
    landscaper_id: landscaper.id,
    event_type: 'capability.updated',
    stripe_account_id: capability.account,
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
```

## Deployment Command

```bash
supabase functions deploy stripe-connect-webhook
```

## Verification

After deployment, test by triggering a Stripe Connect account update:
1. Go to Stripe Dashboard → Connect → Test Accounts
2. Update an account's verification status
3. Check `webhook_logs` table for the event
4. Verify `landscapers` table has updated `stripe_account_status`
