import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(JSON.stringify({ ok: true }), {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
    );
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      return new Response(
        JSON.stringify({
          error: "Missing required environment variables",
        }),
        { headers: corsHeaders, status: 500 }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { headers: corsHeaders, status: 401 }
      );
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const serviceClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized user" }),
        { headers: corsHeaders, status: 401 }
      );
    }

    let body;

    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { headers: corsHeaders, status: 400 }
      );
    }

    const { jobId, action } = body;

    if (!jobId || !action) {
      return new Response(
        JSON.stringify({ error: "Missing jobId or action" }),
        { headers: corsHeaders, status: 400 }
      );
    }

    if (action !== "complete") {
      return new Response(
        JSON.stringify({ error: "Unsupported action" }),
        { headers: corsHeaders, status: 400 }
      );
    }

    const { data: job, error: jobError } = await serviceClient
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { headers: corsHeaders, status: 404 }
      );
    }

    const { error: updateError } = await serviceClient
      .from("jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { headers: corsHeaders, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        newStatus: "completed",
      }),
      { headers: corsHeaders, status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: err instanceof Error ? err.message : "Unknown error",
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});
