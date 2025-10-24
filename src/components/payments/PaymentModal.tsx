import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StripeProvider } from './StripeProvider';
import { PaymentForm } from './PaymentForm';
import { useStripePayment } from '@/hooks/useStripePayment';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  title?: string;
  description?: string;
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: string) => void;
  metadata?: Record<string, string>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  title = 'Complete Payment',
  description,
  onSuccess,
  onError,
  metadata,
}) => {
  const {
    loading,
    clientSecret,
    createPaymentIntent,
    handlePaymentSuccess,
    handlePaymentError,
  } = useStripePayment({
    onSuccess: (paymentIntent) => {
      onSuccess?.(paymentIntent);
      onClose();
    },
    onError,
  });

  const handleInitiatePayment = async () => {
    try {
      await createPaymentIntent(amount, metadata);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </DialogHeader>

        {!clientSecret ? (
          <div className="flex flex-col items-center space-y-4 py-6">
            <p className="text-center text-muted-foreground">
              Ready to process payment of ${amount.toFixed(2)}
            </p>
            <Button
              onClick={handleInitiatePayment}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up payment...
                </>
              ) : (
                'Continue to Payment'
              )}
            </Button>
          </div>
        ) : (
          <StripeProvider clientSecret={clientSecret}>
            <PaymentForm
              amount={amount * 100} // Convert to cents
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              loading={loading}
            />
          </StripeProvider>
        )}
      </DialogContent>
    </Dialog>
  );
};