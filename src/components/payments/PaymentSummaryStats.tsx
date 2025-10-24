import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface PaymentSummaryStatsProps {
  transactions: Array<{
    amount: number;
    type: string;
    created: number;
    status: string;
    fees: number;
  }>;
}

export default function PaymentSummaryStats({ transactions }: PaymentSummaryStatsProps) {
  const calculateStats = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentTransactions = transactions.filter(t => 
      new Date(t.created * 1000) >= thirtyDaysAgo
    );
    const previousTransactions = transactions.filter(t => {
      const date = new Date(t.created * 1000);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    const totalAmount = recentTransactions
      .filter(t => t.type === 'payment' && t.status === 'succeeded')
      .reduce((sum, t) => sum + t.amount, 0);

    const previousAmount = previousTransactions
      .filter(t => t.type === 'payment' && t.status === 'succeeded')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalFees = recentTransactions.reduce((sum, t) => sum + t.fees, 0);
    const refundAmount = recentTransactions
      .filter(t => t.type === 'refund')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const growth = previousAmount > 0 
      ? ((totalAmount - previousAmount) / previousAmount) * 100 
      : 0;

    return {
      totalAmount,
      totalFees,
      refundAmount,
      growth,
      transactionCount: recentTransactions.length
    };
  };

  const stats = calculateStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue (30d)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
          <div className={`text-xs flex items-center ${stats.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.growth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(stats.growth).toFixed(1)}% from last month
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalFees)}</div>
          <p className="text-xs text-muted-foreground">
            Processing & platform fees
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Refunds</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.refundAmount)}</div>
          <p className="text-xs text-muted-foreground">
            Total refunded amount
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.transactionCount}</div>
          <p className="text-xs text-muted-foreground">
            Last 30 days
          </p>
        </CardContent>
      </Card>
    </div>
  );
}