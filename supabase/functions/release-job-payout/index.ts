import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const RELEASABLE_STATUS = 'ready_for_release';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

  if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Server configuration missing. Contact support.',
        code: 'CONFIG_MISSING'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { jobId, adminUserId } = await req.json();

    if (!jobId || !adminUserId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: jobId and adminUserId',
          code: 'INVALID_REQUEST'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, service_type, status, payout_status, payout_amount, landscaper_id, client_id')
      .eq('id', jobId)
      .eq('payout_status', RELEASABLE_STATUS)
      .single();

    if (jobError || !job) {
      console.error('[release-job-payout] Job not eligible. jobId=' + jobId + ' error=' + (jobError?.message || 'no rows'));
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Job not found or payout already processed. Refresh the queue.',
          code: 'JOB_NOT_ELIGIBLE'
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (job.status !== 'completed') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Job is not in completed status.',
          code: 'JOB_NOT_COMPLETED'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('id, amount, status, platform_fee, landscaper_payout')
      .eq('job_id', jobId)
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const payoutAmountDollars = payment?.landscaper_payout || job.payout_amount || 0;

    if (payoutAmountDollars <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payout amount is zero or missing. Cannot release.',
          code: 'ZERO_PAYOUT'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: landscaper, error: landscaperError } = await supabase
      .from('landscapers')
      .select('id, user_id, business_name, stripe_connect_id, stripe_payouts_enabled, stripe_charges_enabled')
      .eq('id', job.landscaper_id)
      .single();

    if (landscaperError || !landscaper) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Landscaper not found.',
          code: 'LANDSCAPER_NOT_FOUND'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!landscaper.stripe_connect_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Landscaper has no Stripe Connect account. They must complete onboarding first.',
          code: 'NO_STRIPE_CONNECT'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!landscaper.stripe_payouts_enabled) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Landscaper has Stripe payouts disabled. Their account may need further verification.',
          code: 'PAYOUTS_DISABLED'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: lockResult, error: lockError } = await supabase
      .from('jobs')
      .update({ payout_status: 'processing' })
      .eq('id', jobId)
      .eq('payout_status', RELEASABLE_STATUS)
      .select('id')
      .single();

    if (lockError || !lockResult) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payout was already picked up by another admin. Refresh the queue.',
          code: 'RACE_CONDITION'
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payoutAmountCents = Math.round(payoutAmountDollars * 100);

    const transferParams = new URLSearchParams();
    transferParams.append('amount', String(payoutAmountCents));
    transferParams.append('currency', 'usd');
    transferParams.append('destination', landscaper.stripe_connect_id);
    transferParams.append('metadata[job_id]', jobId);
    transferParams.append('metadata[landscaper_id]', landscaper.id);
    transferParams.append('metadata[admin_user_id]', adminUserId);
    transferParams.append('metadata[source]', 'admin_release_payout');

    let transfer;

    try {
      const stripeResp = await fetch('https://api.stripe.com/v1/transfers', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + stripeSecretKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: transferParams
      });

      const transferData = await stripeResp.json();

      if (!stripeResp.ok) {
        throw new Error(transferData?.error?.message || ('Stripe API error: HTTP ' + stripeResp.status));
      }

      transfer = transferData;
      console.log('[release-job-payout] Stripe transfer created:', transfer.id);

    } catch (stripeError) {
      console.error('[release-job-payout] Stripe transfer failed, rolling back:', stripeError.message);

      await supabase
        .from('jobs')
        .update({ payout_status: RELEASABLE_STATUS })
        .eq('id', jobId)
        .eq('payout_status', 'processing');

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Stripe transfer failed: ' + stripeError.message,
          code: 'STRIPE_TRANSFER_FAILED'
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date().toISOString();

    const { error: finalUpdateError } = await supabase
      .from('jobs')
      .update({
        payout_status: 'paid',
        payout_amount: payoutAmountDollars,
        payout_released_at: now,
        payout_released_by: adminUserId,
        stripe_transfer_id: transfer.id
      })
      .eq('id', jobId)
      .eq('payout_status', 'processing');

    if (finalUpdateError) {
      console.error('[release-job-payout] CRITICAL: Stripe transfer succeeded but DB update failed!', {
        transferId: transfer.id,
        jobId,
        error: finalUpdateError.message
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Stripe transfer succeeded but database update failed. Transfer ID: ' + transfer.id,
          code: 'DB_UPDATE_FAILED_AFTER_TRANSFER',
          transferId: transfer.id
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payoutDate = now.split('T')[0];

    const { data: payoutRecord } = await supabase
      .from('payouts')
      .insert({
        landscaper_id: landscaper.id,
        amount: payoutAmountDollars,
        currency: 'usd',
        status: 'completed',
        stripe_transfer_id: transfer.id,
        payout_date: payoutDate,
        processed_at: now,
        metadata: {
          job_id: jobId,
          stripe_connect_id: landscaper.stripe_connect_id,
          admin_user_id: adminUserId,
          transfer_amount_cents: payoutAmountCents
        },
        job_ids: [jobId],
        user_id: adminUserId
      })
      .select('id')
      .single();

    console.log('[release-job-payout] SUCCESS: Job ' + jobId + ' paid $' + payoutAmountDollars + ' via ' + transfer.id);

    return new Response(
      JSON.stringify({
        success: true,
        transferId: transfer.id,
        payoutId: payoutRecord?.id || null,
        amount: payoutAmountDollars,
        landscaper: landscaper.business_name || 'Unknown',
        releasedAt: now
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[release-job-payout] Unhandled error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred.',
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
