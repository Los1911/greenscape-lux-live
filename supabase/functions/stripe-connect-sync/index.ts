export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('Missing Stripe signature');
    }

    const body = await req.text();
    let event;
    try {
      event = JSON.parse(body);
    } catch (err) {
      throw new Error('Invalid JSON payload');
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Log webhook event
    await supabase.from('webhook_logs').insert({
      event_type: event.type,
      event_id: event.id,
      processed_at: new Date().toISOString(),
      data: event.data
    });

    if (event.type === 'account.updated') {
      const account = event.data.object;
      
      // Get landscaper info
      const { data: landscaper } = await supabase
        .from('landscapers')
        .select('id, user_id, stripe_charges_enabled, stripe_payouts_enabled')
        .eq('stripe_connect_id', account.id)
        .single();
      
      if (!landscaper) {
        console.log(`No landscaper found for Stripe account: ${account.id}`);
        return new Response(JSON.stringify({ received: true, message: 'No landscaper found' }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const newStatus = account.charges_enabled && account.payouts_enabled ? 'active' : 'pending';
      const wasActive = landscaper.stripe_charges_enabled && landscaper.stripe_payouts_enabled;
      const isNowActive = account.charges_enabled && account.payouts_enabled;
      
      // Update landscapers table
      await supabase.from('landscapers').update({
        stripe_charges_enabled: account.charges_enabled || false,
        stripe_payouts_enabled: account.payouts_enabled || false,
        stripe_details_submitted: account.details_submitted || false,
        stripe_account_status: newStatus,
        updated_at: new Date().toISOString()
      }).eq('stripe_connect_id', account.id);
      
      // Update profiles/users table
      await supabase.from('users').update({
        stripe_account_status: newStatus,
        updated_at: new Date().toISOString()
      }).eq('id', landscaper.user_id);

      // Log to stripe_connect_notifications
      await supabase.from('stripe_connect_notifications').insert({
        landscaper_id: landscaper.id,
        event_type: 'account.updated',
        stripe_account_id: account.id,
        charges_enabled: account.charges_enabled || false,
        payouts_enabled: account.payouts_enabled || false,
        requirements: account.requirements || {},
        notification_sent: false,
        created_at: new Date().toISOString()
      });

      // Get user for notifications
      const { data: user } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', landscaper.user_id)
        .single();
      
      if (user) {
        // Send onboarding complete notification
        if (!wasActive && isNowActive) {
          await supabase.functions.invoke('unified-email', {
            body: {
              to: user.email,
              subject: '🎉 Stripe Connect Setup Complete - Ready to Receive Payments!',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #10b981;">Congratulations ${user.full_name}!</h2>
                  <p>Your Stripe Connect account is now fully set up and verified.</p>
                  <p><strong>You can now receive payments for completed jobs!</strong></p>
                  <ul style="list-style: none; padding: 0;">
                    <li style="padding: 8px 0;">✅ Identity verified</li>
                    <li style="padding: 8px 0;">✅ Bank account connected</li>
                    <li style="padding: 8px 0;">✅ Tax information submitted</li>
                  </ul>
                  <p>Payments will be automatically transferred to your bank account after job completion.</p>
                  <a href="https://greenscapelux.com/landscaper-dashboard" 
                     style="display: inline-block; background: #10b981; color: white; 
                            padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
                    View Dashboard
                  </a>
                </div>
              `
            }
          });
          
          await supabase.from('notifications').insert({
            user_id: landscaper.user_id,
            type: 'stripe_onboarding_complete',
            title: 'Stripe Setup Complete!',
            message: 'Your account is verified and ready to receive payments.',
            read: false,
            created_at: new Date().toISOString()
          });

          // Update notification sent flag
          await supabase.from('stripe_connect_notifications')
            .update({ notification_sent: true })
            .eq('landscaper_id', landscaper.id)
            .eq('event_type', 'account.updated')
            .order('created_at', { ascending: false })
            .limit(1);
        }
        
        // Send verification needed notification
        const requiresAction = account.requirements?.currently_due?.length > 0 || 
                              account.requirements?.past_due?.length > 0;
        
        if (requiresAction) {
          const requiredFields = [
            ...(account.requirements.currently_due || []), 
            ...(account.requirements.past_due || [])
          ].join(', ');
          
          await supabase.functions.invoke('unified-email', {
            body: {
              to: user.email,
              subject: '⚠️ Action Required: Complete Your Stripe Verification',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #f59e0b;">Additional Verification Needed</h2>
                  <p>Hi ${user.full_name},</p>
                  <p>To continue receiving payments, please complete the following verification steps:</p>
                  <div style="background: #fef3c7; padding: 16px; border-radius: 6px; margin: 16px 0;">
                    <p style="margin: 0;"><strong>Required information:</strong></p>
                    <p style="margin: 8px 0 0 0;">${requiredFields}</p>
                  </div>
                  <a href="https://greenscapelux.com/landscaper-dashboard" 
                     style="display: inline-block; background: #10b981; color: white; 
                            padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
                    Complete Verification
                  </a>
                </div>
              `
            }
          });
          
          await supabase.from('notifications').insert({
            user_id: landscaper.user_id,
            type: 'stripe_verification_required',
            title: 'Verification Required',
            message: `Please complete: ${requiredFields}`,
            read: false,
            created_at: new Date().toISOString()
          });
        }
      }
      
      console.log(`✅ Updated Stripe Connect status for landscaper ${landscaper.id}: ${newStatus}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
