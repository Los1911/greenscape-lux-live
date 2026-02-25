import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, Plus, Trash2, Star } from 'lucide-react';
import { PaymentMethodModal } from './PaymentMethodModal';
import { getPaymentMethods, deletePaymentMethod, createStripeCustomer, invokeEdgeFunction } from '@/lib/edgeFunctions';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created: number;
}

interface PaymentMethodManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const { user, session } = useAuth();

  useEffect(() => {
    if (open && user?.id && session) {
      fetchPaymentMethods();
    }
  }, [open, user?.id, session]);

  const fetchPaymentMethods = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email, first_name, last_name')
        .eq('id', user?.id)
        .single();

      if (profileError) throw new Error(`Profile fetch failed: ${profileError.message}`);

      let customerId = profile?.stripe_customer_id;
      
      if (!customerId) {
        console.log('[PAYMENT_METHOD] Creating Stripe customer for user:', user?.id);
        const { data: createResult, error: createError } = await createStripeCustomer(
          user?.id || '',
          profile?.email || user?.email || '',
          `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          session.access_token
        );

        if (createError) throw new Error(`Failed to initialize payment system: ${createError.message}`);
        if (!createResult?.success || !createResult?.stripe_customer_id) throw new Error('Failed to create payment account');

        customerId = createResult.stripe_customer_id;
        console.log('[PAYMENT_METHOD] Stripe customer created successfully:', customerId);
      }
      
      setStripeCustomerId(customerId);

      console.log('[PAYMENT_METHOD] Fetching payment methods for customer:', customerId);
      const { data: methodsResult, error: methodsError } = await getPaymentMethods(customerId, session.access_token);

      if (methodsError) throw new Error(`Failed to fetch payment methods: ${methodsError.message}`);
      if (methodsResult?.success) {
        console.log('[PAYMENT_METHOD] Payment methods fetched:', methodsResult.payment_methods?.length || 0);
        setPaymentMethods(methodsResult.payment_methods || []);
      } else {
        throw new Error(methodsResult?.error || 'Failed to fetch payment methods');
      }

    } catch (err: any) {
      console.error('[PAYMENT_METHOD] Error:', err);
      toast.error(err.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!session) return;
    
    try {
      setDeletingId(paymentMethodId);
      const { data, error } = await deletePaymentMethod(paymentMethodId, session.access_token);

      if (error) throw error;
      if (data?.success) {
        toast.success('Payment method deleted successfully');
        fetchPaymentMethods();
        window.dispatchEvent(new CustomEvent('profileUpdated'));
      } else {
        throw new Error(data?.error || 'Failed to delete payment method');
      }
    } catch (err: any) {
      console.error('[PAYMENT_METHOD] Delete error:', err);
      toast.error(err.message || 'Failed to delete payment method');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    if (!session) return;
    
    try {
      setSettingDefaultId(paymentMethodId);
      const { data, error } = await invokeEdgeFunction('set-default-payment-method', {
        body: { customerId: stripeCustomerId, paymentMethodId }
      }, session.access_token);

      if (error) throw error;
      if (data?.success) {
        toast.success('Default payment method updated');
        fetchPaymentMethods();
      } else {
        throw new Error(data?.error || 'Failed to set default payment method');
      }
    } catch (err: any) {
      console.error('[PAYMENT_METHOD] Set default error:', err);
      toast.error(err.message || 'Failed to set default payment method');
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleBillingPortal = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      if (!stripeCustomerId) throw new Error('No payment account found');

      console.log('[BILLING_PORTAL] Opening Stripe Billing Portal...');
      const { data, error } = await invokeEdgeFunction('create-billing-portal-session', {
        body: { customerId: stripeCustomerId }
      }, session.access_token);

      if (error) throw error;
      if (data?.url) {
        console.log('[BILLING_PORTAL] Redirecting to:', data.url);
        toast.success('Redirecting to billing portal...');
        window.location.href = data.url;
      } else {
        throw new Error('Unable to create billing session');
      }
    } catch (err: any) {
      console.error('[BILLING_PORTAL] Error:', err);
      toast.error(err.message || 'Unable to open billing portal');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = () => setShowAddPaymentModal(true);

  const handlePaymentMethodSuccess = () => {
    console.log('[PAYMENT_MANAGER] Payment method added successfully, dispatching events');
    fetchPaymentMethods();
    setShowAddPaymentModal(false);
    onSuccess?.();
    toast.success('Payment method added successfully!');
    
    // Mark payment method as added in localStorage for optimistic updates
    try {
      localStorage.setItem('greenscape_payment_method_added', Date.now().toString());
      console.log('[PAYMENT_MANAGER] Marked payment method as added in localStorage');
    } catch (e) {
      // Ignore localStorage errors
    }
    
    // Dispatch both events to ensure profile completion updates
    window.dispatchEvent(new CustomEvent('paymentMethodAdded'));
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { type: 'payment_method_added' } }));
  };


  const formatCardBrand = (brand: string) => brand.charAt(0).toUpperCase() + brand.slice(1);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Manage Payment Methods
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Manage your saved payment methods and billing information.
                  </div>
                  <Button onClick={handleAddPaymentMethod} disabled={loading || !stripeCustomerId} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </Button>
                </div>

                {paymentMethods.length > 0 ? (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <Card key={method.id} className="relative">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-6 w-6 text-muted-foreground" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {formatCardBrand(method.brand)} •••• {method.last4}
                                  </span>
                                  {method.is_default && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Star className="h-3 w-3 mr-1" />
                                      Default
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!method.is_default && (
                                <Button variant="outline" size="sm" onClick={() => handleSetDefaultPaymentMethod(method.id)} disabled={settingDefaultId === method.id}>
                                  {settingDefaultId === method.id ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                  ) : (
                                    <>
                                      <Star className="h-3 w-3 mr-1" />
                                      Set Default
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button variant="outline" size="sm" onClick={() => handleDeletePaymentMethod(method.id)} disabled={deletingId === method.id} className="text-red-600 hover:text-red-700">
                                {deletingId === method.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground">
                        <CreditCard className="mx-auto h-12 w-12 mb-2 opacity-50" />
                        <p>No payment methods found</p>
                        <p className="text-xs">Add a payment method to get started</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="pt-4 border-t">
                  <Button variant="outline" onClick={handleBillingPortal} disabled={loading || !stripeCustomerId} className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" />
                    {loading ? 'Opening...' : 'Open Stripe Billing Portal'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PaymentMethodModal isOpen={showAddPaymentModal} onClose={() => setShowAddPaymentModal(false)} onSuccess={handlePaymentMethodSuccess} />
    </>
  );
};
