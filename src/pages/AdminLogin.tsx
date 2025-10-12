import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Shield, Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    if (user && role === 'admin') {
      navigate('/admin-dashboard', { replace: true });
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) throw signInError;

      const userRole = data.user?.user_metadata?.role;
      if (userRole !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin credentials required.');
      }

      await supabase.from('admin_login_logs').insert({
        admin_id: data.user.id,
        email: data.user.email,
        ip_address: 'browser',
        user_agent: navigator.userAgent
      });

      navigate('/admin-dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
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
          <Card className="relative bg-black/80 border-2 border-red-500/30 backdrop-blur-xl shadow-[0_0_40px_rgba(239,68,68,0.3)] hover:shadow-[0_0_50px_rgba(239,68,68,0.4)] hover:border-red-500/50 transition-all duration-500">
            <CardHeader className="space-y-6">
              {/* Security Warning */}
              <div 
                className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-2 border-red-500/40 rounded-xl p-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                role="alert"
                aria-live="polite"
              >
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
                  <label htmlFor="admin-email" className="sr-only">
                    Admin Email Address
                  </label>
                  <Input
                    id="admin-email"
                    type="email"
                    name="email"
                    placeholder="Admin Email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={error ? 'true' : 'false'}
                    className="bg-black/60 border-2 border-red-500/30 text-white placeholder:text-gray-500 focus:border-red-500/60 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="admin-password" className="sr-only">
                    Admin Password
                  </label>
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
                      aria-required="true"
                      aria-invalid={error ? 'true' : 'false'}
                      className="bg-black/60 border-2 border-red-500/30 text-white placeholder:text-gray-500 focus:border-red-500/60 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-md p-1 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" aria-hidden="true" />
                      ) : (
                        <Eye className="w-5 h-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white font-bold text-base hover:from-red-700 hover:via-red-600 hover:to-red-700 hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:ring-4 focus:ring-red-500/50"
                  aria-busy={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></span>
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
                <div 
                  className="bg-red-500/10 border-2 border-red-500/40 rounded-lg p-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  role="alert"
                  aria-live="assertive"
                >
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
