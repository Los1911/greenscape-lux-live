import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { DollarSign, TrendingUp } from 'lucide-react';

interface RevenueChartProps {
  filters: {
    dateRange: string;
    serviceType: string;
    location: string;
  };
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ filters }) => {
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

  const revenueData = data?.revenueData || [];
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0);
  const avgDailyRevenue = revenueData.length ? totalRevenue / revenueData.length : 0;

  // Group revenue by service type for breakdown
  const serviceBreakdown = [
    { service: 'Lawn Mowing', revenue: totalRevenue * 0.4, percentage: 40 },
    { service: 'Landscaping', revenue: totalRevenue * 0.3, percentage: 30 },
    { service: 'Tree Service', revenue: totalRevenue * 0.15, percentage: 15 },
    { service: 'Garden Maintenance', revenue: totalRevenue * 0.1, percentage: 10 },
    { service: 'Snow Removal', revenue: totalRevenue * 0.05, percentage: 5 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">
              Average: ${avgDailyRevenue.toFixed(0)}/day
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value) => [`$${value}`, 'Revenue']}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue by Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={serviceBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="service" angle={-45} textAnchor="end" height={80} />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {serviceBreakdown.map((item) => (
              <div key={item.service} className="flex justify-between items-center text-sm">
                <span>{item.service}</span>
                <span className="font-medium">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};