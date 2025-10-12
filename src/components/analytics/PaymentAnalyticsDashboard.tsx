import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RevenueMetricsChart } from './RevenueMetricsChart';
import { PaymentSuccessRateChart } from './PaymentSuccessRateChart';
import { ChurnAnalysisChart } from './ChurnAnalysisChart';
import { FailedPaymentsChart } from './FailedPaymentsChart';
import { CustomerLifetimeValueChart } from './CustomerLifetimeValueChart';
import { ExportDataButton } from './ExportDataButton';
import { supabase } from '@/lib/supabase';
import { Download, TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle } from 'lucide-react';

interface PaymentMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  paymentSuccessRate: number;
  churnRate: number;
  failedPayments: number;
  averageCustomerLifetimeValue: number;
  activeSubscriptions: number;
  revenueGrowth: number;
}

export function PaymentAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentMetrics();
    const interval = setInterval(fetchPaymentMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchPaymentMetrics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('payment-analytics', {
        body: { timeRange }
      });

      if (error) throw error;
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching payment metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Analytics</h1>
          <p className="text-muted-foreground">Comprehensive payment and revenue insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <ExportDataButton timeRange={timeRange} />
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.totalRevenue.toLocaleString() || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics?.revenueGrowth && metrics.revenueGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(metrics?.revenueGrowth || 0)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.monthlyRecurringRevenue.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Monthly Recurring Revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Badge variant={metrics?.paymentSuccessRate && metrics.paymentSuccessRate > 95 ? "default" : "destructive"}>
              {metrics?.paymentSuccessRate.toFixed(1) || 0}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.paymentSuccessRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">Payment success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.churnRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">Monthly churn rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="success-rate">Success Rate</TabsTrigger>
          <TabsTrigger value="churn">Churn Analysis</TabsTrigger>
          <TabsTrigger value="failed">Failed Payments</TabsTrigger>
          <TabsTrigger value="ltv">Customer LTV</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <RevenueMetricsChart timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="success-rate">
          <PaymentSuccessRateChart timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="churn">
          <ChurnAnalysisChart timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="failed">
          <FailedPaymentsChart timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="ltv">
          <CustomerLifetimeValueChart timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}