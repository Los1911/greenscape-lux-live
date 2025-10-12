import { supabase } from '@/lib/supabase';

export interface SignupEmailDiagnostic {
  timestamp: string;
  email?: string;
  checks: {
    userExists?: any;
    emailConfirmed?: boolean;
    authConfig?: any;
    recentAttempts?: any[];
  };
  fixes: {
    resendAttempt?: any;
    manualConfirm?: any;
  };
  recommendations: string[];
}

export async function runSignupEmailDiagnostic(email?: string): Promise<SignupEmailDiagnostic> {
  const result: SignupEmailDiagnostic = {
    timestamp: new Date().toISOString(),
    email,
    checks: {},
    fixes: {},
    recommendations: []
  };

  try {
    // 1. Check if user exists and email confirmation status
    if (email) {
      const { data: user, error } = await supabase.auth.admin.getUserByEmail(email);
      
      result.checks.userExists = {
        found: !!user,
        error: error?.message,
        emailConfirmed: user?.email_confirmed_at ? true : false,
        createdAt: user?.created_at
      };

      if (user && !user.email_confirmed_at) {
        result.recommendations.push('User exists but email not confirmed - try resending verification');
      }
    }

    // 2. Check recent signup attempts in email logs
    const { data: emailLogs, error: logsError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('recipient_email', email || '')
      .order('sent_at', { ascending: false })
      .limit(5);

    result.checks.recentAttempts = {
      found: emailLogs?.length || 0,
      logs: emailLogs,
      error: logsError?.message
    };

    // 3. Try to resend verification email
    if (email) {
      try {
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email
        });

        result.fixes.resendAttempt = {
          success: !resendError,
          error: resendError?.message
        };

        if (!resendError) {
          result.recommendations.push('Verification email resent successfully');
        }
      } catch (error: any) {
        result.fixes.resendAttempt = {
          success: false,
          error: error.message
        };
      }
    }

    // 4. Add general recommendations
    if (!email) {
      result.recommendations.push('Provide email address for detailed diagnostic');
    }

    result.recommendations.push('Check spam/junk folder for verification emails');
    result.recommendations.push('Ensure email address is correct and accessible');

  } catch (error: any) {
    result.recommendations.push(`Diagnostic error: ${error.message}`);
  }

  return result;
}

export async function forceEmailConfirmation(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user by email
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (userError || !user) {
      return { success: false, error: 'User not found' };
    }

    // Update user to confirm email
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}