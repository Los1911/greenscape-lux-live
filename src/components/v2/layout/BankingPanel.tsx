import GlowCard from "@/components/v2/GlowCard";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseClient } from "@/lib/ConfigContext";
import { Building2, AlertCircle, CheckCircle, DollarSign, Loader2, ExternalLink } from "lucide-react";
import { STRIPE_STATUS_REFRESH_EVENT } from "@/pages/LandscaperDashboardV2";

type BankingStatus = {
  stripe_connect_id: string | null;
  stripe_onboarding_complete: boolean;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
};

export default function BankingPanel() {
  const [bankingStatus, setBankingStatus] = useState<BankingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const supabase = useSupabaseClient();

  const fetchBankingStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('landscapers')
        .select('stripe_connect_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setBankingStatus(data);
    } catch (error) {
      console.error('Error fetching banking status:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchBankingStatus();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('banking_success') === 'true') {
      handleBankingReturn();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchBankingStatus]);

  useEffect(() => {
    const handleRefresh = () => {
      console.log('[BankingPanel] Received refresh event');
      fetchBankingStatus();
    };
    window.addEventListener(STRIPE_STATUS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(STRIPE_STATUS_REFRESH_EVENT, handleRefresh);
  }, [fetchBankingStatus]);

  const handleBankingReturn = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchBankingStatus();
      toast({
        title: "Payout Setup Updated",
        description: "Your banking information has been processed. Status will update shortly.",
      });
    } catch (error) {
      console.error('Error handling banking return:', error);
    }
  };

  const handleSetupBanking = async (retryCount = 0) => {
    setActionLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshedSession) {
          toast({ title: "Session Expired", description: "Please log in again.", variant: "destructive" });
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Not Logged In", description: "Please log in to set up payouts.", variant: "destructive" });
        return;
      }

      console.log('[BankingPanel] Invoking create-connect-account-link for user:', user.id);

      const { data, error } = await supabase.functions.invoke('create-connect-account-link', {
        body: { userId: user.id, email: user.email || '' }
      });

      console.log('[BankingPanel] Response:', { data, error });

      if (error) {
        console.error('[BankingPanel] Function error:', error);
        if (retryCount < 2 && (error.message?.includes('Failed to send') || error.message?.includes('FunctionsHttpError'))) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          return handleSetupBanking(retryCount + 1);
        }
        throw new Error(error.message || 'Unable to connect to payment service');
      }

      if (data?.error) throw new Error(data.error);

      if (data?.onboardingUrl) {
        console.log('[BankingPanel] Redirecting to Stripe onboarding...');
        localStorage.setItem('banking_return_url', window.location.href);
        window.location.href = data.onboardingUrl;
      } else {
        throw new Error('No onboarding URL received. Please try again.');
      }
    } catch (error: any) {
      console.error('[BankingPanel] Error:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Unable to start payout setup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!bankingStatus?.stripe_connect_id) {
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
    if (bankingStatus.stripe_onboarding_complete && bankingStatus.stripe_payouts_enabled) {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
    return <AlertCircle className="w-5 h-5 text-yellow-400" />;
  };

  const getStatusText = () => {
    if (!bankingStatus?.stripe_connect_id) return "Not Started";
    if (bankingStatus.stripe_onboarding_complete && bankingStatus.stripe_payouts_enabled) return "Verified";
    return "Pending Verification";
  };

  if (loading) {
    return (
      <GlowCard title="Payout Account" icon={<Building2 className="w-5 h-5" />}>
        <div className="text-center py-4 text-emerald-300/70">Loading...</div>
      </GlowCard>
    );
  }

  return (
    <GlowCard title="Payout Account" icon={<Building2 className="w-5 h-5" />}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-emerald-500/20">
          {getStatusIcon()}
          <div>
            <div className="font-medium text-emerald-200">{getStatusText()}</div>
            <div className="text-xs text-emerald-300/70">
              {bankingStatus?.stripe_payouts_enabled
                ? 'Bank account connected — ready for payouts'
                : 'Complete Stripe onboarding to receive payouts'}
            </div>
          </div>
        </div>

        {!bankingStatus?.stripe_connect_id ? (
          <button
            onClick={() => handleSetupBanking()}
            disabled={actionLoading}
            className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 text-black py-3 px-6 font-semibold transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Stripe...</>
            ) : (
              <><ExternalLink className="w-4 h-4" /> Complete Stripe Onboarding</>
            )}
          </button>
        ) : !bankingStatus.stripe_onboarding_complete ? (
          <button
            onClick={() => handleSetupBanking()}
            disabled={actionLoading}
            className="w-full rounded-full border border-yellow-500/50 text-yellow-200 hover:border-yellow-500/70 py-3 px-6 font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            {actionLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
            ) : (
              <><ExternalLink className="w-4 h-4" /> Continue Onboarding</>
            )}
          </button>
        ) : (
          <div className="space-y-2">
            <button className="w-full rounded-full border border-emerald-500/30 hover:border-emerald-500/50 py-2 px-4 text-emerald-200 hover:text-emerald-100 transition-all duration-200 text-sm flex items-center justify-center gap-2">
              <DollarSign className="w-4 h-4" />
              View Payouts
            </button>
            <button
              onClick={() => window.open('https://dashboard.stripe.com/express', '_blank')}
              className="w-full rounded-full border border-emerald-500/30 hover:border-emerald-500/50 py-2 px-4 text-emerald-200 hover:text-emerald-100 transition-all duration-200 text-sm flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Stripe Dashboard
            </button>
          </div>
        )}
      </div>
    </GlowCard>
  );
}
