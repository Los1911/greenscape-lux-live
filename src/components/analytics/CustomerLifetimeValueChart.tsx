import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';

interface LTVData {
  cohort: string;
  averageLTV: number;
  customerCount: number;
  averageLifespan: number;
  totalRevenue: number;
}

interface LTVSegmentData {
  segment: string;
  ltv: number;
  customers: number;
  retention: number;
}

interface CustomerLifetimeValueChartProps {
  timeRange: string;
}

export function CustomerLifetimeValueChart({ timeRange }: CustomerLifetimeValueChartProps) {
  const [ltvData, setLtvData] = useState<LTVData[]>([]);
  const [segmentData, setSegmentData] = useState<LTVSegmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLTVData();
  }, [timeRange]);

  const fetchLTVData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-ltv-analytics', {
        body: { timeRange }
      });

      if (error) throw error;
      setLtvData(data?.ltvData || []);
      setSegmentData(data?.segmentData || []);
    } catch (error) {
      console.error('Error fetching LTV data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Loading customer LTV data...</div>;
  }

  const overallLTV = ltvData.length > 0 
    ? ltvData.reduce((sum, d) => sum + d.averageLTV * d.customerCount, 0) / ltvData.reduce((sum, d) => sum + d.customerCount, 0)
    : 0;

  const totalCustomers = ltvData.reduce((sum, d) => sum + d.customerCount, 0);
  const averageLifespan = ltvData.length > 0 
    ? ltvData.reduce((sum, d) => sum + d.averageLifespan, 0) / ltvData.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average LTV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overallLTV.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Analyzed customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Lifespan</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageLifespan.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${ltvData.reduce((sum, d) => sum + d.totalRevenue, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From analyzed cohorts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>LTV by Cohort</CardTitle>
            <CardDescription>Average customer lifetime value by acquisition cohort</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ltvData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cohort" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Average LTV']} />
                <Line type="monotone" dataKey="averageLTV" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>LTV vs Customer Count</CardTitle>
            <CardDescription>Relationship between LTV and cohort size</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={ltvData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="customerCount" name="Customer Count" />
                <YAxis dataKey="averageLTV" name="Average LTV" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'averageLTV' ? `$${Number(value).toLocaleString()}` : value,
                    name === 'averageLTV' ? 'Average LTV' : 'Customer Count'
                  ]}
                />
                <Scatter dataKey="averageLTV" fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Segments by LTV</CardTitle>
          <CardDescription>Customer segments ranked by lifetime value</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {segmentData.map((segment, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-lg font-semibold">#{index + 1}</div>
                  <div>
                    <div className="font-medium">{segment.segment}</div>
                    <div className="text-sm text-muted-foreground">
                      {segment.customers} customers • {segment.retention.toFixed(1)}% retention
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">${segment.ltv.toLocaleString()}</div>
                  <Badge 
                    variant={segment.ltv > overallLTV ? "default" : "secondary"}
                  >
                    {segment.ltv > overallLTV ? "Above Average" : "Below Average"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>LTV Insights</CardTitle>
          <CardDescription>Key insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Top Performing Cohort</h4>
              <p className="text-sm text-blue-700 mt-1">
                {ltvData.length > 0 && 
                  `${ltvData.reduce((max, d) => d.averageLTV > max.averageLTV ? d : max).cohort} 
                   with $${ltvData.reduce((max, d) => d.averageLTV > max.averageLTV ? d : max).averageLTV.toLocaleString()} LTV`
                }
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">Growth Opportunity</h4>
              <p className="text-sm text-green-700 mt-1">
                Focus on segments with high retention but lower LTV for upselling opportunities
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}