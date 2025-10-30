<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======
import React from 'react';
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFormValidation } from '@/hooks/useFormValidation';


export default function ClientLogin() {
  const navigate = useNavigate();
  const { role } = useAuth();
<<<<<<< HEAD
  const [configError, setConfigError] = useState<string | null>(null);

  // ✅ Environment Variable Validation & Debugging
  useEffect(() => {
    console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("Supabase Key:", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "Loaded ✅" : "Missing ❌");

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
      setConfigError("Configuration error: Invalid or missing Supabase key.");
    }
  }, []);


=======
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706

  const {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    setValue,
    setFieldTouched,
    handleSubmit
  } = useFormValidation({
    initialValues: { email: '', password: '' },
    validationRules: {
      email: { required: true },
      password: { required: true }
    },
    onSubmit: async (formValues) => {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formValues.email,
        password: formValues.password,
      });

      if (authError) {
        if (authError.message?.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (authError.message?.includes('Email not confirmed')) {
          throw new Error('Please check your email and click the confirmation link before logging in.');
        } else if (authError.message?.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please wait a few minutes before trying again.');
        }
        throw authError;
      }

      if (!authData.user) throw new Error('Authentication failed - no user returned');

      // Navigate to client dashboard
      setTimeout(() => {
        navigate('/client-dashboard');
      }, 1000);
    }
  });

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full px-4 md:px-0 max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl relative z-10">
        {/* Portal Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 mb-6 shadow-2xl shadow-emerald-500/50 animate-pulse">
            <User className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 bg-clip-text text-transparent mb-2 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            Client Portal
          </h1>
          <p className="text-gray-300">Access your luxury landscaping account</p>
        </div>

        {/* Login Form */}
        <div className="bg-black/60 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6 md:p-8 shadow-2xl shadow-emerald-500/20 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl"></div>
          
<<<<<<< HEAD
          {configError && (
            <Alert className="mb-6 border-yellow-500/50 bg-yellow-900/30 relative z-10">
              <AlertDescription className="text-yellow-300">{configError}</AlertDescription>
            </Alert>
          )}

=======
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
          {submitError && (
            <Alert className="mb-6 border-red-500/50 bg-red-900/30 relative z-10">
              <AlertDescription className="text-red-300">{submitError}</AlertDescription>
            </Alert>
          )}

<<<<<<< HEAD

=======
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-4">
              <FormField
                name="email"
                label="Email Address"
                type="email"
                value={values.email}
                onChange={(value) => setValue('email', value)}
                onBlur={() => setFieldTouched('email')}
                placeholder="Enter your email"
                required
                error={errors.email}
                touched={touched.email}
                className="bg-black/50 text-white border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 focus:shadow-[0_0_20px_rgba(16,185,129,0.3)] h-12 rounded-xl transition-all duration-300"
              />
              
              <FormField
                name="password"
                label="Password"
                type="password"
                value={values.password}
                onChange={(value) => setValue('password', value)}
                onBlur={() => setFieldTouched('password')}
                placeholder="Enter your password"
                required
                error={errors.password}
                touched={touched.password}
                className="bg-black/50 text-white border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 focus:shadow-[0_0_20px_rgba(16,185,129,0.3)] h-12 rounded-xl transition-all duration-300"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold rounded-xl shadow-lg shadow-emerald-500/50 hover:shadow-emerald-400/70 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>

          </form>

          <div className="mt-6 text-center space-y-3 relative z-10">
            <div className="text-gray-300 text-sm">
              <Link to="/forgot-password" className="text-emerald-400 hover:text-emerald-300 font-medium hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] transition-all">
                Forgot your password?
              </Link>
            </div>
            <div className="text-gray-300 text-sm">
              Don't have an account?{' '}
              <Link to="/client-signup" className="text-emerald-400 hover:text-emerald-300 font-medium hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] transition-all">
                Sign up here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
