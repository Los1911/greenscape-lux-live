import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function getEmailContent(notification: any) {
  const { charges_enabled, payouts_enabled, details_submitted } = notification
  
  if (charges_enabled && payouts_enabled && details_submitted) {
    return {
      subject: '🎉 Your Payment Account is Active!',
      title: 'Payment Account Activated',
      message: 'Congratulations! Your Stripe payment account is fully verified and active. You can now accept payments and receive payouts.',
      next_steps: [
        'Start accepting job assignments',
        'Payments will be processed automatically',
        'Payouts are sent according to your schedule',
        'View earnings in your dashboard'
      ]
    }
  }
  
  if (charges_enabled && !payouts_enabled) {
    return {
      subject: '⚠️ Banking Information Required',
      title: 'Banking Setup Required',
      message: 'Your account can accept charges, but payouts are disabled. Please complete your banking information to receive payments.',
      next_steps: [
        'Click "View Stripe Dashboard" below',
        'Complete your banking information',
        'Verify your bank account',
        'Payouts will be enabled automatically'
      ]
    }
  }
  
  if (details_submitted && (!charges_enabled || !payouts_enabled)) {
    return {
      subject: '⏳ Account Under Review',
      title: 'Verification in Progress',
      message: 'Your account information has been submitted and is being reviewed by Stripe. This typically takes 1-2 business days.',
      next_steps: [
        'Check your email for any verification requests from Stripe',
        'Ensure all submitted information is accurate',
        'You will be notified when verification is complete',
        'Contact support if you have questions'
      ]
    }
  }
  
  return {
    subject: '🔔 Action Required',
    title: 'Setup Incomplete',
    message: 'Your payment account requires additional information or action. Please complete the setup to start accepting payments.',
    next_steps: [
      'Click "View Stripe Dashboard" below',
      'Complete all required information',
      'Upload any requested documents',
      'Contact support if you need assistance'
    ]
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Get unprocessed notifications
    const { data: notifications, error: notifError } = await supabase
      .from('stripe_connect_notifications')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(10)

    if (notifError) throw notifError

    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending notifications' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const results = []

    for (const notification of notifications) {
      try {
        // Get landscaper info
        const { data: landscaper } = await supabase
          .from('landscapers')
          .select('user_id, users!inner(email, full_name)')
          .eq('stripe_connect_id', notification.stripe_connect_id)
          .single()

        if (!landscaper) {
          console.error('Landscaper not found for:', notification.stripe_connect_id)
          continue
        }

        const emailContent = getEmailContent(notification)

        // Send email
        const emailResponse = await supabase.functions.invoke('unified-email', {
          body: {
            type: 'stripe_connect_status',
            data: {
              email: landscaper.users.email,
              name: landscaper.users.full_name,
              subject: emailContent.subject,
              title: emailContent.title,
              message: emailContent.message,
              charges_enabled: notification.charges_enabled,
              payouts_enabled: notification.payouts_enabled,
              details_submitted: notification.details_submitted,
              next_steps: emailContent.next_steps,
              dashboard_url: 'https://www.greenscapelux.com/landscaper/profile'
            }
          }
        })

        if (emailResponse.error) {
          console.error('Email error:', emailResponse.error)
          continue
        }

        // Mark as processed
        await supabase
          .from('stripe_connect_notifications')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('id', notification.id)

        results.push({
          id: notification.id,
          email: landscaper.users.email,
          status: 'sent'
        })

      } catch (error: any) {
        console.error('Error processing notification:', error)
        results.push({
          id: notification.id,
          status: 'error',
          error: error.message
        })
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      processed: results.length,
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})