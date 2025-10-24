// Custom hook for secure API requests with built-in security features
import { useCallback } from 'react';
import { useSecureAPI } from '../components/SecurityProvider';
import { supabase } from '../lib/supabase';

interface SecureRequestOptions extends RequestInit {
  requireAuth?: boolean;
  rateLimitType?: 'auth' | 'api' | 'upload';
  validateResponse?: boolean;
}

export function useSecureRequest() {
  const { secureRequest, checkRateLimit, validateData } = useSecureAPI();

  const makeSecureRequest = useCallback(async (
    url: string, 
    options: SecureRequestOptions = {}
  ) => {
    const {
      requireAuth = false,
      rateLimitType = 'api',
      validateResponse = true,
      ...requestOptions
    } = options;

    // Check rate limit
    if (!checkRateLimit(url, rateLimitType)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Add auth header if required
    if (requireAuth) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }
      
      requestOptions.headers = {
        ...requestOptions.headers,
        'Authorization': `Bearer ${session.access_token}`
      };
    }

    // Validate request body if present
    if (requestOptions.body) {
      try {
        const bodyData = JSON.parse(requestOptions.body as string);
        const validation = validateData(bodyData);
        
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        
        requestOptions.body = JSON.stringify(validation.sanitized);
      } catch (e) {
        if (e instanceof SyntaxError) {
          // Not JSON, leave as-is
        } else {
          throw e;
        }
      }
    }

    // Make secure request
    const response = await secureRequest(url, requestOptions);

    // Validate response if enabled
    if (validateResponse && !response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed: ${response.status} ${errorText}`);
    }

    return response;
  }, [secureRequest, checkRateLimit, validateData]);

  return {
    secureRequest: makeSecureRequest,
    checkRateLimit,
    validateData
  };
}

// Hook for secure Supabase operations
export function useSecureSupabase() {
  const { checkRateLimit } = useSecureAPI();

  const secureQuery = useCallback(async (
    operation: () => Promise<any>,
    rateLimitType: 'auth' | 'api' | 'upload' = 'api'
  ) => {
    // Check rate limit before database operation
    if (!checkRateLimit('supabase-query', rateLimitType)) {
      throw new Error('Rate limit exceeded for database operations');
    }

    return await operation();
  }, [checkRateLimit]);

  return { secureQuery };
}