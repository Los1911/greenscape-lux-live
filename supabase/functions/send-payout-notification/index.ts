import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { serverConfig } from '../_shared/serverConfig.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { userId, type, title, message, data, email } = await req.json()
    const supabase = createClient(supabaseUrl, serverConfig.supabaseServiceRoleKey)

    const { data: prefs } = await supabase.from('notification_preferences').select('*').eq('user_id', userId).single()

    if (prefs?.in_app_enabled !== false) {
      await supabase.from('notifications').insert({ user_id: userId, type, title, message, data: data || {} })
    }

    if (prefs?.email_enabled !== false && email && prefs?.[type] !== false) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${serverConfig.resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'GreenScape <noreply@greenscape.com>',
          to: [email],
          subject: title,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #16a34a;">${title}</h2><p>${message}</p>${data?.amount ? `<p><strong>Amount:</strong> $${data.amount}</p>` : ''}${data?.payout_id ? `<p><strong>Payout ID:</strong> ${data.payout_id}</p>` : ''}<hr style="margin: 20px 0;"><p style="color: #666; font-size: 14px;">You can manage your notification preferences in your dashboard settings.</p></div>`
        })
      })
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})