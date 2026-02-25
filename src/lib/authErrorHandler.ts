/**
 * GreenScape Lux Auth Error Handler
 * 
 * Centralized error handling for Supabase Auth errors.
 * Maps error codes to user-friendly messages and provides dev logging.
 * 
 * Based on official Supabase Auth error codes:
 * https://supabase.com/docs/guides/auth/debugging/error-codes
 */

import { AuthError, AuthApiError } from '@supabase/supabase-js';

// Check if we're in development mode
const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * Supabase Auth Error Codes mapped to user-friendly messages
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Rate limiting errors
  over_email_send_rate_limit: 'Too many email requests. Please wait a few minutes before trying again.',
  over_request_rate_limit: 'Too many requests. Please wait a moment and try again.',
  over_sms_send_rate_limit: 'Too many SMS requests. Please wait before trying again.',
  
  // User existence errors
  user_already_exists: 'An account with this email already exists. Please sign in instead.',
  email_exists: 'This email address is already registered. Try signing in or use a different email.',
  phone_exists: 'This phone number is already registered.',
  
  // Credential errors
  invalid_credentials: 'Invalid email or password. Please check your credentials and try again.',
  email_not_confirmed: 'Please verify your email address before signing in. Check your inbox for a confirmation link.',
  phone_not_confirmed: 'Please verify your phone number before signing in.',
  
  // Password errors
  weak_password: 'Password is too weak. Use at least 8 characters with a mix of letters, numbers, and symbols.',
  same_password: 'New password must be different from your current password.',
  
  // Session errors
  session_expired: 'Your session has expired. Please sign in again.',
  session_not_found: 'Session not found. Please sign in again.',
  refresh_token_not_found: 'Your session could not be refreshed. Please sign in again.',
  refresh_token_already_used: 'Session refresh failed. Please sign in again.',
  
  // Provider errors
  email_provider_disabled: 'Email sign-up is currently disabled.',
  phone_provider_disabled: 'Phone sign-up is currently disabled.',
  signup_disabled: 'New account registration is currently disabled.',
  provider_disabled: 'This sign-in method is currently disabled.',
  anonymous_provider_disabled: 'Anonymous sign-in is disabled.',
  
  // OAuth errors
  bad_oauth_callback: 'There was an issue with the social login. Please try again.',
  bad_oauth_state: 'Social login session expired. Please try again.',
  oauth_provider_not_supported: 'This social login provider is not supported.',
  
  // Email configuration errors
  email_address_not_authorized: 'This email address cannot receive emails. Please use a different email or contact support.',
  email_address_invalid: 'Please enter a valid email address.',
  
  // OTP/Magic link errors
  otp_expired: 'The verification code has expired. Please request a new one.',
  otp_disabled: 'One-time password sign-in is disabled.',
  
  // PKCE flow errors
  flow_state_expired: 'Sign-in session expired. Please try again.',
  flow_state_not_found: 'Sign-in session not found. Please try again.',
  bad_code_verifier: 'Authentication verification failed. Please try again.',
  
  // MFA errors
  mfa_challenge_expired: 'MFA challenge expired. Please request a new code.',
  mfa_verification_failed: 'Incorrect verification code. Please try again.',
  insufficient_aal: 'Additional verification required. Please complete MFA.',
  
  // User state errors
  user_not_found: 'No account found with these credentials.',
  user_banned: 'This account has been suspended. Please contact support.',
  
  // Invite errors
  invite_not_found: 'Invitation expired or already used.',
  
  // Identity errors
  identity_already_exists: 'This identity is already linked to another account.',
  identity_not_found: 'Identity not found.',
  single_identity_not_deletable: 'Cannot remove your only sign-in method.',
  
  // Validation errors
  validation_failed: 'Please check your input and try again.',
  bad_json: 'Invalid request format. Please try again.',
  bad_jwt: 'Authentication token is invalid. Please sign in again.',
  
  // CAPTCHA errors
  captcha_failed: 'CAPTCHA verification failed. Please try again.',
  
  // Reauthentication
  reauthentication_needed: 'Please verify your identity to continue.',
  reauthentication_not_valid: 'Verification failed. Please try again.',
  
  // Server errors
  unexpected_failure: 'An unexpected error occurred. Please try again later.',
  request_timeout: 'Request timed out. Please try again.',
  conflict: 'A conflict occurred. Please try again.',
  
  // SSO/SAML errors
  sso_provider_not_found: 'SSO provider not found.',
  saml_provider_disabled: 'SAML authentication is disabled.',
  
  // Default fallback
  unknown_error: 'An error occurred. Please try again.',
};

/**
 * Dev mode email reuse cooldown tracking
 * Tracks recently deleted test emails to prevent immediate re-signup
 */
const DELETED_EMAIL_COOLDOWN_KEY = 'greenscape_deleted_emails_cooldown';
const COOLDOWN_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface DeletedEmailEntry {
  email: string;
  deletedAt: number;
}

