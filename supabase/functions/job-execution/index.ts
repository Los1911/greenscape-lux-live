import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type'
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
    console.log('[job-execution] Request received');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔐 Decode JWT directly (verify_jwt already validated it)
    let userId: string;

    try {
      const token = authHeader.substring(7);
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token format');

      const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = atob(base64Payload);
      const payload = JSON.parse(payloadJson);

      userId = payload.sub;

      if (!userId) throw new Error('Missing sub claim');
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        if (job.status !== 'active') {
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

        return new Response(
          JSON.stringify({ success: true, message: 'Job is active and ready' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'complete': {
        if (job.status !== 'active') {
          return new Response(
            JSON.stringify({ success: false, error: `Cannot complete job. Current status: ${job.status}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!landscaperProfile || (job.landscaper_id !== landscaperProfile.id && job.assigned_to !== userId)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Not assigned to this job' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: photos } = await supabase
          .from('job_photos')
          .select('type')
          .eq('job_id', jobId);

        const beforePhotos = (photos || []).filter(p => p.type === 'before');
        const afterPhotos = (photos || []).filter(p => p.type === 'after');

        if (beforePhotos.length === 0 || afterPhotos.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'At least one before and one after photo required' }),
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
          JSON.stringify({
            success: true,
            message: 'Job submitted for review',
            job: { id: jobId, status: 'completed_pending_review' }
          }),
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
