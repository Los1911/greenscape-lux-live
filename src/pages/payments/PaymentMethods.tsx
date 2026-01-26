import React, { useEffect, useState } from 'react';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

export default function PaymentMethods() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initUser();
  }, []);

  const initUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;

    setUserId(data.user.id);
    fetchPaymentMethods(data.user.id);
  };

  const fetchPaymentMethods = async (uid: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', uid)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setMethods(data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load payment methods',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMethods(methods.filter(m => m.id !== id));
      toast({ title: 'Removed', description: 'Payment method removed' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to remove payment method',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PaymentLayout activeTab="methods">
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
      </PaymentLayout>
    );
  }

  return (
    <PaymentLayout activeTab="methods">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Payment Methods</h2>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Method
          </Button>
        </div>

        {methods.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-8 text-center text-gray-400">
              No payment methods on file
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {methods.map(method => (
              <Card key={method.id} className="bg-slate-800 border-slate-700">
                <CardContent className="flex justify-between items-center py-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">
                        {method.brand.toUpperCase()} •••• {method.last4}
                      </p>
                      <p className="text-sm text-gray-400">
                        Expires {method.exp_month}/{method.exp_year}
                      </p>
                    </div>
                    {method.is_default && (
                      <CheckCircle className="h-4 w-4 text-green-400 ml-2" />
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(method.id)}
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PaymentLayout>
  );
}
