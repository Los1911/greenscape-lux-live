import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './lib/runtimeEnvCheck'
import { AuthProvider } from './contexts/AuthContext'
import { SecurityProvider } from './components/SecurityProvider'
import { checkSupabaseEnvs } from './lib/envGuard'
import { environmentGuard } from './lib/environmentGuard'
<<<<<<< HEAD
import { checkCriticalEnvVars, showEnvErrorScreen } from './lib/envFallback'

// 🔍 CRITICAL: Check for missing environment variables FIRST
const envCheck = checkCriticalEnvVars();
if (!envCheck.isValid && import.meta.env.PROD) {
  console.error('❌ CRITICAL: Missing environment variables:', envCheck.missing);
  console.error(envCheck.message);
  showEnvErrorScreen(envCheck.missing);
  throw new Error('Missing critical environment variables');
}
=======
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706

// 🔍 DEBUG: Verify Vercel environment variables are injected at build time
console.group('🔍 Vercel Environment Variables Debug');
console.log('Build Mode:', import.meta.env.MODE);
console.log('Is Production:', import.meta.env.PROD);
console.log('Is Development:', import.meta.env.DEV);
console.log('\n📦 Environment Variables (injected at build time):');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || '❌ UNDEFINED');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? `✅ SET (${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...)` : '❌ UNDEFINED');
console.log('VITE_STRIPE_PUBLISHABLE_KEY:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? `✅ SET (${import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.substring(0, 20)}...)` : '❌ UNDEFINED');
console.log('VITE_GOOGLE_MAPS_API_KEY:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? `✅ SET` : '❌ UNDEFINED');
console.log('\n💡 If all show ❌ UNDEFINED, environment variables are NOT configured in Vercel Dashboard');
console.log('📝 Action Required: Add VITE_* variables to Vercel → Settings → Environment Variables');
console.groupEnd();


// Initialize environment validation system with route awareness
<<<<<<< HEAD
(async () => {
  try {
    await environmentGuard.initializeForRoute(window.location.pathname, {
      strictMode: import.meta.env.PROD,
      allowPlaceholders: import.meta.env.DEV
    });
  } catch (error) {
    const isAdminRoute = window.location.pathname.includes('/admin');
    console.error('Environment validation failed:', error);
    
    // Only block startup for admin routes in production
    if (import.meta.env.PROD && isAdminRoute) {
      document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1>Configuration Error</h1><p>Admin dashboard requires proper environment configuration. Please contact support.</p></div>';
=======
environmentGuard.initializeForRoute(window.location.pathname, {
  strictMode: import.meta.env.PROD,
  allowPlaceholders: import.meta.env.DEV
}).catch((error) => {
  import('./utils/logger').then(({ logger }) => {
    logger.error('Environment validation failed', error, 'MainApp');
    // Only block startup for admin routes in production
    const isAdminRoute = window.location.pathname.includes('/admin');
    if (import.meta.env.PROD && isAdminRoute) {
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
      throw error;
    }
    // For non-admin routes, just log and continue
    console.warn('⚠️ Environment validation issues detected but continuing for non-admin route');
<<<<<<< HEAD
  }
})();

=======
  });
});
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706

// Legacy environment check (keeping for compatibility)
checkSupabaseEnvs();

// Initialize Google Analytics
import { initGA } from './lib/analytics'
initGA();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SecurityProvider enableCSP={true} enableRateLimit={true}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </SecurityProvider>
  </StrictMode>
)