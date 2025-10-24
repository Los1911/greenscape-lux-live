import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, Pause, Play, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Subscription {
  id: string;
  stripe_subscription_id: string;
  status: string;
  service_type: string;
  amount: number;
  currency: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export const SubscriptionManager: React.FC = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptions();
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const pauseSubscription = async (subscriptionId: string) => {
    try {
      // This would call a Stripe function to pause the subscription
      console.log('Pausing subscription:', subscriptionId);
      // Refresh subscriptions after action
      await fetchSubscriptions();
    } catch (error) {
      console.error('Error pausing subscription:', error);
    }
  };

  const resumeSubscription = async (subscriptionId: string) => {
    try {
      // This would call a Stripe function to resume the subscription
      console.log('Resuming subscription:', subscriptionId);
      await fetchSubscriptions();
    } catch (error) {
      console.error('Error resuming subscription:', error);
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      // This would call a Stripe function to cancel the subscription
      console.log('Canceling subscription:', subscriptionId);
      await fetchSubscriptions();
    } catch (error) {
      console.error('Error canceling subscription:', error);
    }
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Badge variant="destructive">Canceling</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return <div className="text-center py-8">Loading subscriptions...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Subscription Management</h2>
        <p className="text-muted-foreground">
          Manage your recurring landscaping services
        </p>
      </div>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Active Subscriptions</h3>
            <p className="text-muted-foreground mb-4">
              You don't have any recurring services set up yet.
            </p>
            <Button>Set Up Monthly Service</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {subscription.service_type} Service
                      {getStatusBadge(subscription.status, subscription.cancel_at_period_end)}
                    </CardTitle>
                    <CardDescription>
                      {formatAmount(subscription.amount, subscription.currency)} per month
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => pauseSubscription(subscription.stripe_subscription_id)}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelSubscription(subscription.stripe_subscription_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {subscription.status === 'paused' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resumeSubscription(subscription.stripe_subscription_id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};