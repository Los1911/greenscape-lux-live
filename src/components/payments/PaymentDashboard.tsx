import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import PaymentHistory from './PaymentHistory';
import InvoiceGenerator from './InvoiceGenerator';
import { DollarSign, TrendingUp, Clock, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

interface PaymentStats {
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  refundedAmount: number;
}

interface PaymentDashboardProps {
  userId: string;
  userType: 'customer' | 'landscaper' | 'admin';
}

export default function PaymentDashboard({ userId, userType }: PaymentDashboardProps) {
  const [stats, setStats] = useState<PaymentStats>({ totalRevenue: 0, pendingPayments: 0, completedPayments: 0, refundedAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) fetchPaymentStats();
    else setLoading(false);
  }, [userId, userType]);

  const fetchPaymentStats = async () => {
    if (!userId) { setLoading(false); return; }
    try {
      setError(null);
      let query = supabase.from('payments').select('amount, status');
      if (userType === 'customer') query = query.eq('customer_id', userId);
      else if (userType === 'landscaper') query = query.eq('landscaper_id', userId);
      const { data, error: fetchError } = await query;
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      const payments = data || [];
      setStats({
        totalRevenue: payments.filter(p => p?.status === 'succeeded').reduce((sum, p) => sum + (p?.amount || 0), 0),
        pendingPayments: payments.filter(p => p?.status === 'pending').length,
        completedPayments: payments.filter(p => p?.status === 'succeeded').length,
        refundedAmount: payments.filter(p => p?.status === 'refunded').reduce((sum, p) => sum + (p?.amount || 0), 0)
      });
    } catch (err) {
      console.error('Error fetching payment stats:', err);
      setError('Unable to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">{title}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></div><Icon className={`h-8 w-8 ${color}`} /></div></CardContent></Card>
  );

  // No userId provided - show placeholder
  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto" />
          <p className="text-gray-500">Please sign in to view payment information</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8"><RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" /></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (<Card key={i}><CardContent className="p-6"><div className="animate-pulse"><div className="h-4 bg-gray-200 rounded mb-2"></div><div className="h-8 bg-gray-200 rounded"></div></div></CardContent></Card>))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-gray-500">{error}</p>
          <button onClick={() => { setLoading(true); fetchPaymentStats(); }} className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title={userType === 'customer' ? 'Total Spent' : 'Total Revenue'} value={`$${(stats.totalRevenue / 100).toFixed(2)}`} icon={DollarSign} color="text-green-600" />
        <StatCard title="Pending Payments" value={stats.pendingPayments} icon={Clock} color="text-yellow-600" />
        <StatCard title="Completed Payments" value={stats.completedPayments} icon={CheckCircle} color="text-blue-600" />
        <StatCard title="Refunded" value={`$${(stats.refundedAmount / 100).toFixed(2)}`} icon={TrendingUp} color="text-red-600" />
      </div>
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          {userType === 'landscaper' && <TabsTrigger value="invoices">Generate Invoice</TabsTrigger>}
        </TabsList>
        <TabsContent value="history">
          <PaymentHistory customerId={userType === 'customer' ? userId : undefined} landscaperId={userType === 'landscaper' ? userId : undefined} />
        </TabsContent>
        {userType === 'landscaper' && (
          <TabsContent value="invoices">
            <InvoiceGenerator customerId="" landscaperId={userId} onInvoiceCreated={(invoiceId) => console.log('Invoice created:', invoiceId)} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
