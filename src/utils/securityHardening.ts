// Security hardening utilities and middleware

import { InputSanitizer } from './inputSanitizer';

// Content Security Policy headers
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://mwvcbedvnimabfwubazz.supabase.co https://api.stripe.com https://maps.googleapis.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ')
};

// Security headers for production
export const SECURITY_HEADERS = {
  ...CSP_HEADERS,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)'
};

// Rate limiting configurations
export const RATE_LIMITS = {
  auth: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  api: { maxAttempts: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  upload: { maxAttempts: 10, windowMs: 60 * 1000 } // 10 uploads per minute
};

// Create rate limiters
export const rateLimiters = {
  auth: InputSanitizer.createRateLimiter(RATE_LIMITS.auth.maxAttempts, RATE_LIMITS.auth.windowMs),
  api: InputSanitizer.createRateLimiter(RATE_LIMITS.api.maxAttempts, RATE_LIMITS.api.windowMs),
  upload: InputSanitizer.createRateLimiter(RATE_LIMITS.upload.maxAttempts, RATE_LIMITS.upload.windowMs)
};

// Security validation for forms
export function validateSecureForm(data: Record<string, any>): {
  isValid: boolean;
  errors: string[];
  sanitized: Record<string, any>;
} {
  const errors: string[] = [];
  const sanitized = InputSanitizer.sanitizeFormData(data);

  // Email validation
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized.email)) {
    errors.push('Invalid email format');
  }

  // Password strength (if present)
  if (data.password && data.password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  // Phone validation (if present)
  if (data.phone && sanitized.phone && !/^[\d\-\+\(\)\s]{10,}$/.test(sanitized.phone)) {
    errors.push('Invalid phone number format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

// Environment validation
export function validateEnvironment(): {
  isSecure: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Check if running over HTTPS in production
  if (typeof window !== 'undefined') {
    const isProduction = window.location.hostname !== 'localhost';
    const isHTTPS = window.location.protocol === 'https:';
    
    if (isProduction && !isHTTPS) {
      warnings.push('Application should run over HTTPS in production');
    }
  }

  // Check for development tools in production
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      warnings.push('React DevTools detected in production build');
    }
  }

  return {
    isSecure: warnings.length === 0,
    warnings
  };
}

// Secure API request wrapper
export async function secureApiRequest(
  url: string, 
  options: RequestInit = {},
  rateLimiter?: { isLimited: (id: string) => boolean }
): Promise<Response> {
  // Rate limiting check
  if (rateLimiter && rateLimiter.isLimited('api-request')) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Add security headers
  const secureOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  // Sanitize request body if present
  if (secureOptions.body && typeof secureOptions.body === 'string') {
    try {
      const data = JSON.parse(secureOptions.body);
      const sanitized = InputSanitizer.sanitizeFormData(data);
      secureOptions.body = JSON.stringify(sanitized);
    } catch {
      // If not JSON, leave as-is
    }
  }

  return fetch(url, secureOptions);
}