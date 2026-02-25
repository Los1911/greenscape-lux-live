import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Info } from 'lucide-react';
import SocialAuthButtons, { LuxAuthDivider } from './SocialAuthButtons';
import { 
  handleSignupError, 
  handleLoginError, 
  handlePasswordResetError,
  isEmailInCooldown,
  generateTestEmailAlias
} from '@/lib/authErrorHandler';

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

const log = (area: string, msg: string, data?: any) => {
  if (!isDev) return;
  const ts = new Date().toISOString().split('T')[1];
  console.log(`[${ts}][UNIFIED_AUTH:${area}] ${msg}`, data !== undefined ? data : '');
};

export default function UnifiedAuthPage() {
  const navigate = useNavigate();
  const { user, role: userRole, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [socialAuthError, setSocialAuthError] = useState('');
  const [roleIntent, setRoleIntent] = useState<'client' | 'landscaper'>('client');
  const redirectAttemptedRef = useRef(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  // Watch AuthContext for role changes - redirect when role is determined
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

  const clearErrors = () => {
    setError('');
    setErrorCode(null);
    setMessage('');
    setSocialAuthError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    log('LOGIN', '=== LOGIN ATTEMPT ===', { email: loginEmail });
    setLoading(true);
    clearErrors();
    redirectAttemptedRef.current = false;
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail, password: loginPassword,
      });
      
      if (authError) {
        const { message: errorMsg, parsed } = handleLoginError(authError);
        setError(errorMsg);
        setErrorCode(parsed.code);
        return;
      }
      
      log('LOGIN', '✅ SUCCESS - waiting for AuthContext role detection');
      setMessage('Login successful! Redirecting...');
    } catch (err: any) {
      log('LOGIN', '❌ ERROR:', err.message);
      const { message: errorMsg, parsed } = handleLoginError(err);
      setError(errorMsg);
      setErrorCode(parsed.code);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      setErrorCode('validation_failed');
      return;
    }
    
    // Check dev mode email cooldown
    const cooldownCheck = isEmailInCooldown(signupEmail);
    if (cooldownCheck.inCooldown) {
      const alias = generateTestEmailAlias(signupEmail);
      setError(`[DEV] This email was recently deleted. Wait ${cooldownCheck.remainingMinutes} min or use: ${alias}`);
      setErrorCode('email_cooldown');
      return;
    }
    
    setLoading(true);
    clearErrors();
    
    try {
      log('SIGNUP', '=== SIGNUP ATTEMPT ===', { email: signupEmail, role: roleIntent });
      
      const { error: authError } = await supabase.auth.signUp({
        email: signupEmail, password: signupPassword,
        options: { data: { role: roleIntent } }
      });
      
      if (authError) {
        const { message: errorMsg, parsed } = handleSignupError(signupEmail, authError);
        setError(errorMsg);
        setErrorCode(parsed.code);
        return;
      }
      
      log('SIGNUP', '✅ SUCCESS - Check email for verification');
      setMessage('Check your email for verification link');
    } catch (err: any) {
      log('SIGNUP', '❌ ERROR:', err.message);
      const { message: errorMsg, parsed } = handleSignupError(signupEmail, err);
      setError(errorMsg);
      setErrorCode(parsed.code);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearErrors();
    
    try {
      log('RESET', '=== PASSWORD RESET ATTEMPT ===', { email: resetEmail });
      
      const { error: authError } = await supabase.auth.resetPasswordForEmail(resetEmail);
      
      if (authError) {
        const { message: errorMsg, parsed } = handlePasswordResetError(authError);
        setError(errorMsg);
        setErrorCode(parsed.code);
        return;
      }
      
      log('RESET', '✅ SUCCESS - Reset email sent');
      setMessage('Password reset email sent');
    } catch (err: any) {
      log('RESET', '❌ ERROR:', err.message);
      const { message: errorMsg, parsed } = handlePasswordResetError(err);
      setError(errorMsg);
      setErrorCode(parsed.code);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuthError = (errorMsg: string) => {
    setSocialAuthError(errorMsg);
    setError('');
    setMessage('');
  };

  return (
    <div 
      className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex flex-col relative overflow-hidden"
      style={{
        minHeight: '100dvh',
        minHeight: '100svh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      {/* Back to home link */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 text-emerald-400 hover:text-emerald-300 transition-colors z-20"
        style={{
          top: 'max(1.5rem, env(safe-area-inset-top))',
          left: 'max(1.5rem, env(safe-area-inset-left))'
        }}
      >
        ← Back to Home
      </Link>
      
      {/* Main content - flexbox centered */}
      <div 
        className="flex-1 flex items-center justify-center px-4 py-6"
        style={{
          paddingTop: 'max(4rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))'
        }}
      >
        <Card className="w-full max-w-md bg-slate-800/80 backdrop-blur-sm border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">GreenScape Lux</CardTitle>
            <p className="text-slate-400">Premium Landscaping Services</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-700">
                <TabsTrigger value="login" className="data-[state=active]:bg-emerald-600">Login</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-emerald-600">Sign Up</TabsTrigger>
                <TabsTrigger value="reset" className="data-[state=active]:bg-emerald-600">Reset</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input 
                    type="email" 
                    placeholder="Email" 
                    value={loginEmail} 
                    onChange={(e) => { setLoginEmail(e.target.value); clearErrors(); }} 
                    className="bg-slate-700 border-slate-600 text-white" 
                    required 
                  />
                  <Input 
                    type="password" 
                    placeholder="Password" 
                    value={loginPassword} 
                    onChange={(e) => { setLoginPassword(e.target.value); clearErrors(); }} 
                    className="bg-slate-700 border-slate-600 text-white" 
                    required 
                  />
                  <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
                
                <LuxAuthDivider />
                <SocialAuthButtons 
                  variant="lux"
                  roleIntent="client"
                  onError={handleSocialAuthError}
                  disabled={loading}
                />
              </TabsContent>
              
              <TabsContent value="signup">
                {/* Role Selection */}
                <div className="mb-4">
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant={roleIntent === 'client' ? 'default' : 'outline'} 
                      onClick={() => setRoleIntent('client')} 
                      className={roleIntent === 'client' ? 'bg-emerald-600 hover:bg-emerald-700 flex-1' : 'border-slate-600 text-slate-300 flex-1'}
                    >
                      Client
                    </Button>
                    <Button 
                      type="button" 
                      variant={roleIntent === 'landscaper' ? 'default' : 'outline'} 
                      onClick={() => setRoleIntent('landscaper')} 
                      className={roleIntent === 'landscaper' ? 'bg-emerald-600 hover:bg-emerald-700 flex-1' : 'border-slate-600 text-slate-300 flex-1'}
                    >
                      Pro
                    </Button>
                  </div>
                </div>
                
                <form onSubmit={handleSignup} className="space-y-4">
                  <Input 
                    type="email" 
                    placeholder="Email" 
                    value={signupEmail} 
                    onChange={(e) => { setSignupEmail(e.target.value); clearErrors(); }} 
                    className="bg-slate-700 border-slate-600 text-white" 
                    required 
                  />
                  <Input 
                    type="password" 
                    placeholder="Password" 
                    value={signupPassword} 
                    onChange={(e) => { setSignupPassword(e.target.value); clearErrors(); }} 
                    className="bg-slate-700 border-slate-600 text-white" 
                    required 
                  />
                  <Input 
                    type="password" 
                    placeholder="Confirm Password" 
                    value={confirmPassword} 
                    onChange={(e) => { setConfirmPassword(e.target.value); clearErrors(); }} 
                    className="bg-slate-700 border-slate-600 text-white" 
                    required 
                  />
                  <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    {loading ? 'Creating...' : 'Create Account'}
                  </Button>
                </form>
                
                <LuxAuthDivider />
                <SocialAuthButtons 
                  variant="lux"
                  roleIntent={roleIntent}
                  onError={handleSocialAuthError}
                  disabled={loading}
                />
              </TabsContent>
              
              <TabsContent value="reset">
                <form onSubmit={handleReset} className="space-y-4">
                  <p className="text-slate-400 text-sm mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={resetEmail} 
                    onChange={(e) => { setResetEmail(e.target.value); clearErrors(); }} 
                    className="bg-slate-700 border-slate-600 text-white" 
                    required 
                  />
                  <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            {/* Error/Success Messages */}
            {error && (
              <div className="mt-4 flex items-start gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span>{error}</span>
                  {isDev && errorCode && (
                    <div className="mt-1 text-xs text-gray-500 font-mono">
                      Error Code: {errorCode}
                    </div>
                  )}
                </div>
              </div>
            )}
            {socialAuthError && (
              <div className="mt-4 flex items-start gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{socialAuthError}</span>
              </div>
            )}
            {message && (
              <div className="mt-4 flex items-start gap-2 text-emerald-400 text-sm bg-emerald-900/20 p-3 rounded-lg">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{message}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
