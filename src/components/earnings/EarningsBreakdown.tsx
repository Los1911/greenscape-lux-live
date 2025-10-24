import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calendar, Target } from 'lucide-react';

interface EarningsData {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayouts: number;
  completedJobs: number;
  averageJobValue: number;
}

const mockEarningsData: EarningsData = {
  totalEarnings: 15750.00,
  thisMonth: 3250.00,
  lastMonth: 2890.00,
  pendingPayouts: 850.00,
  completedJobs: 47,
  averageJobValue: 335.00
};

export default function EarningsBreakdown() {
  const monthlyGrowth = ((mockEarningsData.thisMonth - mockEarningsData.lastMonth) / mockEarningsData.lastMonth * 100).toFixed(1);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700">Total Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">${mockEarningsData.totalEarnings.toLocaleString()}</div>
          <p className="text-xs text-green-600 mt-1">All-time earnings</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">This Month</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">${mockEarningsData.thisMonth.toLocaleString()}</div>
          <div className="flex items-center mt-1">
            <Badge variant={parseFloat(monthlyGrowth) > 0 ? "default" : "secondary"} className="text-xs">
              {parseFloat(monthlyGrowth) > 0 ? '+' : ''}{monthlyGrowth}%
            </Badge>
            <p className="text-xs text-blue-600 ml-2">vs last month</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-700">Pending Payouts</CardTitle>
          <Calendar className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-900">${mockEarningsData.pendingPayouts.toLocaleString()}</div>
          <p className="text-xs text-orange-600 mt-1">Next payout in 3 days</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">Completed Jobs</CardTitle>
          <Target className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900">{mockEarningsData.completedJobs}</div>
          <p className="text-xs text-purple-600 mt-1">Jobs completed</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-teal-700">Average Job Value</CardTitle>
          <DollarSign className="h-4 w-4 text-teal-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-teal-900">${mockEarningsData.averageJobValue.toLocaleString()}</div>
          <p className="text-xs text-teal-600 mt-1">Per completed job</p>
        </CardContent>
      </Card>
    </div>
  );
}