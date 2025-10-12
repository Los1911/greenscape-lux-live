import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface PayoutAnalytics {
  totalVolume: number;
  successRate: number;
  avgProcessingTime: number;
  failureRate: number;
  monthlyTrend: Array<{ month: string; volume: number; success: number; failed: number }>;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  topEarners: Array<{ name: string; amount: number; payouts: number }>;
}

export default function PayoutAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<PayoutAnalytics>({
    totalVolume: 0,
    successRate: 0,
    avgProcessingTime: 0,
    failureRate: 0,
    monthlyTrend: [],
    statusDistribution: [],
    topEarners: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: payoutLogs } = await supabase
        .from('payout_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (payoutLogs) {
        const totalVolume = payoutLogs.reduce((sum, log) => sum + log.amount, 0);
        const successful = payoutLogs.filter(log => log.status === 'completed');
        const failed = payoutLogs.filter(log => log.status === 'failed');
        
        // Generate monthly trend data
        const monthlyData = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          
          const monthLogs = payoutLogs.filter(log => {
            const logDate = new Date(log.created_at);
            return logDate.getMonth() === date.getMonth() && 
                   logDate.getFullYear() === date.getFullYear();
          });
          
          return {
            month: monthName,
            volume: monthLogs.reduce((sum, log) => sum + log.amount, 0),
            success: monthLogs.filter(log => log.status === 'completed').length,
            failed: monthLogs.filter(log => log.status === 'failed').length
          };
        }).reverse();

        // Status distribution
        const statusDist = [
          { name: 'Completed', value: successful.length, color: '#22c55e' },
          { name: 'Failed', value: failed.length, color: '#ef4444' },
          { name: 'Pending', value: payoutLogs.filter(log => log.status === 'pending').length, color: '#f59e0b' }
        ];

        // Mock top earners data
        const topEarners = [
          { name: 'Mike Johnson', amount: 2450, payouts: 12 },
          { name: 'Sarah Davis', amount: 2100, payouts: 10 },
          { name: 'Tom Wilson', amount: 1890, payouts: 9 },
          { name: 'Lisa Brown', amount: 1650, payouts: 8 },
          { name: 'John Smith', amount: 1420, payouts: 7 }
        ];

        setAnalytics({
          totalVolume,
          successRate: (successful.length / payoutLogs.length) * 100,
          avgProcessingTime: 2.3, // Mock data
          failureRate: (failed.length / payoutLogs.length) * 100,
          monthlyTrend: monthlyData,
          statusDistribution: statusDist,
          topEarners
        });
      }
    } catch (error) {
      console.error('Error fetching payout analytics:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-white">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/60 border-green-500/25 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Volume</p>
              <p className="text-2xl font-bold text-white">${analytics.totalVolume.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-green-400 text-sm">+12.5%</span>
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-black/60 border-blue-500/25 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-white">{analytics.successRate.toFixed(1)}%</p>
              <div className="flex items-center mt-1">
                <CheckCircle className="h-4 w-4 text-blue-400 mr-1" />
                <span className="text-blue-400 text-sm">+2.1%</span>
              </div>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-black/60 border-yellow-500/25 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Processing</p>
              <p className="text-2xl font-bold text-white">{analytics.avgProcessingTime}h</p>
              <div className="flex items-center mt-1">
                <Clock className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="text-yellow-400 text-sm">-0.5h</span>
              </div>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </Card>

        <Card className="bg-black/60 border-red-500/25 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Failure Rate</p>
              <p className="text-2xl font-bold text-white">{analytics.failureRate.toFixed(1)}%</p>
              <div className="flex items-center mt-1">
                <TrendingDown className="h-4 w-4 text-red-400 mr-1" />
                <span className="text-red-400 text-sm">-1.2%</span>
              </div>
            </div>
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card className="bg-black/60 border-green-500/25 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Monthly Payout Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="volume" fill="#22c55e" name="Volume ($)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Distribution */}
        <Card className="bg-black/60 border-green-500/25 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Payout Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.statusDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {analytics.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Earners */}
      <Card className="bg-black/60 border-green-500/25 p-6">
        <h3 className="text-xl font-bold text-white mb-4">Top Earning Landscapers</h3>
        <div className="space-y-3">
          {analytics.topEarners.map((earner, index) => (
            <div key={earner.name} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  {index + 1}
                </div>
                <div>
                  <p className="text-white font-medium">{earner.name}</p>
                  <p className="text-gray-400 text-sm">{earner.payouts} payouts</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">${earner.amount.toLocaleString()}</p>
                <Badge variant="secondary" className="text-xs">
                  ${(earner.amount / earner.payouts).toFixed(0)} avg
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}