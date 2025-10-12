import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Import stripe from our centralized config to ensure proper validation
import { getStripe } from '@/lib/stripe';

const stripePromise = getStripe();

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

interface PaymentMethodFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !user) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setLoading(false);
      return;
    }

    try {
      // Get user profile to ensure we have stripe_customer_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email, first_name, last_name')
        .eq('id', user.id)
        .single();

      let customerId = profile?.stripe_customer_id;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const { data: customerResult, error: customerError } = await supabase.functions.invoke('create-stripe-customer', {
          body: {
            userId: user.id,
            email: profile?.email || user.email,
            name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
          }
        });

        if (customerError || !customerResult?.success) {
          throw new Error('Failed to create customer account');
        }

        customerId = customerResult.stripe_customer_id;
      }

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          email: profile?.email || user.email,
          name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
        },
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      // Attach payment method to customer
      const { error: attachError } = await supabase.functions.invoke('attach-payment-method', {
        body: {
          paymentMethodId: paymentMethod.id,
          customerId: customerId
        }
      });

      if (attachError) {
        throw new Error('Failed to save payment method');
      }

      toast({
        title: "Payment method added",
        description: "Your payment method has been saved successfully.",
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement options={cardElementOptions} />
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={!stripe || loading} className="flex-1">
          {loading ? 'Adding...' : 'Add Payment Method'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

interface StripePaymentMethodManagerProps {
  onClose: () => void;
}

export const StripePaymentMethodManager: React.FC<StripePaymentMethodManagerProps> = ({ onClose }) => {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user?.id)
        .single();

      if (profile?.stripe_customer_id) {
        const { data, error } = await supabase.functions.invoke('get-payment-methods', {
          body: { customerId: profile.stripe_customer_id }
        });

        if (!error && data?.paymentMethods) {
          setPaymentMethods(data.paymentMethods);
        }
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    try {
      const { error } = await supabase.functions.invoke('delete-payment-method', {
        body: { paymentMethodId }
      });

      if (error) {
        throw new Error('Failed to delete payment method');
      }

      toast({
        title: "Payment method removed",
        description: "Your payment method has been deleted.",
      });

      fetchPaymentMethods();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Methods
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.length === 0 && !showAddForm && (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No payment methods added yet</p>
                <Button onClick={() => setShowAddForm(true)}>
                  Add Your First Payment Method
                </Button>
              </div>
            )}

            {paymentMethods.map((pm) => (
              <div key={pm.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <p className="font-medium">•••• •••• •••• {pm.card.last4}</p>
                    <p className="text-sm text-gray-600">{pm.card.brand.toUpperCase()} • Expires {pm.card.exp_month}/{pm.card.exp_year}</p>
                  </div>
                  {pm.default && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDeletePaymentMethod(pm.id)}
                >
                  Remove
                </Button>
              </div>
            ))}

            {showAddForm ? (
              <Elements stripe={stripePromise}>
                <PaymentMethodForm 
                  onSuccess={() => {
                    setShowAddForm(false);
                    fetchPaymentMethods();
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              </Elements>
            ) : paymentMethods.length > 0 && (
              <Button onClick={() => setShowAddForm(true)} className="w-full">
                Add Another Payment Method
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};