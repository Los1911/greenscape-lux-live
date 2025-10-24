import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CreditCard, RefreshCw } from 'lucide-react';

interface FailedPaymentData {
  date: string;
  failedCount: number;
  failureRate: number;
  recoveredCount: number;
  totalAttempts: number;
}

interface FailureReasonData {
  reason: string;
  count: number;
  percentage: number;
  recoverable: boolean;
}

interface FailedPaymentsChartProps {
  timeRange: string;
}

export function FailedPaymentsChart({ timeRange }: FailedPaymentsChartProps) {
  const [failureData, setFailureData] = useState<FailedPaymentData[]>([]);
  const [reasonData, setReasonData] = useState<FailureReasonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFailedPaymentData();
  }, [timeRange]);

  const fetchFailedPaymentData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('failed-payment-analytics', {
        body: { timeRange }
      });

      if (error) throw error;
      setFailureData(data?.failureData || []);
      setReasonData(data?.reasonData || []);
    } catch (error) {
      console.error('Error fetching failed payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const retryFailedPayments = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('retry-failed-payments', {
        body: { timeRange }
      });

      if (error) throw error;
      // Refresh data after retry
      fetchFailedPaymentData();
    } catch (error) {
      console.error('Error retrying failed payments:', error);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Loading failed payment data...</div>;
  }

  const totalFailedPayments = failureData.reduce((sum, d) => sum + d.failedCount, 0);
  const totalRecoveredPayments = failureData.reduce((sum, d) => sum + d.recoveredCount, 0);
  const recoveryRate = totalFailedPayments > 0 ? (totalRecoveredPayments / totalFailedPayments) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalFailedPayments}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
            <RefreshCw className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{recoveryRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{totalRecoveredPayments} recovered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Failure Rate</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {failureData.length > 0 
                ? (failureData.reduce((sum, d) => sum + d.failureRate, 0) / failureData.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Average failure rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={retryFailedPayments} size="sm" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Failed
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Failed Payments Trend</CardTitle>
            <CardDescription>Daily failed payment count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={failureData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="failedCount" stroke="#ff7c7c" strokeWidth={2} name="Failed" />
                <Line type="monotone" dataKey="recoveredCount" stroke="#00C49F" strokeWidth={2} name="Recovered" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failure Rate Trend</CardTitle>
            <CardDescription>Percentage of failed payments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={failureData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Failure Rate']} />
                <Bar dataKey="failureRate" fill="#ff7c7c" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Failure Reasons</CardTitle>
          <CardDescription>Common reasons for payment failures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reasonData.map((reason, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className={`h-4 w-4 ${reason.recoverable ? 'text-yellow-500' : 'text-red-500'}`} />
                  <div>
                    <div className="font-medium">{reason.reason}</div>
                    <div className="text-sm text-muted-foreground">
                      {reason.count} occurrences ({reason.percentage.toFixed(1)}%)
                    </div>
                  </div>
                </div>
                <Badge variant={reason.recoverable ? "secondary" : "destructive"}>
                  {reason.recoverable ? "Recoverable" : "Permanent"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}