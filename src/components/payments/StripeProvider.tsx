import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise, STRIPE_CONFIG } from '@/lib/stripe';

interface StripeProviderProps {
  children: React.ReactNode;
  clientSecret?: string;
  amount?: number;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({
  children,
  clientSecret,
  amount,
}) => {
  const options = {
    clientSecret,
    appearance: STRIPE_CONFIG.appearance,
    loader: 'auto' as const,
  };

  return (
    <Elements stripe={stripePromise} options={clientSecret ? options : undefined}>
      {children}
    </Elements>
  );
};

export default StripeProvider;