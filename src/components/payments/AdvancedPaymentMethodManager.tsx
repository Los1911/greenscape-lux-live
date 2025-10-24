import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Star, 
  Shield, 
  Calendar,
  AlertCircle,
  CheckCircle
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

interface PaymentMethodManagerProps {
  userId: string;
  onPaymentMethodChange?: () => void;
}

export default function AdvancedPaymentMethodManager({ 
  userId, 
  onPaymentMethodChange 
}: PaymentMethodManagerProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMethod, setAddingMethod] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCardData, setNewCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const { toast } = useToast();

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

      setPaymentMethods(data.paymentMethods || []);
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
      onPaymentMethodChange?.();
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
      onPaymentMethodChange?.();
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
      onPaymentMethodChange?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove payment method",
        variant: "destructive"
      });
    }
  };

  const getCardIcon = (brand?: string) => {
    // Return appropriate card brand icon
    return <CreditCard className="h-5 w-5" />;
  };

  const getStatusBadge = (status: string, expMonth?: number, expYear?: number) => {
    if (status === 'expired' || (expMonth && expYear && 
        new Date() > new Date(expYear, expMonth - 1))) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (status === 'requires_action') {
      return <Badge variant="outline">Requires Action</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Payment Methods
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Method
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  value={newCardData.name}
                  onChange={(e) => setNewCardData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={newCardData.number}
                  onChange={(e) => setNewCardData(prev => ({ ...prev, number: e.target.value }))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Expiry</Label>
                  <Input
                    id="expiry"
                    value={newCardData.expiry}
                    onChange={(e) => setNewCardData(prev => ({ ...prev, expiry: e.target.value }))}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    value={newCardData.cvc}
                    onChange={(e) => setNewCardData(prev => ({ ...prev, cvc: e.target.value }))}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
              <Button 
                onClick={handleAddPaymentMethod} 
                disabled={addingMethod}
                className="w-full"
              >
                {addingMethod ? 'Adding...' : 'Add Payment Method'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No payment methods</h3>
            <p className="text-gray-500 mb-4">Add a payment method to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div 
                key={method.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getCardIcon(method.brand)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {method.brand?.toUpperCase()} •••• {method.last4}
                      </span>
                      {method.is_default && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
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
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePaymentMethod(method.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Secure Payment Processing</h4>
              <p className="text-sm text-blue-700 mt-1">
                Your payment information is encrypted and securely processed by Stripe. 
                We never store your full card details on our servers.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}