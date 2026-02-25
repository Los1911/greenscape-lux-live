import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { Loader2, Users, TrendingUp, CheckCircle2, Mail } from 'lucide-react';

interface ExpansionWaitlistFormProps {
  zipCode: string;
  onSuccess?: () => void;
}

const serviceOptions = [
  'Lawn Mowing',
  'Landscaping',
  'Tree Services',
  'Seasonal Cleanup',
  'Garden Maintenance'
];

export function ExpansionWaitlistForm({ zipCode, onSuccess }: ExpansionWaitlistFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    serviceInterests: [] as string[]
  });

  useEffect(() => {
    fetchWaitlistCount();
  }, [zipCode]);

  const fetchWaitlistCount = async () => {
    if (!zipCode) return;
    
    console.log('[WAITLIST] Fetching count for ZIP:', zipCode);
    try {
      // Try RPC first, fall back to direct count
      const { data, error } = await supabase.rpc('get_waitlist_count', { zip: zipCode });
      if (!error && data !== null) {
        setWaitlistCount(data);
        console.log('[WAITLIST] Count:', data);
      } else {
        // Fallback: direct count query
        const { count, error: countError } = await supabase
          .from('expansion_waitlist')
          .select('id', { count: 'exact', head: true })
          .eq('zip_code', zipCode);
        
        if (!countError && count !== null) {
          setWaitlistCount(count);
          console.log('[WAITLIST] Count (fallback):', count);
        }
      }
    } catch (err) {
      console.error('[WAITLIST] Error fetching count:', err);
      // Don't crash - just show 0
      setWaitlistCount(0);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('[WAITLIST] Submitting for ZIP:', zipCode);
      
      const { error: insertError } = await supabase
        .from('expansion_waitlist')
        .insert({
          email: formData.email,
          zip_code: zipCode,
          full_name: formData.fullName || null,
          phone: formData.phone || null,
          service_interests: formData.serviceInterests
        });

      if (insertError) throw insertError;

      // Send confirmation email
      await supabase.functions.invoke('unified-email', {
        body: {
          to: formData.email,
          type: 'waitlist_confirmation',
          data: {
            name: formData.fullName || 'Valued Customer',
            zipCode,
            waitlistCount: waitlistCount + 1
          }
        }
      });

      setSuccess(true);
      await fetchWaitlistCount();
      console.log('[WAITLIST] Success!');
      
      setTimeout(() => {
        onSuccess?.();
      }, 3000);
    } catch (error) {
      console.error('[WAITLIST] Error:', error);
      alert('Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      serviceInterests: prev.serviceInterests.includes(service)
        ? prev.serviceInterests.filter(s => s !== service)
        : [...prev.serviceInterests, service]
    }));
  };

  if (success) {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
        <h3 className="text-2xl font-bold text-emerald-400">You're on the list!</h3>
        <p className="text-gray-300">We'll notify you when GreenScape Lux expands to {zipCode}</p>
        <div className="flex items-center justify-center gap-2 text-emerald-400">
          <Users className="w-5 h-5" />
          <span className="font-semibold">{waitlistCount + 1} people</span>
          <span className="text-gray-400">in your area</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-white">Join the Expansion Waitlist</h3>
        <p className="text-gray-300">Be the first to know when we bring luxury landscaping to {zipCode}</p>
      </div>

      {/* Progress Tracker */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl p-6 border border-emerald-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-emerald-400" />
            <div>
              <div className="text-2xl font-bold text-emerald-400">{waitlistCount}</div>
              <div className="text-sm text-gray-400">people waiting</div>
            </div>
          </div>
          <TrendingUp className="w-8 h-8 text-emerald-400 animate-pulse" />
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
            style={{ width: `${Math.min((waitlistCount / 50) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {waitlistCount >= 50 ? 'High demand! Expansion likely soon.' : `${50 - waitlistCount} more needed for priority expansion`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-white">Email *</Label>
          <Input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="bg-gray-800/50 border-emerald-500/30 text-white"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <Label htmlFor="fullName" className="text-white">Full Name</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            className="bg-gray-800/50 border-emerald-500/30 text-white"
            placeholder="John Doe"
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-white">Phone (optional)</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="bg-gray-800/50 border-emerald-500/30 text-white"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <Label className="text-white mb-3 block">Services of Interest</Label>
          <div className="space-y-2">
            {serviceOptions.map(service => (
              <div key={service} className="flex items-center gap-2">
                <Checkbox
                  id={service}
                  checked={formData.serviceInterests.includes(service)}
                  onCheckedChange={() => toggleService(service)}
                />
                <label htmlFor={service} className="text-sm text-gray-300 cursor-pointer">
                  {service}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-6"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Joining Waitlist...
            </>
          ) : (
            <>
              <Mail className="w-5 h-5 mr-2" />
              Join Waitlist
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
