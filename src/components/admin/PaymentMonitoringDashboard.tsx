import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LiveTransactionsFeed } from './LiveTransactionsFeed';
import { PaymentMetricsCards } from './PaymentMetricsCards';
import { CommissionPayoutTracker } from './CommissionPayoutTracker';
import { SystemHealthMonitor } from './SystemHealthMonitor';
import { PaymentAlertsSystem } from './PaymentAlertsSystem';
import { PaymentChartsAndGraphs } from './PaymentChartsAndGraphs';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, DollarSign, TrendingUp, Activity, RefreshCw } from 'lucide-react';

interface PaymentDashboardData {
  totalRevenue: number;
  successRate: number;
  activeSubscriptions: number;
  pendingPayouts: number;
  failedPayments: number;
  webhookHealth: 'healthy' | 'warning' | 'critical';
}

export const PaymentMonitoringDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<PaymentDashboardData>({
    totalRevenue: 0,
    successRate: 0,
    activeSubscriptions: 0,
    pendingPayouts: 0,
    failedPayments: 0,
    webhookHealth: 'healthy'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    
    fetchDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [authLoading, user, autoRefresh]);


  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch payment metrics
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Fetch subscription data
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active');

      // Fetch payout data
      const { data: payouts } = await supabase
        .from('payouts')
        .select('*')
        .eq('status', 'pending');

      // Calculate metrics
      const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const successfulPayments = payments?.filter(p => p.status === 'succeeded').length || 0;
      const successRate = payments?.length ? (successfulPayments / payments.length) * 100 : 0;
      const failedPayments = payments?.filter(p => p.status === 'failed').length || 0;

      setDashboardData({
        totalRevenue,
        successRate,
        activeSubscriptions: subscriptions?.length || 0,
        pendingPayouts: payouts?.length || 0,
        failedPayments,
        webhookHealth: failedPayments > 5 ? 'critical' : failedPayments > 2 ? 'warning' : 'healthy'
      });

      // Check for alerts
      if (failedPayments > 5) {
        setAlerts(prev => [...prev, {
          id: Date.now(),
          type: 'error',
          message: `High number of failed payments: ${failedPayments} in the last 24 hours`,
          timestamp: new Date()
        }]);
      }
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load payment data');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    );
  }

  const getHealthBadgeColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };


  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Monitoring Dashboard</h1>
          <p className="text-muted-foreground">Real-time payment system monitoring and analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className={getHealthBadgeColor(dashboardData.webhookHealth)}>
            System {dashboardData.webhookHealth}
          </Badge>
          <Button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
          >
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={fetchDashboardData} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh Now'}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      <PaymentAlertsSystem alerts={alerts} onDismiss={(id) => 
        setAlerts(prev => prev.filter(alert => alert.id !== id))
      } />

      {/* Key Metrics */}
      <PaymentMetricsCards data={dashboardData} />

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Live Transactions</TabsTrigger>
          <TabsTrigger value="commissions">Commission Payouts</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PaymentChartsAndGraphs />
            <LiveTransactionsFeed limit={10} />
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <LiveTransactionsFeed />
        </TabsContent>

        <TabsContent value="commissions">
          <CommissionPayoutTracker />
        </TabsContent>

        <TabsContent value="system">
          <SystemHealthMonitor />
        </TabsContent>

        <TabsContent value="analytics">
          <PaymentChartsAndGraphs detailed />
        </TabsContent>
      </Tabs>
    </div>
  );
};