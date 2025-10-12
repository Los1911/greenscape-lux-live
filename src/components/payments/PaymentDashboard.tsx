import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import PaymentHistory from './PaymentHistory';
import InvoiceGenerator from './InvoiceGenerator';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';

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
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    refundedAmount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentStats();
  }, [userId, userType]);

  const fetchPaymentStats = async () => {
    try {
      let query = supabase.from('payments').select('amount, status');
      
      if (userType === 'customer') {
        query = query.eq('customer_id', userId);
      } else if (userType === 'landscaper') {
        query = query.eq('landscaper_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const payments = data || [];
      const newStats = {
        totalRevenue: payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0),
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        completedPayments: payments.filter(p => p.status === 'succeeded').length,
        refundedAmount: payments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + p.amount, 0)
      };
      
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title={userType === 'customer' ? 'Total Spent' : 'Total Revenue'}
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="text-green-600"
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={Clock}
          color="text-yellow-600"
        />
        <StatCard
          title="Completed Payments"
          value={stats.completedPayments}
          icon={CheckCircle}
          color="text-blue-600"
        />
        <StatCard
          title="Refunded"
          value={`$${stats.refundedAmount.toFixed(2)}`}
          icon={TrendingUp}
          color="text-red-600"
        />
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          {userType === 'landscaper' && (
            <TabsTrigger value="invoices">Generate Invoice</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="history">
          <PaymentHistory 
            customerId={userType === 'customer' ? userId : undefined}
            landscaperId={userType === 'landscaper' ? userId : undefined}
          />
        </TabsContent>
        
        {userType === 'landscaper' && (
          <TabsContent value="invoices">
            <InvoiceGenerator
              customerId=""
              landscaperId={userId}
              onInvoiceCreated={(invoiceId) => {
                console.log('Invoice created:', invoiceId);
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}