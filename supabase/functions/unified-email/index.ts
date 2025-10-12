import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const stripeConnectTemplate = (d: any) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #059669; margin: 0;">GreenScape Lux</h1>
      <p style="color: #666; margin-top: 5px;">Payment Account Update</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
      <h2 style="margin: 0 0 10px 0; font-size: 24px;">${d.title}</h2>
      <p style="margin: 0; font-size: 16px; opacity: 0.95;">${d.message}</p>
    </div>

    <div style="background: #f9fafb; padding: 25px; border-radius: 8px; border-left: 4px solid #059669; margin-bottom: 25px;">
      <h3 style="margin: 0 0 15px 0; color: #1f2937;">Account Status</h3>
      <div style="display: grid; gap: 10px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280;">Charges:</span>
          <span style="font-weight: 600; color: ${d.charges_enabled ? '#059669' : '#dc2626'};">
            ${d.charges_enabled ? '✓ Enabled' : '✗ Disabled'}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280;">Payouts:</span>
          <span style="font-weight: 600; color: ${d.payouts_enabled ? '#059669' : '#dc2626'};">
            ${d.payouts_enabled ? '✓ Enabled' : '✗ Disabled'}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #6b7280;">Details:</span>
          <span style="font-weight: 600; color: ${d.details_submitted ? '#059669' : '#dc2626'};">
            ${d.details_submitted ? '✓ Complete' : '✗ Incomplete'}
          </span>
        </div>
      </div>
    </div>

    ${d.next_steps ? `
      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; color: #1e40af;">Next Steps</h3>
        <ul style="margin: 0; padding-left: 20px; color: #1f2937;">
          ${d.next_steps.map((step: string) => `<li style="margin-bottom: 8px;">${step}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    ${d.dashboard_url ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${d.dashboard_url}" style="display: inline-block; background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          View Stripe Dashboard
        </a>
      </div>
    ` : ''}

    <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px;">
      <p style="margin: 0 0 10px 0;">Need help? Contact support:</p>
      <p style="margin: 0;">Email: <a href="mailto:support@greenscapelux.com" style="color: #059669;">support@greenscapelux.com</a></p>
    </div>
  </div>`

async function sendEmail(config: any) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify(config)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Email failed')
  return data
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { type, data } = await req.json()

    if (type === 'stripe_connect_status') {
      const emailResult = await sendEmail({
        from: 'noreply@greenscapelux.com',
        to: [data.email],
        subject: data.subject,
        html: stripeConnectTemplate(data)
      })

      return new Response(JSON.stringify({ 
        success: true, 
        emailId: emailResult.id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})