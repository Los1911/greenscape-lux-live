import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, AlertCircle, Plus, Trash2, Star } from 'lucide-react';
import { PaymentMethodModal } from './PaymentMethodModal';
import { StripeKeyValidator } from './StripeKeyValidator';

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
  const { user } = useAuth();

  useEffect(() => {
    if (open && user?.id) {
      fetchPaymentMethods();
    }
  }, [open, user?.id]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);

      // Get user's stripe_customer_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email, first_name, last_name')
        .eq('id', user?.id)
        .single();

      if (profileError) {
        throw new Error(`Profile fetch failed: ${profileError.message}`);
      }

      let customerId = profile?.stripe_customer_id;
      
      // Create Stripe customer if doesn't exist
      if (!customerId) {
        console.log('Creating Stripe customer for user:', user?.id);
        const { data: createResult, error: createError } = await supabase.functions.invoke('create-stripe-customer', {
          body: {
            userId: user?.id,
            email: profile?.email || user?.email,
            firstName: profile?.first_name || '',
            lastName: profile?.last_name || ''
          }
        });

        if (createError) {
          console.error('Stripe customer creation error:', createError);
          throw new Error(`Failed to initialize payment system: ${createError.message}`);
        }

        if (!createResult?.success || !createResult?.stripe_customer_id) {
          console.error('Invalid response from create-stripe-customer:', createResult);
          throw new Error('Failed to create payment account');
        }

        customerId = createResult.stripe_customer_id;
        console.log('Stripe customer created successfully:', customerId);
      }
      
      setStripeCustomerId(customerId);

      // Fetch payment methods from Stripe
      const { data: methodsResult, error: methodsError } = await supabase.functions.invoke('list-payment-methods', {
        body: { customerId }
      });

      if (methodsError) {
        throw new Error(`Failed to fetch payment methods: ${methodsError.message}`);
      }

      if (methodsResult?.success) {
        setPaymentMethods(methodsResult.payment_methods || []);
      } else {
        throw new Error(methodsResult?.error || 'Failed to fetch payment methods');
      }

    } catch (err: any) {
      console.error('Payment methods error:', err);
      toast.error(err.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    try {
      setDeletingId(paymentMethodId);

      const { data, error } = await supabase.functions.invoke('delete-payment-method', {
        body: { paymentMethodId }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Payment method deleted successfully');
        fetchPaymentMethods(); // Refresh the list
        // Dispatch profile update event to refresh completion status
        window.dispatchEvent(new CustomEvent('profileUpdated'));
      } else {
        throw new Error(data?.error || 'Failed to delete payment method');
      }
    } catch (err: any) {
      console.error('Delete payment method error:', err);
      toast.error(err.message || 'Failed to delete payment method');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      setSettingDefaultId(paymentMethodId);

      const { data, error } = await supabase.functions.invoke('set-default-payment-method', {
        body: { 
          customerId: stripeCustomerId,
          paymentMethodId 
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Default payment method updated');
        fetchPaymentMethods(); // Refresh the list
      } else {
        throw new Error(data?.error || 'Failed to set default payment method');
      }
    } catch (err: any) {
      console.error('Set default payment method error:', err);
      toast.error(err.message || 'Failed to set default payment method');
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleBillingPortal = async () => {
    try {
      setLoading(true);

      if (!stripeCustomerId) {
        throw new Error('No payment account found');
      }

      const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
        body: { customerId: stripeCustomerId }
      });

      if (error) throw error;

      if (data?.url) {
        toast.success('Redirecting to billing portal...');
        window.location.href = data.url;
      } else {
        throw new Error('Unable to create billing session');
      }
    } catch (err: any) {
      console.error('Billing portal error:', err);
      toast.error(err.message || 'Unable to open billing portal');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = () => {
    setShowAddPaymentModal(true);
  };

  const handlePaymentMethodSuccess = () => {
    fetchPaymentMethods();
    setShowAddPaymentModal(false);
    onSuccess?.();
    toast.success('Payment method added successfully!');
    
    // Dispatch profile update event to refresh completion status
    window.dispatchEvent(new CustomEvent('profileUpdated'));
  };

  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

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
            {/* Add Stripe Key Validator for debugging */}
            <StripeKeyValidator />
            
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
                  <Button
                    onClick={handleAddPaymentMethod}
                    disabled={loading || !stripeCustomerId}
                    size="sm"
                  >
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSetDefaultPaymentMethod(method.id)}
                                  disabled={settingDefaultId === method.id}
                                >
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeletePaymentMethod(method.id)}
                                disabled={deletingId === method.id}
                                className="text-red-600 hover:text-red-700"
                              >
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
                  <Button
                    variant="outline"
                    onClick={handleBillingPortal}
                    disabled={loading || !stripeCustomerId}
                    className="w-full"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {loading ? 'Opening...' : 'Open Stripe Billing Portal'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PaymentMethodModal
        isOpen={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        onSuccess={handlePaymentMethodSuccess}
      />
    </>
  );
};