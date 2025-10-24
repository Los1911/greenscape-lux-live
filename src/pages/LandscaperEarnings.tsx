import React from 'react';
import { ArrowLeft, Download, Settings, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SiteChrome from '@/components/SiteChrome';
import EarningsBreakdown from '@/components/earnings/EarningsBreakdown';
import PayoutHistory from '@/components/earnings/PayoutHistory';
import CommissionTracker from '@/components/earnings/CommissionTracker';
import FinancialAnalyticsCharts from '@/components/earnings/FinancialAnalyticsCharts';

export default function LandscaperEarnings() {
  const handleGoBack = () => {
    navigate('/landscaper-dashboard');
  };

  const handleExportData = () => {
    console.log('Exporting earnings data...');
    // Simulate CSV export
    const csvData = 'Date,Amount,Jobs,Status\n2024-01-15,1250.00,5,Completed\n2024-01-01,890.50,3,Completed';
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'earnings-report.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePayoutSettings = () => {
    console.log('Opening payout settings...');
    alert('Payout settings would open here - configure bank details, payout frequency, etc.');
  };

  const handleHelp = () => {
    console.log('Opening earnings help...');
    alert('Help center would open here - FAQs about earnings, commissions, and payouts.');
  };

  return (
    <SiteChrome>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleGoBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Earnings Dashboard</h1>
                  <p className="text-sm text-gray-600">Track your earnings, payouts, and financial performance</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportData}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePayoutSettings}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleHelp}
                  className="flex items-center gap-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  Help
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <EarningsBreakdown />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PayoutHistory />
                <div className="space-y-6">
                  <CommissionTracker />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payouts" className="space-y-6">
              <PayoutHistory />
            </TabsContent>

            <TabsContent value="commissions" className="space-y-6">
              <CommissionTracker />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <FinancialAnalyticsCharts />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EarningsBreakdown />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SiteChrome>
  );
}