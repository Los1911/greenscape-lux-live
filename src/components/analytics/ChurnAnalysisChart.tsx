import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface ChurnData {
  date: string;
  churnRate: number;
  newSubscriptions: number;
  canceledSubscriptions: number;
  netGrowth: number;
}

interface ChurnReasonData {
  reason: string;
  count: number;
  percentage: number;
}

interface ChurnAnalysisChartProps {
  timeRange: string;
}

export function ChurnAnalysisChart({ timeRange }: ChurnAnalysisChartProps) {
  const [churnData, setChurnData] = useState<ChurnData[]>([]);
  const [reasonData, setReasonData] = useState<ChurnReasonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChurnData();
  }, [timeRange]);

  const fetchChurnData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('churn-analytics', {
        body: { timeRange }
      });

      if (error) throw error;
      setChurnData(data?.churnData || []);
      setReasonData(data?.reasonData || []);
    } catch (error) {
      console.error('Error fetching churn data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Loading churn analysis...</div>;
  }

  const averageChurnRate = churnData.length > 0 
    ? churnData.reduce((sum, d) => sum + d.churnRate, 0) / churnData.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageChurnRate.toFixed(1)}%</div>
            <Badge variant={averageChurnRate < 5 ? "default" : averageChurnRate < 10 ? "secondary" : "destructive"}>
              {averageChurnRate < 5 ? "Excellent" : averageChurnRate < 10 ? "Good" : "Needs Attention"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {churnData.reduce((sum, d) => sum + d.newSubscriptions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Canceled Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {churnData.reduce((sum, d) => sum + d.canceledSubscriptions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {churnData.reduce((sum, d) => sum + d.netGrowth, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Net subscriber change</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Churn Rate Trend</CardTitle>
            <CardDescription>Monthly churn rate percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={churnData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Churn Rate']} />
                <Line type="monotone" dataKey="churnRate" stroke="#ff7c7c" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Changes</CardTitle>
            <CardDescription>New vs canceled subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={churnData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="newSubscriptions" fill="#00C49F" name="New" />
                <Bar dataKey="canceledSubscriptions" fill="#ff7c7c" name="Canceled" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Churn Reasons</CardTitle>
          <CardDescription>Top reasons for subscription cancellations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reasonData.map((reason, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded" />
                  <span className="font-medium">{reason.reason}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{reason.count} cancellations</span>
                  <Badge variant="outline">{reason.percentage.toFixed(1)}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}