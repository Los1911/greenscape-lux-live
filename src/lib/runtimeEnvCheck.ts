// Runtime environment check with safe access
export const runtimeEnvCheck = () => {
  const hasImportMeta = typeof window !== 'undefined' && (window as any).import?.meta;
  const env = hasImportMeta?.env || {};
  
  console.log('import.meta.env available:', !!hasImportMeta);
  console.log('VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL || 'UNDEFINED');
  console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'SET' : 'UNDEFINED');
  console.log('DEV mode:', env.DEV);
  console.log('Environment object keys:', Object.keys(env));
  
  return {
    hasImportMeta: !!hasImportMeta,
    env,
    supabaseUrl: env.VITE_SUPABASE_URL,
    supabaseKey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
    isDev: env.DEV
  };
};
// Auto-run in development with safe access
const env = (typeof window !== 'undefined' && (window as any).import?.meta?.env) || {};
if (env.DEV) {
  runtimeEnvCheck();
}