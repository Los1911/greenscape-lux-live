import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, AlertCircle, Clock, ExternalLink, RefreshCw, Building2, Loader2 } from 'lucide-react';

interface ConnectStatus {
  stripe_connect_id: string | null;
  stripe_account_status: string;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_details_submitted: boolean;
}

type VerificationState = 'not_started' | 'pending_verification' | 'verified';

export function ConnectAccountStatus({ landscaperId }: { landscaperId: string }) {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  useEffect(() => {
    loadStatus();

    const statusChannel = supabase
      .channel('landscaper-connect-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'landscapers',
          filter: `id=eq.${landscaperId}`
        },
        () => { loadStatus(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [landscaperId]);

  const loadStatus = async () => {
    const { data } = await supabase
      .from('landscapers')
      .select('stripe_connect_id, stripe_account_status, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted')
      .eq('id', landscaperId)
      .single();

    setStatus(data);
    setLoading(false);
    setRefreshing(false);
  };

  const refreshStatus = async () => {
    setRefreshing(true);
    await loadStatus();
  };

  const startOnboarding = async () => {
    setOnboardingLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('create-connect-account-link', {
        body: { userId: user.id, email: user.email || '' }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }
    } catch (err: any) {
      console.error('[ConnectAccountStatus] Onboarding error:', err);
    } finally {
      setOnboardingLoading(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Loading payout status...</div>;

  // Derive verification state
  const getVerificationState = (): VerificationState => {
    if (!status?.stripe_connect_id) return 'not_started';
    if (status.stripe_charges_enabled && status.stripe_payouts_enabled) return 'verified';
    return 'pending_verification';
  };

  const verificationState = getVerificationState();

  const stateConfig = {
    not_started: {
      badge: 'Not Started',
      badgeVariant: 'destructive' as const,
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      message: 'Complete Stripe onboarding to connect your bank account and receive payouts.',
      showOnboardButton: true,
    },
    pending_verification: {
      badge: 'Pending Verification',
      badgeVariant: 'secondary' as const,
      icon: <Clock className="h-5 w-5 text-yellow-500" />,
      message: 'Stripe is reviewing your information. This typically takes 1-2 business days.',
      showOnboardButton: true,
    },
    verified: {
      badge: 'Verified',
      badgeVariant: 'default' as const,
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      message: 'Your bank account is connected and payouts are enabled.',
      showOnboardButton: false,
    },
  };

  const config = stateConfig[verificationState];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Payout Account</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={config.badgeVariant}>
            {config.badge}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={refreshStatus}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Status details */}
      <div className="space-y-3 mb-4">
        <StatusItem
          label="Bank Account Connected"
          enabled={status?.stripe_payouts_enabled || false}
          description="Receive payouts to your bank account"
        />
        <StatusItem
          label="Identity Verified"
          enabled={status?.stripe_details_submitted || false}
          description="Identity and business info submitted to Stripe"
        />
        <StatusItem
          label="Payouts Enabled"
          enabled={status?.stripe_payouts_enabled || false}
          description="Ready to receive earnings from completed jobs"
        />
      </div>

      {/* Status message */}
      <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
        verificationState === 'verified'
          ? 'bg-green-50 border border-green-200'
          : verificationState === 'pending_verification'
          ? 'bg-yellow-50 border border-yellow-200'
          : 'bg-red-50 border border-red-200'
      }`}>
        {config.icon}
        <p className={`text-sm ${
          verificationState === 'verified' ? 'text-green-800' :
          verificationState === 'pending_verification' ? 'text-yellow-800' :
          'text-red-800'
        }`}>
          {config.message}
        </p>
      </div>

      {/* Action button */}
      {config.showOnboardButton && (
        <Button
          onClick={startOnboarding}
          disabled={onboardingLoading}
          className="w-full"
        >
          {onboardingLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirecting to Stripe...</>
          ) : (
            <><ExternalLink className="mr-2 h-4 w-4" />
              {verificationState === 'not_started' ? 'Complete Stripe Onboarding' : 'Continue Onboarding'}
            </>
          )}
        </Button>
      )}

      {verificationState === 'verified' && (
        <Button
          onClick={() => window.open('https://dashboard.stripe.com/express', '_blank')}
          variant="outline"
          className="w-full"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Stripe Dashboard
        </Button>
      )}
    </Card>
  );
}

function StatusItem({ label, enabled, description }: { label: string; enabled: boolean; description: string }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {enabled ? (
        <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
      ) : (
        <Clock className="h-5 w-5 text-yellow-500 mt-1" />
      )}
    </div>
  );
}
