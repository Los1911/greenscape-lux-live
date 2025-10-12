import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, PieChart, Calendar } from 'lucide-react';

interface ChartData {
  month: string;
  earnings: number;
  jobs: number;
}

const mockChartData: ChartData[] = [
  { month: 'Jan', earnings: 2890, jobs: 12 },
  { month: 'Feb', earnings: 3250, jobs: 15 },
  { month: 'Mar', earnings: 2750, jobs: 11 },
  { month: 'Apr', earnings: 3850, jobs: 18 },
  { month: 'May', earnings: 4200, jobs: 21 },
  { month: 'Jun', earnings: 3650, jobs: 16 }
];

const jobTypeData = [
  { type: 'Lawn Maintenance', percentage: 35, earnings: 5500 },
  { type: 'Landscaping', percentage: 28, earnings: 4400 },
  { type: 'Tree Services', percentage: 20, earnings: 3150 },
  { type: 'Seasonal Cleanup', percentage: 17, earnings: 2675 }
];

export default function FinancialAnalyticsCharts() {
  const [activeChart, setActiveChart] = useState<'earnings' | 'jobs' | 'breakdown'>('earnings');

  const maxEarnings = Math.max(...mockChartData.map(d => d.earnings));
  const maxJobs = Math.max(...mockChartData.map(d => d.jobs));

  const renderEarningsChart = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Monthly Earnings Trend</h3>
        <div className="text-sm text-gray-600">Last 6 months</div>
      </div>
      <div className="h-64 flex items-end justify-between gap-2">
        {mockChartData.map((data, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="w-full bg-gray-200 rounded-t-lg relative overflow-hidden">
              <div 
                className="bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-500 hover:from-green-600 hover:to-green-500"
                style={{ height: `${(data.earnings / maxEarnings) * 200}px` }}
              ></div>
            </div>
            <div className="text-center mt-2">
              <div className="text-sm font-medium">${data.earnings.toLocaleString()}</div>
              <div className="text-xs text-gray-600">{data.month}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderJobsChart = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Jobs Completed Trend</h3>
        <div className="text-sm text-gray-600">Last 6 months</div>
      </div>
      <div className="h-64 flex items-end justify-between gap-2">
        {mockChartData.map((data, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="w-full bg-gray-200 rounded-t-lg relative overflow-hidden">
              <div 
                className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-600 hover:to-blue-500"
                style={{ height: `${(data.jobs / maxJobs) * 200}px` }}
              ></div>
            </div>
            <div className="text-center mt-2">
              <div className="text-sm font-medium">{data.jobs} jobs</div>
              <div className="text-xs text-gray-600">{data.month}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderJobBreakdown = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Earnings by Job Type</h3>
        <div className="text-sm text-gray-600">Current period</div>
      </div>
      <div className="space-y-3">
        {jobTypeData.map((job, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{job.type}</span>
              <div className="text-right">
                <div className="text-sm font-semibold">${job.earnings.toLocaleString()}</div>
                <div className="text-xs text-gray-600">{job.percentage}%</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${job.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Financial Analytics
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={activeChart === 'earnings' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveChart('earnings')}
              className="flex items-center gap-1"
            >
              <TrendingUp className="h-4 w-4" />
              Earnings
            </Button>
            <Button
              variant={activeChart === 'jobs' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveChart('jobs')}
              className="flex items-center gap-1"
            >
              <Calendar className="h-4 w-4" />
              Jobs
            </Button>
            <Button
              variant={activeChart === 'breakdown' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveChart('breakdown')}
              className="flex items-center gap-1"
            >
              <PieChart className="h-4 w-4" />
              Breakdown
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeChart === 'earnings' && renderEarningsChart()}
        {activeChart === 'jobs' && renderJobsChart()}
        {activeChart === 'breakdown' && renderJobBreakdown()}
      </CardContent>
    </Card>
  );
}