/**
 * Check if an email is in cooldown period (dev mode only)
 */
export function isEmailInCooldown(email: string): { inCooldown: boolean; remainingMinutes: number } {
  if (!isDev) return { inCooldown: false, remainingMinutes: 0 };
  
  try {
    const stored = localStorage.getItem(DELETED_EMAIL_COOLDOWN_KEY);
    if (!stored) return { inCooldown: false, remainingMinutes: 0 };
    
    const entries: DeletedEmailEntry[] = JSON.parse(stored);
    const now = Date.now();
    
    // Clean up expired entries
    const validEntries = entries.filter(e => now - e.deletedAt < COOLDOWN_DURATION_MS);
    localStorage.setItem(DELETED_EMAIL_COOLDOWN_KEY, JSON.stringify(validEntries));
    
    // Check if this email is in cooldown
    const entry = validEntries.find(e => e.email.toLowerCase() === email.toLowerCase());
    if (entry) {
      const elapsed = now - entry.deletedAt;
      const remaining = COOLDOWN_DURATION_MS - elapsed;
      const remainingMinutes = Math.ceil(remaining / 60000);
      return { inCooldown: true, remainingMinutes };
    }
    
    return { inCooldown: false, remainingMinutes: 0 };
  } catch {
    return { inCooldown: false, remainingMinutes: 0 };
  }
}

/**
 * Add an email to cooldown list (call after deleting a test user)
 */
