import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VersionInfo {
  commitHash: string;
  buildId: string;
  timestamp: number;
  environment: string;
  deployedAt: string;
  cacheVersion?: string;
  querySource?: string;
}

// Build-time constant for version comparison
const BUILD_VERSION = 'admin-jobs-fix-final-20260126';
const CACHE_VERSION = 'v4';

export function VersionChecker() {
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('New version available. Reloading...');

  useEffect(() => {
    // Log current build version on mount
    console.log('[VersionChecker] Current build version:', BUILD_VERSION);
    console.log('[VersionChecker] Query source: jobs table (NOT quotes)');
    
    // Only run version checking in production
    if (import.meta.env.DEV) {
      console.log('[VersionChecker] Dev mode - skipping version check');
      return;
    }

    const checkVersion = async () => {
      try {
        // Add cache-busting timestamp to prevent cached version.json
        const cacheBuster = Date.now();
        const response = await fetch(`/version.json?t=${cacheBuster}&v=${BUILD_VERSION}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          console.warn('[VersionChecker] Failed to fetch version.json:', response.status);
          return;
        }
        
        const data: VersionInfo = await response.json();
        
        console.log('[VersionChecker] Server version:', data.commitHash);
        console.log('[VersionChecker] Server query source:', data.querySource);
        
        // Skip if placeholder values
        if (data.commitHash === 'PLACEHOLDER' || !data.commitHash) {
          console.log('[VersionChecker] Placeholder version detected, skipping');
          return;
        }
        
        setVersion(data);
        
        // Check for version mismatch
        const storedVersion = localStorage.getItem('app_version');
        const storedCacheVersion = localStorage.getItem('app_cache_version');
        
        console.log('[VersionChecker] Stored version:', storedVersion);
        console.log('[VersionChecker] Stored cache version:', storedCacheVersion);
        
        // Force reload if:
        // 1. Version hash changed
        // 2. Cache version changed (new deployment)
        // 3. Query source is not 'jobs' (stale code)
        const versionMismatch = storedVersion && storedVersion !== data.commitHash;
        const cacheVersionMismatch = storedCacheVersion && data.cacheVersion && storedCacheVersion !== data.cacheVersion;
        const staleQuerySource = data.querySource && data.querySource !== 'jobs';
        
        if (versionMismatch || cacheVersionMismatch || staleQuerySource) {
          console.log('[VersionChecker] Version mismatch detected!');
          console.log('[VersionChecker] - Version mismatch:', versionMismatch);
          console.log('[VersionChecker] - Cache version mismatch:', cacheVersionMismatch);
          console.log('[VersionChecker] - Stale query source:', staleQuerySource);
          
          if (staleQuerySource) {
            setAlertMessage('Critical update available. Clearing cache and reloading...');
          }
          
          setShowAlert(true);
          
          // Clear all caches before reload
          if ('caches' in window) {
            try {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map(name => caches.delete(name)));
              console.log('[VersionChecker] Service worker caches cleared');
            } catch (e) {
              console.warn('[VersionChecker] Failed to clear caches:', e);
            }
          }
          
          // Update stored versions
          localStorage.setItem('app_version', data.commitHash);
          if (data.cacheVersion) {
            localStorage.setItem('app_cache_version', data.cacheVersion);
          }
          
          // Force hard reload after brief delay
          setTimeout(() => {
            // Use location.reload(true) for hard reload (deprecated but still works)
            // Or navigate to current URL with cache-busting param
            const url = new URL(window.location.href);
            url.searchParams.set('_cb', Date.now().toString());
            window.location.href = url.toString();
          }, 2000);
          
        } else if (!storedVersion) {
          // First visit - store version
          localStorage.setItem('app_version', data.commitHash);
          if (data.cacheVersion) {
            localStorage.setItem('app_cache_version', data.cacheVersion);
          }
          console.log('[VersionChecker] First visit - version stored');
        } else {
          console.log('[VersionChecker] Version up to date');
        }
      } catch (error) {
        console.error('[VersionChecker] Version check failed:', error);
      }
    };

    // Check immediately on mount
    checkVersion();
    
    // Check every 2 minutes (more frequent during deployment issues)
    const interval = setInterval(checkVersion, 120000);
    return () => clearInterval(interval);
  }, []);

  // Also check on window focus (user returning to tab)
  useEffect(() => {
    if (import.meta.env.DEV) return;
    
    const handleFocus = () => {
      console.log('[VersionChecker] Window focused - checking version');
      // Trigger a version check when user returns to tab
      const event = new CustomEvent('versioncheck');
      window.dispatchEvent(event);
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  if (showAlert) {
    return (
      <Alert className="fixed bottom-4 right-4 w-auto max-w-sm z-50 bg-emerald-600 text-white border-emerald-700 shadow-lg">
        <AlertDescription className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {alertMessage}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

// Export build version for debugging
export const CURRENT_BUILD_VERSION = BUILD_VERSION;
