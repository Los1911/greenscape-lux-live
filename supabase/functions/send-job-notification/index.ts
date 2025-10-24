import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serverConfig } from '../_shared/serverConfig.ts'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabase = createClient(supabaseUrl, serverConfig.supabaseServiceRoleKey)

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { job_id, notification_type, recipient_type } = await req.json()
    if (!job_id || !notification_type) return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: job, error } = await supabase.from('jobs').select('*, client:profiles!jobs_client_id_fkey(id, full_name, email), landscaper:profiles!jobs_landscaper_id_fkey(id, full_name, email)').eq('id', job_id).single()
    if (error || !job) return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const notifications = []
    if ((recipient_type === 'client' || recipient_type === 'both') && job.client?.email) {
      notifications.push({ to: job.client.email, template_type: `job_${notification_type}`, template_data: { user: { name: job.client.full_name }, job: { title: job.title, status: job.status, date: job.scheduled_date, address: job.address }, landscaper: job.landscaper ? { name: job.landscaper.full_name } : null, company: { name: 'GreenScape Lux', phone: '(555) 123-4567' } } })
    }
    if ((recipient_type === 'landscaper' || recipient_type === 'both') && job.landscaper?.email) {
      notifications.push({ to: job.landscaper.email, template_type: `landscaper_job_${notification_type}`, template_data: { user: { name: job.landscaper.full_name }, job: { title: job.title, status: job.status, date: job.scheduled_date, address: job.address, client_name: job.client?.full_name }, client: job.client ? { name: job.client.full_name } : null, company: { name: 'GreenScape Lux', phone: '(555) 123-4567' } } })
    }

    const results = []
    for (const notification of notifications) {
      try {
        const { data, error } = await supabase.functions.invoke('unified-email', { body: notification })
        results.push({ recipient: notification.to, success: !error, error: error?.message })
      } catch (error) {
        results.push({ recipient: notification.to, success: false, error: error.message })
      }
    }

    return new Response(JSON.stringify({ success: true, notifications_sent: results.length, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})