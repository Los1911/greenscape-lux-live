import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { DollarSign, Percent, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommissionTrackerProps {
  filters: {
    dateRange: string;
    serviceType: string;
    location: string;
  };
}

export const CommissionTracker: React.FC<CommissionTrackerProps> = ({ filters }) => {
  const { data, loading } = useAnalyticsData(filters);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const commissionData = data?.commissionData || [];
  const totalCommissions = commissionData.reduce((sum, item) => sum + item.commission, 0);
  const totalJobs = commissionData.reduce((sum, item) => sum + item.jobs, 0);
  const avgCommissionPerJob = totalJobs ? totalCommissions / totalJobs : 0;
  const topPerformers = commissionData.slice(0, 5);

  // Commission trend data (simulated monthly data)
  const commissionTrend = [
    { month: 'Jan', commission: totalCommissions * 0.8, jobs: totalJobs * 0.8 },
    { month: 'Feb', commission: totalCommissions * 0.85, jobs: totalJobs * 0.85 },
    { month: 'Mar', commission: totalCommissions * 0.9, jobs: totalJobs * 0.9 },
    { month: 'Apr', commission: totalCommissions * 0.95, jobs: totalJobs * 0.95 },
    { month: 'May', commission: totalCommissions, jobs: totalJobs }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Commissions</p>
                <p className="text-2xl font-bold text-green-600">${totalCommissions.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commission Rate</p>
                <p className="text-2xl font-bold text-blue-600">10%</p>
              </div>
              <Percent className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Landscapers</p>
                <p className="text-2xl font-bold">{commissionData.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg/Job</p>
                <p className="text-2xl font-bold text-orange-600">${avgCommissionPerJob.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Landscapers</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPerformers} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                <YAxis type="category" dataKey="landscaper" width={100} />
                <Tooltip formatter={(value) => [`$${value}`, 'Commission']} />
                <Bar dataKey="commission" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commission Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={commissionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => [`$${value}`, 'Commission']} />
                <Line 
                  type="monotone" 
                  dataKey="commission" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Commission Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Commission Details</CardTitle>
          <Button variant="outline" size="sm">
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Landscaper</th>
                  <th className="text-right p-2">Jobs Completed</th>
                  <th className="text-right p-2">Total Revenue</th>
                  <th className="text-right p-2">Commission Earned</th>
                  <th className="text-right p-2">Commission Rate</th>
                </tr>
              </thead>
              <tbody>
                {commissionData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{item.landscaper}</td>
                    <td className="p-2 text-right">{item.jobs}</td>
                    <td className="p-2 text-right">${(item.commission * 10).toLocaleString()}</td>
                    <td className="p-2 text-right text-green-600 font-medium">
                      ${item.commission.toLocaleString()}
                    </td>
                    <td className="p-2 text-right">10%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};