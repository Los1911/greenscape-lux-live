import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface JobCompletionChartProps {
  filters: {
    dateRange: string;
    serviceType: string;
    location: string;
  };
}

export const JobCompletionChart: React.FC<JobCompletionChartProps> = ({ filters }) => {
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

  const jobData = data?.jobData || [];
  const totalJobs = jobData.reduce((sum, item) => sum + item.total, 0);
  const completedJobs = jobData.reduce((sum, item) => sum + item.completed, 0);
  const completionRate = totalJobs ? (completedJobs / totalJobs) * 100 : 0;

  // Calculate completion rate for each day
  const completionRateData = jobData.map(item => ({
    ...item,
    completionRate: item.total ? (item.completed / item.total) * 100 : 0,
    pending: item.total - item.completed
  }));

  // Job status breakdown
  const statusBreakdown = [
    { 
      status: 'Completed', 
      count: completedJobs, 
      percentage: totalJobs ? (completedJobs / totalJobs) * 100 : 0,
      color: '#22c55e'
    },
    { 
      status: 'In Progress', 
      count: Math.floor(totalJobs * 0.2), 
      percentage: 20,
      color: '#f59e0b'
    },
    { 
      status: 'Pending', 
      count: totalJobs - completedJobs - Math.floor(totalJobs * 0.2), 
      percentage: totalJobs ? ((totalJobs - completedJobs - Math.floor(totalJobs * 0.2)) / totalJobs) * 100 : 0,
      color: '#ef4444'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600">{completionRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{totalJobs}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Jobs/Day</p>
                <p className="text-2xl font-bold">{jobData.length ? (totalJobs / jobData.length).toFixed(1) : 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Completion Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={completionRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value, name) => [
                    name === 'completionRate' ? `${value.toFixed(1)}%` : value,
                    name === 'completionRate' ? 'Completion Rate' : 
                    name === 'completed' ? 'Completed' : 'Total'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stackId="1"
                  stroke="#22c55e" 
                  fill="#22c55e"
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="pending" 
                  stackId="1"
                  stroke="#ef4444" 
                  fill="#ef4444"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Jobs']} />
                <Bar dataKey="count" fill={(entry) => entry.color} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {statusBreakdown.map((item) => (
                <div key={item.status} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span>{item.status}</span>
                  </div>
                  <span className="font-medium">{item.count} ({item.percentage.toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};