import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenueChart } from './RevenueChart';
import { UserGrowthChart } from './UserGrowthChart';
import { JobCompletionChart } from './JobCompletionChart';
import { CommissionTracker } from './CommissionTracker';
import { AnalyticsFilters } from './AnalyticsFilters';
import { ExportReports } from './ExportReports';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { TrendingUp, Users, CheckCircle, DollarSign } from 'lucide-react';

export const AdminAnalyticsDashboard: React.FC = () => {
  const [filters, setFilters] = useState({
    dateRange: '30d',
    serviceType: 'all',
    location: 'all'
  });

  const { data, loading, error } = useAnalyticsData(filters);

  const metrics = [
    {
      title: 'Total Revenue',
      value: data?.totalRevenue || 0,
      change: data?.revenueChange || 0,
      icon: DollarSign,
      format: 'currency'
    },
    {
      title: 'Active Landscapers',
      value: data?.activeLandscapers || 0,
      change: data?.landscaperChange || 0,
      icon: Users,
      format: 'number'
    },
    {
      title: 'Job Completion Rate',
      value: data?.completionRate || 0,
      change: data?.completionChange || 0,
      icon: CheckCircle,
      format: 'percentage'
    },
    {
      title: 'Platform Growth',
      value: data?.userGrowth || 0,
      change: data?.growthChange || 0,
      icon: TrendingUp,
      format: 'percentage'
    }
  ];

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  if (loading) return <div className="p-6">Loading analytics...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading analytics</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <ExportReports filters={filters} />
      </div>

      <AnalyticsFilters filters={filters} onFiltersChange={setFilters} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatValue(metric.value, metric.format)}</div>
                <p className={`text-xs ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}% from last period
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">User Growth</TabsTrigger>
          <TabsTrigger value="jobs">Job Analytics</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <RevenueChart filters={filters} />
        </TabsContent>

        <TabsContent value="users">
          <UserGrowthChart filters={filters} />
        </TabsContent>

        <TabsContent value="jobs">
          <JobCompletionChart filters={filters} />
        </TabsContent>

        <TabsContent value="commissions">
          <CommissionTracker filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
};