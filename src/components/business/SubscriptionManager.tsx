import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Check, Crown, Zap, Star } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_type: string;
  monthly_price: number;
  annual_price: number;
  features: { features: string[] };
  max_jobs_per_month: number | null;
  priority_support: boolean;
}

export const SubscriptionManager: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    loadPlans();
    loadCurrentSubscription();
  }, []);

  const loadPlans = async () => {
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('monthly_price');
    
    if (data) setPlans(data);
  };

  const loadCurrentSubscription = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data } = await supabase
      .from('user_subscriptions')
      .select('plan_id, subscription_plans(plan_name)')
      .eq('user_id', user.user.id)
      .eq('status', 'active')
      .single();

    if (data) {
      setCurrentPlan(data.plan_id);
    }
  };

  const subscribeToPlan = async (planId: string) => {
    // In a real app, this would integrate with Stripe
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { error } = await supabase
      .from('user_subscriptions')
      .upsert([{
        user_id: user.user.id,
        plan_id: planId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }]);

    if (!error) {
      setCurrentPlan(planId);
      alert('Subscription updated successfully!');
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'basic': return <Zap className="h-6 w-6 text-blue-600" />;
      case 'premium': return <Crown className="h-6 w-6 text-purple-600" />;
      case 'enterprise': return <Star className="h-6 w-6 text-yellow-600" />;
      default: return <Zap className="h-6 w-6" />;
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    return billingCycle === 'monthly' ? plan.monthly_price : plan.annual_price;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-gray-600 mt-2">Upgrade your landscaping business with premium features</p>
        
        <div className="flex justify-center mt-4">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded ${billingCycle === 'monthly' ? 'bg-white shadow' : ''}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded ${billingCycle === 'annual' ? 'bg-white shadow' : ''}`}
            >
              Annual (Save 20%)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${currentPlan === plan.id ? 'ring-2 ring-blue-500' : ''}`}>
            {plan.plan_type === 'premium' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600">Most Popular</Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                {getPlanIcon(plan.plan_type)}
              </div>
              <CardTitle className="text-xl">{plan.plan_name}</CardTitle>
              <div className="text-3xl font-bold">
                ${getPrice(plan)}
                <span className="text-sm font-normal text-gray-600">
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                onClick={() => subscribeToPlan(plan.id)}
                className="w-full"
                variant={currentPlan === plan.id ? 'secondary' : 'default'}
                disabled={currentPlan === plan.id}
              >
                {currentPlan === plan.id ? 'Current Plan' : 'Subscribe'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {plans.find(p => p.id === currentPlan)?.plan_name}
                </p>
                <p className="text-sm text-gray-600">Active subscription</p>
              </div>
              <Button variant="outline">Manage Subscription</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};