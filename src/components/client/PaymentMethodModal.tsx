import React, { useState } from 'react';
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

  const handleSuccess = () => {
    toast({
      title: "Payment method updated",
      description: "Your payment information has been saved successfully.",
    });
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Manage Payment Methods
          </DialogTitle>
        </DialogHeader>
        
        <StripePaymentMethodManager onClose={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
};