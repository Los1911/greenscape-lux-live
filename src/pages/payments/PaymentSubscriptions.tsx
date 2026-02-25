import React, { useState, useEffect } from 'react';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

import { supabase } from '@/lib/supabase';
import { Crown, Calendar, CreditCard, Check, Star, RefreshCw } from 'lucide-react';

interface Subscription {
  id: string;
  plan_name: string;
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: string;
  amount: number;
  interval: 'month' | 'year';
}

const PLANS = [
  { id: 'basic_monthly', name: 'Basic', amount: 999, interval: 'month', features: ['Up to 3 requests/month', 'Email support', 'Mobile access'] },
  { id: 'premium_monthly', name: 'Premium', amount: 2999, interval: 'month', popular: true, features: ['Unlimited requests', 'Priority support', 'Advanced scheduling'] }
];

export default function PaymentSubscriptions() {
  const { user, loading: authLoading } = useAuth();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const userId = user?.id;

  useEffect(() => {
    if (!authLoading && userId) fetchSubscription();
    else if (!authLoading && !userId) setLoading(false);
  }, [userId, authLoading]);

  const fetchSubscription = async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId).single();
      if (error && error.code !== 'PGRST116') throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!userId) { toast({ title: "Error", description: "Please sign in first", variant: "destructive" }); return; }
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', { body: { userId, planId } });
      if (error) throw error;
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch (error) {
      toast({ title: "Error", description: "Failed to create subscription", variant: "destructive" });
    }
  };

  // Auth loading guard - prevents white screen on refresh
  if (authLoading) {
    return (
      <PaymentLayout activeTab="subscriptions">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
        </div>
      </PaymentLayout>
    );
  }

  if (loading) {
    return (
      <PaymentLayout activeTab="subscriptions">
        <div className="animate-pulse"><div className="h-32 bg-slate-700 rounded-lg"></div></div>
      </PaymentLayout>
    );
  }

  return (
    <PaymentLayout activeTab="subscriptions">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Subscriptions</h2>
        {subscription ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Crown className="h-5 w-5 text-yellow-400" />Current Subscription</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div><h3 className="font-semibold text-lg text-white">{subscription.plan_name}</h3><p className="text-gray-300">${(subscription.amount / 100).toFixed(2)}/{subscription.interval}</p></div>
                <Badge className="bg-green-100 text-green-800">{subscription.status}</Badge>
              </div>
              <div className="flex items-center gap-2 text-gray-300"><Calendar className="h-4 w-4" />Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}</div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="border-slate-600 text-white"><CreditCard className="h-4 w-4 mr-2" />Manage Billing</Button>
                <Button variant="destructive">Cancel Subscription</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="text-center"><h2 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h2><p className="text-gray-400">Select the perfect plan for your needs</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PLANS.map((plan) => (
                <Card key={plan.id} className={`bg-slate-800 border-slate-700 relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                  {plan.popular && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2"><Badge className="bg-blue-500 text-white"><Star className="h-3 w-3 mr-1" />Popular</Badge></div>}
                  <CardHeader>
                    <CardTitle className="text-white">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold text-white">${(plan.amount / 100).toFixed(2)}<span className="text-lg font-normal text-gray-400">/{plan.interval}</span></div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">{plan.features.map((feature, index) => (<li key={index} className="flex items-center gap-2 text-gray-300"><Check className="h-4 w-4 text-green-400" />{feature}</li>))}</ul>
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleSubscribe(plan.id)}>Choose Plan</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </PaymentLayout>
  );
}
