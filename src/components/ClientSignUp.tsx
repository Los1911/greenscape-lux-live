import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { PasswordStrength } from '@/components/ui/password-strength';
import { supabase } from '@/lib/supabase';
import { ensureClientProfile } from '@/lib/clients';
import { ArrowLeft, AlertCircle, Info } from 'lucide-react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { ButtonLoading } from '@/components/ui/loading-spinner';
import { validateEmail, validatePassword, validatePhone } from '@/utils/formValidation';
import { 
  handleSignupError,
  isEmailInCooldown,
  generateTestEmailAlias
} from '@/lib/authErrorHandler';

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

const ClientSignUp: React.FC = () => {
  const navigate = useNavigate();
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [layoutReady, setLayoutReady] = useState(false);

  // Force layout recalculation after OAuth redirect or page mount
  // This fixes iOS Safari viewport issues after returning from external OAuth flow
  useLayoutEffect(() => {
    // Trigger reflow by temporarily hiding and showing content
    const forceReflow = () => {
      document.body.style.display = 'none';
      // Force browser to recalculate layout
      void document.body.offsetHeight;
      document.body.style.display = '';
      setLayoutReady(true);
    };

    // Small delay to ensure DOM is ready after OAuth redirect
    const timer = setTimeout(forceReflow, 50);
    return () => clearTimeout(timer);
  }, []);

  // Additional viewport height fix for iOS Safari
  useEffect(() => {
    const setViewportHeight = () => {
      // Set CSS custom property for actual viewport height
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
    };
  }, []);

  const {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    setValue,
    setFieldTouched,
    handleSubmit,
    setSubmitError
  } = useFormValidation({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    },
    validationRules: {
      firstName: { required: true, minLength: 2 },
      lastName: { required: true, minLength: 2 },
      email: { 
        required: true,
        custom: (value) => {
          const result = validateEmail(value);
          return result.isValid ? null : result.error!;
        }
      },
      phone: {
        custom: (value) => {
          if (!value) return null;
          const result = validatePhone(value);
          return result.isValid ? null : result.error!;
        }
      },
      password: {
        required: true,
        custom: (value) => {
          const result = validatePassword(value);
          return result.isValid ? null : result.error!;
        }
      },
      confirmPassword: {
        required: true,
        custom: (value) => {
          if (value !== values.password) {
            return 'Passwords do not match';
          }
          return null;
        }
      }
    },
    onSubmit: async (formValues) => {
      // Clear previous states
      setErrorCode(null);
      setSuccessMessage('');
      
      // Check dev mode email cooldown
      const cooldownCheck = isEmailInCooldown(formValues.email);
      if (cooldownCheck.inCooldown) {
        const alias = generateTestEmailAlias(formValues.email);
        const errorMsg = `[DEV] This email was recently deleted. Wait ${cooldownCheck.remainingMinutes} min or use: ${alias}`;
        setErrorCode('email_cooldown');
        throw new Error(errorMsg);
      }
      
      if (isDev) {
        console.log('=== CLIENT SIGNUP ATTEMPT ===');
        console.log('Email:', formValues.email);
      }
      
      const signupPayload = {
        email: formValues.email,
        password: formValues.password,
        options: {
          data: { role: 'client' },
          emailRedirectTo: window.location.origin + '/client-dashboard'
        }
      };

      const { data, error } = await supabase.auth.signUp(signupPayload);
      
      if (error) {
        const { message: errorMsg, parsed } = handleSignupError(formValues.email, error);
        setErrorCode(parsed.code);
        throw new Error(errorMsg);
      }
      
      if (!data.user?.id) {
        setErrorCode('unexpected_failure');
        throw new Error('No user ID returned. Please try again.');
      }

      if (isDev) {
        console.log('✅ CLIENT SIGNUP SUCCESS');
        console.log('User ID:', data.user.id);
      }

      await ensureClientProfile({
        first_name: formValues.firstName,
        last_name: formValues.lastName,
        email: formValues.email,
        phone: formValues.phone
      });

      setSuccessMessage('Account created! Redirecting to your dashboard...');
      setTimeout(() => navigate('/client-dashboard', { replace: true }), 1500);
    }
  });

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/get-started');
    }
  };

  // Clear error code when user starts typing
  const handleFieldChange = (field: string, value: string) => {
    setValue(field, value);
    if (submitError) {
      setSubmitError('');
      setErrorCode(null);
    }
  };

  return (
    <div 
      className="bg-black relative overflow-hidden flex flex-col"
      style={{
        // Use dvh for dynamic viewport height (handles iOS Safari address bar)
        // Fallback to svh, then vh for older browsers
        minHeight: '100dvh',
        // @ts-ignore - CSS fallback for browsers without dvh support
        minHeight: '100svh',
        // Safe area insets for notch/dynamic island devices
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        // Prevent layout shift during reflow
        opacity: layoutReady ? 1 : 0.99,
        transition: 'opacity 0.1s ease-in-out'
      }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Back Button - positioned with safe area awareness */}
      <button
        onClick={handleBack}
        className="absolute z-10 flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
        style={{
          top: 'max(1.5rem, env(safe-area-inset-top))',
          right: 'max(1.5rem, env(safe-area-inset-right))'
        }}
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      {/* Main content - flexbox centered, no absolute positioning */}
      <div 
        className="flex-1 flex items-center justify-center px-6 lg:px-8 py-12 relative z-10"
        style={{
          paddingTop: 'max(3rem, env(safe-area-inset-top))',
          paddingBottom: 'max(3rem, env(safe-area-inset-bottom))'
        }}
      >
        <div className="max-w-6xl w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Panel - Brand/Benefits */}
            <div className="hidden lg:block">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 bg-clip-text text-transparent mb-6 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                Client Portal
              </h1>
              <p className="text-xl text-gray-300 mb-8">Join GreenScape Lux for premium landscaping services</p>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Premium landscaping professionals</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Real-time project tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Secure payment processing</span>
                </div>
              </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full">
              <div className="lg:hidden mb-8 text-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 bg-clip-text text-transparent mb-2 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                  Client Portal
                </h1>
              </div>

              <div className="bg-black/60 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-8 shadow-2xl shadow-emerald-500/20">
                {/* Success Message */}
                {successMessage && (
                  <div className="flex items-start gap-2 text-emerald-400 text-sm bg-emerald-900/30 border border-emerald-500/50 rounded-xl p-3 mb-6">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}
                
                {/* Error Message */}
                {submitError && (
                  <div className="flex items-start gap-2 text-red-300 text-sm bg-red-900/30 border border-red-500/50 rounded-xl p-3 mb-6">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span>{submitError}</span>
                      {isDev && errorCode && (
                        <div className="mt-1 text-xs text-gray-500 font-mono">
                          Error Code: {errorCode}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      name="firstName"
                      label="First Name"
                      value={values.firstName}
                      onChange={(value) => handleFieldChange('firstName', value)}
                      onBlur={() => setFieldTouched('firstName')}
                      placeholder="Enter first name"
                      required
                      error={errors.firstName}
                      touched={touched.firstName}
                      className="bg-black/50 text-white border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 h-12 rounded-xl"
                    />
                    
                    <FormField
                      name="lastName"
                      label="Last Name"
                      value={values.lastName}
                      onChange={(value) => handleFieldChange('lastName', value)}
                      onBlur={() => setFieldTouched('lastName')}
                      placeholder="Enter last name"
                      required
                      error={errors.lastName}
                      touched={touched.lastName}
                      className="bg-black/50 text-white border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 h-12 rounded-xl"
                    />
                  </div>

                  {/* Email */}
                  <FormField
                    name="email"
                    label="Email Address"
                    type="email"
                    value={values.email}
                    onChange={(value) => handleFieldChange('email', value)}
                    onBlur={() => setFieldTouched('email')}
                    placeholder="Enter email address"
                    required
                    error={errors.email}
                    touched={touched.email}
                    className="bg-black/50 text-white border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 h-12 rounded-xl"
                  />

                  {/* Phone */}
                  <FormField
                    name="phone"
                    label="Phone Number"
                    type="tel"
                    value={values.phone}
                    onChange={(value) => handleFieldChange('phone', value)}
                    onBlur={() => setFieldTouched('phone')}
                    placeholder="Enter phone number (optional)"
                    error={errors.phone}
                    touched={touched.phone}
                    className="bg-black/50 text-white border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 h-12 rounded-xl"
                  />

                  {/* Password */}
                  <div className="space-y-2">
                    <FormField
                      name="password"
                      label="Password"
                      type="password"
                      value={values.password}
                      onChange={(value) => {
                        handleFieldChange('password', value);
                        setShowPasswordStrength(value.length > 0);
                      }}
                      onBlur={() => setFieldTouched('password')}
                      placeholder="Enter password"
                      required
                      error={errors.password}
                      touched={touched.password}
                      className="bg-black/50 text-white border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 h-12 rounded-xl"
                    />
                    
                    {showPasswordStrength && (
                      <PasswordStrength password={values.password} />
                    )}
                  </div>

                  {/* Confirm Password */}
                  <FormField
                    name="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    value={values.confirmPassword}
                    onChange={(value) => handleFieldChange('confirmPassword', value)}
                    onBlur={() => setFieldTouched('confirmPassword')}
                    placeholder="Confirm your password"
                    required
                    error={errors.confirmPassword}
                    touched={touched.confirmPassword}
                    className="bg-black/50 text-white border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 h-12 rounded-xl"
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all duration-300"
                  >
                    <ButtonLoading loading={isSubmitting} loadingText="Creating Account...">
                      Create Account
                    </ButtonLoading>
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-gray-300">
                    Already have an account?{' '}
                    <Link to="/portal-login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                      Portal Login
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSignUp;
