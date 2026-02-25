import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calendar, Target, Briefcase } from 'lucide-react';

interface EarningsData {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayouts: number;
  completedJobs: number;
  averageJobValue: number;
}

interface EarningsBreakdownProps {
  data?: EarningsData;
}

const defaultEarningsData: EarningsData = {
  totalEarnings: 15750.00,
  thisMonth: 3250.00,
  lastMonth: 2890.00,
  pendingPayouts: 850.00,
  completedJobs: 47,
  averageJobValue: 335.00
};

export default function EarningsBreakdown({ data }: EarningsBreakdownProps) {
  const earningsData = data || defaultEarningsData;
  const hasEarnings = earningsData.completedJobs > 0;
  
  const monthlyGrowth = earningsData.lastMonth > 0 
    ? ((earningsData.thisMonth - earningsData.lastMonth) / earningsData.lastMonth * 100).toFixed(1)
    : '0';

  // Empty state component
  if (!hasEarnings) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Briefcase className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Start Your Journey</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Complete your first job to start earning and unlock higher tiers.
            </p>
            <p className="text-sm text-slate-500 mt-4">
              Your earnings, payouts, and performance metrics will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Total Earnings */}
      <Card className="bg-gradient-to-br from-emerald-900/50 to-emerald-950/50 border-emerald-700/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-emerald-300">Total Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">${earningsData.totalEarnings.toLocaleString()}</div>
          <p className="text-xs text-emerald-400/80 mt-1">All-time earnings</p>
        </CardContent>
      </Card>

      {/* This Month */}
      <Card className="bg-gradient-to-br from-blue-900/50 to-blue-950/50 border-blue-700/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-300">This Month</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">${earningsData.thisMonth.toLocaleString()}</div>
          <div className="flex items-center mt-1 flex-wrap gap-1">
            <Badge 
              variant="secondary" 
              className={`text-xs ${
                parseFloat(monthlyGrowth) > 0 
                  ? 'bg-emerald-900/50 text-emerald-400 border-emerald-700' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {parseFloat(monthlyGrowth) > 0 ? '+' : ''}{monthlyGrowth}%
            </Badge>
            <p className="text-xs text-blue-400/80">vs last month</p>
          </div>
        </CardContent>
      </Card>

      {/* Pending Payouts */}
      <Card className="bg-gradient-to-br from-amber-900/50 to-amber-950/50 border-amber-700/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-amber-300">Pending Payouts</CardTitle>
          <Calendar className="h-4 w-4 text-amber-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">${earningsData.pendingPayouts.toLocaleString()}</div>
          <p className="text-xs text-amber-400/80 mt-1">Next payout in 3 days</p>
        </CardContent>
      </Card>

      {/* Completed Jobs */}
      <Card className="bg-gradient-to-br from-purple-900/50 to-purple-950/50 border-purple-700/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-300">Completed Jobs</CardTitle>
          <Target className="h-4 w-4 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{earningsData.completedJobs}</div>
          <p className="text-xs text-purple-400/80 mt-1">Jobs completed</p>
        </CardContent>
      </Card>

      {/* Average Job Value */}
      <Card className="bg-gradient-to-br from-cyan-900/50 to-cyan-950/50 border-cyan-700/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-cyan-300">Average Job Value</CardTitle>
          <DollarSign className="h-4 w-4 text-cyan-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">${earningsData.averageJobValue.toLocaleString()}</div>
          <p className="text-xs text-cyan-400/80 mt-1">Per completed job</p>
        </CardContent>
      </Card>
    </div>
  );
}
