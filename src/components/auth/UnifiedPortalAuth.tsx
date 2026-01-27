import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, X, AlertCircle, Info } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ensureClientProfile } from '@/lib/clients';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedBackground from '@/components/AnimatedBackground';
import HomeButton from '@/components/HomeButton';
import { handleUnifiedPasswordReset, getPasswordResetUrl } from '@/utils/unifiedPasswordResetHandler';
import { clearPasswordResetFlag, clearRecoveryIntent } from '@/utils/passwordResetGuard';
import SocialAuthButtons, { LuxAuthDivider } from './SocialAuthButtons';
import { 
  handleSignupError, 
  handleLoginError, 
  handlePasswordResetError,
  isEmailInCooldown,
  generateTestEmailAlias
} from '@/lib/authErrorHandler';
import { useOAuthLayoutFix } from '@/hooks/useOAuthLayoutFix';

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

const log = (area: string, msg: string, data?: any) => {
  if (!isDev) return;
  const ts = new Date().toISOString().split('T')[1];
  console.log(`[${ts}][PORTAL:${area}] ${msg}`, data !== undefined ? data : '');
};

const UnifiedPortalAuth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role: userRole, loading: authLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [roleIntent, setRoleIntent] = useState<'client' | 'landscaper'>('client');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [socialAuthError, setSocialAuthError] = useState('');
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', phone: ''
  });
  const redirectAttemptedRef = useRef(false);
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotErrorCode, setForgotErrorCode] = useState<string | null>(null);

  // Force layout recalculation after OAuth redirect (fixes iOS Safari viewport issues)
  const { layoutReady } = useOAuthLayoutFix();


  // Check for error passed from OAuth callback
  useEffect(() => {
    const state = location.state as { error?: string } | null;
    if (state?.error) {
      setSocialAuthError(state.error);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Clear password reset flags on login page load
  useEffect(() => {
    log('INIT', 'Login page loaded - clearing password reset flags and recovery intent');
    clearPasswordResetFlag();
    clearRecoveryIntent();
  }, []);

  // Primary redirect: Monitor auth context for role changes
  useEffect(() => {
    log('AUTH_WATCH', 'Context changed', { userRole, authLoading, hasUser: !!user });
    
    if (userRole && !authLoading && !redirectAttemptedRef.current) {
      redirectAttemptedRef.current = true;
      const path = userRole === 'admin' ? '/admin-dashboard' :
                  userRole === 'landscaper' ? '/landscaper-dashboard' : '/client-dashboard';
      log('AUTH_WATCH', '✅ Role detected, navigating to:', path);
      navigate(path, { replace: true });
    }
  }, [userRole, authLoading, user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (socialAuthError) setSocialAuthError('');
    // Clear error messages when user starts typing
    if (message && !message.includes('check') && !message.includes('successful')) {
      setMessage('');
      setErrorCode(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    log('LOGIN', '=== LOGIN ATTEMPT ===');
    log('LOGIN', 'Email:', formData.email);
    
    setLoading(true);
    setMessage('');
    setErrorCode(null);
    setSocialAuthError('');
    redirectAttemptedRef.current = false;
    
    try {
      log('LOGIN', 'Calling signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email, password: formData.password
      });
      
      log('LOGIN', 'Response:', { hasUser: !!data.user, error: error?.message });
      
      if (error) {
        const { message: errorMsg, parsed } = handleLoginError(error);
        setMessage(errorMsg);
        setErrorCode(parsed.code);
        return;
      }
      
      if (data.user) {
        log('LOGIN', '✅ SUCCESS - User:', data.user.email);
        log('LOGIN', 'Metadata role:', data.user.user_metadata?.role);
        setMessage('Login successful! Redirecting...');
      }
    } catch (error: any) {
      log('LOGIN', '❌ UNEXPECTED ERROR:', error.message);
      const { message: errorMsg, parsed } = handleLoginError(error);
      setMessage(errorMsg);
      setErrorCode(parsed.code);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorCode(null);
    setSocialAuthError('');
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setErrorCode('validation_failed');
      setLoading(false);
      return;
    }
    
    // Check dev mode email cooldown
    const cooldownCheck = isEmailInCooldown(formData.email);
    if (cooldownCheck.inCooldown) {
      const alias = generateTestEmailAlias(formData.email);
      setMessage(`[DEV] This email was recently deleted. Wait ${cooldownCheck.remainingMinutes} min or use: ${alias}`);
      setErrorCode('email_cooldown');
      setLoading(false);
      return;
    }
    
    try {
      log('SIGNUP', '=== SIGNUP ATTEMPT ===');
      log('SIGNUP', 'Email:', formData.email, 'Role:', roleIntent);
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email, password: formData.password,
        options: { data: { role: roleIntent } }
      });
      
      if (error) {
        const { message: errorMsg, parsed } = handleSignupError(formData.email, error);
        setMessage(errorMsg);
        setErrorCode(parsed.code);
        return;
      }
      
      if (data.user && roleIntent === 'client') {
        await ensureClientProfile({
          first_name: formData.firstName, last_name: formData.lastName,
          email: formData.email, phone: formData.phone
        });
      }
      
      log('SIGNUP', '✅ SUCCESS - Check email for verification');
      setMessage('Please check your email to verify your account');
    } catch (error: any) {
      log('SIGNUP', '❌ UNEXPECTED ERROR:', error.message);
      const { message: errorMsg, parsed } = handleSignupError(formData.email, error);
      setMessage(errorMsg);
      setErrorCode(parsed.code);
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password submission
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotLoading(true);
    setForgotError('');
    setForgotErrorCode(null);
    setForgotMessage('');

    try {
      log('FORGOT_PASSWORD', 'Requesting reset for:', forgotEmail);
      
      const result = await handleUnifiedPasswordReset(forgotEmail, getPasswordResetUrl());
      
      if (!result.success) {
        const { message: errorMsg, parsed } = handlePasswordResetError(result.error || 'Failed to send reset email');
        setForgotError(errorMsg);
        setForgotErrorCode(parsed.code);
        return;
      }
      
      log('FORGOT_PASSWORD', '✅ Reset email sent successfully');
      setForgotMessage('Password reset email sent! Please check your inbox.');
      
      // Auto-close after success
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
        setForgotMessage('');
      }, 4000);
    } catch (err: any) {
      log('FORGOT_PASSWORD', '❌ ERROR:', err.message);
      const { message: errorMsg, parsed } = handlePasswordResetError(err);
      setForgotError(errorMsg);
      setForgotErrorCode(parsed.code);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSocialAuthError = (error: string) => {
    setSocialAuthError(error);
    setMessage('');
  };

  const handleSocialAuthLoading = (isLoading: boolean) => {
    if (isLoading) {
      setSocialAuthError('');
      setMessage('');
    }
  };

  // Determine if message is success or error
  const isSuccess = message.includes('check') || message.includes('successful');
  const isError = !isSuccess && message.length > 0;

  // Forgot Password Modal/Form
  const renderForgotPasswordForm = () => (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))'
      }}
    >
      <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl p-6 w-full max-w-md relative">
        <button 
          onClick={() => {
            setShowForgotPassword(false);
            setForgotEmail('');
            setForgotMessage('');
            setForgotError('');
            setForgotErrorCode(null);
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold text-emerald-400 mb-2">Reset Password</h2>
        <p className="text-gray-400 text-sm mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
            className="bg-gray-800/50 border-emerald-500/30 text-white"
          />
          
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={forgotLoading} 
              className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-semibold"
            >
              {forgotLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowForgotPassword(false);
                setForgotEmail('');
                setForgotMessage('');
                setForgotError('');
                setForgotErrorCode(null);
              }}
              className="border-emerald-500/30 text-emerald-400"
            >
              Cancel
            </Button>
          </div>
          
          {forgotMessage && (
            <div className="flex items-start gap-2 text-emerald-400 text-sm bg-emerald-900/20 p-3 rounded-lg">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{forgotMessage}</span>
            </div>
          )}
          {forgotError && (
            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span>{forgotError}</span>
                {isDev && forgotErrorCode && (
                  <div className="mt-1 text-xs text-gray-500 font-mono">
                    Error Code: {forgotErrorCode}
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );

  return (
    <div 
      className="bg-black relative flex flex-col min-h-screen"
      style={{
        // Use dvh for dynamic viewport height (handles iOS Safari address bar)
        // CSS class min-h-screen provides fallback for older browsers
        minHeight: '100dvh',
        // Safe area insets for notch/dynamic island devices
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        // Smooth transition for layout recalculation after OAuth redirect
        opacity: layoutReady ? 1 : 0.99,
        transition: 'opacity 0.1s ease-in-out'
      }}
    >
      <AnimatedBackground />
      

      
      {/* Forgot Password Modal */}
      {showForgotPassword && renderForgotPasswordForm()}
      
      {/* Main content area - flexbox centered, no absolute positioning */}
      <div 
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6"
        style={{
          paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))'
        }}
      >
        <div className="w-full max-w-2xl">
          <div className="mb-6"><HomeButton /></div>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-emerald-400 mb-2">GreenScape Lux Portal</h1>
            <p className="text-gray-300">Secure access for all users</p>
          </div>
          <Card className="bg-gray-900/80 border-emerald-500/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="mt-6">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <Input 
                      type="email" 
                      name="email" 
                      placeholder="Email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      required 
                      className="bg-gray-800/50 border-emerald-500/30 text-white" 
                    />
                    <Input 
                      type="password" 
                      name="password" 
                      placeholder="Password" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      required 
                      className="bg-gray-800/50 border-emerald-500/30 text-white" 
                    />
                    <Button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-semibold"
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                  
                  <div className="mt-4 text-center">
                    <button 
                      type="button" 
                      onClick={() => setShowForgotPassword(true)} 
                      className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors border-0 outline-none focus:outline-none rounded"
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        border: 'none',
                        background: 'transparent'
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <LuxAuthDivider />
                  
                  <SocialAuthButtons 
                    variant="lux"
                    roleIntent="client"
                    onError={handleSocialAuthError}
                    onLoading={handleSocialAuthLoading}
                    disabled={loading}
                  />
                </TabsContent>
                
                <TabsContent value="signup" className="mt-6">
                  {/* Role Selection */}
                  <div className="mb-4">
                    <label className="text-sm text-gray-300 mb-2 block">I am a:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        type="button" 
                        variant={roleIntent === 'client' ? 'default' : 'outline'} 
                        onClick={() => setRoleIntent('client')} 
                        className={roleIntent === 'client' ? 'bg-emerald-500 text-black' : 'border-emerald-500/30 text-emerald-400'}
                      >
                        Client
                      </Button>
                      <Button 
                        type="button" 
                        variant={roleIntent === 'landscaper' ? 'default' : 'outline'} 
                        onClick={() => setRoleIntent('landscaper')} 
                        className={roleIntent === 'landscaper' ? 'bg-emerald-500 text-black' : 'border-emerald-500/30 text-emerald-400'}
                      >
                        Professional
                      </Button>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        type="text" 
                        name="firstName" 
                        placeholder="First Name" 
                        value={formData.firstName} 
                        onChange={handleInputChange} 
                        required 
                        className="bg-gray-800/50 border-emerald-500/30 text-white" 
                      />
                      <Input 
                        type="text" 
                        name="lastName" 
                        placeholder="Last Name" 
                        value={formData.lastName} 
                        onChange={handleInputChange} 
                        required 
                        className="bg-gray-800/50 border-emerald-500/30 text-white" 
                      />
                    </div>
                    <Input 
                      type="email" 
                      name="email" 
                      placeholder="Email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      required 
                      className="bg-gray-800/50 border-emerald-500/30 text-white" 
                    />
                    <Input 
                      type="tel" 
                      name="phone" 
                      placeholder="Phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      className="bg-gray-800/50 border-emerald-500/30 text-white" 
                    />
                    <Input 
                      type="password" 
                      name="password" 
                      placeholder="Password" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      required 
                      className="bg-gray-800/50 border-emerald-500/30 text-white" 
                    />
                    <Input 
                      type="password" 
                      name="confirmPassword" 
                      placeholder="Confirm Password" 
                      value={formData.confirmPassword} 
                      onChange={handleInputChange} 
                      required 
                      className="bg-gray-800/50 border-emerald-500/30 text-white" 
                    />
                    <Button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-semibold"
                    >
                      {loading ? 'Creating...' : 'Create Account'}
                    </Button>
                  </form>
                  
                  <LuxAuthDivider />
                  
                  <SocialAuthButtons 
                    variant="lux"
                    roleIntent={roleIntent}
                    onError={handleSocialAuthError}
                    onLoading={handleSocialAuthLoading}
                    disabled={loading}
                  />
                </TabsContent>
              </Tabs>
            </CardHeader>
            
            {/* Error/Success Messages */}
            {(message || socialAuthError) && (
              <CardContent className="pt-0">
                {socialAuthError && (
                  <div className="flex items-start gap-2 text-sm text-red-400 bg-red-900/20 p-3 rounded-lg mb-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{socialAuthError}</span>
                  </div>
                )}
                {message && (
                  <div className={`flex items-start gap-2 text-sm ${isSuccess ? 'text-emerald-400 bg-emerald-900/20' : 'text-red-400 bg-red-900/20'} p-3 rounded-lg`}>
                    {isError ? <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      <span>{message}</span>
                      {/* Dev mode: Show error code */}
                      {isDev && errorCode && isError && (
                        <div className="mt-1 text-xs text-gray-500 font-mono">
                          Error Code: {errorCode}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
          
          <p className="text-center text-gray-500 text-xs mt-4">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-emerald-400 hover:underline" style={{ WebkitTapHighlightColor: 'transparent' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-emerald-400 hover:underline" style={{ WebkitTapHighlightColor: 'transparent' }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedPortalAuth;
