import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface PaymentChartsProps {
  detailed?: boolean;
}

interface ChartData {
  name: string;
  value: number;
  amount?: number;
}

export const PaymentChartsAndGraphs: React.FC<PaymentChartsProps> = ({ detailed = false }) => {
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [statusData, setStatusData] = useState<ChartData[]>([]);
  const [trendData, setTrendData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch payment data for the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (payments) {
        // Revenue by day
        const revenueByDay = payments.reduce((acc: any, payment) => {
          const date = new Date(payment.created_at).toLocaleDateString();
          if (!acc[date]) {
            acc[date] = { name: date, value: 0, amount: 0 };
          }
          if (payment.status === 'succeeded') {
            acc[date].amount += payment.amount || 0;
            acc[date].value += 1;
          }
          return acc;
        }, {});

        setRevenueData(Object.values(revenueByDay));

        // Payment status distribution
        const statusCounts = payments.reduce((acc: any, payment) => {
          acc[payment.status] = (acc[payment.status] || 0) + 1;
          return acc;
        }, {});

        const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
          name: status,
          value: count as number
        }));

        setStatusData(statusChartData);

        // Trend data (hourly for today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayPayments = payments.filter(p => 
          new Date(p.created_at) >= today
        );

        const hourlyData = Array.from({ length: 24 }, (_, hour) => {
          const hourPayments = todayPayments.filter(p => 
            new Date(p.created_at).getHours() === hour
          );
          return {
            name: `${hour}:00`,
            value: hourPayments.length,
            amount: hourPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
          };
        });

        setTrendData(hourlyData);
      }

    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value / 100);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="amount" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {detailed && (
        <>
          {/* Payment Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Hourly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Payment Trend (Hourly)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};