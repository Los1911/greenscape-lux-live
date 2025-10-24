import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { secrets } = await req.json()
    
    const secretStatus: Record<string, boolean> = {}
    
    // Check each secret exists (without exposing values)
    for (const secretName of secrets) {
      const value = Deno.env.get(secretName)
      secretStatus[secretName] = !!value
    }
    
    const allValid = Object.values(secretStatus).every(Boolean)
    
    return new Response(
      JSON.stringify({
        valid: allValid,
        secrets: secretStatus,
        message: allValid ? 'All secrets configured' : 'Some secrets missing'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})