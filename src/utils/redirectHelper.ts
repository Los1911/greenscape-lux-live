/**
 * Safe redirect helper that works in both iframe preview and production
 * Handles cross-origin iframe navigation properly
 */

const log = (msg: string, data?: any) => {
  const ts = new Date().toISOString().split('T')[1];
  console.log(`[${ts}][REDIRECT] ${msg}`, data !== undefined ? data : '');
};

export function hardRedirect(path: string): void {
  log('=== HARD REDIRECT CALLED ===');
  log('Target path:', path);
  log('Current path:', window.location.pathname);
  log('Current href:', window.location.href);
  
  try {
    const url = new URL(path, window.location.origin).toString();
    
    log('Full URL:', url);
    log('In iframe:', window.top !== window);
    log('Origin:', window.location.origin);
    
    // Check if we're in an iframe
    if (window.top && window.top !== window) {
      log('Attempting window.top navigation...');
      try {
        window.top.location.href = url;
        log('window.top.location.href set successfully');
      } catch (crossOriginError) {
        log('Cross-origin iframe, falling back to window.location');
        window.location.href = url;
      }
    } else {
      log('Using window.location.href...');
      window.location.href = url;
      log('window.location.href set to:', url);
    }
    
    log('Redirect initiated, waiting for navigation...');
  } catch (error: any) {
    log('ERROR:', error.message);
    log('Using fallback window.location.href');
    window.location.href = path;
  }
}
