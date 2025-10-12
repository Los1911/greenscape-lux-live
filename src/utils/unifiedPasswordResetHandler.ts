import { supabase } from '@/lib/supabase';

/**
 * Enhanced password reset handler that uses our unified-email pipeline
 * This ensures all emails go through Resend and are logged properly
 */

export interface PasswordResetResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  isRateLimited?: boolean;
  requiresRedirectWhitelist?: boolean;
}

/**
 * Handle password reset using our unified email pipeline
 * This generates the token via Supabase admin API and sends email via Resend
 */
export async function handleUnifiedPasswordReset(
  email: string, 
  redirectTo: string = 'https://greenscapelux.com/reset-password'
): Promise<PasswordResetResult> {
  try {
    console.log('Initiating unified password reset for:', email);
    console.log('Redirect URL:', redirectTo);

    // Call our custom edge function that handles token generation + email sending
    console.log('Calling password-reset-with-unified-email function...');
    const response = await supabase.functions.invoke('password-reset-with-unified-email', {
      body: { 
        email,
        redirectTo 
      }
    });
    console.log('Function response received:', response);

    if (response.error) {
      console.error('Unified password reset error:', response.error);
      
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

    // Success case
    console.log('Unified password reset successful:', response.data);
    return {
      success: true,
      statusCode: 200
    };

  } catch (error: any) {
    console.error('Unified password reset handler error:', error);
    
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