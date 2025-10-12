import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  landscaperId: string;
  email: string;
  businessName?: string;
  onComplete?: () => void;
}

export function StripeConnectOnboarding({ landscaperId, email, businessName, onComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startOnboarding = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error: fnError } = await supabase.functions.invoke('create-stripe-connect-account', {
        body: { email, businessName, userId: userData?.user?.id }
      });

      if (fnError || !data?.success) {
        throw new Error(data?.error || 'Failed to create Connect account');
      }

      // Store Connect account ID
      await supabase
        .from('landscapers')
        .update({ 
          stripe_connect_id: data.accountId,
          connect_account_status: 'pending'
        })
        .eq('id', landscaperId);

      // Redirect to Stripe onboarding
      window.location.href = data.onboardingUrl;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Payment Setup</h3>
      <p className="text-gray-600 mb-6">
        Connect your bank account to receive payments for completed jobs.
      </p>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button onClick={startOnboarding} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Setting up...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Connect Bank Account
          </>
        )}
      </Button>
    </Card>
  );
}
