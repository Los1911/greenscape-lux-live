// CSP violation reporting and validation utilities
export interface CSPViolation {
  'document-uri': string;
  referrer: string;
  'violated-directive': string;
  'effective-directive': string;
  'original-policy': string;
  disposition: string;
  'blocked-uri': string;
  'line-number': number;
  'column-number': number;
  'source-file': string;
  'status-code': number;
  'script-sample': string;
}

export interface CSPReport {
  'csp-report': CSPViolation;
}

// CSP violation handler
export function handleCSPViolation(report: CSPReport) {
  const violation = report['csp-report'];
  
  // Log violation in development
  if (process.env.NODE_ENV === 'development') {
    console.warn('CSP Violation:', {
      directive: violation['violated-directive'],
      blockedURI: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number']
    });
  }

  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to monitoring service
    fetch('/api/csp-violation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    }).catch(() => {
      // Silently fail - don't let CSP reporting break the app
    });
  }
}

// Setup CSP violation reporting
export function setupCSPReporting() {
  if (typeof document !== 'undefined') {
    document.addEventListener('securitypolicyviolation', (e) => {
      const report: CSPReport = {
        'csp-report': {
          'document-uri': e.documentURI,
          referrer: e.referrer,
          'violated-directive': e.violatedDirective,
          'effective-directive': e.effectiveDirective,
          'original-policy': e.originalPolicy,
          disposition: e.disposition,
          'blocked-uri': e.blockedURI,
          'line-number': e.lineNumber,
          'column-number': e.columnNumber,
          'source-file': e.sourceFile,
          'status-code': e.statusCode,
          'script-sample': e.sample
        }
      };
      
      handleCSPViolation(report);
    });
  }
}

// Validate CSP policy syntax
export function validateCSPPolicy(policy: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const directives = policy.split(';').map(d => d.trim()).filter(d => d);
  
  const validDirectives = [
    'default-src', 'script-src', 'style-src', 'img-src', 'connect-src',
    'font-src', 'object-src', 'media-src', 'frame-src', 'sandbox',
    'report-uri', 'child-src', 'form-action', 'frame-ancestors',
    'base-uri', 'manifest-src', 'worker-src'
  ];

  directives.forEach(directive => {
    const [name] = directive.split(' ');
    if (!validDirectives.includes(name)) {
      errors.push(`Unknown directive: ${name}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Get recommended CSP for GreenScape Lux
export function getRecommendedCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://mwvcbedvnimabfwubazz.supabase.co https://api.stripe.com https://maps.googleapis.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ');
}