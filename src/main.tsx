import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './lib/runtimeEnvCheck'
import { AuthProvider } from './contexts/AuthContext'
import { SecurityProvider } from './components/SecurityProvider'
import { checkSupabaseEnvs } from './lib/envGuard'
import { environmentGuard } from './lib/environmentGuard'

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
environmentGuard.initializeForRoute(window.location.pathname, {
  strictMode: import.meta.env.PROD,
  allowPlaceholders: import.meta.env.DEV
}).catch((error) => {
  import('./utils/logger').then(({ logger }) => {
    logger.error('Environment validation failed', error, 'MainApp');
    // Only block startup for admin routes in production
    const isAdminRoute = window.location.pathname.includes('/admin');
    if (import.meta.env.PROD && isAdminRoute) {
      throw error;
    }
    // For non-admin routes, just log and continue
    console.warn('⚠️ Environment validation issues detected but continuing for non-admin route');
  });
});

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