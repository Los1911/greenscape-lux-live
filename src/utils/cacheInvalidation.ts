// Cache Invalidation and Version Management System
export interface AppVersion {
  version: string;
  buildTime: number;
  hash: string;
}

// Generate build timestamp and version using build-time constants
export const getBuildInfo = (): AppVersion => {
  const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : Date.now();
  const version = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const hash = typeof __BUILD_HASH__ !== 'undefined' ? __BUILD_HASH__ : 
    import.meta.env.VITE_BUILD_HASH || Math.random().toString(36).substr(2, 9);
  
  return {
    version,
    buildTime,
    hash
  };
};

// Check if app version is outdated
export const checkForUpdates = async (): Promise<boolean> => {
  try {
    const response = await fetch('/version.json?t=' + Date.now(), {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) return false;
    
    const serverVersion: AppVersion = await response.json();
    const currentVersion = getBuildInfo();
    
    return serverVersion.buildTime > currentVersion.buildTime;
  } catch (error) {
    console.warn('Failed to check for updates:', error);
    return false;
  }
};

// Force cache clear and reload
export const forceCacheInvalidation = async (): Promise<void> => {
  try {
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
    
    // Clear service worker cache
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
    }
    
    // Clear browser storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Force reload without cache
    window.location.reload();
  } catch (error) {
    console.error('Failed to clear cache:', error);
    window.location.reload();
  }
};

// Add cache-busting parameters to URLs
export const addCacheBuster = (url: string): string => {
  const separator = url.includes('?') ? '&' : '?';
  const buildInfo = getBuildInfo();
  return `${url}${separator}v=${buildInfo.version}&t=${buildInfo.buildTime}&h=${buildInfo.hash}`;
};

// Set no-cache headers for critical resources
export const setCacheHeaders = (): void => {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Cache-Control';
  meta.content = 'no-cache, no-store, must-revalidate';
  document.head.appendChild(meta);
  
  const pragma = document.createElement('meta');
  pragma.httpEquiv = 'Pragma';
  pragma.content = 'no-cache';
  document.head.appendChild(pragma);
  
  const expires = document.createElement('meta');
  expires.httpEquiv = 'Expires';
  expires.content = '0';
  document.head.appendChild(expires);
};