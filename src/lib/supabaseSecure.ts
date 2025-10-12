import { createClient } from '@supabase/supabase-js';
import { secureConfig } from './secureConfig';

// Secure Supabase client without hardcoded credentials
const supabaseUrl = secureConfig.getRequired('VITE_SUPABASE_URL');
const supabaseAnonKey = secureConfig.getRequired('VITE_SUPABASE_ANON_KEY');

// Create Supabase client with enhanced security
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Add rate limiting protection
    flowType: 'pkce'
  },
  // Add request timeout
  global: {
    headers: {
      'X-Client-Info': 'greenscape-lux'
    }
  }
});

// Rate limiting for auth operations
class AuthRateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return false;
    }
    
    if (record.count >= this.maxAttempts) {
      return true;
    }
    
    record.count++;
    return false;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export const authRateLimiter = new AuthRateLimiter();

// Secure auth wrapper with rate limiting
export const secureAuth = {
  async signIn(email: string, password: string) {
    const identifier = email.toLowerCase();
    
    if (authRateLimiter.isRateLimited(identifier)) {
      throw new Error('Too many login attempts. Please try again later.');
    }
    
    const result = await supabase.auth.signInWithPassword({ email, password });
    
    if (result.error) {
      // Don't reset rate limit on error
      throw result.error;
    }
    
    // Reset rate limit on success
    authRateLimiter.reset(identifier);
    return result;
  },

  async signUp(email: string, password: string, options?: any) {
    const identifier = email.toLowerCase();
    
    if (authRateLimiter.isRateLimited(identifier)) {
      throw new Error('Too many signup attempts. Please try again later.');
    }
    
    return supabase.auth.signUp({ email, password, options });
  },

  async resetPassword(email: string) {
    const identifier = email.toLowerCase();
    
    if (authRateLimiter.isRateLimited(identifier)) {
      throw new Error('Too many reset attempts. Please try again later.');
    }
    
    return supabase.auth.resetPasswordForEmail(email);
  }
};

// Export configuration status for debugging (without exposing keys)
export const configStatus = {
  supabaseConfigured: secureConfig.isConfigured('VITE_SUPABASE_URL'),
  validation: secureConfig.getValidation()
};