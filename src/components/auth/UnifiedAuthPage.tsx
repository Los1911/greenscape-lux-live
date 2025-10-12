import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function UnifiedAuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState<'client' | 'landscaper'>('client');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Reset form
  const [resetEmail, setResetEmail] = useState('');

  React.useEffect(() => {
    if (user) {
      const userRole = user.user_metadata?.role || 'client';
      navigate(userRole === 'landscaper' ? '/landscaper-dashboard' : '/client-dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      
      if (error) throw error;
      
      const userRole = data.user?.user_metadata?.role || 'client';
      navigate(userRole === 'landscaper' ? '/landscaper-dashboard' : '/client-dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: { role }
        }
      });
      
      if (error) throw error;
      setMessage('Check your email for verification link');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
      if (error) throw error;
      setMessage('Password reset email sent');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      {/* Back to Home */}
      <Link to="/" className="absolute top-6 left-6 text-emerald-400 hover:text-emerald-300 transition-colors">
        ← Back to Home
      </Link>
      
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
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
                
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={role === 'client' ? 'default' : 'outline'}
                    onClick={() => setRole('client')}
                    className={role === 'client' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-slate-600 text-slate-300'}
                  >
                    Client
                  </Button>
                  <Button
                    type="button"
                    variant={role === 'landscaper' ? 'default' : 'outline'}
                    onClick={() => setRole('landscaper')}
                    className={role === 'landscaper' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-slate-600 text-slate-300'}
                  >
                    Pro (Landscaper)
                  </Button>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="reset">
              <form onSubmit={handleReset} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          {error && (
            <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
          )}
          {message && (
            <p className="mt-4 text-emerald-400 text-sm text-center glow-text">{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}