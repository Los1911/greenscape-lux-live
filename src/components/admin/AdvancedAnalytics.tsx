import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Users, DollarSign, Calendar, BarChart3 } from 'lucide-react';

interface AnalyticsData {
  revenue: { period: string; amount: number }[];
  jobs: { period: string; count: number; status: string }[];
  customers: { period: string; new: number; returning: number }[];
  landscapers: { period: string; active: number; earnings: number }[];
}

export default function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    revenue: [],
    jobs: [],
    customers: [],
    landscapers: []
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const days = parseInt(timeframe);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch revenue data
      const { data: revenueData } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('status', 'succeeded')
        .gte('created_at', startDate.toISOString());

      // Fetch jobs data
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('status, created_at')
        .gte('created_at', startDate.toISOString());

      // Fetch client data from profiles table
      const { data: clientsData } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      // Fetch landscaper earnings
      const { data: landscapersData } = await supabase
        .from('payments')
        .select('landscaper_id, amount, created_at')
        .eq('status', 'succeeded')
        .gte('created_at', startDate.toISOString());

      // Process data for charts
      const processedData = {
        revenue: processRevenueData(revenueData || []),
        jobs: processJobsData(jobsData || []),
        customers: processCustomersData(clientsData || []),
        landscapers: processLandscapersData(landscapersData || [])
      };

      setData(processedData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processRevenueData = (payments: any[]) => {
    const grouped = payments.reduce((acc, payment) => {
      const date = new Date(payment.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + payment.amount;
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, amount]) => ({
      period: date,
      amount: amount as number
    }));
  };

  const processJobsData = (jobs: any[]) => {
    const grouped = jobs.reduce((acc, job) => {
      const date = new Date(job.created_at).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = {};
      acc[date][job.status] = (acc[date][job.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).flatMap(([date, statuses]: [string, any]) =>
      Object.entries(statuses).map(([status, count]) => ({
        period: date,
        count: count as number,
        status
      }))
    );
  };

  const processCustomersData = (customers: any[]) => {
    const grouped = customers.reduce((acc, customer) => {
      const date = new Date(customer.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, count]) => ({
      period: date,
      new: count as number,
      returning: 0 // Would need additional logic to determine returning customers
    }));
  };

  const processLandscapersData = (payments: any[]) => {
    const grouped = payments.reduce((acc, payment) => {
      const date = new Date(payment.created_at).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { landscapers: new Set(), earnings: 0 };
      acc[date].landscapers.add(payment.landscaper_id);
      acc[date].earnings += payment.amount;
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, data]: [string, any]) => ({
      period: date,
      active: data.landscapers.size,
      earnings: data.earnings
    }));
  };

  const totalRevenue = data.revenue.reduce((sum, item) => sum + item.amount, 0);
  const totalJobs = data.jobs.reduce((sum, item) => sum + item.count, 0);
  const avgJobValue = totalJobs > 0 ? totalRevenue / totalJobs : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Advanced Analytics
          </CardTitle>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalRevenue.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-blue-600">{totalJobs}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Job Value</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${avgJobValue.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New Customers</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {data.customers.reduce((sum, item) => sum + item.new, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="landscapers">Landscapers</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {data.revenue.map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="bg-green-500 w-8 rounded-t"
                        style={{ 
                          height: `${(item.amount / Math.max(...data.revenue.map(r => r.amount))) * 200}px` 
                        }}
                      ></div>
                      <span className="text-xs mt-1 transform -rotate-45">
                        {new Date(item.period).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Job Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['completed', 'active', 'scheduled', 'pending'].map(status => {

                    const count = data.jobs
                      .filter(job => job.status === status)
                      .reduce((sum, job) => sum + job.count, 0);
                    const percentage = totalJobs > 0 ? (count / totalJobs) * 100 : 0;
                    
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <span className="capitalize">{status.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customer Acquisition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">Customer analytics visualization would go here</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Total new customers: {data.customers.reduce((sum, item) => sum + item.new, 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="landscapers">
            <Card>
              <CardHeader>
                <CardTitle>Landscaper Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">Landscaper performance metrics would go here</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Total earnings distributed: ${data.landscapers.reduce((sum, item) => sum + item.earnings, 0).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}