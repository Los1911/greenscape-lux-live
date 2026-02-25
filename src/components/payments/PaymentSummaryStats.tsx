import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Clock, Receipt } from 'lucide-react';

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

    const pendingAmount = recentTransactions
      .filter(t => t.status === 'pending' || t.status === 'processing')
      .reduce((sum, t) => sum + t.amount, 0);

    const growth = previousAmount > 0 
      ? ((totalAmount - previousAmount) / previousAmount) * 100 
      : 0;

    return {
      totalAmount,
      totalFees,
      refundAmount,
      pendingAmount,
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total Revenue */}
      <div className="bg-black/40 border border-emerald-500/15 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-xs sm:text-sm text-gray-400 truncate">Revenue (30d)</span>
        </div>
        <p className="text-lg sm:text-2xl font-bold text-white truncate">
          {formatCurrency(stats.totalAmount)}
        </p>
        <div className={`text-xs flex items-center mt-1 ${stats.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {stats.growth >= 0 ? (
            <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1 flex-shrink-0" />
          )}
          <span className="truncate">{Math.abs(stats.growth).toFixed(1)}% vs last month</span>
        </div>
      </div>

      {/* Pending */}
      <div className="bg-black/40 border border-emerald-500/15 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <span className="text-xs sm:text-sm text-gray-400 truncate">Pending</span>
        </div>
        <p className="text-lg sm:text-2xl font-bold text-white truncate">
          {formatCurrency(stats.pendingAmount)}
        </p>
        <p className="text-xs text-gray-500 mt-1 truncate">
          Awaiting completion
        </p>
      </div>

      {/* Refunds */}
      <div className="bg-black/40 border border-emerald-500/15 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="h-4 w-4 text-red-400" />
          </div>
          <span className="text-xs sm:text-sm text-gray-400 truncate">Refunds</span>
        </div>
        <p className="text-lg sm:text-2xl font-bold text-white truncate">
          {formatCurrency(stats.refundAmount)}
        </p>
        <p className="text-xs text-gray-500 mt-1 truncate">
          Total refunded
        </p>
      </div>

      {/* Transactions */}
      <div className="bg-black/40 border border-emerald-500/15 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Receipt className="h-4 w-4 text-blue-400" />
          </div>
          <span className="text-xs sm:text-sm text-gray-400 truncate">Transactions</span>
        </div>
        <p className="text-lg sm:text-2xl font-bold text-white">
          {stats.transactionCount}
        </p>
        <p className="text-xs text-gray-500 mt-1 truncate">
          Last 30 days
        </p>
      </div>
    </div>
  );
}
