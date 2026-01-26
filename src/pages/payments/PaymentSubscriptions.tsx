import React, { useEffect, useState } from 'react';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Crown,
  Calendar,
  CreditCard,
  Check,
  Star,
  Loader2
} from 'lucide-react';

interface Subscription {
  id: string;
  plan_name: string;
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: string;
  price: number;
  interval: 'month' | 'year';
}

export default function PaymentSubscriptions() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initUser();
  }, []);

  const initUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;

    setUserId(data.user.id);
    fetchSubscriptions(data.user.id);
  };

  const fetchSubscriptions = async (uid: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load subscriptions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PaymentLayout activeTab="subscriptions">
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
      </PaymentLayout>
    );
  }

  return (
    <PaymentLayout activeTab="subscriptions">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Crown className="h-6 w-6 text-yellow-400" />
          Subscriptions
        </h2>

        {subscriptions.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-10 text-center text-gray-400">
              No active subscriptions
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {subscriptions.map(sub => (
              <Card key={sub.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-white">
                    <span className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-400" />
                      {sub.plan_name}
                    </span>
                    <Badge
                      className={
                        sub.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : sub.status === 'past_due'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {sub.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-300">
                    <CreditCard className="h-4 w-4" />
                    ${(sub.price / 100).toFixed(2)} / {sub.interval}
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="h-4 w-4" />
                    Renews on{' '}
                    {new Date(sub.current_period_end).toLocaleDateString()}
                  </div>

                  {sub.status === 'active' && (
                    <Button variant="outline" className="mt-4">
                      <Check className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PaymentLayout>
  );
}
