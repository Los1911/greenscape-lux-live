import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  Zap, 
  Star,
  Check,
  AlertCircle,
  TrendingUp,
  Shield
} from 'lucide-react';

interface Subscription {
  id: string;
  plan_id: string;
  plan_name: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  amount: number;
  interval: 'month' | 'year';
  trial_end?: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  amount: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
}

interface SubscriptionBillingProps {
  userId: string;
  userRole: 'client' | 'landscaper';
}

const PLANS: Plan[] = [
  {
    id: 'basic_monthly',
    name: 'Basic',
    description: 'Perfect for individual homeowners',
    amount: 999, // $9.99
    interval: 'month',
    features: [
      'Up to 3 service requests per month',
      'Basic landscaper matching',
      'Email support',
      'Mobile app access'
    ]
  },
  {
    id: 'premium_monthly',
    name: 'Premium',
    description: 'Best for active property managers',
    amount: 2999, // $29.99
    interval: 'month',
    popular: true,
    features: [
      'Unlimited service requests',
      'Priority landscaper matching',
      'Phone & chat support',
      'Advanced scheduling',
      'Progress photo updates',
      'Custom service packages'
    ]
  },
  {
    id: 'pro_landscaper_monthly',
    name: 'Pro Landscaper',
    description: 'For professional landscaping businesses',
    amount: 4999, // $49.99
    interval: 'month',
    features: [
      'Unlimited job applications',
      'Premium profile placement',
      'Advanced analytics dashboard',
      'Customer management tools',
      'Automated invoicing',
      'Priority support'
    ]
  }
];

export default function SubscriptionBillingSystem({ userId, userRole }: SubscriptionBillingProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscription();
  }, [userId]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setProcessing(true);

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          userId,
          planId,
          userRole
        }
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }

      toast({
        title: "Success",
        description: "Redirecting to secure checkout..."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create subscription",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          subscriptionId: subscription?.id
        }
      });

      if (error) throw error;

      toast({
        title: "Subscription Canceled",
        description: "Your subscription will remain active until the end of the current billing period"
      });

      fetchSubscription();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive"
      });
    }
  };

  const handleUpdateBilling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
        body: { userId }
      });

      if (error) throw error;

      window.location.href = data.url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800' },
      trialing: { label: 'Trial', color: 'bg-blue-100 text-blue-800' },
      past_due: { label: 'Past Due', color: 'bg-red-100 text-red-800' },
      canceled: { label: 'Canceled', color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const PlanCard = ({ plan }: { plan: Plan }) => (
    <Card className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-500 text-white">
            <Star className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {plan.name}
          <Crown className="h-5 w-5 text-yellow-500" />
        </CardTitle>
        <div className="text-3xl font-bold">
          ${(plan.amount / 100).toFixed(2)}
          <span className="text-lg font-normal text-gray-500">/{plan.interval}</span>
        </div>
        <p className="text-gray-600">{plan.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        <Button 
          className="w-full" 
          variant={plan.popular ? "default" : "outline"}
          onClick={() => handleSubscribe(plan.id)}
          disabled={processing}
        >
          {processing ? 'Processing...' : 'Choose Plan'}
        </Button>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      {subscription ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{subscription.plan_name}</h3>
                <p className="text-gray-600">
                  ${(subscription.amount / 100).toFixed(2)}/{subscription.interval}
                </p>
              </div>
              {getStatusBadge(subscription.status)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
                </span>
              </div>
              {subscription.trial_end && (
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">
                    Trial ends: {new Date(subscription.trial_end).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleUpdateBilling}>
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Upgrade Your Plan</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    {PLANS.filter(plan => 
                      userRole === 'landscaper' ? 
                      plan.id.includes('landscaper') : 
                      !plan.id.includes('landscaper')
                    ).map((plan) => (
                      <PlanCard key={plan.id} plan={plan} />
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="destructive" 
                onClick={handleCancelSubscription}
              >
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* No Subscription - Show Plans */
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
            <p className="text-gray-600">
              Select the perfect plan for your {userRole === 'landscaper' ? 'business' : 'property'} needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.filter(plan => 
              userRole === 'landscaper' ? 
              plan.id.includes('landscaper') : 
              !plan.id.includes('landscaper')
            ).map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>

          {/* Security & Features */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Shield className="h-12 w-12 text-blue-600 mx-auto" />
                <h3 className="text-lg font-semibold">Secure & Reliable</h3>
                <p className="text-gray-600">
                  All plans include SSL encryption, 99.9% uptime guarantee, and 24/7 monitoring
                </p>
                <div className="flex justify-center gap-8 text-sm text-gray-500">
                  <span>✓ 30-day money-back guarantee</span>
                  <span>✓ Cancel anytime</span>
                  <span>✓ No setup fees</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}