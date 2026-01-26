import React, { useState, useEffect } from 'react';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Receipt,
  Download,
  RefreshCw
} from 'lucide-react';

interface PaymentStats {
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  refundedAmount: number;
  monthlyRevenue: number;
  subscriptionRevenue: number;
}

interface Transaction {
  id: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  created_at: string;
  description: string;
  invoice_id?: string;
  subscription_id?: string;
}

export default function PaymentOverview() {
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    refundedAmount: 0,
    monthlyRevenue: 0,
    subscriptionRevenue: 0
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'client' | 'landscaper' | 'admin'>('client');

  useEffect(() => {
    initUser();
  }, []);

  const initUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;

    setUserId(data.user.id);
    setUserRole((data.user.user_metadata?.role as any) || 'client');
    fetchPaymentData(data.user.id, (data.user.user_metadata?.role as any) || 'client');
  };

  const fetchPaymentData = async (uid = userId, role = userRole) => {
    if (!uid) return;

    try {
      setLoading(true);

      let query = supabase.from('payments').select('*');

      if (role === 'client') query = query.eq('client_id', uid);
      if (role === 'landscaper') query = query.eq('landscaper_id', uid);

      const { data: payments, error } = await query.order('created_at', { ascending: false });
      if (error && error.code !== 'PGRST116') throw error;

      const paymentsData = payments || [];
      setTransactions(paymentsData);

      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();

      setStats({
        totalRevenue: paymentsData.filter(p => p.status === 'succeeded').reduce((s, p) => s + (p.amount || 0), 0),
        pendingPayments: paymentsData.filter(p => p.status === 'pending').length,
        completedPayments: paymentsData.filter(p => p.status === 'succeeded').length,
        refundedAmount: paymentsData.filter(p => p.status === 'refunded').reduce((s, p) => s + (p.amount || 0), 0),
        monthlyRevenue: paymentsData
          .filter(p => {
            const d = new Date(p.created_at);
            return p.status === 'succeeded' && d.getMonth() === month && d.getFullYear() === year;
          })
          .reduce((s, p) => s + (p.amount || 0), 0),
        subscriptionRevenue: paymentsData
          .filter(p => p.status === 'succeeded' && p.subscription_id)
          .reduce((s, p) => s + (p.amount || 0), 0)
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load payment data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPaymentData();
    setRefreshing(false);
    toast({ title: 'Refreshed', description: 'Payment data updated' });
  };

  const handleDownloadInvoice = async (transactionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { transactionId, userId }
      });
      if (error) throw error;

      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${transactionId}.pdf`;
      a.click();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      succeeded: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={map[status] || map.pending}>{status}</Badge>;
  };

  if (loading) {
    return (
      <PaymentLayout activeTab="overview">
        <div className="text-white">Loading payments...</div>
      </PaymentLayout>
    );
  }

  return (
    <PaymentLayout activeTab="overview">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Payment Overview</h2>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex gap-2 items-center">
              <CreditCard className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.slice(0, 10).map(t => (
              <div key={t.id} className="flex justify-between p-3 bg-slate-700 rounded mb-2">
                <div>
                  <p className="text-white">{t.description || 'Payment'}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-white font-semibold">${(t.amount / 100).toFixed(2)}</span>
                  {getStatusBadge(t.status)}
                  <Button size="sm" onClick={() => handleDownloadInvoice(t.id)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PaymentLayout>
  );
}