export function addEmailToCooldown(email: string): void {
  if (!isDev) return;
  
  try {
    const stored = localStorage.getItem(DELETED_EMAIL_COOLDOWN_KEY);
    const entries: DeletedEmailEntry[] = stored ? JSON.parse(stored) : [];
    
    // Remove existing entry for this email if present
    const filtered = entries.filter(e => e.email.toLowerCase() !== email.toLowerCase());
    
    // Add new entry
    filtered.push({ email: email.toLowerCase(), deletedAt: Date.now() });
    
    localStorage.setItem(DELETED_EMAIL_COOLDOWN_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('[AuthErrorHandler] Failed to add email to cooldown:', e);
  }
}

/**
 * Clear all email cooldowns (for testing)
 */
export function clearEmailCooldowns(): void {
  localStorage.removeItem(DELETED_EMAIL_COOLDOWN_KEY);
}

/**
 * Interface for parsed auth error
 */
export interface ParsedAuthError {
  code: string;
  message: string;
  userMessage: string;
  status?: number;
  isRateLimit: boolean;
  isDuplicateEmail: boolean;
  isInvalidCredentials: boolean;
  isEmailNotConfirmed: boolean;
  isWeakPassword: boolean;
  raw: any;
}

/**
 * Check if an error is a Supabase Auth API error
 */
export function isAuthApiError(error: unknown): error is AuthApiError {
  return (
    error !== null &&
    typeof error === 'object' &&
    '__isAuthError' in error &&
    (error as any).__isAuthError === true &&
    'status' in error
  );
}

/**
 * Parse a Supabase Auth error into a structured format
 */
export function parseAuthError(error: unknown): ParsedAuthError {
  // Default error structure
  const defaultError: ParsedAuthError = {
    code: 'unknown_error',
    message: 'An unknown error occurred',
    userMessage: AUTH_ERROR_MESSAGES.unknown_error,
    isRateLimit: false,
    isDuplicateEmail: false,
    isInvalidCredentials: false,
    isEmailNotConfirmed: false,
    isWeakPassword: false,
    raw: error,
  };

  if (!error) return defaultError;

  // Handle AuthApiError (from Supabase)
  if (isAuthApiError(error)) {
    const code = (error as any).code || 'unknown_error';
    const message = error.message || 'An error occurred';
    const status = error.status;
    
    return {
      code,
      message,
      userMessage: AUTH_ERROR_MESSAGES[code] || message,
      status,
      isRateLimit: code.includes('rate_limit') || status === 429,
      isDuplicateEmail: code === 'user_already_exists' || code === 'email_exists',
      isInvalidCredentials: code === 'invalid_credentials',
      isEmailNotConfirmed: code === 'email_not_confirmed',
      isWeakPassword: code === 'weak_password',
      raw: error,
    };
  }

  // Handle generic AuthError
  if (error instanceof AuthError) {
    const code = (error as any).code || 'unknown_error';
    const message = error.message || 'An error occurred';
    
    return {
      code,
      message,
      userMessage: AUTH_ERROR_MESSAGES[code] || message,
      isRateLimit: code.includes('rate_limit'),
      isDuplicateEmail: code === 'user_already_exists' || code === 'email_exists',
      isInvalidCredentials: code === 'invalid_credentials',
      isEmailNotConfirmed: code === 'email_not_confirmed',
      isWeakPassword: code === 'weak_password',
      raw: error,
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;
    
    // Try to detect error type from message (fallback)
    let code = 'unknown_error';
    if (message.toLowerCase().includes('rate limit')) {
      code = 'over_request_rate_limit';
    } else if (message.toLowerCase().includes('already registered') || message.toLowerCase().includes('already exists')) {
      code = 'user_already_exists';
    } else if (message.toLowerCase().includes('invalid') && message.toLowerCase().includes('credentials')) {
      code = 'invalid_credentials';
    } else if (message.toLowerCase().includes('email') && message.toLowerCase().includes('confirm')) {
      code = 'email_not_confirmed';
    }
    
    return {
      code,
      message,
      userMessage: AUTH_ERROR_MESSAGES[code] || message,
      isRateLimit: code.includes('rate_limit'),
      isDuplicateEmail: code === 'user_already_exists' || code === 'email_exists',
      isInvalidCredentials: code === 'invalid_credentials',
      isEmailNotConfirmed: code === 'email_not_confirmed',
      isWeakPassword: code === 'weak_password',
      raw: error,
    };
  }

  // Handle plain objects with error-like structure
  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, any>;
    const code = obj.code || obj.error_code || 'unknown_error';
    const message = obj.message || obj.error_description || obj.error || 'An error occurred';
    
    return {
      code,
      message,
      userMessage: AUTH_ERROR_MESSAGES[code] || message,
      status: obj.status,
      isRateLimit: code.includes('rate_limit') || obj.status === 429,
      isDuplicateEmail: code === 'user_already_exists' || code === 'email_exists',
      isInvalidCredentials: code === 'invalid_credentials',
      isEmailNotConfirmed: code === 'email_not_confirmed',
      isWeakPassword: code === 'weak_password',
      raw: error,
    };
  }

  return defaultError;
}

/**
 * Get user-friendly error message for display
 */
export function getAuthErrorMessage(error: unknown): string {
  const parsed = parseAuthError(error);
  return parsed.userMessage;
}

/**
 * Log auth error in development mode
 */
export function logAuthError(context: string, error: unknown): ParsedAuthError {
  const parsed = parseAuthError(error);
  
  if (isDev) {
    console.group(`🔐 [AUTH ERROR] ${context}`);
    console.log('Error Code:', parsed.code);
    console.log('Error Message:', parsed.message);
    console.log('User Message:', parsed.userMessage);
    if (parsed.status) console.log('HTTP Status:', parsed.status);
    console.log('Flags:', {
      isRateLimit: parsed.isRateLimit,
      isDuplicateEmail: parsed.isDuplicateEmail,
      isInvalidCredentials: parsed.isInvalidCredentials,
      isEmailNotConfirmed: parsed.isEmailNotConfirmed,
      isWeakPassword: parsed.isWeakPassword,
    });
    console.log('Raw Error:', parsed.raw);
    console.groupEnd();
  }
  
  return parsed;
}

/**
 * Handle signup error with cooldown check
 */
export function handleSignupError(email: string, error: unknown): {
  message: string;
  parsed: ParsedAuthError;
} {
  // Check cooldown first (dev mode only)
  const cooldownCheck = isEmailInCooldown(email);
  if (cooldownCheck.inCooldown) {
    const devMessage = `[DEV MODE] This email was recently deleted. Wait ${cooldownCheck.remainingMinutes} minute(s) or use an email alias (e.g., ${email.replace('@', '+test1@')})`;
    return {
      message: devMessage,
      parsed: {
        code: 'email_cooldown',
        message: devMessage,
        userMessage: devMessage,
        isRateLimit: false,
        isDuplicateEmail: true,
        isInvalidCredentials: false,
        isEmailNotConfirmed: false,
        isWeakPassword: false,
        raw: null,
      },
    };
  }
  
  const parsed = logAuthError('SIGNUP', error);
  return {
    message: parsed.userMessage,
    parsed,
  };
}

/**
 * Handle login error
 */
export function handleLoginError(error: unknown): {
  message: string;
  parsed: ParsedAuthError;
} {
  const parsed = logAuthError('LOGIN', error);
  return {
    message: parsed.userMessage,
    parsed,
  };
}

/**
 * Handle password reset error
 */
export function handlePasswordResetError(error: unknown): {
  message: string;
  parsed: ParsedAuthError;
} {
  const parsed = logAuthError('PASSWORD_RESET', error);
  return {
    message: parsed.userMessage,
    parsed,
  };
}

/**
 * Generate email alias suggestion for testing
 */
export function generateTestEmailAlias(email: string): string {
  const timestamp = Date.now().toString(36);
  const [localPart, domain] = email.split('@');
  return `${localPart}+test${timestamp}@${domain}`;
}

export default {
  parseAuthError,
  getAuthErrorMessage,
  logAuthError,
  handleSignupError,
  handleLoginError,
  handlePasswordResetError,
  isEmailInCooldown,
  addEmailToCooldown,
  clearEmailCooldowns,
  generateTestEmailAlias,
};
