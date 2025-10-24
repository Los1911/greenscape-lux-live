import { supabase } from '@/lib/supabase';

export async function runLoginDiagnostic(email = 'carlosmatthews@gmail.com') {
  try {
    const { data, error } = await supabase.functions.invoke('test-complete-login-flow', {
      body: { email, password: 'TempPass123!' }
    });

    if (error) {
      console.error('Diagnostic function error:', error);
      return { error: error.message };
    }

    console.log('Login Diagnostic Results:', data);
    return data;
  } catch (err) {
    console.error('Failed to run diagnostic:', err);
    return { error: err.message };
  }
}

// Run diagnostic immediately
runLoginDiagnostic().then(result => {
  console.log('=== CARLOS LOGIN DIAGNOSTIC ===');
  console.log(JSON.stringify(result, null, 2));
});