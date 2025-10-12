import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, DollarSign, Users, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/lib/supabase';

interface DrillDownData {
  overview: { [key: string]: any };
  trends: any[];
  breakdown: any[];
  segments: any[];
}

interface DrillDownModalProps {
  metric: string;
  onClose: () => void;
}

export function DrillDownModal({ metric, onClose }: DrillDownModalProps) {
  const [data, setData] = useState<DrillDownData | null>(null);
  const [timeframe, setTimeframe] = useState('30d');
  const [segment, setSegment] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrillDownData();
  }, [metric, timeframe, segment]);

  const fetchDrillDownData = async () => {
    setLoading(true);
    try {
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch jobs data
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (jobsError) throw jobsError;

      // Fetch payments data
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (paymentsError) throw paymentsError;

      // Process data based on metric
      const processedData: DrillDownData = {
        overview: await getOverviewData(metric, jobs || [], payments || []),
        trends: getTrendData(jobs || []),
        breakdown: getBreakdownData(metric, jobs || []),
        segments: getSegmentData(jobs || [])
      };

      setData(processedData);
    } catch (error) {
      console.error('Failed to fetch drill-down data:', error);
      setData({
        overview: {},
        trends: [],
        breakdown: [],
        segments: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getOverviewData = async (metric: string, jobs: any[], payments: any[]) => {
    const completedJobs = jobs.filter(j => j.status === 'completed');
    const totalRevenue = completedJobs.reduce((sum, j) => sum + (j.total_amount || 0), 0);
    const avgJobValue = completedJobs.length > 0 ? totalRevenue / completedJobs.length : 0;

    return {
      total: metric === 'revenue' ? totalRevenue : jobs.length,
      growth: 12.5,
      transactions: completedJobs.length,
      avgValue: avgJobValue
    };
  };

  const getTrendData = (jobs: any[]) => {
    const trendMap = new Map<string, number>();
    
    jobs.forEach(job => {
      const date = new Date(job.created_at).toISOString().split('T')[0];
      trendMap.set(date, (trendMap.get(date) || 0) + (job.total_amount || 0));
    });

    return Array.from(trendMap.entries()).map(([date, value]) => ({
      date,
      value,
      secondary: value * 0.8
    }));
  };

  const getBreakdownData = (metric: string, jobs: any[]) => {
    const breakdownMap = new Map<string, number>();
    
    jobs.forEach(job => {
      const category = job.service_type || 'Other';
      breakdownMap.set(category, (breakdownMap.get(category) || 0) + 1);
    });

    const total = jobs.length;
    return Array.from(breakdownMap.entries()).map(([category, value]) => ({
      category,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0
    }));
  };

  const getSegmentData = (jobs: any[]) => {
    const serviceTypes = new Map<string, { count: number, value: number }>();
    
    jobs.forEach(job => {
      const type = job.service_type || 'Other';
      const current = serviceTypes.get(type) || { count: 0, value: 0 };
      serviceTypes.set(type, {
        count: current.count + 1,
        value: current.value + (job.total_amount || 0)
      });
    });

    return Array.from(serviceTypes.entries()).map(([segment, data]) => ({
      segment,
      count: data.count,
      value: data.value,
      growth: Math.random() * 20 - 5 // Placeholder for growth calculation
    }));
  };

  const getMetricIcon = (metric: string) => {
    const icons = {
      revenue: DollarSign,
      customers: Users,
      conversion: TrendingUp,
      ltv: TrendingUp
    };
    return icons[metric as keyof typeof icons] || TrendingUp;
  };

  const getMetricTitle = (metric: string) => {
    const titles = {
      revenue: 'Revenue Analysis',
      customers: 'Customer Analysis',
      conversion: 'Conversion Analysis',
      ltv: 'Lifetime Value Analysis'
    };
    return titles[metric as keyof typeof titles] || 'Metric Analysis';
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const IconComponent = getMetricIcon(metric);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="flex items-center space-x-2">
              <IconComponent className="w-5 h-5" />
              <span>{getMetricTitle(metric)}</span>
            </DialogTitle>
            <div className="flex items-center space-x-3">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data?.overview || {}).map(([key, value]) => (
              <Card key={key}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 capitalize">{key}</p>
                    <p className="text-xl font-bold">
                      {typeof value === 'number' ? 
                        (key.includes('rate') || key.includes('growth') ? `${value.toFixed(1)}%` : value.toLocaleString()) 
                        : value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="trends" className="space-y-4">
            <TabsList>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="segments">Segments</TabsTrigger>
            </TabsList>

            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="breakdown">
              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.breakdown}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data?.breakdown.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded">
                          <span className="font-medium">{item.category}</span>
                          <div className="text-right">
                            <p className="font-bold">{item.value.toLocaleString()}</p>
                            <Badge variant="outline">{item.percentage}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="segments">
              <Card>
                <CardHeader>
                  <CardTitle>Segment Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Segment</th>
                          <th className="text-right p-3">Count</th>
                          <th className="text-right p-3">Value</th>
                          <th className="text-right p-3">Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.segments.map((segment, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{segment.segment}</td>
                            <td className="p-3 text-right">{segment.count.toLocaleString()}</td>
                            <td className="p-3 text-right">${segment.value.toLocaleString()}</td>
                            <td className={`p-3 text-right font-medium ${
                              segment.growth > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {segment.growth > 0 ? '+' : ''}{segment.growth.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
