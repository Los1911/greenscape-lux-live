import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { serverConfig } from '../_shared/serverConfig.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { landscaperId, amount, stripeAccountId } = await req.json()
    const supabase = createClient(supabaseUrl, serverConfig.supabaseServiceRoleKey)

    const { data: landscaper } = await supabase.from('profiles').select('id, email, full_name').eq('id', landscaperId).single()

    const transferResponse = await fetch('https://api.stripe.com/v1/transfers', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${serverConfig.stripeSecretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ amount: (amount * 100).toString(), currency: 'usd', destination: stripeAccountId, metadata: JSON.stringify({ landscaper_id: landscaperId }) })
    })

    if (!transferResponse.ok) {
      const error = await transferResponse.text()
      if (landscaper) {
        await supabase.functions.invoke('send-payout-notification', {
          body: { userId: landscaper.id, type: 'payout_failed', title: 'Payout Failed', message: `Your payout of $${amount} could not be processed.`, data: { amount, error_message: error }, email: landscaper.email }
        })
      }
      throw new Error(`Stripe transfer failed: ${error}`)
    }

    const transfer = await transferResponse.json()
    const { data: payout } = await supabase.from('payout_logs').insert({ landscaper_id: landscaperId, amount, stripe_transfer_id: transfer.id, status: 'completed', created_at: new Date().toISOString() }).select().single()

    if (landscaper) {
      await supabase.functions.invoke('send-payout-notification', {
        body: { userId: landscaper.id, type: 'payout_success', title: 'Payout Completed', message: `Your payout of $${amount} has been processed.`, data: { payout_id: payout?.id || transfer.id, amount, stripe_transfer_id: transfer.id }, email: landscaper.email }
      })
    }

    return new Response(JSON.stringify({ success: true, transferId: transfer.id, payoutId: payout?.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})