// Security middleware for enforcing headers and policies
import { SECURITY_HEADERS, rateLimiters, validateSecureForm } from '../utils/securityHardening';

export interface SecurityMiddlewareOptions {
  enableRateLimit?: boolean;
  enableCSP?: boolean;
  enableXSSProtection?: boolean;
  customHeaders?: Record<string, string>;
}

// Security middleware class
export class SecurityMiddleware {
  private options: SecurityMiddlewareOptions;
  
  constructor(options: SecurityMiddlewareOptions = {}) {
    this.options = {
      enableRateLimit: true,
      enableCSP: true,
      enableXSSProtection: true,
      ...options
    };
  }

  // Apply security headers to response
  applySecurityHeaders(response: Response): Response {
    if (!this.options.enableCSP) return response;

    const headers = new Headers(response.headers);
    
    // Apply all security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      headers.set(key, value);
    });

    // Apply custom headers if provided
    if (this.options.customHeaders) {
      Object.entries(this.options.customHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  // Rate limiting check
  checkRateLimit(identifier: string, type: 'auth' | 'api' | 'upload' = 'api'): boolean {
    if (!this.options.enableRateLimit) return true;
    
    const limiter = rateLimiters[type];
    return !limiter.isLimited(identifier);
  }

  // Validate and sanitize request data
  validateRequest(data: any): { isValid: boolean; errors: string[]; sanitized: any } {
    return validateSecureForm(data);
  }

  // Create secure fetch wrapper
  createSecureFetch() {
    return async (url: string, options: RequestInit = {}): Promise<Response> => {
      // Check rate limit
      if (!this.checkRateLimit('global-api')) {
        throw new Error('Rate limit exceeded');
      }

      // Add security headers to request
      const secureOptions: RequestInit = {
        ...options,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          ...options.headers
        }
      };

      return fetch(url, secureOptions);
    };
  }
}

// Default security middleware instance
export const securityMiddleware = new SecurityMiddleware();

// Hook for React components to use secure requests
export function useSecureRequest() {
  return securityMiddleware.createSecureFetch();
}

// Utility to check if request is from allowed origin
export function validateOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  const allowedOrigins = [
    'https://greenscapelux.com',
    'https://www.greenscapelux.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ];

  
  return allowedOrigins.includes(origin);
}

// CSRF token validation
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  // Simple CSRF validation - in production, use proper CSRF tokens
  return token === sessionToken;
}