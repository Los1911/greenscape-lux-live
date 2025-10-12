import GlowCard from "@/components/v2/GlowCard";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseClient } from "@/lib/ConfigContext";
import { CreditCard, AlertCircle, CheckCircle, DollarSign } from "lucide-react";

type BankingStatus = {
  stripe_account_id: string | null;
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

  useEffect(() => {
    fetchBankingStatus();
    
    // Check for banking return parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('banking_success') === 'true') {
      // Handle successful banking setup return
      handleBankingReturn();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleBankingReturn = async () => {
    try {
      // Refresh banking status after return from Stripe
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait a bit for Stripe webhook
      await fetchBankingStatus();
      
      toast({
        title: "Banking Setup Updated",
        description: "Your banking information has been processed. Status will update shortly.",
      });
    } catch (error) {
      console.error('Error handling banking return:', error);
    }
  };

  const fetchBankingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('landscapers')
        .select('stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setBankingStatus(data);
    } catch (error) {
      console.error('Error fetching banking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupBanking = async () => {
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('create-stripe-connect-account', {
        body: {
          userId: user.id,
          email: user.email
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        // Store the current URL for return navigation
        localStorage.setItem('banking_return_url', window.location.href);
        window.location.href = data.url;
      } else {
        throw new Error('No onboarding URL received');
      }
    } catch (error: any) {
      console.error('Error setting up banking:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Unable to start banking setup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!bankingStatus?.stripe_account_id) {
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
    if (bankingStatus.stripe_onboarding_complete && bankingStatus.stripe_payouts_enabled) {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
    return <AlertCircle className="w-5 h-5 text-yellow-400" />;
  };

  const getStatusText = () => {
    if (!bankingStatus?.stripe_account_id) {
      return "Banking Not Set Up";
    }
    if (bankingStatus.stripe_onboarding_complete && bankingStatus.stripe_payouts_enabled) {
      return "Banking Active";
    }
    return "Setup In Progress";
  };

  if (loading) {
    return (
      <GlowCard title="Banking Setup" icon={<CreditCard className="w-5 h-5" />}>
        <div className="text-center py-4 text-emerald-300/70">Loading...</div>
      </GlowCard>
    );
  }

  return (
    <GlowCard title="Banking Setup" icon={<CreditCard className="w-5 h-5" />}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-emerald-500/20">
          {getStatusIcon()}
          <div>
            <div className="font-medium text-emerald-200">{getStatusText()}</div>
            <div className="text-xs text-emerald-300/70">
              {bankingStatus?.stripe_payouts_enabled ? 'Ready for payouts' : 'Complete setup to receive payments'}
            </div>
          </div>
        </div>

        {!bankingStatus?.stripe_account_id ? (
          <button 
            onClick={handleSetupBanking}
            disabled={actionLoading}
            className="w-full rounded-full bg-emerald-500 hover:bg-emerald-400 text-black py-3 px-6 font-semibold transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50">
            {actionLoading ? 'Setting up...' : 'Complete Banking Setup'}
          </button>
        ) : !bankingStatus.stripe_onboarding_complete ? (
          <button 
            onClick={handleSetupBanking}
            disabled={actionLoading}
            className="w-full rounded-full border border-yellow-500/50 text-yellow-200 hover:border-yellow-500/70 py-3 px-6 font-semibold transition-all duration-200">
            {actionLoading ? 'Loading...' : 'Continue Setup'}
          </button>
        ) : (
          <div className="space-y-2">
            <button className="w-full rounded-full border border-emerald-500/30 hover:border-emerald-500/50 py-2 px-4 text-emerald-200 hover:text-emerald-100 transition-all duration-200 text-sm">
              <DollarSign className="w-4 h-4 inline mr-2" />
              View Payouts
            </button>
            <button className="w-full rounded-full border border-emerald-500/30 hover:border-emerald-500/50 py-2 px-4 text-emerald-200 hover:text-emerald-100 transition-all duration-200 text-sm">
              Manage Banking
            </button>
          </div>
        )}
      </div>
    </GlowCard>
  );
}