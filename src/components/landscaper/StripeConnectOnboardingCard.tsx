import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseClient } from '@/lib/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, AlertCircle, Loader2, Building2, X, RefreshCw, Clock, ExternalLink } from 'lucide-react';
import { STRIPE_STATUS_REFRESH_EVENT } from '@/pages/LandscaperDashboardV2';

interface Props {
  landscaperId: string;
  email: string;
  businessName?: string;
}

type VerificationStatus = 'not_started' | 'pending_verification' | 'verified';

interface AccountState {
  accountId: string | null;
  verificationStatus: VerificationStatus;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

export function StripeConnectOnboardingCard({ landscaperId, email, businessName }: Props) {
  const supabase = useSupabaseClient();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [account, setAccount] = useState<AccountState>({
    accountId: null,
    verificationStatus: 'not_started',
    payoutsEnabled: false,
    detailsSubmitted: false,
  });

  // Derive verification status from database fields
  const deriveStatus = (data: any): VerificationStatus => {
    if (!data?.stripe_connect_id) return 'not_started';
    if (data.stripe_payouts_enabled && data.stripe_charges_enabled) return 'verified';
    if (data.stripe_details_submitted || data.stripe_account_status === 'pending') return 'pending_verification';
    return 'not_started';
  };

  // Load status from database
  const loadStatus = useCallback(async () => {
    try {
      const userId = user?.id;
      if (!userId) return;

      const { data, error: fetchErr } = await supabase
        .from('landscapers')
        .select('stripe_connect_id, stripe_account_status, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchErr) {
        console.error('[StripeConnectOnboarding] DB error:', fetchErr);
        return;
      }

      const status = deriveStatus(data);
      setAccount({
        accountId: data?.stripe_connect_id || null,
        verificationStatus: status,
        payoutsEnabled: data?.stripe_payouts_enabled || false,
        detailsSubmitted: data?.stripe_details_submitted || false,
      });
    } catch (err) {
      console.error('[StripeConnectOnboarding] Error loading status:', err);
    }
  }, [supabase, user?.id]);

  // Verify with Stripe API for latest status
  const verifyWithStripe = useCallback(async () => {
    const userId = user?.id;
    if (!userId) return;

    setRefreshing(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('verify-stripe-connect-status', {
        body: { userId }
      });

      if (fnErr) {
        console.error('[StripeConnectOnboarding] Verify error:', fnErr);
        // Fall back to DB check
        await loadStatus();
        return;
      }

      if (data?.success) {
        const status: VerificationStatus =
          (data.payoutsEnabled && data.chargesEnabled) ? 'verified' :
          data.detailsSubmitted ? 'pending_verification' :
          data.accountId ? 'pending_verification' : 'not_started';

        setAccount({
          accountId: data.accountId || null,
          verificationStatus: status,
          payoutsEnabled: data.payoutsEnabled || false,
          detailsSubmitted: data.detailsSubmitted || false,
        });
      } else {
        await loadStatus();
      }
    } catch (err) {
      console.error('[StripeConnectOnboarding] Verify failed:', err);
      await loadStatus();
    } finally {
      setRefreshing(false);
    }
  }, [supabase, user?.id, loadStatus]);

  // Initial load
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Listen for refresh events (e.g. returning from Stripe)
  useEffect(() => {
    const handleRefresh = () => {
      verifyWithStripe();
    };
    window.addEventListener(STRIPE_STATUS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(STRIPE_STATUS_REFRESH_EVENT, handleRefresh);
  }, [verifyWithStripe]);

  // Start Stripe hosted onboarding
  const startOnboarding = async (retryCount = 0) => {
    setLoading(true);
    setError('');

    try {
      const userId = user?.id;
      if (!userId) throw new Error('Not logged in. Please refresh and try again.');

      console.log('[StripeConnectOnboarding] Starting onboarding for:', userId);

      const { data, error: fnErr } = await supabase.functions.invoke('create-connect-account-link', {
        body: { userId, email, businessName }
      });

      if (fnErr) {
        console.error('[StripeConnectOnboarding] Function error:', fnErr);
        if (retryCount < 2 && (fnErr.message?.includes('Failed to send') || fnErr.message?.includes('FunctionsHttpError'))) {
          await new Promise(r => setTimeout(r, 1500));
          return startOnboarding(retryCount + 1);
        }
        throw new Error(fnErr.message || 'Unable to connect to payment service');
      }

      if (data?.error) throw new Error(data.error);
      if (!data?.success || !data?.onboardingUrl) throw new Error('Failed to generate onboarding link.');

      // Redirect to Stripe hosted onboarding
      window.location.href = data.onboardingUrl;
    } catch (err: any) {
      console.error('[StripeConnectOnboarding] Error:', err);
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  // Hide if dismissed or fully verified
  if (dismissed || account.verificationStatus === 'verified') return null;

  const statusConfig = {
    not_started: {
      badge: 'Not Started',
      badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
      icon: <AlertCircle className="h-6 w-6 text-red-400" />,
      title: 'Set Up Your Payout Account',
      description: 'Connect your bank account through Stripe to receive payouts for completed jobs.',
      buttonText: 'Complete Stripe Onboarding',
      buttonIcon: <ExternalLink className="mr-2 h-5 w-5" />,
    },
    pending_verification: {
      badge: 'Pending Verification',
      badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      icon: <Clock className="h-6 w-6 text-yellow-400" />,
      title: 'Verification In Progress',
      description: 'Stripe is reviewing your information. This typically takes 1-2 business days. You can check back or continue onboarding if needed.',
      buttonText: 'Continue Onboarding',
      buttonIcon: <ExternalLink className="mr-2 h-5 w-5" />,
    },
    verified: {
      badge: 'Verified',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
      title: 'Payout Account Verified',
      description: 'Your bank account is connected and ready to receive payouts.',
      buttonText: '',
      buttonIcon: null,
    },
  };

  const config = statusConfig[account.verificationStatus];

  return (
    <div className="relative bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-2 border-emerald-500/30 rounded-2xl p-6 shadow-lg">
      {/* Dismiss button */}
      <button onClick={() => setDismissed(true)} className="absolute top-4 right-4 text-emerald-300/60 hover:text-emerald-300">
        <X className="h-5 w-5" />
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        <div className="p-3 bg-emerald-500/20 rounded-xl">
          <Building2 className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-emerald-300">{config.title}</h3>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${config.badgeClass}`}>
              {config.badge}
            </span>
          </div>
          <p className="text-emerald-200/70 text-sm">{config.description}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status indicator */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-black/30 border border-emerald-500/15 mb-5">
        {config.icon}
        <div className="flex-1">
          <div className="text-sm font-medium text-emerald-200">Payout Status</div>
          <div className="text-xs text-emerald-300/60">
            {account.verificationStatus === 'not_started' && 'Bank account not connected — complete Stripe onboarding to receive payouts'}
            {account.verificationStatus === 'pending_verification' && 'Stripe is verifying your identity and bank account details'}
          </div>
        </div>
        {account.payoutsEnabled && (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {config.buttonText && (
          <Button
            onClick={() => startOnboarding()}
            disabled={loading || refreshing}
            className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold py-6 text-lg"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Redirecting to Stripe...</>
            ) : (
              <>{config.buttonIcon}{config.buttonText}</>
            )}
          </Button>
        )}

        {/* Refresh status — only show when pending */}
        {account.verificationStatus === 'pending_verification' && (
          <Button
            onClick={verifyWithStripe}
            disabled={refreshing}
            variant="outline"
            className="w-full border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
          >
            {refreshing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking Status...</>
            ) : (
              <><RefreshCw className="mr-2 h-4 w-4" />Refresh Verification Status</>
            )}
          </Button>
        )}
      </div>

      {/* Info footer */}
      <p className="text-center text-emerald-300/50 text-xs mt-4">
        Stripe Connect Express — your bank account details are handled securely by Stripe. No card required.
      </p>
    </div>
  );
}
