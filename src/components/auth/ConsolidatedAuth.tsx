import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Eye, EyeOff, Users, Briefcase, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ensureClientProfile } from '@/lib/clients';
import AnimatedBackground from '@/components/AnimatedBackground';

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

  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') || defaultTab
  );

  const [showPassword, setShowPassword] = useState(false);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      //
      // LOGIN
      //
      if (activeTab === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;

        if (import.meta.env.DEV) {
          console.log('=== CONSOLIDATED AUTH LOGIN SUCCESS ===');
          console.log('User:', data.user?.email);
          console.log('Redirect handled by AuthContext');
          console.log('=======================================');
        }

        setMessage('Login successful. Redirecting...');

        return;
      }

      //
      // SIGNUP
      //
      if (activeTab === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { role: userType } }
        });

        if (error) throw error;

        // Create profile for client signups
        if (data.user && userType === 'client') {
          await ensureClientProfile({
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone
          });
        }

        setMessage('Account created. Please check email to verify.');
        return;
      }

      //
      // RESET PASSWORD
      //
      if (activeTab === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(
          formData.email
        );
        if (error) throw error;

        setMessage('Password reset email sent.');
        return;
      }

    } catch (err: any) {
      setMessage(err.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  //
  // PORTAL CONFIG (client, landscaper, admin)
  //
  const portalConfig = {
    client: {
      title: 'Client Portal',
      icon: Users,
      description: 'Book luxury landscaping services'
    },
    landscaper: {
      title: 'Professional Portal',
      icon: Briefcase,
      description: 'Manage your landscaping work'
    },
    admin: {
      title: 'Admin Portal',
      icon: Shield,
      description: 'System administration'
    }
  };

  const config = portalConfig[userType];
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Back Button */}
          {showBackButton && onBack && (
            <Button
              onClick={onBack}
              variant="ghost"
              className="mb-6 text-emerald-400 hover:text-emerald-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <IconComponent className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-emerald-400 mb-1">
              {config.title}
            </h1>
            <p className="text-gray-300">{config.description}</p>
          </div>

          {/* AUTH CARD */}
          <Card className="bg-gray-900/80 border border-emerald-500/30 backdrop-blur-md">
            <CardHeader>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  <TabsTrigger value="reset">Reset</TabsTrigger>
                </TabsList>

                {/* LOGIN */}
                <TabsContent value="login">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-800/50 border-emerald-500/30 text-white"
                    />

                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="bg-gray-800/50 border-emerald-500/30 text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-400"
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-semibold"
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                {/* SIGNUP */}
                <TabsContent value="signup">
                  <form onSubmit={handleSubmit} className="space-y-4">

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
                      placeholder="Phone Number"
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
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>

                {/* RESET PASSWORD */}
                <TabsContent value="reset">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-800/50 border-emerald-500/30 text-white"
                    />

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-semibold"
                    >
                      {loading ? 'Sending...' : 'Send Reset Email'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardHeader>

            {message && (
              <CardContent>
                <p
                  className={`text-sm ${
                    message.includes('sent') ||
                    message.includes('verify') ||
                    message.includes('Redirect')
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  {message}
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
