import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serverConfig } from '../_shared/serverConfig.ts'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabase = createClient(supabaseUrl, serverConfig.supabaseServiceRoleKey)

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
    const tomorrowEnd = new Date(tomorrowStart); tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)

    const { data: jobs, error } = await supabase.from('jobs').select(`id, title, scheduled_date, address, client_id, profiles!jobs_client_id_fkey (name, email), landscaper:profiles!jobs_landscaper_id_fkey (name)`).gte('scheduled_date', tomorrowStart.toISOString()).lt('scheduled_date', tomorrowEnd.toISOString()).eq('status', 'scheduled')
    if (error) throw error

    let sentCount = 0, errorCount = 0
    for (const job of jobs || []) {
      try {
        const { data: prefs } = await supabase.from('email_preferences').select('enabled').eq('user_id', job.client_id).eq('type', 'appointment_reminder').single()
        if (prefs && !prefs.enabled) continue

        await fetch(`${supabaseUrl}/functions/v1/unified-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serverConfig.supabaseServiceRoleKey}` },
          body: JSON.stringify({ to: job.profiles?.email, template_type: 'appointment_reminder', template_data: { user: { name: job.profiles?.name || 'Valued Customer' }, job: { title: job.title, date: new Date(job.scheduled_date).toLocaleDateString(), address: job.address }, landscaper: { name: job.landscaper?.name }, company: { name: 'GreenScape Lux', phone: '(555) 123-4567' } } })
        })
        sentCount++
      } catch { errorCount++ }
    }

    return new Response(JSON.stringify({ success: true, sent: sentCount, errors: errorCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})