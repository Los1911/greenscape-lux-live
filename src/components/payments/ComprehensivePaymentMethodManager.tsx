import React, { useState, useEffect } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { stripePromise } from '@/lib/stripe';
import { CreditCard, Plus, Trash2, Star, Shield, AlertCircle, RefreshCw } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: string;
  card: { brand: string; last4: string; exp_month: number; exp_year: number; };
  is_default?: boolean;
}

const AddPaymentMethodForm: React.FC<{ onSuccess: () => void; onCancel: () => void }> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || !user) return;
    setLoading(true);
    setError(null);
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) { setError('Card element not found'); setLoading(false); return; }
    try {
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({ type: 'card', card: cardElement });
      if (pmError) throw new Error(pmError.message);
      const { error: attachError } = await supabase.functions.invoke('attach-payment-method', { body: { paymentMethodId: paymentMethod.id, userId: user.id } });
      if (attachError) throw new Error('Failed to save payment method');
      toast({ title: "Success", description: "Payment method added successfully" });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg"><CardElement options={{ style: { base: { fontSize: '16px', color: '#424770' }, invalid: { color: '#9e2146' } } }} /></div>
      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="flex gap-2">
        <Button type="submit" disabled={!stripe || loading} className="flex-1">{loading ? 'Adding...' : 'Add Payment Method'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};

export default function ComprehensivePaymentMethodManager() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user) fetchPaymentMethods();
    else if (!authLoading && !user) setLoading(false);
  }, [user, authLoading]);

  const fetchPaymentMethods = async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-payment-methods', { body: { userId: user.id } });
      if (error) throw error;
      setPaymentMethods(data?.paymentMethods || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load payment methods", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const { error } = await supabase.functions.invoke('set-default-payment-method', { body: { userId: user?.id, paymentMethodId } });
      if (error) throw error;
      toast({ title: "Success", description: "Default payment method updated" });
      fetchPaymentMethods();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update default method", variant: "destructive" });
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    try {
      const { error } = await supabase.functions.invoke('delete-payment-method', { body: { paymentMethodId } });
      if (error) throw error;
      toast({ title: "Success", description: "Payment method removed" });
      fetchPaymentMethods();
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove payment method", variant: "destructive" });
    }
  };

  // Auth loading guard - prevents white screen on refresh
  if (authLoading) {
    return (
      <Card><CardContent className="p-6"><div className="flex items-center justify-center py-8"><RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" /></div></CardContent></Card>
    );
  }

  if (!user) {
    return (
      <Card><CardContent className="p-6"><div className="text-center py-8"><AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" /><p className="text-gray-500">Please sign in to manage payment methods</p></div></CardContent></Card>
    );
  }

  if (loading) {
    return (
      <Card><CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader><CardContent><div className="space-y-4">{[1, 2].map(i => (<div key={i} className="animate-pulse h-16 bg-gray-200 rounded-lg"></div>))}</div></CardContent></Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Payment Methods</CardTitle><Button onClick={() => setShowAddDialog(true)}><Plus className="h-4 w-4 mr-2" />Add Method</Button></CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8"><CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">No payment methods</h3><p className="text-gray-500">Add a payment method to get started</p></div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <div className="flex items-center gap-2"><span className="font-medium">{method.card?.brand?.toUpperCase() || 'CARD'} •••• {method.card?.last4 || '****'}</span>{method.is_default && <Badge variant="outline" className="text-xs"><Star className="h-3 w-3 mr-1" />Default</Badge>}</div>
                    <p className="text-sm text-gray-500">Expires {method.card?.exp_month || '??'}/{method.card?.exp_year || '????'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!method.is_default && <Button variant="outline" size="sm" onClick={() => handleSetDefault(method.id)}>Set Default</Button>}
                  <Button variant="outline" size="sm" onClick={() => handleDelete(method.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent><DialogHeader><DialogTitle>Add Payment Method</DialogTitle></DialogHeader><Elements stripe={stripePromise}><AddPaymentMethodForm onSuccess={() => { setShowAddDialog(false); fetchPaymentMethods(); }} onCancel={() => setShowAddDialog(false)} /></Elements></DialogContent>
        </Dialog>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg"><div className="flex items-start gap-3"><Shield className="h-5 w-5 text-blue-600 mt-0.5" /><div><h4 className="font-medium text-blue-900">Secure Payment Processing</h4><p className="text-sm text-blue-700 mt-1">Your payment information is encrypted and securely processed by Stripe.</p></div></div></div>
      </CardContent>
    </Card>
  );
}
