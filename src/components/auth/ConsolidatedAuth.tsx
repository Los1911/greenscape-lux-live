import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Eye, EyeOff, Users, Briefcase, Shield, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ensureClientProfile } from '@/lib/clients';
import AnimatedBackground from '@/components/AnimatedBackground';
import { getPasswordResetUrl } from '@/utils/unifiedPasswordResetHandler';
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

interface ConsolidatedAuthProps {
  userType?: 'client' | 'landscaper' | 'admin';
  defaultTab?: 'login' | 'signup' | 'reset';
  onBack?: () => void;
  showBackButton?: boolean;
}

export default function ConsolidatedAuth({ 
  userType = 'client', 
  defaultTab = 'login',
  onBack,
  showBackButton = true
}: ConsolidatedAuthProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [socialAuthError, setSocialAuthError] = useState('');
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', firstName: '', lastName: '', phone: ''
  });

  // Force layout recalculation after OAuth redirect (fixes iOS Safari viewport issues)
  const { layoutReady } = useOAuthLayoutFix();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (socialAuthError) setSocialAuthError('');
    if (message && !message.includes('sent') && !message.includes('check') && !message.includes('successful')) {
      setMessage('');
      setErrorCode(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorCode(null);
    setSocialAuthError('');

    try {
      if (activeTab === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email, password: formData.password
        });
        
        if (error) {
          const { message: errorMsg, parsed } = handleLoginError(error);
          setMessage(errorMsg);
          setErrorCode(parsed.code);
          return;
        }
        
        if (isDev) {
          console.log('=== CONSOLIDATED AUTH LOGIN SUCCESS ===');
          console.log('✅ Login successful for:', data.user?.email);
          console.log('🔄 AuthContext will handle role resolution and redirect');
          console.log('=======================================');
        }
        
        setMessage('Login successful! Redirecting...');
        
      } else if (activeTab === 'signup') {
        // Check password match first
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
        
        const { data, error } = await supabase.auth.signUp({
          email: formData.email, password: formData.password,
          options: { data: { role: userType } }
        });
        
        if (error) {
          const { message: errorMsg, parsed } = handleSignupError(formData.email, error);
          setMessage(errorMsg);
          setErrorCode(parsed.code);
          return;
        }

        if (data.user && userType === 'client') {
          await ensureClientProfile({
            first_name: formData.firstName, last_name: formData.lastName,
            email: formData.email, phone: formData.phone
          });
        }
        setMessage('Please check your email to verify your account');
        
      } else if (activeTab === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: getPasswordResetUrl()
        });
        
        if (error) {
          const { message: errorMsg, parsed } = handlePasswordResetError(error);
          setMessage(errorMsg);
          setErrorCode(parsed.code);
          return;
        }
        setMessage('Password reset email sent! Check your inbox.');
      }
    } catch (error: any) {
      // Fallback for unexpected errors
      console.error('[ConsolidatedAuth] Unexpected error:', error);
      setMessage(error.message || 'Operation failed. Please try again.');
      setErrorCode('unexpected_failure');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuthError = (error: string) => {
    setSocialAuthError(error);
    setMessage('');
  };

  const portalConfig = {
    client: { title: 'Client Portal', icon: Users, description: 'Book luxury landscaping services' },
    landscaper: { title: 'Professional Portal', icon: Briefcase, description: 'Manage your landscaping business' },
    admin: { title: 'Admin Portal', icon: Shield, description: 'System administration' }
  };

  const config = portalConfig[userType];
  const IconComponent = config.icon;
  const showSocialAuth = userType !== 'admin';

  // Determine if message is success or error
  const isSuccess = message.includes('sent') || message.includes('check') || message.includes('successful');
  const isError = !isSuccess && message.length > 0;

  return (
    <div 
      className="bg-black relative flex flex-col"
      style={{
        // Use dvh for dynamic viewport height (handles iOS Safari address bar)
        // Fallback to svh for older browsers
        minHeight: '100dvh',
        // @ts-ignore - CSS fallback
        minHeight: '100svh',
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
      
      {/* Main content - flexbox centered, no absolute positioning */}
      <div 
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6"
        style={{
          paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))'
        }}
      >
        <div className="w-full max-w-md">
          {showBackButton && onBack && (
            <Button onClick={onBack} variant="ghost" className="mb-6 text-emerald-400 hover:text-emerald-300">
              <ArrowLeft className="w-4 h-4 mr-2" />Back
            </Button>
          )}

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <IconComponent className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-emerald-400 mb-2">{config.title}</h1>
            <p className="text-gray-300">{config.description}</p>
          </div>

          <Card className="bg-gray-900/80 border-emerald-500/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  <TabsTrigger value="reset">Reset</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input type="email" name="email" placeholder="Email" value={formData.email}
                      onChange={handleInputChange} required className="bg-gray-800/50 border-emerald-500/30 text-white" />
                    <div className="relative">
                      <Input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password"
                        value={formData.password} onChange={handleInputChange} required 
                        className="bg-gray-800/50 border-emerald-500/30 text-white pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-400">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <Button type="submit" disabled={loading} 
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-semibold">
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                  
                  {showSocialAuth && (
                    <>
                      <LuxAuthDivider />
                      <SocialAuthButtons 
                        variant="lux"
                        roleIntent={userType === 'landscaper' ? 'landscaper' : 'client'}
                        onError={handleSocialAuthError}
                        disabled={loading}
                      />
                    </>
                  )}
                </TabsContent>

                <TabsContent value="signup" className="mt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input type="text" name="firstName" placeholder="First Name" value={formData.firstName}
                        onChange={handleInputChange} required className="bg-gray-800/50 border-emerald-500/30 text-white" />
                      <Input type="text" name="lastName" placeholder="Last Name" value={formData.lastName}
                        onChange={handleInputChange} required className="bg-gray-800/50 border-emerald-500/30 text-white" />
                    </div>
                    <Input type="email" name="email" placeholder="Email" value={formData.email}
                      onChange={handleInputChange} required className="bg-gray-800/50 border-emerald-500/30 text-white" />
                    <Input type="tel" name="phone" placeholder="Phone Number" value={formData.phone}
                      onChange={handleInputChange} className="bg-gray-800/50 border-emerald-500/30 text-white" />
                    <Input type="password" name="password" placeholder="Password" value={formData.password}
                      onChange={handleInputChange} required className="bg-gray-800/50 border-emerald-500/30 text-white" />
                    <Input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword}
                      onChange={handleInputChange} required className="bg-gray-800/50 border-emerald-500/30 text-white" />
                    <Button type="submit" disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-semibold">
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                  
                  {showSocialAuth && (
                    <>
                      <LuxAuthDivider />
                      <SocialAuthButtons 
                        variant="lux"
                        roleIntent={userType === 'landscaper' ? 'landscaper' : 'client'}
                        onError={handleSocialAuthError}
                        disabled={loading}
                      />
                    </>
                  )}
                </TabsContent>

                <TabsContent value="reset" className="mt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-gray-400 text-sm mb-4">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                    <Input type="email" name="email" placeholder="Email" value={formData.email}
                      onChange={handleInputChange} required className="bg-gray-800/50 border-emerald-500/30 text-white" />
                    <Button type="submit" disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-semibold">
                      {loading ? 'Sending...' : 'Send Reset Email'}
                    </Button>
                  </form>
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
            <a href="/terms" className="text-emerald-400 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
