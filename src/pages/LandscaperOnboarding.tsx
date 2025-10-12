import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AppLayout from '@/components/AppLayout';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StripeConnectOnboarding } from '@/components/landscaper/StripeConnectOnboarding';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

export default function LandscaperOnboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [landscaperId, setLandscaperId] = useState<string>('');
  const [showStripeOnboarding, setShowStripeOnboarding] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    serviceArea: '',
    experience: '',
  });

  // Check for Stripe return
  const stripeSuccess = searchParams.get('success') === 'true';
  const stripeRefresh = searchParams.get('refresh') === 'true';


  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        if (user.user_metadata) {
          setFormData(prev => ({
            ...prev,
            firstName: user.user_metadata.first_name || '',
            lastName: user.user_metadata.last_name || '',
          }));
        }

        // Load landscaper profile
        const { data: landscaper } = await supabase
          .from('landscapers')
          .select('id, stripe_connect_id')
          .eq('user_id', user.id)
          .single();

        if (landscaper) {
          setLandscaperId(landscaper.id);
          setShowStripeOnboarding(!landscaper.stripe_connect_id);
        }
      }
    };

    loadUserData();

    // Handle Stripe return
    if (stripeSuccess) {
      setTimeout(() => navigate('/landscaper-dashboard'), 2000);
    }
  }, [stripeSuccess]);


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // Check if profile exists
      const { data: existing, error: fetchError } = await supabase
        .from('landscapers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existing && fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        // Update profile
        const { error: updateError } = await supabase
          .from('landscapers')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            business_name: formData.businessName,
            service_area: formData.serviceArea,
            years_experience: formData.experience,
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Insert profile
        const { error: insertError } = await supabase
          .from('landscapers')
          .insert([
            {
              user_id: user.id,
              first_name: formData.firstName,
              last_name: formData.lastName,
              business_name: formData.businessName,
              service_area: formData.serviceArea,
              years_experience: formData.experience,
            }
          ]);

        if (insertError) throw insertError;
      }

      // Navigate directly to dashboard
      navigate('/landscaper-dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <AnimatedBackground />
      <div className="flex items-center justify-center min-h-screen px-4 pt-24">
        <Card className="w-full max-w-2xl bg-black/90 border-2 border-green-500 shadow-2xl shadow-green-500/20">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-green-400 text-center">
              Complete Your Profile
            </CardTitle>
            <p className="text-gray-300 text-center">Professional landscaper setup</p>
          </CardHeader>
          <CardContent>
            {stripeSuccess && (
              <Alert className="mb-4 bg-green-900/50 border-green-500">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  Payment setup complete! Redirecting to dashboard...
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-300">
                {error}
              </div>
            )}


            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <Label htmlFor="firstName" className="text-green-400">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="bg-gray-900 border-green-500 text-white"
                  placeholder="First name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="lastName" className="text-green-400">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="bg-gray-900 border-green-500 text-white"
                  placeholder="Last name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="businessName" className="text-green-400">Business Name</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="bg-gray-900 border-green-500 text-white"
                  placeholder="Your landscaping business name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="serviceArea" className="text-green-400">Service Area</Label>
                <Input
                  id="serviceArea"
                  value={formData.serviceArea}
                  onChange={(e) => handleInputChange('serviceArea', e.target.value)}
                  className="bg-gray-900 border-green-500 text-white"
                  placeholder="ZIP codes or areas you serve"
                  required
                />
              </div>

              <div>
                <Label htmlFor="experience" className="text-green-400">Years of Experience</Label>
                <Select onValueChange={(value) => handleInputChange('experience', value)} required>
                  <SelectTrigger className="bg-gray-900 border-green-500 text-white">
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-2">1-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {showStripeOnboarding && landscaperId && user?.email && (
                <StripeConnectOnboarding
                  landscaperId={landscaperId}
                  email={user.email}
                  businessName={formData.businessName}
                />
              )}

              {!showStripeOnboarding && landscaperId && (
                <div className="bg-green-900/50 border border-green-500 rounded-lg p-4">
                  <h3 className="text-green-400 font-semibold mb-2">✓ Payment Setup Complete</h3>
                  <p className="text-gray-300 text-sm">
                    Your bank account is connected and ready to receive payments.
                  </p>
                </div>
              )}


              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? 'Saving...' : 'Complete Profile Setup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
