import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseClient } from '@/lib/ConfigContext';
import { CheckCircle2, AlertCircle, Loader2, XCircle, CreditCard, FileText, Building2, X } from 'lucide-react';

interface Props {
  landscaperId: string;
  email: string;
  businessName?: string;
}

type OnboardingStep = {
  id: string;
  label: string;
  icon: any;
  completed: boolean;
};

export function StripeConnectOnboardingCard({ landscaperId, email, businessName }: Props) {
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [accountStatus, setAccountStatus] = useState<any>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    { id: 'identity', label: 'Identity Verification', icon: FileText, completed: false },
    { id: 'bank', label: 'Bank Account', icon: Building2, completed: false },
    { id: 'tax', label: 'Tax Information', icon: CreditCard, completed: false }
  ]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [landscaperId]);

  const checkOnboardingStatus = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_connect_id, stripe_account_status')
        .eq('id', landscaperId)
        .single();

      if (profile?.stripe_connect_id) {
        setAccountStatus({
          accountId: profile.stripe_connect_id,
          status: profile.stripe_account_status || 'pending',
          payoutsEnabled: profile.stripe_account_status === 'active',
          detailsSubmitted: profile.stripe_account_status !== 'pending'
        });

        const isComplete = profile.stripe_account_status === 'active';
        setSteps([
          { id: 'identity', label: 'Identity Verification', icon: FileText, completed: isComplete },
          { id: 'bank', label: 'Bank Account', icon: Building2, completed: isComplete },
          { id: 'tax', label: 'Tax Information', icon: CreditCard, completed: isComplete }
        ]);
      }
    } catch (err) {
      console.error('Error checking status:', err);
    }
  };

  const startOnboarding = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-stripe-connect-account', {
        body: { email, businessName, userId: landscaperId }
      });

      if (fnError || !data?.success) {
        throw new Error(data?.error || 'Failed to create Connect account');
      }

      await supabase
        .from('profiles')
        .update({ 
          stripe_connect_id: data.accountId,
          stripe_account_status: 'pending'
        })
        .eq('id', landscaperId);

      window.location.href = data.onboardingUrl;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (dismissed || accountStatus?.payoutsEnabled) return null;

  const progress = steps.filter(s => s.completed).length;
  const progressPercent = (progress / steps.length) * 100;

  return (
    <div className="relative bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-2 border-emerald-500/30 rounded-2xl p-6 shadow-lg">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-emerald-300/60 hover:text-emerald-300 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-emerald-500/20 rounded-xl">
          <CreditCard className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-emerald-300 mb-2">Complete Your Payment Setup</h3>
          <p className="text-emerald-200/70 text-sm">
            Connect your bank account to receive payments for completed jobs securely through Stripe.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-emerald-300 font-medium">Setup Progress</span>
          <span className="text-emerald-400 font-semibold">{progress}/{steps.length} Complete</span>
        </div>
        
        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="space-y-3 mt-4">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
              <step.icon className={`h-5 w-5 ${step.completed ? 'text-emerald-400' : 'text-emerald-300/50'}`} />
              <span className={`flex-1 text-sm ${step.completed ? 'text-emerald-300' : 'text-emerald-300/70'}`}>
                {step.label}
              </span>
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-emerald-300/30" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-black/40 rounded-xl mb-4">
        <div className={`h-3 w-3 rounded-full ${accountStatus?.payoutsEnabled ? 'bg-emerald-400' : 'bg-yellow-400'} animate-pulse`} />
        <div className="flex-1">
          <div className="text-sm font-medium text-emerald-300">Payout Status</div>
          <div className="text-xs text-emerald-300/70">
            {accountStatus?.payoutsEnabled ? 'Ready to receive payments' : 'Setup required to receive payments'}
          </div>
        </div>
      </div>

      <Button 
        onClick={startOnboarding} 
        disabled={loading}
        className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold py-6 text-lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Setting up...
          </>
        ) : accountStatus?.accountId ? (
          <>
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Continue Setup
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            Start Stripe Connect Setup
          </>
        )}
      </Button>
    </div>
  );
}
