import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, Plus, AlertTriangle, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PaymentMethodModal } from './PaymentMethodModal';
import { PaymentMethodCard } from './PaymentMethodCard';
import { getPaymentMethods, deletePaymentMethod, createStripeCustomer, invokeEdgeFunction } from '@/lib/edgeFunctions';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created: number;
  status?: 'active' | 'expired' | 'expiring_soon' | 'failed';
  failure_reason?: string;
}

interface EnhancedPaymentMethodManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const EnhancedPaymentMethodManager: React.FC<EnhancedPaymentMethodManagerProps> = ({
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

  const getCardStatus = (method: PaymentMethod): PaymentMethod['status'] => {
    const now = new Date();
    const expiry = new Date(method.exp_year, method.exp_month - 1);
    const monthsUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (method.failure_reason) return 'failed';
    if (expiry < now) return 'expired';
    if (monthsUntilExpiry <= 2) return 'expiring_soon';
    return 'active';
  };

  const fetchPaymentMethods = async () => {
    if (!session) return;
    
    try {
      setLoading(true);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email, first_name, last_name')
        .eq('id', user?.id)
        .single();

      if (profileError) {
        throw new Error(`Profile fetch failed: ${profileError.message}`);
      }

      let customerId = profile?.stripe_customer_id;
      
      if (!customerId) {
        const { data: createResult, error: createError } = await createStripeCustomer(
          user?.id || '',
          profile?.email || user?.email || '',
          `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          session.access_token
        );

        if (createError || !createResult?.success) {
          throw new Error('Failed to initialize payment system');
        }

        customerId = createResult.stripe_customer_id;
      }
      
      setStripeCustomerId(customerId);
      
      console.log('[ENHANCED_PAYMENT] Fetching payment methods for customer:', customerId);
      const { data: methodsResult, error: methodsError } = await getPaymentMethods(customerId, session.access_token);

      if (methodsError) {
        throw new Error(`Failed to fetch payment methods: ${methodsError.message}`);
      }

      if (methodsResult?.success) {
        const enhancedMethods = (methodsResult.payment_methods || []).map((method: PaymentMethod) => ({
          ...method,
          status: getCardStatus(method)
        }));
        console.log('[ENHANCED_PAYMENT] Payment methods fetched:', enhancedMethods.length);
        setPaymentMethods(enhancedMethods);
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
      console.error('Delete payment method error:', err);
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
        body: { 
          customerId: stripeCustomerId,
          paymentMethodId 
        }
      }, session.access_token);

      if (error) throw error;

      if (data?.success) {
        toast.success('Default payment method updated');
        fetchPaymentMethods();
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

  const handleAddPaymentMethod = () => {
    setShowAddPaymentModal(true);
  };

  const handlePaymentMethodSuccess = () => {
    fetchPaymentMethods();
    setShowAddPaymentModal(false);
    onSuccess?.();
    toast.success('Payment method added successfully!');
    window.dispatchEvent(new CustomEvent('profileUpdated'));
  };

  const getStatusIcon = (status: PaymentMethod['status']) => {
    switch (status) {
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'expiring_soon':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: PaymentMethod['status']) => {
    switch (status) {
      case 'expired':
        return <Badge variant="destructive" className="text-xs">Expired</Badge>;
      case 'expiring_soon':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Expires Soon</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      default:
        return null;
    }
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
                      <PaymentMethodCard
                        key={method.id}
                        method={method}
                        onSetDefault={handleSetDefaultPaymentMethod}
                        onDelete={handleDeletePaymentMethod}
                        isSettingDefault={settingDefaultId === method.id}
                        isDeleting={deletingId === method.id}
                      />
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
