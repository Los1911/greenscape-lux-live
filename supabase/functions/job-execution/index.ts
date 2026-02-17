import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface JobExecutionRequest {
  action: 'start' | 'complete' | 'admin_approve' | 'admin_reject';
  jobId: string;
  rejectionReason?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ENV GUARD
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // AUTH HEADER CHECK
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // JWT DECODE (verify_jwt true already validates token)
    let userId: string;
    try {
      const token = authHeader.substring(7);
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token format');

      const base64Payload = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const payload = JSON.parse(atob(base64Payload));
      userId = payload.sub;

      if (!userId) throw new Error('Missing sub claim');
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SAFE BODY PARSE
    let body: JobExecutionRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or missing JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, jobId, rejectionReason } = body;

    if (!action || !jobId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // FETCH JOB
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, landscaper_id, assigned_to')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ success: false, error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: landscaperProfile } = await supabase
      .from('landscapers')
      .select('id, user_id')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    const isAdmin = userRecord?.role === 'admin';

    switch (action) {
      case 'start': {
        if (!['accepted', 'assigned', 'active'].includes(job.status)) {
          return new Response(
            JSON.stringify({ success: false, error: `Cannot start job. Current status: ${job.status}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!landscaperProfile || (job.landscaper_id !== landscaperProfile.id && job.assigned_to !== userId)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Not assigned to this job' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const startedAt = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('jobs')
          .update({ status: 'in_progress', started_at: startedAt })
          .eq('id', jobId);

        if (updateError) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to start job' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, status: 'in_progress' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'complete': {
        if (job.status !== 'in_progress') {
          return new Response(
            JSON.stringify({ success: false, error: `Cannot complete job. Current status: ${job.status}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const completedAt = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('jobs')
          .update({ status: 'completed_pending_review', completed_at: completedAt })
          .eq('id', jobId);

        if (updateError) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to complete job' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, status: 'completed_pending_review' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'admin_approve': {
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ success: false, error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('jobs')
          .update({ status: 'completed', approved_by: userId })
          .eq('id', jobId);

        return new Response(
          JSON.stringify({ success: true, status: 'completed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'admin_reject': {
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ success: false, error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!rejectionReason?.trim()) {
          return new Response(
            JSON.stringify({ success: false, error: 'Rejection reason required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('jobs')
          .update({ status: 'in_progress', rejection_reason: rejectionReason.trim() })
          .eq('id', jobId);

        return new Response(
          JSON.stringify({ success: true, status: 'in_progress' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
