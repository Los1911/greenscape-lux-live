import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Receipt, 
  Workflow, 
  CheckCircle, 
  AlertCircle,
  Clock,
  DollarSign,
  Users,
  TrendingUp
} from 'lucide-react';
import PaymentWorkflowManager from './payments/PaymentWorkflowManager';
import ReceiptGenerator from './payments/ReceiptGenerator';
import PaymentFlowTestSuite from './payments/PaymentFlowTestSuite';
import StripeTestDashboard from './StripeTestDashboard';

export default function PaymentSystemDashboard() {
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);

  // Mock data for demonstration
  const workflowStats = {
    totalPayments: 1247,
    successfulPayments: 1189,
    failedPayments: 58,
    totalRevenue: 187350.00,
    pendingPayouts: 23,
    averageOrderValue: 150.25
  };

  const recentTransactions = [
    {
      id: 'pi_1234567890',
      customer: 'John Smith',
      amount: 150.00,
      status: 'succeeded',
      created: '2024-01-15T10:30:00Z',
      service: 'Lawn Mowing'
    },
    {
      id: 'pi_0987654321',
      customer: 'Sarah Johnson',
      amount: 275.50,
      status: 'processing',
      created: '2024-01-15T09:15:00Z',
      service: 'Garden Maintenance'
    },
    {
      id: 'pi_1122334455',
      customer: 'Mike Davis',
      amount: 89.99,
      status: 'succeeded',
      created: '2024-01-15T08:45:00Z',
      service: 'Hedge Trimming'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black text-white">
      <header className="bg-black/60 backdrop-blur border-b border-emerald-500/30">
        <div className="container mx-auto padding-responsive">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-emerald-400 glow-text">
              GreenScape Lux Payment System
            </h1>
            <Badge variant="outline" className="pill-button bg-emerald-500/20 text-emerald-300 border-emerald-500/50">
              Production Ready
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-responsive">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <Card className="pill-card bg-black/60 backdrop-blur border-emerald-500/25">
            <CardContent className="padding-responsive">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Payments</p>
                  <p className="text-2xl font-bold text-white">{workflowStats.totalPayments.toLocaleString()}</p>
                </div>
                <CreditCard className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="pill-card bg-black/60 backdrop-blur border-emerald-500/25">
            <CardContent className="padding-responsive">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">${workflowStats.totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="pill-card bg-black/60 backdrop-blur border-emerald-500/25">
            <CardContent className="padding-responsive">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {((workflowStats.successfulPayments / workflowStats.totalPayments) * 100).toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="pill-card bg-black/60 backdrop-blur border-emerald-500/25">
            <CardContent className="padding-responsive">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Order Value</p>
                  <p className="text-2xl font-bold text-white">${workflowStats.averageOrderValue}</p>
                </div>
                <Users className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="workflow" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-black/60 backdrop-blur border border-emerald-500/25 rounded-full p-1">
            <TabsTrigger value="workflow" className="pill-button flex items-center gap-2 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">
              <Workflow className="h-4 w-4" />
              Payment Workflow
            </TabsTrigger>
            <TabsTrigger value="receipts" className="pill-button flex items-center gap-2 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">
              <Receipt className="h-4 w-4" />
              Receipt Generator
            </TabsTrigger>
            <TabsTrigger value="testing" className="pill-button flex items-center gap-2 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">
              <CreditCard className="h-4 w-4" />
              Flow Testing
            </TabsTrigger>
            <TabsTrigger value="integration" className="pill-button flex items-center gap-2 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">
              <CheckCircle className="h-4 w-4" />
              Stripe Integration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflow" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PaymentWorkflowManager 
                jobId="job_12345" 
                customerId="customer_67890"
              />
              
              <Card className="pill-card bg-black/60 backdrop-blur border-emerald-500/25">
                <CardHeader className="padding-responsive">
                  <CardTitle className="text-emerald-300">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent className="padding-responsive pt-0">
                  <div className="space-y-4">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border border-emerald-500/20 rounded-2xl bg-black/40">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(transaction.status)}
                          <div>
                            <p className="font-medium text-white">{transaction.customer}</p>
                            <p className="text-sm text-gray-400">{transaction.service}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-white">${transaction.amount}</p>
                          <p className="text-sm text-gray-400 capitalize">{transaction.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="receipts">
            <ReceiptGenerator paymentId="pi_1234567890" />
          </TabsContent>

          <TabsContent value="testing">
            <PaymentFlowTestSuite />
          </TabsContent>

          <TabsContent value="integration">
            <StripeTestDashboard />
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="bg-black/60 backdrop-blur border-t border-emerald-500/30 mt-12">
        <div className="container mx-auto padding-responsive">
          <p className="text-center text-gray-400">
            GreenScape Lux - Premium Landscaping Services - Payment Processing System
          </p>
        </div>
      </footer>
    </div>
  );
}