import { supabase } from '@/lib/supabase';

/**
 * Enhanced Supabase password reset handler that properly handles 204 responses
 * and provides comprehensive error handling for auth flow issues
 */

export interface PasswordResetResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  isRateLimited?: boolean;
  requiresRedirectWhitelist?: boolean;
}

/**
 * Handle password reset with proper 204 No Content response handling
 * Supabase returns 204 on successful password reset requests (not an error)
 */
export async function handlePasswordReset(
  email: string, 
  redirectTo: string = 'https://greenscapelux.com/reset-password'
): Promise<PasswordResetResult> {
  try {
    console.log('Initiating password reset for:', email);
    console.log('Redirect URL:', redirectTo);

    // Call Supabase auth - this returns 204 No Content on success
    const response = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    // Check for explicit errors
    if (response.error) {
      console.error('Supabase password reset error:', response.error);
      
      // Check for common error types
      if (response.error.message?.includes('rate limit')) {
        return {
          success: false,
          error: 'Too many requests. Please wait before trying again.',
          isRateLimited: true
        };
      }
      
      if (response.error.message?.includes('redirect')) {
        return {
          success: false,
          error: 'Invalid redirect URL. Please contact support.',
          requiresRedirectWhitelist: true
        };
      }

      return {
        success: false,
        error: response.error.message || 'Failed to send reset email'
      };
    }

    // Success case - Supabase returns { data: {}, error: null } for 204 responses
    console.log('Password reset request successful (204 No Content expected)');
    return {
      success: true,
      statusCode: 204
    };

  } catch (error: any) {
    console.error('Password reset handler error:', error);
    
    // Handle network/connection errors
    if (error.name === 'TypeError' && error.message?.includes('fetch')) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }

    return {
      success: false,
      error: error.message || 'Unexpected error occurred'
    };
  }
}

/**
 * Validate redirect URL format and domain
 */
export function validateRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowedDomains = [
      'greenscapelux.com',
      'www.greenscapelux.com',
      'localhost'
    ];
    
    return allowedDomains.some(domain => 
      parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Get the appropriate reset URL based on environment
 */
export function getPasswordResetUrl(): string {
  const baseUrl = import.meta.env.PROD 
    ? 'https://greenscapelux.com'
    : window.location.origin;
    
  return `${baseUrl}/reset-password`;
}