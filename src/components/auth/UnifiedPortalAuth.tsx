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
  console.log(`[${ts}][PORTAL:${area}] ${msg}`, data ?? '');
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

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  const redirectAttemptedRef = useRef(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotErrorCode, setForgotErrorCode] = useState<string | null>(null);

  useOAuthLayoutFix();

  useEffect(() => {
    clearPasswordResetFlag();
    clearRecoveryIntent();
  }, []);

  useEffect(() => {
    if (!user || redirectAttemptedRef.current) return;
    redirectAttemptedRef.current = true;

    const path =
      userRole === 'admin'
        ? '/admin'
        : userRole === 'landscaper'
        ? '/landscaper-dashboard'
        : '/client-dashboard';

    navigate(path, { replace: true });
  }, [user, userRole, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorCode(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        const { message: msg, parsed } = handleLoginError(error);
        setMessage(msg);
        setErrorCode(parsed.code);
        return;
      }

      setMessage('Login successful. Redirecting...');
    } catch (err: any) {
      const { message: msg, parsed } = handleLoginError(err);
      setMessage(msg);
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

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (isEmailInCooldown(formData.email)) {
      setMessage('This email was used recently. Please wait.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { role: roleIntent }
        }
      });

      if (error) {
        const { message: msg, parsed } = handleSignupError(formData.email, error);
        setMessage(msg);
        setErrorCode(parsed.code);
        return;
      }

      if (roleIntent === 'client') {
        await ensureClientProfile({
          auth_user_id: data.user!.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone
        });
      }

      setMessage('Check your email to verify your account.');
    } catch (err: any) {
      const { message: msg, parsed } = handleSignupError(formData.email, err);
      setMessage(msg);
      setErrorCode(parsed.code);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotLoading(true);
    setForgotMessage('');
    setForgotError('');
    setForgotErrorCode(null);

    try {
      const result = await handleUnifiedPasswordReset(
        forgotEmail,
        getPasswordResetUrl()
      );

      if (!result.success) {
        const { message: msg, parsed } = handlePasswordResetError(result.error);
        setForgotError(msg);
        setForgotErrorCode(parsed.code);
        return;
      }

      setForgotMessage('Password reset email sent. Check your inbox.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
      }, 2000);
    } catch (err: any) {
      const { message: msg, parsed } = handlePasswordResetError(err);
      setForgotError(msg);
      setForgotErrorCode(parsed.code);
    } finally {
      setForgotLoading(false);
    }
  };

  const isSuccess = message.toLowerCase().includes('success');
  const isError = !isSuccess && message.length > 0;

  return (
    <div className="bg-black relative flex flex-col min-h-screen">
      <AnimatedBackground />

      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl p-6 w-full max-w-md relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              onClick={() => setShowForgotPassword(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-emerald-400 mb-2">
              Reset Password
            </h2>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required
                className="bg-gray-800/50 border-emerald-500/30 text-white"
              />

              <Button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-semibold"
              >
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            {forgotMessage && (
              <div className="mt-3 text-emerald-400 text-sm">{forgotMessage}</div>
            )}
            {forgotError && (
              <div className="mt-3 text-red-400 text-sm">{forgotError}</div>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          <HomeButton />

          <div className="text-center mb-6">
            <Shield className="w-8 h-8 mx-auto text-emerald-400" />
            <h1 className="text-3xl font-bold text-emerald-400">
              GreenScape Lux Portal
            </h1>
            <p className="text-gray-300">Secure access for all users</p>
          </div>

          <Card className="bg-gray-900/80 border border-emerald-500/30">
            <CardHeader className="pb-2">
              <Tabs value={activeTab} onValueChange={v => setActiveTab(v)}>
                <TabsList className="grid grid-cols-2 bg-gray-800/50">
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
                      className="text-emerald-400 hover:text-emerald-300 text-sm"
                    >
                      Forgot password?
                    </button>
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <Input
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-800/50 border-emerald-500/30 text-white"
                    />
                    <Input
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-800/50 border-emerald-500/30 text-white"
                    />
                    <Input
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-800/50 border-emerald-500/30 text-white"
                    />
                    <Input
                      name="password"
                      type="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-800/50 border-emerald-500/30 text-white"
                    />
                    <Input
                      name="confirmPassword"
                      type="password"
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
                </TabsContent>
              </Tabs>
            </CardHeader>

            {(message || errorCode) && (
              <CardContent>
                <div
                  className={`text-sm p-3 rounded-lg ${
                    isSuccess
                      ? 'text-emerald-400 bg-emerald-900/20'
                      : 'text-red-400 bg-red-900/20'
                  }`}
                >
                  {message}
                  {isDev && errorCode && (
                    <div className="mt-1 text-xs font-mono text-gray-500">
                      Error Code: {errorCode}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UnifiedPortalAuth;
