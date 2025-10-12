import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard, 
  Receipt, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Plus
} from 'lucide-react';

interface PaymentSystemProps {
  userId: string;
  userRole: 'client' | 'landscaper' | 'admin';
}

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

export default function ComprehensivePaymentSystem({ userId, userRole }: PaymentSystemProps) {
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
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentData();
  }, [userId, userRole]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      
      // Fetch payment statistics
      let query = supabase.from('payments').select('*');
      
      if (userRole === 'client') {
        query = query.eq('client_id', userId);
      } else if (userRole === 'landscaper') {
        query = query.eq('landscaper_id', userId);
      }

      const { data: payments, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;

      const paymentsData = payments || [];
      setTransactions(paymentsData);

      // Calculate statistics
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const newStats = {
        totalRevenue: paymentsData
          .filter(p => p.status === 'succeeded')
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        pendingPayments: paymentsData.filter(p => p.status === 'pending').length,
        completedPayments: paymentsData.filter(p => p.status === 'succeeded').length,
        refundedAmount: paymentsData
          .filter(p => p.status === 'refunded')
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        monthlyRevenue: paymentsData
          .filter(p => {
            const paymentDate = new Date(p.created_at);
            return p.status === 'succeeded' && 
                   paymentDate.getMonth() === currentMonth && 
                   paymentDate.getFullYear() === currentYear;
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        subscriptionRevenue: paymentsData
          .filter(p => p.status === 'succeeded' && p.subscription_id)
          .reduce((sum, p) => sum + (p.amount || 0), 0)
      };
      
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (transactionId: string) => {
    try {
      const response = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, userId })
      });

      if (!response.ok) throw new Error('Failed to generate invoice');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${transactionId}.pdf`;
      a.click();
      
      toast({
        title: "Success",
        description: "Invoice generated and downloaded"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive"
      });
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {trend && (
              <p className="text-xs text-gray-500 mt-1">{trend}</p>
            )}
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      succeeded: { label: 'Completed', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      failed: { label: 'Failed', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      refunded: { label: 'Refunded', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 sm:h-8 bg-gray-200 rounded"></div>
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
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title={userRole === 'client' ? 'Total Spent' : 'Total Revenue'}
          value={`$${(stats.totalRevenue / 100).toFixed(2)}`}
          icon={DollarSign}
          color="text-green-600"
          trend="+12% from last month"
        />
        <StatCard
          title="This Month"
          value={`$${(stats.monthlyRevenue / 100).toFixed(2)}`}
          icon={TrendingUp}
          color="text-blue-600"
        />
        <StatCard
          title="Pending"
          value={stats.pendingPayments}
          icon={Clock}
          color="text-yellow-600"
        />
        <StatCard
          title="Completed"
          value={stats.completedPayments}
          icon={CheckCircle}
          color="text-green-600"
        />
        <StatCard
          title="Subscriptions"
          value={`$${(stats.subscriptionRevenue / 100).toFixed(2)}`}
          icon={Receipt}
          color="text-purple-600"
        />
        <StatCard
          title="Refunded"
          value={`$${(stats.refundedAmount / 100).toFixed(2)}`}
          icon={AlertCircle}
          color="text-red-600"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full min-w-max bg-white/10 backdrop-blur border border-gray-200 p-1 gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">Overview</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">Transactions</TabsTrigger>
            <TabsTrigger value="invoices" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">Invoices</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap">Reports</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Revenue chart would be displayed here
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Visa ending in 4242</span>
                    <Badge>Default</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg min-w-0">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base truncate" title={transaction.description}>
                            {transaction.description}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        ${(transaction.amount / 100).toFixed(2)}
                      </span>
                      {getStatusBadge(transaction.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateInvoice(transaction.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
                <p className="text-gray-500 mb-4">Create your first invoice to get started</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax & Financial Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  Download Tax Report
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Generate P&L Statement
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <Receipt className="h-6 w-6 mb-2" />
                  Export Transactions
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Revenue Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}