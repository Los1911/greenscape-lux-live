// Environment variables guard for audit purposes with safe access
const safeGetEnv = (key: string) => {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.import?.meta?.env) {
      return globalThis.import.meta.env[key];
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
};

export const envOk = !!(safeGetEnv('VITE_SUPABASE_URL') && safeGetEnv('VITE_SUPABASE_ANON_KEY'));

export const checkSupabaseEnvs = () => {
  const isDev = safeGetEnv('DEV') || safeGetEnv('MODE') === 'development';
  
  if (isDev) {
    console.log('🔍 Environment Variables Check:');
    console.log('VITE_SUPABASE_URL:', safeGetEnv('VITE_SUPABASE_URL') ? '✅ Set' : '❌ Missing');
    console.log('VITE_SUPABASE_ANON_KEY:', safeGetEnv('VITE_SUPABASE_ANON_KEY') ? '✅ Set' : '❌ Missing');
    console.log('VITE_SUPABASE_FUNCTIONS_URL:', safeGetEnv('VITE_SUPABASE_FUNCTIONS_URL') ? '✅ Set' : '❌ Missing');
    console.log('VITE_ADMIN_EMAIL:', safeGetEnv('VITE_ADMIN_EMAIL') ? '✅ Set' : '❌ Missing');
    
    console.log('📋 Raw values:');
    console.log('  URL:', safeGetEnv('VITE_SUPABASE_URL') || 'undefined');
    console.log('  Key:', safeGetEnv('VITE_SUPABASE_ANON_KEY') ? '[PRESENT]' : 'undefined');
    
    if (!envOk) {
      console.warn('⚠️ Missing environment variables detected!');
      console.log('🔧 Quick fixes:');
      console.log('  1. Create .env.local file: cp .env.local.template .env.local');
      console.log('  2. Restart dev server: npm run dev');
      console.log('  3. For production: Set Vercel environment variables');
    } else {
      console.log('✅ All required environment variables are properly set');
    }
  }
};