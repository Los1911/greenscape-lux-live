import React, { useState, useEffect } from 'react';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, CreditCard, Receipt, Download, RefreshCw } from 'lucide-react';

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
}

export default function PaymentOverview() {
  const { user, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<PaymentStats>({ totalRevenue: 0, pendingPayments: 0, completedPayments: 0, refundedAmount: 0, monthlyRevenue: 0, subscriptionRevenue: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  
  const userId = user?.id;
  const userRole = (user?.user_metadata?.role as 'client' | 'landscaper' | 'admin') || 'client';

  useEffect(() => { 
    if (!authLoading && userId) fetchPaymentData(); 
    else if (!authLoading && !userId) setLoading(false);
  }, [userId, userRole, authLoading]);

  const fetchPaymentData = async () => {
    if (!userId) { setLoading(false); return; }
    try {
      setLoading(true);
      let query = supabase.from('payments').select('*');
      if (userRole === 'client') query = query.eq('client_id', userId);
      else if (userRole === 'landscaper') query = query.eq('landscaper_id', userId);
      const { data: payments, error } = await query.order('created_at', { ascending: false });
      if (error && error.code !== 'PGRST116') {
        setLoadError('Data could not be loaded.');
        setLoading(false);
        return;
      }
      const paymentsData = payments || [];
      setTransactions(paymentsData);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      setStats({
        totalRevenue: paymentsData.filter(p => p?.status === 'succeeded').reduce((sum, p) => sum + (p?.amount || 0), 0),
        pendingPayments: paymentsData.filter(p => p?.status === 'pending').length,
        completedPayments: paymentsData.filter(p => p?.status === 'succeeded').length,
        refundedAmount: paymentsData.filter(p => p?.status === 'refunded').reduce((sum, p) => sum + (p?.amount || 0), 0),
        monthlyRevenue: paymentsData.filter(p => { const d = new Date(p?.created_at || 0); return p?.status === 'succeeded' && d.getMonth() === currentMonth && d.getFullYear() === currentYear; }).reduce((sum, p) => sum + (p?.amount || 0), 0),
        subscriptionRevenue: paymentsData.filter(p => p?.status === 'succeeded' && p?.subscription_id).reduce((sum, p) => sum + (p?.amount || 0), 0)
      });
      setLoadError(null);
    } catch (error) {
      setLoadError('Data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => { setRefreshing(true); await fetchPaymentData(); setRefreshing(false); toast({ title: "Refreshed" }); };
  const handleDownloadInvoice = async (transactionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', { body: { transactionId, userId } });
      if (error) throw error;
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `invoice-${transactionId}.pdf`; a.click();
      toast({ title: "Success", description: "Invoice downloaded" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to download invoice", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const cfg = { succeeded: { label: 'Completed', color: 'bg-green-100 text-green-800' }, pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' }, failed: { label: 'Failed', color: 'bg-red-100 text-red-800' }, refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' } };
    const c = cfg[status as keyof typeof cfg] || cfg.pending;
    return <Badge className={c.color}>{c.label}</Badge>;
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <Card className="bg-slate-800 border-slate-700"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-300">{title}</p><p className="text-2xl font-bold text-white">{value}</p>{trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}</div><Icon className={`h-8 w-8 ${color}`} /></div></CardContent></Card>
  );

  // Auth loading guard - prevents white screen on refresh
  if (authLoading) {
    return (
      <PaymentLayout activeTab="overview">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
        </div>
      </PaymentLayout>
    );
  }

  if (loadError) {
    return (
      <PaymentLayout activeTab="overview">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="max-w-md text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Payments Unavailable</h2>
            <p className="text-gray-400">{loadError}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 rounded-xl hover:bg-emerald-500/30">Refresh</button>
          </div>
        </div>
      </PaymentLayout>
    );
  }

  if (loading) {
    return (
      <PaymentLayout activeTab="overview">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (<Card key={i} className="bg-slate-800 border-slate-700"><CardContent className="p-6"><div className="animate-pulse"><div className="h-4 bg-slate-600 rounded mb-2"></div><div className="h-8 bg-slate-600 rounded"></div></div></CardContent></Card>))}
          </div>
        </div>
      </PaymentLayout>
    );
  }

  return (
    <PaymentLayout activeTab="overview">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Payment Overview</h2>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="border-slate-600 text-white hover:bg-slate-700"><RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />Refresh</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title={userRole === 'client' ? 'Total Spent' : 'Total Revenue'} value={`$${(stats.totalRevenue / 100).toFixed(2)}`} icon={DollarSign} color="text-green-400" trend="+12% from last month" />
          <StatCard title="This Month" value={`$${(stats.monthlyRevenue / 100).toFixed(2)}`} icon={TrendingUp} color="text-blue-400" />
          <StatCard title="Pending" value={stats.pendingPayments} icon={Clock} color="text-yellow-400" />
          <StatCard title="Completed" value={stats.completedPayments} icon={CheckCircle} color="text-green-400" />
          <StatCard title="Subscriptions" value={`$${(stats.subscriptionRevenue / 100).toFixed(2)}`} icon={Receipt} color="text-purple-400" />
          <StatCard title="Refunded" value={`$${(stats.refundedAmount / 100).toFixed(2)}`} icon={AlertCircle} color="text-red-400" />
        </div>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><CreditCard className="h-5 w-5" />Recent Transactions</CardTitle></CardHeader>
          <CardContent>
            {(transactions || []).length === 0 ? (
              <div className="text-center py-8"><Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-medium text-white mb-2">No transactions yet</h3><p className="text-gray-400">Your payment history will appear here</p></div>
            ) : (
              <div className="space-y-4">
                {(transactions || []).slice(0, 10).map((t) => (
                  <div key={t?.id || Math.random()} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div className="flex-1 min-w-0 pr-4"><p className="font-medium text-white truncate">{t?.description || 'Payment'}</p><p className="text-sm text-gray-400">{t?.created_at ? new Date(t.created_at).toLocaleDateString() : 'Unknown'}</p></div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">${((t?.amount || 0) / 100).toFixed(2)}</span>
                      {getStatusBadge(t?.status || 'pending')}
                      <Button variant="outline" size="sm" onClick={() => t?.id && handleDownloadInvoice(t.id)} className="border-slate-600 text-white hover:bg-slate-600"><Download className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PaymentLayout>
  );
}
