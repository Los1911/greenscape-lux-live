import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UseStripePaymentProps {
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: string) => void;
}

export const useStripePayment = ({ onSuccess, onError }: UseStripePaymentProps = {}) => {
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const createPaymentIntent = async (amount: number, metadata?: Record<string, string>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          metadata,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create payment intent');
      }

      if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
        return data;
      } else {
        throw new Error('No client secret received');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment setup failed';
      onError?.(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentIntent: any) => {
    setClientSecret(null);
    onSuccess?.(paymentIntent);
  };

  const handlePaymentError = (error: string) => {
    onError?.(error);
  };

  return {
    loading,
    clientSecret,
    createPaymentIntent,
    handlePaymentSuccess,
    handlePaymentError,
  };
};