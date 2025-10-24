import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { serverConfig, validateRequiredSecrets } from '../_shared/serverConfig.ts'

validateRequiredSecrets(['supabaseServiceRoleKey', 'resendApiKey'])

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, type, title, message, email } = await req.json()
    const supabase = createClient(serverConfig.supabaseUrl, serverConfig.supabaseServiceRoleKey)

    if (userId) {
      await supabase.from('notifications').insert({
        user_id: userId,
        type,
        title,
        message,
        created_at: new Date().toISOString()
      })
    }

    if (email && serverConfig.resendApiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serverConfig.resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'noreply@greenscapelux.com',
          to: [email],
          subject: title,
          html: `<p>${message}</p>`,
        }),
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
