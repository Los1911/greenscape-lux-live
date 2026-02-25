import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Phone, MapPin, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { PaymentMethodManager } from '@/components/client/PaymentMethodManager';
import { NotificationPreferencesPanel } from '@/components/notifications/NotificationPreferencesPanel';

export default function ClientProfile() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    email: ''
  });

  // Auth loading guard - show loading UI while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Update email when user becomes available
  useEffect(() => {
    if (user?.email && !profile.email) {
      setProfile(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchProfile();
    else setProfileLoading(false);
  }, [user]);


  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.hash]);

  const fetchProfile = async () => {
    console.log('[CLIENT PROFILE] Starting data load...');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, address, stripe_customer_id')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[CLIENT PROFILE]', error);
        setLoadError('Data could not be loaded in this preview, but you are still signed in.');
        setProfileLoading(false);
        return;
      }
      
      console.log('[CLIENT PROFILE] Profile loaded:', data ? 'found' : 'null');
      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          address: data.address || '',
          email: user?.email || ''
        });
      }
      setLoadError(null);
    } catch (error) {
      console.error('[CLIENT PROFILE]', error);
      setLoadError('Data could not be loaded in this preview, but you are still signed in.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({ id: user?.id, ...profile });
      if (error) throw error;
      toast({ title: "Profile updated", description: "Your profile has been saved successfully." });
    } catch (error: any) {
      console.error('[CLIENT PROFILE] Save error:', error);
      toast({ title: "Error", description: error?.message || "Failed to update profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-emerald-400">Profile Unavailable</h2>
          <p className="text-emerald-200/70">{loadError}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 rounded-xl hover:bg-emerald-500/30">Refresh</button>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Your Profile</h1>
          <p className="text-gray-400">Manage your account information</p>
        </div>

        <Card id="name" className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5 text-emerald-400" />Full Name
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name" className="text-gray-300">First Name</Label>
                <Input id="first_name" value={profile.first_name} onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))} className="bg-gray-800 border-gray-700 text-white" />
              </div>
              <div>
                <Label htmlFor="last_name" className="text-gray-300">Last Name</Label>
                <Input id="last_name" value={profile.last_name} onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))} className="bg-gray-800 border-gray-700 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="phone" className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Phone className="h-5 w-5 text-emerald-400" />Phone Number
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input value={profile.phone} onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))} placeholder="(555) 123-4567" className="bg-gray-800 border-gray-700 text-white" />
          </CardContent>
        </Card>

        <Card id="address" className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MapPin className="h-5 w-5 text-emerald-400" />Service Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input value={profile.address} onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))} placeholder="123 Main St, City, State 12345" className="bg-gray-800 border-gray-700 text-white" />
          </CardContent>
        </Card>

        <Card id="payment" className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5 text-emerald-400" />Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">Manage your payment methods and billing information.</p>
            <PaymentMethodManager open={paymentModalOpen} onOpenChange={setPaymentModalOpen} onSuccess={() => toast({ title: "Payment methods updated", description: "Your payment information has been updated." })} />
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => setPaymentModalOpen(true)}>Manage Payment Methods</Button>
          </CardContent>
        </Card>

        <div id="notifications"><NotificationPreferencesPanel /></div>

        <div className="flex justify-center">
          <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">{loading ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>
    </div>
  );
}
