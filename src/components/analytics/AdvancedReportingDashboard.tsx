import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Settings, TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react';
import { CohortAnalysisChart } from './CohortAnalysisChart';
import { ABTestingResults } from './ABTestingResults';
import { PredictiveAnalytics } from './PredictiveAnalytics';
import { CustomWidgetBuilder } from './CustomWidgetBuilder';
import { ReportScheduler } from './ReportScheduler';
import { DrillDownModal } from './DrillDownModal';

interface ReportingData {
  revenue: { current: number; previous: number; growth: number };
  customers: { active: number; new: number; churn: number };
  conversion: { rate: number; trend: number };
  ltv: { average: number; segments: any[] };
}

export function AdvancedReportingDashboard() {
  const [data, setData] = useState<ReportingData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportingData();
  }, [dateRange]);

  const fetchReportingData = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual Supabase function
      await new Promise(resolve => setTimeout(resolve, 1000));
      setData({
        revenue: { current: 125000, previous: 98000, growth: 27.6 },
        customers: { active: 1250, new: 180, churn: 45 },
        conversion: { rate: 3.2, trend: 0.8 },
        ltv: { average: 2400, segments: [] }
      });
    } catch (error) {
      console.error('Failed to fetch reporting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrillDown = (metric: string) => {
    setSelectedMetric(metric);
  };

  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const response = await fetch('/api/export-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, dateRange, data })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `advanced-report-${dateRange}.${format}`;
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">Comprehensive business intelligence and reporting</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <ReportScheduler />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
              onClick={() => handleDrillDown('revenue')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold">${data?.revenue.current.toLocaleString()}</p>
                <Badge variant={data?.revenue.growth > 0 ? 'default' : 'destructive'} className="mt-1">
                  {data?.revenue.growth > 0 ? '+' : ''}{data?.revenue.growth}%
                </Badge>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleDrillDown('customers')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold">{data?.customers.active.toLocaleString()}</p>
                <Badge variant="default" className="mt-1">
                  +{data?.customers.new} new
                </Badge>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleDrillDown('conversion')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{data?.conversion.rate}%</p>
                <Badge variant="default" className="mt-1">
                  +{data?.conversion.trend}%
                </Badge>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleDrillDown('ltv')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg LTV</p>
                <p className="text-2xl font-bold">${data?.ltv.average.toLocaleString()}</p>
                <Badge variant="default" className="mt-1">
                  Premium tier
                </Badge>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Tabs */}
      <Tabs defaultValue="cohort" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cohort">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="abtesting">A/B Testing</TabsTrigger>
          <TabsTrigger value="predictive">Forecasting</TabsTrigger>
          <TabsTrigger value="widgets">Custom Widgets</TabsTrigger>
          <TabsTrigger value="scheduler">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="cohort">
          <CohortAnalysisChart />
        </TabsContent>

        <TabsContent value="abtesting">
          <ABTestingResults />
        </TabsContent>

        <TabsContent value="predictive">
          <PredictiveAnalytics />
        </TabsContent>

        <TabsContent value="widgets">
          <CustomWidgetBuilder />
        </TabsContent>

        <TabsContent value="scheduler">
          <ReportScheduler />
        </TabsContent>
      </Tabs>

      {/* Drill-down Modal */}
      {selectedMetric && (
        <DrillDownModal 
          metric={selectedMetric}
          onClose={() => setSelectedMetric(null)}
        />
      )}
    </div>
  );
}