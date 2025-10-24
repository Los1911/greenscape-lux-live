import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/lib/supabase';

interface PaymentSuccessData {
  date: string;
  successRate: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
}

interface PaymentMethodData {
  method: string;
  successRate: number;
  count: number;
}

interface PaymentSuccessRateChartProps {
  timeRange: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function PaymentSuccessRateChart({ timeRange }: PaymentSuccessRateChartProps) {
  const [trendData, setTrendData] = useState<PaymentSuccessData[]>([]);
  const [methodData, setMethodData] = useState<PaymentMethodData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuccessRateData();
  }, [timeRange]);

  const fetchSuccessRateData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('payment-success-analytics', {
        body: { timeRange }
      });

      if (error) throw error;
      setTrendData(data?.trendData || []);
      setMethodData(data?.methodData || []);
    } catch (error) {
      console.error('Error fetching success rate data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Loading success rate data...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Success Rate Trend</CardTitle>
          <CardDescription>Success rate percentage over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Success Rate']} />
              <Line type="monotone" dataKey="successRate" stroke="#00C49F" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Success Rate by Payment Method</CardTitle>
          <CardDescription>Performance breakdown by payment type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={methodData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ method, successRate }) => `${method}: ${successRate.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {methodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Payment Volume vs Success Rate</CardTitle>
          <CardDescription>Correlation between payment volume and success rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {trendData.reduce((sum, d) => sum + d.successfulPayments, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Successful Payments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {trendData.reduce((sum, d) => sum + d.failedPayments, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Failed Payments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {trendData.reduce((sum, d) => sum + d.totalPayments, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Payments</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}