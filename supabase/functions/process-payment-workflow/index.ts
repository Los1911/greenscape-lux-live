import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { serverConfig } from '../_shared/serverConfig.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabase = createClient(supabaseUrl, serverConfig.supabaseServiceRoleKey)

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { payment_intent_id, action } = await req.json()
    if (!payment_intent_id) throw new Error('Payment intent ID is required')

    switch (action) {
      case 'confirm_payment': return await confirmPayment(payment_intent_id)
      case 'generate_receipt': return await generateReceipt(payment_intent_id)
      case 'send_notifications': return await sendNotifications(payment_intent_id)
      case 'update_job_status': return await updateJobStatus(payment_intent_id)
      case 'process_payout': return await processPayout(payment_intent_id)
      default: throw new Error('Invalid action specified')
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})

async function confirmPayment(paymentIntentId: string) {
  const { data: payment, error } = await supabase.from('payments').update({ status: 'confirmed', confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('stripe_payment_intent_id', paymentIntentId).select().single()
  if (error) throw error
  await Promise.all([generateReceipt(paymentIntentId), sendNotifications(paymentIntentId), updateJobStatus(paymentIntentId)])
  return new Response(JSON.stringify({ success: true, message: 'Payment confirmed', payment_id: payment.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

async function generateReceipt(paymentIntentId: string) {
  const { data: payment } = await supabase.from('payments').select('*, profiles!customer_id(full_name, email), jobs(description, scheduled_date)').eq('stripe_payment_intent_id', paymentIntentId).single()
  if (!payment) throw new Error('Payment not found')
  await supabase.from('receipts').insert({ payment_id: payment.id, payment_intent_id: paymentIntentId, customer_id: payment.customer_id, job_id: payment.job_id, amount: payment.amount, created_at: new Date().toISOString() })
  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

async function sendNotifications(paymentIntentId: string) {
  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

async function updateJobStatus(paymentIntentId: string) {
  const { data: payment } = await supabase.from('payments').select('job_id').eq('stripe_payment_intent_id', paymentIntentId).single()
  if (!payment?.job_id) throw new Error('Job not found')
  await supabase.from('jobs').update({ status: 'paid', payment_confirmed_at: new Date().toISOString() }).eq('id', payment.job_id)
  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

async function processPayout(paymentIntentId: string) {
  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}