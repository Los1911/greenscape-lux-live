import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Shield, AlertCircle } from 'lucide-react';
import ServiceTypeSelector, { ServiceType } from './ServiceTypeSelector';
import StripeElementsForm from './StripeElementsForm';

interface EnhancedPaymentFormProps {
  jobId?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  defaultServiceTypes?: ServiceType[];
}

const DEFAULT_SERVICE_TYPES: ServiceType[] = [
  {
    id: 'one-time',
    title: 'One-Time Service',
    description: 'Perfect for seasonal cleanups, special projects, or one-off maintenance needs.',
    price: 299,
    features: [
      'Complete property assessment',
      'Full service execution',
      'Before & after photos',
      '30-day satisfaction guarantee',
      'No recurring commitment'
    ],
    badge: 'Pay Once'
  },
  {
    id: 'monthly',
    title: 'Monthly Recurring Service',
    description: 'Ongoing maintenance to keep your property looking pristine year-round.',
    price: 199,
    originalPrice: 299,
    features: [
      'Monthly maintenance visits',
      'Seasonal service adjustments',
      'Priority scheduling',
      'Discounted additional services',
      'Cancel anytime'
    ],
    badge: 'Save 33%',
    popular: true
  }
];

export default function EnhancedPaymentForm({ 
  jobId, 
  onSuccess, 
  onError, 
  onClose,
  defaultServiceTypes = DEFAULT_SERVICE_TYPES
}: EnhancedPaymentFormProps) {
  const [selectedServiceType, setSelectedServiceType] = useState<'one-time' | 'monthly' | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleServiceTypeSelect = (type: 'one-time' | 'monthly') => {
    setSelectedServiceType(type);
  };

  const handleContinueToPayment = () => {
    if (!selectedServiceType) return;
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (result: any) => {
    // Pass the service type along with the payment result
    const enhancedResult = {
      ...result,
      serviceType: selectedServiceType,
      isRecurring: selectedServiceType === 'monthly'
    };
    onSuccess?.(enhancedResult);
  };

  const getSelectedService = () => {
    return defaultServiceTypes.find(service => service.id === selectedServiceType);
  };

  // Show payment form if service type is selected
  if (showPaymentForm && selectedServiceType) {
    const selectedService = getSelectedService();
    if (!selectedService) return null;

    return (
      <div className="space-y-4">
        {/* Selected Service Summary */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-green-800">
                  {selectedService.title}
                </h4>
                <p className="text-sm text-green-600">
                  ${selectedService.price}{selectedServiceType === 'monthly' ? '/month' : ' one-time'}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPaymentForm(false)}
                className="text-green-600 border-green-300"
              >
                Change Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <StripeElementsForm
          amount={selectedService.price}
          jobId={jobId}
          mode="payment"
          onSuccess={handlePaymentSuccess}
          onError={onError}
          onClose={onClose}
        />
      </div>
    );
  }


  // Show service type selection
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Choose Your Service & Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Payment processing is not configured. Please contact support.
            </AlertDescription>
          </Alert>
        )}

        <ServiceTypeSelector
          selectedType={selectedServiceType}
          onSelect={handleServiceTypeSelect}
          serviceTypes={defaultServiceTypes}
          className="mb-6"
        />

        <div className="flex gap-3">
          {onClose && (
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          
          <Button 
            onClick={handleContinueToPayment}
            disabled={!selectedServiceType || loading || !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Continue to Payment`
            )}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
          <Shield className="h-3 w-3" />
          Secured by Stripe • SSL Encrypted • Cancel Anytime
        </div>
      </CardContent>
    </Card>
  );
}