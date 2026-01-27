import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Shield, Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedBackground from '@/components/AnimatedBackground';
import { clearPasswordResetFlag, clearRecoveryIntent } from '@/utils/passwordResetGuard';

const log = (area: string, msg: string, data?: any) => {
  const ts = new Date().toISOString().split('T')[1];
  console.log(`[${ts}][ADMIN_LOGIN:${area}] ${msg}`, data !== undefined ? data : '');
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  // PART 3: Clear password reset flags AND recovery intent on admin login page load
  useEffect(() => {
    log('INIT', 'Admin login page loaded - clearing password reset flags and recovery intent');
    clearPasswordResetFlag();
    clearRecoveryIntent();
  }, []);

  // Auth loading guard - show loading UI while auth is initializing
  if (authLoading) {
    return (
      <div 
        className="bg-black flex flex-col items-center justify-center min-h-screen"
        style={{
          minHeight: '100dvh',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)'
        }}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Watch AuthContext for role - redirect when admin role is confirmed
  useEffect(() => {
    log('AUTH_WATCH', 'Context changed', { hasUser: !!user, role, authLoading });
    
    if (user && role === 'admin') {
      log('AUTH_WATCH', '✅ Admin role confirmed - redirecting to dashboard');
      navigate('/admin-dashboard', { replace: true });
    }
    if (user && role && role !== 'admin') {
      log('AUTH_WATCH', `⚠️ Non-admin role detected (${role}) - redirecting`);
      const path = role === 'landscaper' ? '/landscaper-dashboard' : '/client-dashboard';
      navigate(path, { replace: true });
    }
  }, [user, role, navigate, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    log('LOGIN', '=== ADMIN LOGIN ATTEMPT ===');
    log('LOGIN', 'Email:', formData.email);
    
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) {
        log('LOGIN', '❌ Sign in error:', signInError.message);
        throw signInError;
      }

      log('LOGIN', '✅ Sign in successful, user:', data.user?.email);
      
      try {
        await supabase.from('admin_login_logs').insert({
          admin_id: data.user?.id,
          email: data.user?.email,
          ip_address: 'browser',
          user_agent: navigator.userAgent
        });
        log('LOGIN', 'Admin login logged');
      } catch (logError) {
        log('LOGIN', 'Admin login log failed (non-critical):', logError);
      }

      log('LOGIN', 'Waiting for AuthContext to resolve role...');
      
    } catch (err: any) {
      log('LOGIN', '❌ ERROR:', err.message);
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div 
      className="bg-black relative overflow-hidden flex flex-col min-h-screen"
      style={{
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      <AnimatedBackground />
      
      <div 
        className="relative z-10 flex-1 flex items-center justify-center px-4 py-6"
        style={{
          paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))'
        }}
      >
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/30 blur-xl rounded-full animate-pulse"></div>
                <div className="relative p-5 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                  <Shield className="w-10 h-10 text-red-400" aria-hidden="true" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-400 via-red-500 to-red-400 bg-clip-text text-transparent mb-3">
              Admin Portal
            </h1>
            <p className="text-gray-300 flex items-center justify-center gap-2 text-sm sm:text-base">
              <Lock className="w-4 h-4 text-red-400" aria-hidden="true" />
              Secure System Administration
            </p>
          </div>

          {/* Login Card */}
          <Card className="relative bg-black/80 border-2 border-red-500/30 backdrop-blur-xl shadow-[0_0_40px_rgba(239,68,68,0.3)]">
            <CardHeader className="space-y-6">
              {/* Security Warning */}
              <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-2 border-red-500/40 rounded-xl p-4" role="alert">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-sm text-red-200 leading-relaxed">
                    This portal is restricted to authorized administrators only. 
                    All login attempts are logged and monitored.
                  </p>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Input
                    id="admin-email"
                    type="email"
                    name="email"
                    placeholder="Admin Email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    autoComplete="email"
                    className="bg-black/60 border-2 border-red-500/30 text-white placeholder:text-gray-500 focus:border-red-500/60 h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Admin Password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      autoComplete="current-password"
                      className="bg-black/60 border-2 border-red-500/30 text-white placeholder:text-gray-500 focus:border-red-500/60 h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300 p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white font-bold"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Authenticating...
                    </span>
                  ) : (
                    'Admin Sign In'
                  )}
                </Button>
              </form>
            </CardHeader>
            
            {error && (
              <CardContent>
                <div className="bg-red-500/10 border-2 border-red-500/40 rounded-lg p-4" role="alert">
                  <p className="text-sm text-red-300 font-medium">{error}</p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Footer Text */}
          <p className="text-center text-gray-500 text-sm mt-6 flex items-center justify-center gap-2">
            <Lock className="w-3 h-3" aria-hidden="true" />
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
}
