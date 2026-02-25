/**
 * Quote Submission Error Handler
 * 
 * Provides detailed error handling and logging for quote/estimate request submissions.
 * Handles edge function errors, RLS policy violations, and auth session issues.
 */

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

// Known Supabase/PostgreSQL error codes
const ERROR_CODE_MAP: Record<string, { message: string; isRetryable: boolean }> = {
  // PostgreSQL error codes
  '23505': { message: 'A request with this information already exists.', isRetryable: false },
  '23503': { message: 'Invalid reference data. Please refresh and try again.', isRetryable: true },
  '23502': { message: 'Required information is missing.', isRetryable: false },
  '42501': { message: 'Permission denied. Please sign in again.', isRetryable: true },
  '42P01': { message: 'System configuration error. Please contact support.', isRetryable: false },
  '28000': { message: 'Authentication required. Please sign in.', isRetryable: true },
  '28P01': { message: 'Invalid credentials. Please sign in again.', isRetryable: true },
  
  // Supabase Auth error codes
  'PGRST301': { message: 'Session expired. Please sign in again.', isRetryable: true },
  'PGRST302': { message: 'Invalid authentication token.', isRetryable: true },
  
  // RLS-related
  'new row violates row-level security policy': { 
    message: 'Unable to save your request. Please ensure you are signed in correctly.', 
    isRetryable: true 
  },
  
  // Network/timeout
  'FetchError': { message: 'Network error. Please check your connection and try again.', isRetryable: true },
  'AbortError': { message: 'Request timed out. Please try again.', isRetryable: true },
  'TypeError': { message: 'Connection error. Please try again.', isRetryable: true },
};

export interface QuoteSubmissionError {
  code: string | null;
  message: string;
  details: string | null;
  isRetryable: boolean;
  isAuthError: boolean;
  isRLSError: boolean;
  rawError: any;
}

/**
 * Parse and categorize quote submission errors
 */
export function parseQuoteSubmissionError(error: any): QuoteSubmissionError {
  const errorCode = error?.code || error?.error_code || null;
  const errorMessage = error?.message || error?.error || 'Unknown error';
  const errorDetails = error?.details || error?.hint || null;
  
  // Log in dev mode
  if (isDev) {
    console.error('[QuoteSubmission] Error details:', {
      code: errorCode,
      message: errorMessage,
      details: errorDetails,
      fullError: error
    });
  }
  
  // Check for known error codes
  const knownError = errorCode ? ERROR_CODE_MAP[errorCode] : null;
  
  // Check for RLS errors
  const isRLSError = 
    errorMessage.toLowerCase().includes('row-level security') ||
    errorMessage.toLowerCase().includes('rls') ||
    errorCode === '42501';
  
  // Check for auth errors
  const isAuthError = 
    errorCode === '28000' || 
    errorCode === '28P01' ||
    errorCode === 'PGRST301' ||
    errorCode === 'PGRST302' ||
    errorMessage.toLowerCase().includes('auth') ||
    errorMessage.toLowerCase().includes('session') ||
    errorMessage.toLowerCase().includes('token');
  
  // Determine user-friendly message
  let userMessage: string;
  let isRetryable = true;
  
  if (knownError) {
    userMessage = knownError.message;
    isRetryable = knownError.isRetryable;
  } else if (isRLSError) {
    userMessage = 'Unable to save your request. Please sign out and sign back in, then try again.';
    isRetryable = true;
  } else if (isAuthError) {
    userMessage = 'Your session has expired. Please sign in again to continue.';
    isRetryable = true;
  } else if (errorMessage.includes('Failed to create quote')) {
    userMessage = 'Unable to create your estimate request. Please try again or contact support.';
    isRetryable = true;
  } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
    userMessage = 'Network error. Please check your connection and try again.';
    isRetryable = true;
  } else {
    userMessage = 'Something went wrong. Please try again.';
    isRetryable = true;
  }
  
  return {
    code: errorCode,
    message: userMessage,
    details: isDev ? `${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}` : null,
    isRetryable,
    isAuthError,
    isRLSError,
    rawError: error
  };
}

/**
 * Validate auth session before quote submission
 */
export async function validateAuthSession(user: any, supabase: any): Promise<{ valid: boolean; error?: string }> {
  if (!user) {
    return { valid: false, error: 'No user session found. Please sign in.' };
  }
  
  try {
    // Check if session is still valid
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      if (isDev) {
        console.error('[QuoteSubmission] Session validation error:', error);
      }
      return { valid: false, error: 'Session validation failed. Please sign in again.' };
    }
    
    if (!session) {
      return { valid: false, error: 'Your session has expired. Please sign in again.' };
    }
    
    // Check if session is about to expire (within 5 minutes)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const expiresAtDate = new Date(expiresAt * 1000);
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      
      if (expiresAtDate < fiveMinutesFromNow) {
        // Try to refresh the session
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          if (isDev) {
            console.error('[QuoteSubmission] Session refresh failed:', refreshError);
          }
          return { valid: false, error: 'Your session is expiring. Please sign in again.' };
        }
      }
    }
    
    return { valid: true };
  } catch (err) {
    if (isDev) {
      console.error('[QuoteSubmission] Session check error:', err);
    }
    return { valid: false, error: 'Unable to verify your session. Please try again.' };
  }
}

/**
 * Validate required quote fields before submission
 */
export function validateQuoteFields(formData: {
  name: string;
  email: string;
  propertyAddress: string;
  selectedServices: string[];
  otherService?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  if (!formData.name?.trim()) {
    errors.name = 'Name is required';
  }
  
  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!formData.propertyAddress?.trim()) {
    errors.propertyAddress = 'Service address is required';
  }
  
  if (formData.selectedServices.length === 0 && !formData.otherService?.trim()) {
    errors.services = 'Please select at least one service';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Format error for display
 */
export function formatQuoteError(error: QuoteSubmissionError): {
  title: string;
  message: string;
  showRetry: boolean;
  devInfo?: string;
} {
  let title = 'Submission Failed';
  
  if (error.isAuthError) {
    title = 'Authentication Required';
  } else if (error.isRLSError) {
    title = 'Permission Error';
  }
  
  return {
    title,
    message: error.message,
    showRetry: error.isRetryable,
    devInfo: isDev && error.details ? `[DEV] ${error.code || 'NO_CODE'}: ${error.details}` : undefined
  };
}
