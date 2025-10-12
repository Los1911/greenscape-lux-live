import { serverConfig } from '../_shared/serverConfig.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check if each secret is configured (not missing or placeholder)
    const checkSecret = (value: string | undefined): string => {
      if (!value || value === '') {
        return 'MISSING';
      }
      // Check for placeholder patterns
      if (value.startsWith('__________') && value.endsWith('__________')) {
        return 'MISSING';
      }
      if (value === 'your-key-here' || value === 'placeholder') {
        return 'MISSING';
      }
      return 'CONFIGURED';
    };

    const report = {
      SUPABASE_SERVICE_ROLE_KEY: checkSecret(serverConfig.supabaseServiceRoleKey),
      STRIPE_SECRET_KEY: checkSecret(serverConfig.stripeSecretKey),
      STRIPE_WEBHOOK_SECRET: checkSecret(serverConfig.stripeWebhookSecret),
      RESEND_API_KEY: checkSecret(serverConfig.resendApiKey),
    };

    // Count configured vs missing
    const configured = Object.values(report).filter(v => v === 'CONFIGURED').length;
    const missing = Object.values(report).filter(v => v === 'MISSING').length;

    return new Response(
      JSON.stringify({
        status: 'ok',
        summary: {
          total: Object.keys(report).length,
          configured,
          missing,
        },
        report,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
