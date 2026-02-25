import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Clock, AlertCircle, ExternalLink, Building2 } from 'lucide-react';
import { STRIPE_STATUS_REFRESH_EVENT } from '@/pages/LandscaperDashboardV2';

interface Props {
  userId: string;
}

export function StripeConnectProgressTracker({ userId }: Props) {
  const [status, setStatus] = useState<'not_started' | 'pending_verification' | 'requires_action' | 'verified'>('not_started');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStripeStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('landscapers')
        .select('stripe_connect_id, stripe_onboarding_complete, verification_status, stripe_details_submitted, stripe_charges_enabled, stripe_payouts_enabled')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching landscaper profile:', error);
        setLoading(false);
        return;
      }

      if (data) {
        // Derive status from actual database fields
        if (!data.stripe_connect_id) {
          setStatus('not_started');
        } else if (data.stripe_payouts_enabled && data.stripe_charges_enabled) {
          setStatus('verified');
          setRequirements([]);
        } else if (data.stripe_details_submitted) {
          setStatus('pending_verification');
          setRequirements([]);
        } else {
          setStatus('requires_action');
          const newRequirements: string[] = [];
          if (!data.stripe_details_submitted) newRequirements.push('Complete identity verification');
          if (!data.stripe_payouts_enabled) newRequirements.push('Add bank account for payouts');
          setRequirements(newRequirements);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStripeStatus();
    
    const channel = supabase
      .channel('landscaper-stripe-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'landscapers',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[StripeConnectProgressTracker] Real-time update received');
          if (payload.new) {
            handleRealtimeUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchStripeStatus]);

  useEffect(() => {
    const handleRefresh = () => {
      console.log('[StripeConnectProgressTracker] Received refresh event');
      fetchStripeStatus();
    };

    window.addEventListener(STRIPE_STATUS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(STRIPE_STATUS_REFRESH_EVENT, handleRefresh);
  }, [fetchStripeStatus]);

  const handleRealtimeUpdate = (data: any) => {
    if (!data.stripe_connect_id) {
      setStatus('not_started');
    } else if (data.stripe_payouts_enabled && data.stripe_charges_enabled) {
      setStatus('verified');
      setRequirements([]);
    } else if (data.stripe_details_submitted) {
      setStatus('pending_verification');
      setRequirements([]);
    } else {
      setStatus('requires_action');
      const newRequirements: string[] = [];
      if (!data.stripe_details_submitted) newRequirements.push('Complete identity verification');
      if (!data.stripe_payouts_enabled) newRequirements.push('Add bank account for payouts');
      setRequirements(newRequirements);
    }
  };

  const continueOnboarding = async () => {
    const { data } = await supabase.functions.invoke('create-connect-account-link', {
      body: { userId }
    });
    if (data?.onboardingUrl) window.location.href = data.onboardingUrl;
  };

  const statusConfig = {
    not_started: { icon: AlertCircle, color: 'bg-red-500', text: 'Not Started', time: '5-10 min' },
    pending_verification: { icon: Clock, color: 'bg-yellow-500', text: 'Pending Verification', time: '1-2 days' },
    requires_action: { icon: AlertCircle, color: 'bg-orange-500', text: 'Action Required', time: '3-5 min' },
    verified: { icon: CheckCircle2, color: 'bg-emerald-500', text: 'Verified', time: 'Complete' }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  if (loading) return <Card className="p-6 animate-pulse bg-gray-800" />;

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-emerald-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-400" />
          <h3 className="text-xl font-bold text-white">Payout Account Setup</h3>
        </div>
        <Badge className={`${config.color} text-white`}>
          <Icon className="w-4 h-4 mr-1" />
          {config.text}
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            {status === 'pending_verification' ? 'Estimated review time:' : 'Estimated time:'}
          </span>
          <span className="text-emerald-400 font-semibold">{config.time}</span>
        </div>

        {requirements.length > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-white mb-2">Required Steps:</p>
            {requirements.map((req, i) => (
              <div key={i} className="flex items-center text-sm text-gray-300">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                {req}
              </div>
            ))}
          </div>
        )}

        {(status === 'not_started' || status === 'requires_action') && (
          <Button onClick={continueOnboarding} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {status === 'not_started' ? 'Complete Stripe Onboarding' : 'Continue Onboarding'}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        )}

        {status === 'pending_verification' && (
          <div className="text-center py-2">
            <p className="text-yellow-400 text-sm">Stripe is verifying your identity and bank account details.</p>
            <Button onClick={continueOnboarding} variant="outline" className="mt-3 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10">
              Continue Onboarding
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {status === 'verified' && (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <p className="text-emerald-400 font-semibold">Bank account verified — ready for payouts</p>
          </div>
        )}
      </div>
    </Card>
  );
}
