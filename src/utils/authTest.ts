// Authentication flow test utility
import { supabase } from '@/lib/supabase';

export interface AuthTestResult {
  success: boolean;
  message: string;
  details?: any;
}

export async function testAuthFlow(): Promise<AuthTestResult[]> {
  const results: AuthTestResult[] = [];

  // Test 1: Check Supabase connection
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      results.push({
        success: false,
        message: 'Supabase connection failed',
        details: error.message
      });
    } else {
      results.push({
        success: true,
        message: 'Supabase connection successful',
        details: data.session ? 'User logged in' : 'No active session'
      });
    }
  } catch (err) {
    results.push({
      success: false,
      message: 'Supabase connection error',
      details: err
    });
  }

  // Test 2: Test getUserRoles function
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .single();

      if (userError) {
        results.push({
          success: false,
          message: 'User role query failed',
          details: userError.message
        });
      } else {
        results.push({
          success: true,
          message: 'User role query successful',
          details: userData
        });
      }
    } else {
      results.push({
        success: false,
        message: 'No authenticated user found'
      });
    }
  } catch (err) {
    results.push({
      success: false,
      message: 'User role test error',
      details: err
    });
  }

  return results;
}