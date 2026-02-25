import React, { useState, useEffect } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, CheckCircle, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getStripe } from '@/lib/stripe';
import { getPaymentMethods, deletePaymentMethod, createStripeCustomer, attachPaymentMethod } from '@/lib/edgeFunctions';

const stripePromise = getStripe();
const cardElementOptions = { style: { base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } }, invalid: { color: '#9e2146' } } };
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms))]);

// Local storage key for tracking recently added payment methods
const PAYMENT_METHOD_ADDED_KEY = 'greenscape_payment_method_added';

interface PaymentMethodFormProps { onSuccess: () => void; onCancel: () => void; }

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || !user || !session) { setError('Payment system not ready.'); return; }
    setLoading(true);
    setError(null);
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) { setError('Card element not found'); setLoading(false); return; }
    try {
      const { data: profile } = await withTimeout(supabase.from('profiles').select('stripe_customer_id, email, first_name, last_name').eq('id', user.id).single(), 5000);
      let customerId = profile?.stripe_customer_id;
      if (!customerId) {
        console.log('[PAYMENT_METHOD] Creating Stripe customer for user:', user.id);
        const { data: customerResult, error: customerError } = await createStripeCustomer(
          user.id,
          profile?.email || user.email || '',
          `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          session.access_token
        );
        if (customerError) throw customerError;
        customerId = customerResult?.stripe_customer_id;
        console.log('[PAYMENT_METHOD] Stripe customer created:', customerId);
        
        // Wait for the database to update
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({ type: 'card', card: cardElement, billing_details: { email: profile?.email || user.email, name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() } });
      if (pmError) throw new Error(pmError.message);
      
      console.log('[PAYMENT_METHOD] Attaching payment method to customer:', customerId);
      const { error: attachError } = await attachPaymentMethod(paymentMethod.id, customerId, session.access_token);
      if (attachError) throw attachError;
      
      // Mark payment method as added in localStorage for optimistic updates
      try {
        localStorage.setItem(PAYMENT_METHOD_ADDED_KEY, Date.now().toString());
        console.log('[PAYMENT_METHOD] Marked payment method as added in localStorage');
      } catch (e) {
        // Ignore localStorage errors
      }
      
      toast({ title: "Payment method added", description: "Your payment method has been saved successfully." });
      
      // Dispatch multiple events to ensure profile completion updates
      console.log('[PAYMENT_METHOD] Dispatching events to update profile completion');
      window.dispatchEvent(new CustomEvent('paymentMethodAdded'));
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { type: 'payment_method_added' } }));
      
      onSuccess();
    } catch (err: any) {
      console.error('[PAYMENT_METHOD] Error:', err);
      setError(err.message === 'Request timed out' ? 'Connection timed out.' : err.message || 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg bg-white"><CardElement options={cardElementOptions} /></div>
      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="flex gap-2">
        <Button type="submit" disabled={!stripe || loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
          {loading ? 'Adding...' : 'Add Payment Method'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};

interface StripePaymentMethodManagerProps { onClose: () => void; }

export const StripePaymentMethodManager: React.FC<StripePaymentMethodManagerProps> = ({ onClose }) => {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { user, session, loading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user && session) fetchPaymentMethods();
    else if (!authLoading) setLoading(false);
  }, [user, session, authLoading]);

  const fetchPaymentMethods = async () => {
    if (!user?.id || !session) { setLoading(false); return; }
    try {
      setError(null);
      const { data: profile } = await withTimeout(supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single(), 5000);
      if (profile?.stripe_customer_id) {
        console.log('[PAYMENT_MANAGER] Fetching payment methods for customer:', profile.stripe_customer_id);
        const { data, error: fetchError } = await getPaymentMethods(profile.stripe_customer_id, session.access_token);
        if (fetchError) {
          console.error('[PAYMENT_MANAGER] Error fetching payment methods:', fetchError);
          throw fetchError;
        }
        console.log('[PAYMENT_MANAGER] Payment methods result:', data);
        setPaymentMethods(data?.paymentMethods || data?.payment_methods || []);
      } else {
        console.log('[PAYMENT_MANAGER] No stripe_customer_id found');
        setPaymentMethods([]);
      }
    } catch (err: any) {
      console.error('[PAYMENT_MANAGER] Error:', err);
      setError(err.message === 'Request timed out' ? 'Connection timed out.' : 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!session) return;
    try {
      const { error: deleteError } = await deletePaymentMethod(paymentMethodId, session.access_token);
      if (deleteError) throw deleteError;
      toast({ title: "Payment method removed" });
      
      // Clear the localStorage flag since we removed a payment method
      try {
        localStorage.removeItem(PAYMENT_METHOD_ADDED_KEY);
      } catch (e) {
        // Ignore localStorage errors
      }
      
      fetchPaymentMethods();
      // Dispatch profile updated event to refresh profile completion
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { type: 'payment_method_removed' } }));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handlePaymentMethodAdded = () => {
    setShowAddForm(false);
    fetchPaymentMethods();
    // The profileUpdated event is already dispatched in PaymentMethodForm
  };

  // Auth loading guard
  if (authLoading) {
    return <Card className="w-full max-w-2xl mx-auto"><CardContent className="p-6"><div className="flex items-center justify-center py-8"><RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" /></div></CardContent></Card>;
  }

  if (!user) {
    return <Card className="w-full max-w-2xl mx-auto"><CardContent className="p-6"><div className="text-center py-8"><AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" /><p className="text-gray-500">Please sign in to manage payment methods</p></div></CardContent></Card>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />Payment Methods
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-emerald-600 hover:text-emerald-700">
            <ArrowLeft className="h-4 w-4 mr-1" />Back
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-4"><div className="h-16 bg-gray-200 rounded"></div></div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="outline" size="sm" onClick={fetchPaymentMethods} className="ml-4">Retry</Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {paymentMethods.length === 0 && !showAddForm && (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No payment methods added yet</p>
                <Button onClick={() => setShowAddForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  Add Payment Method
                </Button>
              </div>
            )}
            {paymentMethods.map((pm) => (
              <div key={pm.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-medium">•••• {pm.card?.last4 || '****'}</p>
                    <p className="text-sm text-gray-600">
                      {pm.card?.brand?.toUpperCase() || 'CARD'} • Expires {pm.card?.exp_month || '??'}/{pm.card?.exp_year || '????'}
                    </p>
                  </div>
                  {pm.default && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDeletePaymentMethod(pm.id)}>
                  Remove
                </Button>
              </div>
            ))}
            {showAddForm ? (
              <Elements stripe={stripePromise}>
                <PaymentMethodForm onSuccess={handlePaymentMethodAdded} onCancel={() => setShowAddForm(false)} />
              </Elements>
            ) : paymentMethods.length > 0 && (
              <Button onClick={() => setShowAddForm(true)} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Add Another Payment Method
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
