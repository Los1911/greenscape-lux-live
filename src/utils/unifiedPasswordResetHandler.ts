import { supabase } from '@/lib/supabase';

/**
 * Unified password reset handler that uses Supabase's built-in auth
 * Previously tried to use a custom edge function that doesn't exist
 * Now uses the native resetPasswordForEmail method which works correctly
 */

export interface PasswordResetResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  isRateLimited?: boolean;
  requiresRedirectWhitelist?: boolean;
}

/**
 * Handle password reset using Supabase's built-in auth method
 * This properly handles 204 No Content responses (success case)
 */
export async function handleUnifiedPasswordReset(
  email: string, 
  redirectTo: string = 'https://greenscapelux.com/reset-password'
): Promise<PasswordResetResult> {
  try {
    console.log('Initiating password reset for:', email);
    console.log('Redirect URL:', redirectTo);

    // Use Supabase's built-in resetPasswordForEmail method
    // This returns 204 No Content on success (not an error)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    // Check for explicit errors
    if (error) {
      console.error('Password reset error:', error);
      
      // Check for common error types
      if (error.message?.includes('rate limit') || error.message?.includes('Rate limit')) {
        return {
          success: false,
          error: 'Too many requests. Please wait a minute before trying again.',
          isRateLimited: true
        };
      }
      
      if (error.message?.includes('redirect') || error.message?.includes('Redirect')) {
        return {
          success: false,
          error: 'Invalid redirect URL. Please contact support.',
          requiresRedirectWhitelist: true
        };
      }

      // Handle "User not found" gracefully - don't reveal if email exists
      if (error.message?.includes('User not found') || error.message?.includes('not found')) {
        // For security, still return success to prevent email enumeration
        console.log('User not found, but returning success for security');
        return {
          success: true,
          statusCode: 200
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to send reset email'
      };
    }

    // Success case - Supabase returns { data: {}, error: null } for 204 responses
    console.log('Password reset request successful');
    return {
      success: true,
      statusCode: 200
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
      'localhost',
      'deploypad.app' // Allow preview deployments
    ];
    
    return allowedDomains.some(domain => 
      parsed.hostname === domain || 
      parsed.hostname.endsWith(`.${domain}`) ||
      parsed.hostname.includes('deploypad.app')
    );
  } catch {
    return false;
  }
}

/**
 * Get the appropriate reset URL based on environment
 */
export function getPasswordResetUrl(): string {
  // In production, use the main domain
  if (import.meta.env.PROD) {
    // Check if we're on a preview deployment
    if (window.location.hostname.includes('deploypad.app')) {
      return `${window.location.origin}/reset-password`;
    }
    return 'https://greenscapelux.com/reset-password';
  }
  
  // In development, use current origin
  return `${window.location.origin}/reset-password`;
}
