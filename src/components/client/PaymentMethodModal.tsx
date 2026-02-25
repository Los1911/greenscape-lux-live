import React, { useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { StripePaymentMethodManager } from './StripePaymentMethodManager';
import { CreditCard } from 'lucide-react';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();

  // Listen for payment method added events
  const handlePaymentMethodAdded = useCallback(() => {
    console.log('[PAYMENT_MODAL] Payment method added event received');
    toast({
      title: "Payment method saved",
      description: "Your payment information has been saved successfully.",
    });
    onSuccess?.();
    // Don't close immediately - let user see their saved card
  }, [toast, onSuccess]);

  useEffect(() => {
    if (isOpen) {
      // Listen for payment method added events while modal is open
      window.addEventListener('paymentMethodAdded', handlePaymentMethodAdded);
      return () => {
        window.removeEventListener('paymentMethodAdded', handlePaymentMethodAdded);
      };
    }
  }, [isOpen, handlePaymentMethodAdded]);

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-emerald-500/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            Manage Payment Methods
          </DialogTitle>
        </DialogHeader>
        
        <StripePaymentMethodManager onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
};
