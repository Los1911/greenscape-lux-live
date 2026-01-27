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
import {
  handleSignupError,
  handleLoginError,
  handlePasswordResetError,
  isEmailInCooldown,
  generateTestEmailAlias
} from '@/lib/authErrorHandler';
import {
  handleUnifiedPasswordReset,
  getPasswordResetUrl
} from '@/utils/unifiedPasswordResetHandler';
import {
  clearPasswordResetFlag,
  clearRecoveryIntent
} from '@/utils/passwordResetGuard';
import { useOAuthLayoutFix } from '@/hooks/useOAuthLayoutFix';

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

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

  const { layoutReady } = useOAuthLayoutFix();

  useEffect(() => {
    const state = location.state as { error?: string } | null;
    if (state?.error) {
      setSocialAuthError(state.error);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    clearPasswordResetFlag();
    clearRecoveryIntent();
  }, []);

  useEffect(() => {
    if (userRole && !authLoading && !redirectAttemptedRef.current) {
      redirectAttemptedRef.current = true;
      const path =
        userRole === 'admin'
          ? '/admin-dashboard'
          : userRole === 'landscaper'
          ? '/landscaper-dashboard'
          : '/client-dashboard';
      navigate(path, { replace: true });
    }
  }, [userRole, authLoading, user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (message) {
      setMessage('');
      setErrorCode(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorCode(null);
    setSocialAuthError('');
    redirectAttemptedRef.current = false;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        const { message, parsed } = handleLoginError(error);
        setMessage(message);
        setErrorCode(parsed.code);
        return;
      }

      if (data.user) {
        setMessage('Login successful. Redirecting...');
      }
    } catch (err: any) {
      const { message, parsed } = handleLoginError(err);
      setMessage(message);
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
      setMessage('Passwords do not match');
      setErrorCode('validation_failed');
      setLoading(false);
      return;
    }

    const cooldownCheck = isEmailInCooldown(formData.email);
    if (cooldownCheck.inCooldown) {
      const alias = generateTestEmailAlias(formData.email);
      setMessage(`Wait ${cooldownCheck.remainingMinutes} min or use ${alias}`);
      setErrorCode('email_cooldown');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { role: roleIntent } }
      });

      if (error) {
        const { message, parsed } = handleSignupError(formData.email, error);
        setMessage(message);
        setErrorCode(parsed.code);
        return;
      }

      if (data.user && roleIntent === 'client') {
        await ensureClientProfile({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone
        });
      }

      setMessage('Please check your email to verify your account');
    } catch (err: any) {
      const { message, parsed } = handleSignupError(formData.email, err);
      setMessage(message);
      setErrorCode(parsed.code);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotMessage('');

    try {
      const result = await handleUnifiedPasswordReset(
        forgotEmail,
        getPasswordResetUrl()
      );

      if (!result.success) {
        const { message, parsed } = handlePasswordResetError(result.error || '');
        setForgotError(message);
        setForgotErrorCode(parsed.code);
        return;
      }

      setForgotMessage('Reset email sent. Check your inbox.');
      setTimeout(() => setShowForgotPassword(false), 4000);
    } catch (err: any) {
      const { message, parsed } = handlePasswordResetError(err);
      setForgotError(message);
      setForgotErrorCode(parsed.code);
    } finally {
      setForgotLoading(false);
    }
  };

  const isSuccess = message.includes('check') || message.includes('successful');
  const isError = !isSuccess && message.length > 0;

  return (
    <div
      className="bg-black min-h-screen flex items-center justify-center px-4"
      style={{ opacity: layoutReady ? 1 : 0.99 }}
    >
      <AnimatedBackground />

      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md relative">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-4 right-4 text-gray-400"
            >
              <X />
            </button>
            <h2 className="text-emerald-400 font-bold mb-4">Reset Password</h2>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={forgotLoading} className="w-full">
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              {forgotMessage && <p className="text-emerald-400">{forgotMessage}</p>}
              {forgotError && <p className="text-red-400">{forgotError}</p>}
            </form>
          </div>
        </div>
      )}

      <Card className="bg-gray-900/80 border-emerald-500/30 w-full max-w-xl z-10">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Shield className="text-emerald-400 w-8 h-8" />
          </div>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v)}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
              <button
                onClick={() => setShowForgotPassword(true)}
                className="mt-4 text-sm text-emerald-400"
              >
                Forgot password?
              </button>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <Input name="firstName" placeholder="First Name" onChange={handleInputChange} required />
                <Input name="lastName" placeholder="Last Name" onChange={handleInputChange} required />
                <Input name="email" placeholder="Email" onChange={handleInputChange} required />
                <Input name="phone" placeholder="Phone" onChange={handleInputChange} />
                <Input name="password" type="password" placeholder="Password" onChange={handleInputChange} required />
                <Input name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleInputChange} required />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardHeader>

        {(message || socialAuthError) && (
          <CardContent>
            <div
              className={`p-3 rounded ${
                isError ? 'bg-red-900/20 text-red-400' : 'bg-emerald-900/20 text-emerald-400'
              }`}
            >
              {message || socialAuthError}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default UnifiedPortalAuth;
