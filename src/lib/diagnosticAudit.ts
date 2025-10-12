// Comprehensive Supabase Configuration Diagnostic Audit
export interface DiagnosticReport {
  timestamp: string;
  buildTime: {
    envVarsPresent: boolean;
    viteSupabaseUrl: string | undefined;
    viteSupabaseAnonKey: string | undefined;
    allEnvVars: Record<string, boolean>;
  };
  runtime: {
    runtimeConfigSource: string;
    runtimeConfigUrl: string;
    runtimeConfigAnon: string;
    healthCheckSource: string;
    healthCheckUrl: string;
    healthCheckAnon: string;
  };
  localStorage: {
    gslKeys: { url: string | undefined; anon: string | undefined };
    supabaseKeys: { url: string | undefined; anon: string | undefined };
  };
  queryParams: {
    sbParam: string | undefined;
    urlParam: string | undefined;
    anonParam: string | undefined;
  };
  conflicts: string[];
  recommendations: string[];
  passFailStatus: {
    envVars: 'PASS' | 'FAIL';
    runtimeConfig: 'PASS' | 'FAIL';
    healthCheck: 'PASS' | 'FAIL';
    overall: 'PASS' | 'FAIL';
  };
}

function maskValue(value: string | undefined): string {
  if (!value) return 'NOT_SET';
  if (value.length < 8) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function runDiagnosticAudit(): DiagnosticReport {
  const timestamp = new Date().toISOString();
  const env = (import.meta as any).env || {};
  
  // Build time environment variables
  const viteSupabaseUrl = env.VITE_SUPABASE_URL;
  const viteSupabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON;
  const envVarsPresent = !!(viteSupabaseUrl && viteSupabaseAnonKey);
  
  // All environment variables audit
  const allEnvVars = Object.keys(env)
    .filter(k => k.toLowerCase().includes('supabase') || k.toLowerCase().includes('database'))
    .reduce((acc, key) => ({ ...acc, [key]: !!env[key] }), {});

  // Runtime config check (synchronous)
  let runtimeConfigSource = 'UNKNOWN';
  let runtimeConfigUrl = 'UNKNOWN';
  let runtimeConfigAnon = 'UNKNOWN';
  
  try {
    const { getRuntimeConfig } = require('./runtimeConfig');
    const config = getRuntimeConfig();
    runtimeConfigSource = config.source;
    runtimeConfigUrl = maskValue(config.url);
    runtimeConfigAnon = maskValue(config.anon);
  } catch (e) {
    // Try direct access if require fails
    try {
      import('./runtimeConfig').then(module => {
        const config = module.getRuntimeConfig();
        runtimeConfigSource = config.source;
        runtimeConfigUrl = maskValue(config.url);
        runtimeConfigAnon = maskValue(config.anon);
      });
    } catch (e2) {
      console.error('Failed to get runtime config:', e2);
    }
  }

  // Health check (synchronous)
  let healthCheckSource = 'UNKNOWN';
  let healthCheckUrl = 'UNKNOWN';
  let healthCheckAnon = 'UNKNOWN';
  
  try {
    const { checkSupabaseConfigHealth } = require('./configHealthCheck');
    const health = checkSupabaseConfigHealth();
    healthCheckSource = health.activeSource;
    healthCheckUrl = health.envVars.url || health.localStorage.url || health.queryParams.url || 'NOT_SET';
    healthCheckAnon = health.envVars.anonKey || health.localStorage.anonKey || health.queryParams.anonKey || 'NOT_SET';
  } catch (e) {
    console.error('Failed to get health check:', e);
  }

  // LocalStorage audit
  let gslKeys = { url: undefined as string | undefined, anon: undefined as string | undefined };
  let supabaseKeys = { url: undefined as string | undefined, anon: undefined as string | undefined };
  
  try {
    gslKeys = {
      url: localStorage.getItem('GSL_SUPABASE_URL') || undefined,
      anon: localStorage.getItem('GSL_SUPABASE_ANON') || undefined
    };
    
    supabaseKeys = {
      url: localStorage.getItem('supabaseUrl') || undefined,
      anon: localStorage.getItem('supabaseAnonKey') || undefined
    };
  } catch (e) {
    console.error('Failed to access localStorage:', e);
  }

  // Query parameters
  let queryParams = { sbParam: undefined as string | undefined, urlParam: undefined as string | undefined, anonParam: undefined as string | undefined };
  try {
    const params = new URLSearchParams(window.location.search);
    queryParams = {
      sbParam: params.get('sb') || undefined,
      urlParam: params.get('url') || undefined,
      anonParam: params.get('anon') || undefined
    };
  } catch (e) {
    console.error('Failed to get query params:', e);
  }

  // Conflict detection
  const conflicts: string[] = [];
  if (runtimeConfigSource !== healthCheckSource && runtimeConfigSource !== 'UNKNOWN' && healthCheckSource !== 'UNKNOWN') {
    conflicts.push(`Runtime config source (${runtimeConfigSource}) differs from health check (${healthCheckSource})`);
  }
  
  if (gslKeys.url && supabaseKeys.url && gslKeys.url !== supabaseKeys.url) {
    conflicts.push('Different URLs found in localStorage GSL vs supabase keys');
  }

  // Recommendations
  const recommendations: string[] = [];
  if (!envVarsPresent) {
    recommendations.push('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  }
  if (conflicts.length > 0) {
    recommendations.push('Resolve configuration conflicts between different systems');
  }
  if (runtimeConfigSource === 'MISSING') {
    recommendations.push('No valid Supabase configuration found - check environment variables');
  }

  // Pass/Fail Status
  const passFailStatus = {
    envVars: envVarsPresent ? 'PASS' : 'FAIL' as 'PASS' | 'FAIL',
    runtimeConfig: runtimeConfigSource !== 'MISSING' && runtimeConfigSource !== 'UNKNOWN' ? 'PASS' : 'FAIL' as 'PASS' | 'FAIL',
    healthCheck: healthCheckSource !== 'MISSING' && healthCheckSource !== 'UNKNOWN' ? 'PASS' : 'FAIL' as 'PASS' | 'FAIL',
    overall: (envVarsPresent && runtimeConfigSource !== 'MISSING' && runtimeConfigSource !== 'UNKNOWN') ? 'PASS' : 'FAIL' as 'PASS' | 'FAIL'
  };

  return {
    timestamp,
    buildTime: {
      envVarsPresent,
      viteSupabaseUrl: maskValue(viteSupabaseUrl),
      viteSupabaseAnonKey: maskValue(viteSupabaseAnonKey),
      allEnvVars
    },
    runtime: {
      runtimeConfigSource,
      runtimeConfigUrl,
      runtimeConfigAnon,
      healthCheckSource,
      healthCheckUrl,
      healthCheckAnon
    },
    localStorage: {
      gslKeys: {
        url: maskValue(gslKeys.url),
        anon: maskValue(gslKeys.anon)
      },
      supabaseKeys: {
        url: maskValue(supabaseKeys.url),
        anon: maskValue(supabaseKeys.anon)
      }
    },
    queryParams,
    conflicts,
    recommendations,
    passFailStatus
  };
}