import React, { useState, useEffect } from 'react';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Star, 
  Shield, 
  Calendar,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  created_at: string;
  status: 'active' | 'expired' | 'requires_action';
}

export default function PaymentMethods() {
  const { user } = useAuthContext();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMethod, setAddingMethod] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newCardData, setNewCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const { toast } = useToast();

  const userId = user?.id || 'demo-user-123';

  useEffect(() => {
    fetchPaymentMethods();
  }, [userId]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      
      // Call Supabase edge function to get payment methods from Stripe
      const { data, error } = await supabase.functions.invoke('get-payment-methods', {
        body: { userId }
      });

      if (error) throw error;

      setPaymentMethods(data?.paymentMethods || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPaymentMethods();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Payment methods updated"
    });
  };

  const handleAddPaymentMethod = async () => {
    try {
      setAddingMethod(true);

      const { data, error } = await supabase.functions.invoke('attach-payment-method', {
        body: {
          userId,
          cardData: newCardData
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment method added successfully"
      });

      setNewCardData({ number: '', expiry: '', cvc: '', name: '' });
      setIsDialogOpen(false);
      fetchPaymentMethods();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add payment method",
        variant: "destructive"
      });
    } finally {
      setAddingMethod(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const { error } = await supabase.functions.invoke('set-default-payment-method', {
        body: {
          userId,
          paymentMethodId
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Default payment method updated"
      });

      fetchPaymentMethods();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update default payment method",
        variant: "destructive"
      });
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    try {
      const { error } = await supabase.functions.invoke('delete-payment-method', {
        body: {
          userId,
          paymentMethodId
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment method removed"
      });

      fetchPaymentMethods();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove payment method",
        variant: "destructive"
      });
    }
  };

  const getCardIcon = (brand?: string) => {
    return <CreditCard className="h-5 w-5 text-blue-400" />;
  };

  const getStatusBadge = (status: string, expMonth?: number, expYear?: number) => {
    if (status === 'expired' || (expMonth && expYear && 
        new Date() > new Date(expYear, expMonth - 1))) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    }
    if (status === 'requires_action') {
      return <Badge className="bg-yellow-100 text-yellow-800">Requires Action</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  if (loading) {
    return (
      <PaymentLayout activeTab="methods">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-slate-600 rounded-lg"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PaymentLayout>
    );
  }

  return (
    <PaymentLayout activeTab="methods">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Payment Methods</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Method
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add Payment Method</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardName" className="text-gray-300">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      value={newCardData.name}
                      onChange={(e) => setNewCardData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardNumber" className="text-gray-300">Card Number</Label>
                    <Input
                      id="cardNumber"
                      value={newCardData.number}
                      onChange={(e) => setNewCardData(prev => ({ ...prev, number: e.target.value }))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry" className="text-gray-300">Expiry</Label>
                      <Input
                        id="expiry"
                        value={newCardData.expiry}
                        onChange={(e) => setNewCardData(prev => ({ ...prev, expiry: e.target.value }))}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvc" className="text-gray-300">CVC</Label>
                      <Input
                        id="cvc"
                        value={newCardData.cvc}
                        onChange={(e) => setNewCardData(prev => ({ ...prev, cvc: e.target.value }))}
                        placeholder="123"
                        maxLength={4}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddPaymentMethod} 
                    disabled={addingMethod}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {addingMethod ? 'Adding...' : 'Add Payment Method'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Payment Methods List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-green-400" />
              Stored Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No payment methods</h3>
                <p className="text-gray-400 mb-4">Add a payment method to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id} 
                    className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getCardIcon(method.brand)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {method.brand?.toUpperCase()} •••• {method.last4}
                          </span>
                          {method.is_default && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          {method.exp_month && method.exp_year && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                            </span>
                          )}
                          {getStatusBadge(method.status, method.exp_month, method.exp_year)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!method.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(method.id)}
                          className="border-slate-600 text-white hover:bg-slate-600"
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-300">Secure Payment Processing</h4>
                  <p className="text-sm text-blue-200 mt-1">
                    Your payment information is encrypted and securely processed by Stripe. 
                    We never store your full card details on our servers.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PaymentLayout>
  );
}