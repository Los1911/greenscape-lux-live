// Security headers utilities for client-side enforcement
export const PRODUCTION_SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://mwvcbedvnimabfwubazz.supabase.co https://api.stripe.com https://maps.googleapis.com https://www.google-analytics.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(self)',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

// Apply security headers to meta tags (client-side fallback)
export function applySecurityHeaders() {
  if (typeof document === 'undefined') return;

  // Remove existing security meta tags
  const existingTags = document.querySelectorAll('meta[http-equiv*="Content-Security-Policy"], meta[http-equiv*="X-Frame-Options"]');
  existingTags.forEach(tag => tag.remove());

  // Add CSP meta tag
  const cspMeta = document.createElement('meta');
  cspMeta.httpEquiv = 'Content-Security-Policy';
  cspMeta.content = PRODUCTION_SECURITY_HEADERS['Content-Security-Policy'];
  document.head.appendChild(cspMeta);

  // Add X-Frame-Options meta tag
  const frameMeta = document.createElement('meta');
  frameMeta.httpEquiv = 'X-Frame-Options';
  frameMeta.content = PRODUCTION_SECURITY_HEADERS['X-Frame-Options'];
  document.head.appendChild(frameMeta);
}

// Validate current page security
export function validatePageSecurity(): {
  isSecure: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (typeof window === 'undefined') {
    return { isSecure: true, issues, recommendations };
  }

  // Check HTTPS
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    issues.push('Page not served over HTTPS');
    recommendations.push('Enable HTTPS for all production traffic');
  }

  // Check for mixed content
  const images = document.querySelectorAll('img[src^="http:"]');
  if (images.length > 0) {
    issues.push(`${images.length} images loaded over HTTP`);
    recommendations.push('Update all image URLs to use HTTPS');
  }

  // Check for inline scripts
  const inlineScripts = document.querySelectorAll('script:not([src])');
  if (inlineScripts.length > 0) {
    issues.push(`${inlineScripts.length} inline scripts detected`);
    recommendations.push('Move inline scripts to external files or use nonces');
  }

  // Check for external resources without integrity
  const externalScripts = document.querySelectorAll('script[src]:not([integrity])');
  const externalLinks = document.querySelectorAll('link[rel="stylesheet"]:not([integrity])');
  
  if (externalScripts.length > 0 || externalLinks.length > 0) {
    issues.push('External resources without integrity checks');
    recommendations.push('Add integrity attributes to external scripts and stylesheets');
  }

  return {
    isSecure: issues.length === 0,
    issues,
    recommendations
  };
}

// Security monitoring
export function startSecurityMonitoring() {
  if (typeof window === 'undefined') return;

  // Monitor for security violations
  let violationCount = 0;
  
  document.addEventListener('securitypolicyviolation', () => {
    violationCount++;
    
    // Alert if too many violations
    if (violationCount > 10) {
      console.warn('High number of CSP violations detected. Check console for details.');
    }
  });

  // Monitor for suspicious activity
  let suspiciousActivity = 0;
  
  // Detect potential XSS attempts
  const originalInnerHTML = Element.prototype.innerHTML;
  Element.prototype.innerHTML = function(value) {
    if (typeof value === 'string' && /<script/i.test(value)) {
      suspiciousActivity++;
      console.warn('Potential XSS attempt blocked');
      return;
    }
    return originalInnerHTML.call(this, value);
  };
}