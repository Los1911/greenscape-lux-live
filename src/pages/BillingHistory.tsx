import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface BillingRecord {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoice_url?: string;
}

export default function BillingHistory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth loading guard - show loading UI while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (user) {
      fetchBillingHistory();
    } else {
      setLoading(false);
    }
  }, [user]);


  const fetchBillingHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      const formattedRecords: BillingRecord[] = (payments || []).map(payment => ({
        id: payment.id,
        date: payment.created_at,
        amount: payment.amount / 100, // Convert from cents
        status: payment.status === 'succeeded' ? 'paid' : payment.status === 'processing' ? 'pending' : 'failed',
        description: payment.description || 'Service Payment',
        invoice_url: payment.receipt_url || undefined
      }));
      
      setBillingHistory(formattedRecords);
    } catch (error: any) {
      console.error('Error fetching billing history:', error);
      setError(error.message || 'Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/20 text-emerald-400';
      case 'pending': return 'bg-orange-500/20 text-orange-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateTotals = () => {
    const totalPaid = billingHistory
      .filter(r => r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const outstanding = billingHistory
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0);
    
    return { totalPaid, outstanding, count: billingHistory.length };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading billing history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/client-dashboard')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Billing History</h1>
          <p className="text-gray-400">View your payment history and download invoices</p>
        </div>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5 text-emerald-400" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {billingHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No billing history found.
              </div>
            ) : (
              <div className="space-y-4">
                {billingHistory.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-medium">{record.description}</h3>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm">{formatDate(record.date)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-white font-semibold">{formatAmount(record.amount)}</div>
                      </div>
                      {record.invoice_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(record.invoice_url, '_blank')}
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-400">{formatAmount(totals.totalPaid)}</div>
                <div className="text-gray-400 text-sm">Total Paid</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">{formatAmount(totals.outstanding)}</div>
                <div className="text-gray-400 text-sm">Outstanding</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{totals.count}</div>
                <div className="text-gray-400 text-sm">Total Invoices</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
