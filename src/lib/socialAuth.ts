/**
 * Social Authentication Utilities
 * Handles Google and Apple Sign-In OAuth flows with Supabase
 */

import { supabase } from './supabase';
import { Provider } from '@supabase/supabase-js';

const log = (area: string, msg: string, data?: any) => {
  const ts = new Date().toISOString().split('T')[1];
  console.log(`[${ts}][SOCIAL_AUTH:${area}] ${msg}`, data !== undefined ? data : '');
};

export type SocialProvider = 'google' | 'apple';

export interface SocialAuthResult {
  success: boolean;
  error?: string;
  provider?: SocialProvider;
  isNewUser?: boolean;
  linkedAccount?: boolean;
}

/**
 * Get the OAuth redirect URL based on environment
 */
export function getOAuthRedirectUrl(): string {
  // Use current origin for redirect
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/auth/callback`;
}

/**
 * Initiate OAuth sign-in with a social provider
 */
export async function signInWithSocialProvider(
  provider: SocialProvider,
  options?: {
    roleIntent?: 'client' | 'landscaper';
    scopes?: string[];
  }
): Promise<SocialAuthResult> {
  try {
    log('SIGN_IN', `Initiating ${provider} OAuth flow`, options);

    const redirectTo = getOAuthRedirectUrl();
    
    // Store role intent in localStorage for post-auth processing
    if (options?.roleIntent) {
      try {
        localStorage.setItem('social_auth_role_intent', options.roleIntent);
      } catch (e) {
        log('SIGN_IN', 'Failed to store role intent', e);
      }
    }

    // Configure provider-specific options
    const providerOptions: Record<string, any> = {
      redirectTo,
    };

    // Google-specific scopes
    if (provider === 'google') {
      providerOptions.queryParams = {
        access_type: 'offline',
        prompt: 'consent',
      };
      if (options?.scopes) {
        providerOptions.scopes = options.scopes.join(' ');
      }
    }

    // Apple-specific options
    if (provider === 'apple') {
      providerOptions.queryParams = {
        // Apple requires these for name/email on first sign-in
        response_mode: 'form_post',
      };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: providerOptions,
    });

    if (error) {
      log('SIGN_IN', `${provider} OAuth error:`, error.message);
      return {
        success: false,
        error: getReadableError(error.message, provider),
        provider,
      };
    }

    log('SIGN_IN', `${provider} OAuth initiated successfully`, { url: data.url });
    
    // The actual redirect happens automatically
    return {
      success: true,
      provider,
    };
  } catch (error: any) {
    log('SIGN_IN', `Unexpected error during ${provider} sign-in:`, error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      provider,
    };
  }
}

/**
 * Handle OAuth callback and process the session
 * Called from the /auth/callback route
 */
export async function handleOAuthCallback(): Promise<SocialAuthResult> {
  try {
    log('CALLBACK', 'Processing OAuth callback');

    // Get the session from the URL hash/params
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      log('CALLBACK', 'Session error:', error.message);
      return {
        success: false,
        error: getReadableError(error.message),
      };
    }

    if (!session) {
      log('CALLBACK', 'No session found after OAuth callback');
      return {
        success: false,
        error: 'Authentication failed. Please try again.',
      };
    }

    log('CALLBACK', 'OAuth session established', {
      userId: session.user.id,
      email: session.user.email,
      provider: session.user.app_metadata?.provider,
    });

    // Check if this is a new user or existing
    const isNewUser = isNewSocialUser(session.user);
    
    // Get stored role intent
    let roleIntent: 'client' | 'landscaper' = 'client';
    try {
      const stored = localStorage.getItem('social_auth_role_intent');
      if (stored === 'landscaper') {
        roleIntent = 'landscaper';
      }
      localStorage.removeItem('social_auth_role_intent');
    } catch (e) {
      log('CALLBACK', 'Failed to retrieve role intent', e);
    }

    // Handle account linking if needed
    const linkResult = await handleAccountLinking(session.user, roleIntent);

    return {
      success: true,
      provider: session.user.app_metadata?.provider as SocialProvider,
      isNewUser,
      linkedAccount: linkResult.linked,
    };
  } catch (error: any) {
    log('CALLBACK', 'Unexpected error in callback:', error);
    return {
      success: false,
      error: 'Failed to complete authentication. Please try again.',
    };
  }
}

/**
 * Check if this is a new user based on metadata
 */
function isNewSocialUser(user: any): boolean {
  // Check if created_at is within the last minute
  const createdAt = new Date(user.created_at);
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  
  return diffMinutes < 1;
}

/**
 * Handle account linking for social auth users
 * Links social auth to existing profiles or creates new ones
 */
async function handleAccountLinking(
  user: any,
  roleIntent: 'client' | 'landscaper'
): Promise<{ linked: boolean; error?: string }> {
  try {
    log('LINKING', 'Checking for existing account to link', {
      userId: user.id,
      email: user.email,
      roleIntent,
    });

    // Check if profile already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      log('LINKING', 'Profile query error:', profileError.message);
    }

    if (existingProfile) {
      log('LINKING', 'Profile already exists, no linking needed');
      return { linked: false };
    }

    // Create new profile for social auth user
    log('LINKING', 'Creating new profile for social auth user');
    
    // Extract name from user metadata
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Update user metadata with role
    await supabase.auth.updateUser({
      data: { role: roleIntent }
    });

    // Create profile
    const { error: createError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        role: roleIntent,
        auth_provider: user.app_metadata?.provider || 'social',
      });

    if (createError) {
      log('LINKING', 'Failed to create profile:', createError.message);
      return { linked: false, error: createError.message };
    }

    // If landscaper, create landscaper record
    if (roleIntent === 'landscaper') {
      const { error: landscaperError } = await supabase
        .from('landscapers')
        .insert({
          user_id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          status: 'pending',
          approval_status: 'pending',
        });

      if (landscaperError) {
        log('LINKING', 'Failed to create landscaper record:', landscaperError.message);
      }
    }

    // If client, create client record
    if (roleIntent === 'client') {
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
        });

      if (clientError && clientError.code !== '23505') { // Ignore duplicate key errors
        log('LINKING', 'Failed to create client record:', clientError.message);
      }
    }

    log('LINKING', 'Account linking completed successfully');
    return { linked: true };
  } catch (error: any) {
    log('LINKING', 'Unexpected error during account linking:', error);
    return { linked: false, error: error.message };
  }
}

/**
 * Convert error messages to user-friendly text
 */
function getReadableError(error: string, provider?: SocialProvider): string {
  const providerName = provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : 'social';
  
  if (error.includes('popup_closed_by_user')) {
    return `${providerName} sign-in was cancelled. Please try again.`;
  }
  
  if (error.includes('access_denied')) {
    return `Access was denied. Please grant the required permissions to continue.`;
  }
  
  if (error.includes('invalid_request')) {
    return `Invalid authentication request. Please try again.`;
  }
  
  if (error.includes('temporarily_unavailable')) {
    return `${providerName} sign-in is temporarily unavailable. Please try again later.`;
  }
  
  if (error.includes('email_not_confirmed')) {
    return 'Please verify your email address before signing in.';
  }
  
  if (error.includes('user_already_exists')) {
    return 'An account with this email already exists. Try signing in with your password instead.';
  }

  if (error.includes('provider_disabled')) {
    return `${providerName} sign-in is not currently available. Please use email/password instead.`;
  }

  return `${providerName} sign-in failed. Please try again or use email/password.`;
}

/**
 * Check if social auth providers are available
 */
export function isSocialAuthAvailable(): { google: boolean; apple: boolean } {
  // In production, these would be configured in Supabase dashboard
  // For now, we assume they're available if the app is running
  return {
    google: true,
    apple: true,
  };
}

/**
 * Get the user's linked social providers
 */
export async function getLinkedProviders(): Promise<SocialProvider[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];

    const providers: SocialProvider[] = [];
    const identities = user.identities || [];

    for (const identity of identities) {
      if (identity.provider === 'google') {
        providers.push('google');
      } else if (identity.provider === 'apple') {
        providers.push('apple');
      }
    }

    return providers;
  } catch (error) {
    log('PROVIDERS', 'Error getting linked providers:', error);
    return [];
  }
}

/**
 * Link an additional social provider to existing account
 */
export async function linkSocialProvider(provider: SocialProvider): Promise<SocialAuthResult> {
  try {
    log('LINK', `Linking ${provider} to existing account`);

    const { data, error } = await supabase.auth.linkIdentity({
      provider: provider as Provider,
      options: {
        redirectTo: getOAuthRedirectUrl(),
      },
    });

    if (error) {
      log('LINK', `Failed to link ${provider}:`, error.message);
      return {
        success: false,
        error: getReadableError(error.message, provider),
        provider,
      };
    }

    return {
      success: true,
      provider,
      linkedAccount: true,
    };
  } catch (error: any) {
    log('LINK', `Unexpected error linking ${provider}:`, error);
    return {
      success: false,
      error: 'Failed to link account. Please try again.',
      provider,
    };
  }
}

/**
 * Unlink a social provider from existing account
 */
export async function unlinkSocialProvider(provider: SocialProvider): Promise<SocialAuthResult> {
  try {
    log('UNLINK', `Unlinking ${provider} from account`);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'No user session found.',
        provider,
      };
    }

    // Find the identity to unlink
    const identity = user.identities?.find(i => i.provider === provider);
    
    if (!identity) {
      return {
        success: false,
        error: `${provider} is not linked to this account.`,
        provider,
      };
    }

    const { error } = await supabase.auth.unlinkIdentity(identity);

    if (error) {
      log('UNLINK', `Failed to unlink ${provider}:`, error.message);
      return {
        success: false,
        error: error.message,
        provider,
      };
    }

    return {
      success: true,
      provider,
    };
  } catch (error: any) {
    log('UNLINK', `Unexpected error unlinking ${provider}:`, error);
    return {
      success: false,
      error: 'Failed to unlink account. Please try again.',
      provider,
    };
  }
}
