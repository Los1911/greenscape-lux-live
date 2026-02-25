import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { SecurityProvider } from './components/SecurityProvider'
import { initSessionRecovery } from './utils/sessionRecovery'
import { initGlobalErrorHandlers } from './components/ErrorBoundary'

// =============================================================================
// BUILD VERSION - Used for cache validation
// =============================================================================
const BUILD_VERSION = 'admin-jobs-fix-final-20260126';
const QUERY_SOURCE = 'jobs'; // NOT quotes
const CACHE_VERSION = 'v4';

// =============================================================================
// GLOBAL ERROR HANDLERS - Initialize before anything else
// =============================================================================
initGlobalErrorHandlers();

// =============================================================================
// VERSION LOGGING - Critical for debugging deployment issues
// =============================================================================
console.log('═══════════════════════════════════════════════════════════════');
console.log('🚀 GreenScape Lux Starting...');
console.log('📦 Build Version:', BUILD_VERSION);
console.log('🔍 Query Source:', QUERY_SOURCE, '(admin queries use jobs table)');
console.log('📋 Cache Version:', CACHE_VERSION);
console.log('⏰ Build Time:', '2026-01-26T07:30:00Z');
console.log('═══════════════════════════════════════════════════════════════');

// Validate this is the correct build
if (QUERY_SOURCE !== 'jobs') {
  console.error('❌ CRITICAL: Stale build detected! Query source should be "jobs"');
}

// Simple environment check - log only, never block
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('📦 Supabase URL:', supabaseUrl || '⚠️ Not set');
console.log('🔑 Supabase Key:', supabaseKey ? '✓ Configured' : '⚠️ Not set');

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Missing Supabase configuration. Some features may not work.');
}

// Initialize Google Analytics
import { initGA } from './lib/analytics'
initGA();

// Initialize session recovery for background/idle handling
initSessionRecovery();

// =============================================================================
// CACHE VALIDATION - Ensure we're running the latest code
// =============================================================================
const validateCache = async () => {
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('[CacheValidation] Server version:', data.commitHash);
      console.log('[CacheValidation] Server query source:', data.querySource);
      
      if (data.querySource && data.querySource !== 'jobs') {
        console.error('[CacheValidation] ❌ Server reports stale query source!');
      }
      
      if (data.commitHash !== BUILD_VERSION) {
        console.warn('[CacheValidation] ⚠️ Version mismatch - may need refresh');
        console.warn('[CacheValidation] Local:', BUILD_VERSION);
        console.warn('[CacheValidation] Server:', data.commitHash);
      } else {
        console.log('[CacheValidation] ✅ Version matches');
      }
    }
  } catch (e) {
    console.warn('[CacheValidation] Could not validate cache:', e);
  }
};

// Run cache validation after app loads
setTimeout(validateCache, 2000);

// =============================================================================
// RENDER APP - Wrapped in providers with error boundary in App.tsx
// =============================================================================
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SecurityProvider enableCSP={true} enableRateLimit={true}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </SecurityProvider>
  </StrictMode>
)

// Export version for debugging
export const APP_BUILD_VERSION = BUILD_VERSION;
export const APP_QUERY_SOURCE = QUERY_SOURCE;
