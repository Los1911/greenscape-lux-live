import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PaymentModal } from './PaymentModal';
import { PaymentSuccess } from './PaymentSuccess';
import { validateStripeConfig } from '@/lib/stripe';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const StripeTestCard: React.FC = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastPayment, setLastPayment] = useState<any>(null);
  const [testAmount] = useState(29.99);

  const isConfigured = validateStripeConfig();

  const handlePaymentSuccess = (paymentIntent: any) => {
    setLastPayment(paymentIntent);
    setShowSuccess(true);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  if (showSuccess && lastPayment) {
    return (
      <div className="space-y-4">
        <PaymentSuccess
          paymentIntent={lastPayment}
          onContinue={() => {
            setShowSuccess(false);
            setLastPayment(null);
          }}
          showDownloadReceipt={false}
        />
      </div>
    );
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Payment Test
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConfigured ? 'default' : 'destructive'}>
              {isConfigured ? 'Configured' : 'Not Configured'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConfigured && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Stripe is not properly configured. Please check your environment variables.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Test payment processing with Stripe Elements
            </p>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Test Amount:</span>
                <span className="font-bold">${testAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowPaymentModal(true)}
            disabled={!isConfigured}
            className="w-full"
          >
            {isConfigured ? 'Test Payment' : 'Configure Stripe First'}
          </Button>

          {isConfigured && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Test Card:</strong> 4242 4242 4242 4242</p>
              <p><strong>Expiry:</strong> Any future date</p>
              <p><strong>CVC:</strong> Any 3 digits</p>
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={testAmount}
        title="Test Payment"
        description="This is a test payment using Stripe"
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        metadata={{
          test: 'true',
          source: 'stripe-test-card',
        }}
      />
    </>
  );
};