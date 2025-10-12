import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { subscribeToConnectNotifications } from '@/utils/stripeConnectNotifications';
import { CheckCircle2, AlertCircle, Clock, ExternalLink, RefreshCw, Mail } from 'lucide-react';


interface ConnectStatus {
  stripe_connect_id: string | null;
  stripe_account_status: string;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_details_submitted: boolean;
}

export function ConnectAccountStatus({ landscaperId }: { landscaperId: string }) {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStatus();
    
    // Set up real-time subscription for status updates
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
        (payload) => {
          console.log('Connect status updated:', payload);
          loadStatus();
        }
      )
      .subscribe();

    // Subscribe to notification queue to trigger email processing
    const notificationChannel = subscribeToConnectNotifications((payload) => {
      console.log('Notification queued, email will be sent:', payload);
    });

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(notificationChannel);
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

  const openDashboard = () => {
    window.open('https://dashboard.stripe.com/express', '_blank');
  };

  if (loading) return <div>Loading...</div>;
  if (!status?.stripe_connect_id) return null;

  const isActive = status.stripe_charges_enabled && status.stripe_payouts_enabled;
  const isPending = status.stripe_details_submitted && !isActive;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Payment Account Status</h3>
        <div className="flex items-center gap-2">
          <Badge variant={isActive ? 'default' : isPending ? 'secondary' : 'outline'}>
            {isActive ? 'Active' : isPending ? 'Under Review' : 'Setup Required'}
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

      <div className="space-y-3 mb-4">
        <StatusItem 
          label="Charges Enabled" 
          enabled={status.stripe_charges_enabled}
          description="Can accept payments from clients"
        />
        <StatusItem 
          label="Payouts Enabled" 
          enabled={status.stripe_payouts_enabled}
          description="Can receive payouts to bank account"
        />
        <StatusItem 
          label="Details Submitted" 
          enabled={status.stripe_details_submitted}
          description="Identity and business info verified"
        />
      </div>

      {!isActive && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              {!status.stripe_details_submitted 
                ? 'Complete your account setup to start receiving payments. You\'ll receive email updates on your progress.'
                : 'Your account is under review. This typically takes 1-2 business days. We\'ll email you when it\'s ready.'}
            </p>
          </div>
        </div>
      )}

      <Button onClick={openDashboard} variant="outline" className="w-full">
        <ExternalLink className="mr-2 h-4 w-4" />
        Open Stripe Dashboard
      </Button>
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

