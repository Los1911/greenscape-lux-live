import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  popular?: boolean;
  stripePriceId: string;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic Care',
    description: 'Essential lawn maintenance',
    price: 99,
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_basic_monthly',
    features: [
      'Weekly lawn mowing',
      'Edge trimming',
      'Basic cleanup',
      'Email updates'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Service',
    description: 'Complete landscaping care',
    price: 199,
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_premium_monthly',
    popular: true,
    features: [
      'Everything in Basic',
      'Bi-weekly deep maintenance',
      'Seasonal plantings',
      'Fertilization program',
      'Priority scheduling',
      'Photo progress reports'
    ]
  },
  {
    id: 'luxury',
    name: 'Luxury Estate',
    description: 'Full-service luxury care',
    price: 399,
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_luxury_monthly',
    features: [
      'Everything in Premium',
      'Weekly detailed service',
      'Custom landscape design',
      'Irrigation management',
      'Pest control program',
      '24/7 emergency support',
      'Dedicated account manager'
    ]
  }
];

interface SubscriptionPlansProps {
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onSelectPlan }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!user) return;
    
    setLoading(plan.id);
    try {
      onSelectPlan(plan);
    } catch (error) {
      console.error('Error selecting plan:', error);
    } finally {
      setLoading(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Select the perfect landscaping service for your property
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">
                  {formatPrice(plan.price, plan.currency)}
                </span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full" 
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handleSelectPlan(plan)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? 'Processing...' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>All plans include a 30-day satisfaction guarantee</p>
        <p>Cancel or modify your subscription anytime</p>
      </div>
    </div>
  );
};