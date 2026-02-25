import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/lib/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

interface StripePaymentSetupProps {
  userId: string;
  onConnected: (accountId: string) => void;
  alreadyConnected: boolean;
}

export function StripePaymentSetup({ userId, onConnected, alreadyConnected }: StripePaymentSetupProps) {
  const supabase = useSupabaseClient();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(alreadyConnected);
  const [landscaperData, setLandscaperData] = useState<{ email: string; businessName: string } | null>(null);

  useEffect(() => {
    const fetchLandscaperData = async () => {
      try {
        const { data, error } = await supabase
          .from('landscapers')
          .select('business_name')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('[StripePayoutSetup] Error fetching landscaper data:', error);
        }

        setLandscaperData({
          email: user?.email || '',
          businessName: data?.business_name || ''
        });
      } catch (err) {
        console.error('[StripePayoutSetup] Error:', err);
        if (user?.email) {
          setLandscaperData({ email: user.email, businessName: '' });
        }
      }
    };

    fetchLandscaperData();
  }, [supabase, userId, user]);

  const handleStripeOnboarding = async (retryCount = 0) => {
    setLoading(true);
    setMessage('');

    try {
      console.log('[StripePayoutSetup] Starting Stripe Connect onboarding for:', userId);

      const { data, error } = await supabase.functions.invoke('create-connect-account-link', {
        body: {
          userId,
          email: landscaperData?.email || user?.email || '',
          businessName: landscaperData?.businessName || ''
        }
      });

      console.log('[StripePayoutSetup] Response:', { data, error });

      if (error) {
        console.error('[StripePayoutSetup] Function error:', error);
        if (retryCount < 2 && (error.message?.includes('Failed to send') || error.message?.includes('FunctionsHttpError'))) {
          console.log('[StripePayoutSetup] Retrying... attempt', retryCount + 1);
          await new Promise(resolve => setTimeout(resolve, 1500));
          return handleStripeOnboarding(retryCount + 1);
        }
        throw error;
      }

      if (data?.error) throw new Error(data.error);

      if (data?.onboardingUrl) {
        // Redirect to Stripe hosted onboarding
        window.location.href = data.onboardingUrl;
      } else if (data?.accountId) {
        setIsSuccess(true);
        setMessage('Stripe Connect account created. Complete onboarding to enable payouts.');
        onConnected(data.accountId);
      } else {
        throw new Error('No onboarding URL received from Stripe.');
      }
    } catch (err: any) {
      setIsSuccess(false);
      setMessage(err.message || 'Stripe onboarding failed. Please try again.');
      console.error('[StripePayoutSetup] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
        <div className="text-emerald-400 text-lg font-semibold">Stripe Connect account linked</div>
        <p className="text-emerald-200/60">Your bank account will be set up through Stripe's secure onboarding.</p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-emerald-500/20 rounded-full">
            <Building2 className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-emerald-300">Payout Account Setup</h3>
        <p className="text-emerald-200/60">
          Connect your bank account through Stripe to receive payouts for completed jobs.
          No credit card required.
        </p>
      </div>

      <Button
        onClick={() => handleStripeOnboarding()}
        disabled={loading}
        className="bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.5)] hover:shadow-[0_0_35px_rgba(52,211,153,0.7)] px-8 py-6 text-lg font-semibold"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Redirecting to Stripe...
          </>
        ) : (
          <>
            <ExternalLink className="mr-2 h-5 w-5" />
            Complete Stripe Onboarding
          </>
        )}
      </Button>

      <p className="text-emerald-200/40 text-sm">
        You'll be redirected to Stripe's secure hosted onboarding to provide your bank account and identity details.
      </p>

      {message && (
        <div className={`flex items-center justify-center gap-2 text-sm p-3 rounded-lg ${
          isSuccess
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {!isSuccess && <AlertCircle className="w-4 h-4" />}
          {message}
        </div>
      )}
    </div>
  );
}
