import React, { useState } from 'react';
import { SubscriptionManager } from '@/components/payments/SubscriptionManager';
import { SubscriptionPlans } from '@/components/payments/SubscriptionPlans';
// import { SubscriptionCheckout } from '@/components/payments/SubscriptionCheckout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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

type ViewMode = 'dashboard' | 'plans' | 'checkout';

const SubscriptionDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setCurrentView('checkout');
  };

  const handleCheckoutSuccess = () => {
    setCurrentView('dashboard');
    setSelectedPlan(null);
  };

  const handleCheckoutCancel = () => {
    setCurrentView('plans');
    setSelectedPlan(null);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedPlan(null);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'plans':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToDashboard}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <SubscriptionPlans onSelectPlan={handleSelectPlan} />
          </div>
        );

      case 'checkout':
        return selectedPlan ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentView('plans')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Plans
              </Button>
            </div>
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Subscription Plans Available</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Subscription checkout functionality will be available soon.</p>
                <Button onClick={handleCheckoutCancel} className="mt-4">
                  Go Back
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null;

      default:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Subscription Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage your recurring landscaping services
                </p>
              </div>
              <Button onClick={() => setCurrentView('plans')}>
                Add New Service
              </Button>
            </div>
            <SubscriptionManager />
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {renderContent()}
    </div>
  );
};

export default SubscriptionDashboard;