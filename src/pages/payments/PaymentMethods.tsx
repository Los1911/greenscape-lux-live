import React, { useState, useEffect } from 'react';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise, isStripeConfigured } from '@/lib/stripe';
import { CreditCard, Plus, Trash2, Star, Shield, Calendar, AlertCircle, RefreshCw } from 'lucide-react';

interface PaymentMethod {
  id: string;
  card: { brand: string; last4: string; exp_month: number; exp_year: number; };
  is_default?: boolean;
}

const AddCardForm: React.FC<{ onSuccess: () => void; onCancel: () => void }> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !user) return;
    setLoading(true);
    setError(null);
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) { setError('Card element not found'); setLoading(false); return; }
    try {
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({ type: 'card', card: cardElement });
      if (pmError) throw new Error(pmError.message);
      const { error: attachError } = await supabase.functions.invoke('attach-payment-method', {
        body: { paymentMethodId: paymentMethod.id, userId: user.id }
      });
      if (attachError) throw new Error('Failed to save payment method');
      toast({ title: "Success", description: "Payment method added" });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-slate-600 rounded-lg bg-white">
        <CardElement options={{ style: { base: { fontSize: '16px', color: '#1f2937' }, invalid: { color: '#ef4444' } } }} />
      </div>
      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="flex gap-2">
        <Button type="submit" disabled={!stripe || loading} className="flex-1 bg-green-600 hover:bg-green-700">{loading ? 'Adding...' : 'Add Card'}</Button>
        <Button type="button" variant="outline" onClick={onCancel} className="border-slate-600 text-white hover:bg-slate-700">Cancel</Button>
      </div>
    </form>
  );
};

export default function PaymentMethods() {
  const { user, loading: authLoading } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const stripeReady = isStripeConfigured();

  useEffect(() => { 
    if (!authLoading && user) fetchPaymentMethods(); 
    else if (!authLoading && !user) setLoading(false);
  }, [user, authLoading]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-payment-methods', { body: { userId: user?.id } });
      if (error) throw error;
      setPaymentMethods(data?.paymentMethods || data?.payment_methods || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => { setRefreshing(true); await fetchPaymentMethods(); setRefreshing(false); };
  const handleSetDefault = async (id: string) => {
    const { error } = await supabase.functions.invoke('set-default-payment-method', { body: { userId: user?.id, paymentMethodId: id } });
    if (!error) { toast({ title: "Success", description: "Default updated" }); fetchPaymentMethods(); }
  };
  const handleDelete = async (id: string) => {
    const { error } = await supabase.functions.invoke('delete-payment-method', { body: { paymentMethodId: id } });
    if (!error) { toast({ title: "Success", description: "Payment method removed" }); fetchPaymentMethods(); }
  };

  if (authLoading) {
    return (
      <PaymentLayout activeTab="methods">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
        </div>
      </PaymentLayout>
    );
  }

  return (
    <PaymentLayout activeTab="methods">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Payment Methods</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="border-slate-600 text-white hover:bg-slate-700">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />Refresh
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} disabled={!stripeReady} className="bg-green-600 hover:bg-green-700"><Plus className="h-4 w-4 mr-2" />Add Method</Button>
          </div>
        </div>
        {!stripeReady && <Alert className="bg-yellow-900/30 border-yellow-500/50"><AlertCircle className="h-4 w-4 text-yellow-400" /><AlertDescription className="text-yellow-200">Stripe is not configured.</AlertDescription></Alert>}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Shield className="h-5 w-5 text-green-400" />Stored Payment Methods</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">{[1,2].map(i => <div key={i} className="animate-pulse h-16 bg-slate-600 rounded-lg"></div>)}</div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-8"><CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-medium text-white mb-2">No payment methods</h3><p className="text-gray-400">Add a payment method to get started</p></div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-blue-400" />
                      <div>
                        <div className="flex items-center gap-2"><span className="font-medium text-white">{m.card.brand.toUpperCase()} •••• {m.card.last4}</span>{m.is_default && <Badge className="bg-yellow-100 text-yellow-800 text-xs"><Star className="h-3 w-3 mr-1" />Default</Badge>}</div>
                        <span className="text-sm text-gray-400 flex items-center gap-1"><Calendar className="h-3 w-3" />{m.card.exp_month}/{m.card.exp_year}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!m.is_default && <Button variant="outline" size="sm" onClick={() => handleSetDefault(m.id)} className="border-slate-600 text-white hover:bg-slate-600">Set Default</Button>}
                      <Button variant="outline" size="sm" onClick={() => handleDelete(m.id)} className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader><DialogTitle className="text-white">Add Payment Method</DialogTitle></DialogHeader>
            {stripeReady ? <Elements stripe={stripePromise}><AddCardForm onSuccess={() => { setIsDialogOpen(false); fetchPaymentMethods(); }} onCancel={() => setIsDialogOpen(false)} /></Elements> : <p className="text-gray-400">Stripe is not configured</p>}
          </DialogContent>
        </Dialog>
      </div>
    </PaymentLayout>
  );
}
