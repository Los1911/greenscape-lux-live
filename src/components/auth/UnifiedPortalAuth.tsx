import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ensureClientProfile } from '@/lib/clients';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedBackground from '@/components/AnimatedBackground';

interface UnifiedPortalAuthProps {
  roleIntent: 'client' | 'landscaper';
  onBack?: () => void;
}

const UnifiedPortalAuth: React.FC<UnifiedPortalAuthProps> = ({ 
  roleIntent,
  onBack 
}) => {
  const navigate = useNavigate();
  const { role: userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      if (data.user) {
        // Ignore roleIntent on login - redirect based on actual user role
        // The AuthContext will fetch the role from the database
        // We'll let the auth state change handler redirect appropriately
        setMessage('Login successful! Redirecting...');
      }
    } catch (error: any) {
      setMessage(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Redirect based on actual user role once auth context updates
  React.useEffect(() => {
    if (userRole && !loading) {
      setTimeout(() => {
        if (userRole === 'client') {
          navigate('/client-dashboard');
        } else if (userRole === 'landscaper') {
          navigate('/landscaper-dashboard');
        } else if (userRole === 'admin') {
          navigate('/admin-dashboard');
        }
      }, 1000);
    }
  }, [userRole, loading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Use roleIntent for signup
      const signupPayload = {
        email: formData.email,
        password: formData.password,
        options: {
          data: { role: roleIntent },
          emailRedirectTo: window.location.origin + `/${roleIntent}-dashboard`
        }
      };

      const { data, error } = await supabase.auth.signUp(signupPayload);

      if (error) throw error;

      if (data.user) {
        // Store profile data based on role intent
        if (roleIntent === 'client') {
          await ensureClientProfile({
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone
          });
        }
        
        setMessage('Please check your email to verify your account');
      }
    } catch (error: any) {
      setMessage(error.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const portalConfig = {
    client: {
      title: 'Client Portal',
      icon: Users,
      description: 'Book luxury landscaping services'
    },
    landscaper: {
      title: 'Professional Portal', 
      icon: Briefcase,
      description: 'Manage your landscaping business'
    }
  };

  const config = portalConfig[roleIntent];
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-black relative">
      <AnimatedBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Back Button */}
          {onBack && (
            <Button
              onClick={onBack}
              variant="ghost"
              className="mb-6 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Get Started
            </Button>
          )}

          {/* Portal Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <IconComponent className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-emerald-400 mb-2">
              {config.title}
            </h1>
            <p className="text-gray-300">{config.description}</p>
          </div>

          {/* Auth Card */}
          <Card className="bg-gray-900/80 border-emerald-500/30 backdrop-blur-sm">
            <CardHeader>
              <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
                <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
                  <TabsTrigger value="login" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-800/50 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-400"
                    />
                    <Input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-800/50 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-400"
                    />
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-semibold"
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                  
                  {/* Forgot Password Link */}
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="bg-gray-800/50 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-400"
                      />
                      <Input
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="bg-gray-800/50 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-400"
                      />
                    </div>
                    <Input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-800/50 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-400"
                    />
                    <Input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bg-gray-800/50 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-400"
                    />
                    <Input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-800/50 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-400"
                    />
                    <Input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-800/50 border-emerald-500/30 text-white placeholder-gray-400 focus:border-emerald-400"
                    />
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-semibold"
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardHeader>
            
            {message && (
              <CardContent>
                <p className={`text-sm ${message.includes('sent') || message.includes('check') || message.includes('successful') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {message}
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UnifiedPortalAuth;