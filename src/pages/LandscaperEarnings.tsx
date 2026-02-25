import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Settings, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SiteChrome from '@/components/SiteChrome';
import EarningsBreakdown from '@/components/earnings/EarningsBreakdown';
import PayoutHistory from '@/components/earnings/PayoutHistory';
import CommissionTracker from '@/components/earnings/CommissionTracker';
import FinancialAnalyticsCharts from '@/components/earnings/FinancialAnalyticsCharts';
import EarningsProgressTiers from '@/components/earnings/EarningsProgressTiers';
import NextMilestoneCard from '@/components/earnings/NextMilestoneCard';
import EarningsGoalCard from '@/components/earnings/EarningsGoalCard';
import { PerformanceInsightsCard } from '@/components/landscaper/PerformanceInsightsCard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function LandscaperEarnings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [earningsStats, setEarningsStats] = useState({
    completedJobs: 0,
    jobsThisWeek: 0,
    totalEarnings: 0,
    pendingPayouts: 0
  });
  const [periodEarnings, setPeriodEarnings] = useState({ weekly: 0, monthly: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadEarningsData();
    }
  }, [user?.id]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('landscaper_id', user?.id)
        .eq('status', 'completed');

      const jobList = jobs || [];
      const now = new Date();
      
      // Calculate week start (Monday)
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      weekStart.setHours(0, 0, 0, 0);
      
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalEarnings = jobList.reduce((sum, j) => sum + (j.price || j.amount || 0), 0);
      
      const weeklyEarnings = jobList
        .filter(j => j.completed_at && new Date(j.completed_at) >= weekStart)
        .reduce((sum, j) => sum + (j.price || j.amount || 0), 0);

      const monthlyEarnings = jobList
        .filter(j => j.completed_at && new Date(j.completed_at) >= monthStart)
        .reduce((sum, j) => sum + (j.price || j.amount || 0), 0);

      const jobsThisWeek = jobList.filter(j => 
        j.completed_at && new Date(j.completed_at) >= weekStart
      ).length;

      // Get pending payouts
      const { data: payouts } = await supabase
        .from('payouts')
        .select('amount')
        .eq('landscaper_id', user?.id)
        .eq('status', 'pending');

      const pendingPayouts = payouts?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      setEarningsStats({
        completedJobs: jobList.length,
        jobsThisWeek,
        totalEarnings,
        pendingPayouts
      });

      setPeriodEarnings({ weekly: weeklyEarnings, monthly: monthlyEarnings });
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoBack = () => {
    navigate('/landscaper-dashboard');
  };

  const handleExportData = () => {
    console.log('[LANDSCAPER EARNINGS] Exporting earnings data...');
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
    console.log('[LANDSCAPER EARNINGS] Opening payout settings...');
    alert('Payout settings would open here - configure bank details, payout frequency, etc.');
  };

  const handleHelp = () => {
    console.log('[LANDSCAPER EARNINGS] Opening earnings help...');
    alert('Help center would open here - FAQs about earnings, commissions, and payouts.');
  };

  return (
    <SiteChrome>
      <div className="min-h-screen bg-slate-950">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleGoBack} 
                  className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">Earnings Dashboard</h1>
                  <p className="text-sm text-slate-400">Track your earnings, payouts, and financial performance</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportData} 
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePayoutSettings} 
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleHelp} 
                  className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-slate-900 border border-slate-700">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="performance"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
              >
                Performance
              </TabsTrigger>
              <TabsTrigger 
                value="payouts"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
              >
                Payouts
              </TabsTrigger>
              <TabsTrigger 
                value="commissions"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
              >
                Commissions
              </TabsTrigger>
              <TabsTrigger 
                value="analytics"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
              >
                Analytics
              </TabsTrigger>
            </TabsList>


            <TabsContent value="overview" className="space-y-6">
              {/* Earnings Goal Card - Prominent placement at top */}
              <EarningsGoalCard 
                currentEarnings={earningsStats.totalEarnings}
                periodEarnings={periodEarnings}
              />

              {/* Earnings Progress Tiers */}
              <EarningsProgressTiers completedJobs={earningsStats.completedJobs} />
              
              {/* Next Milestone & Weekly Activity */}
              <NextMilestoneCard 
                completedJobs={earningsStats.completedJobs} 
                jobsThisWeek={earningsStats.jobsThisWeek} 
              />
              
              {/* Existing Earnings Breakdown */}
              <EarningsBreakdown />
              
              {/* Existing Payout History and Commission Tracker */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PayoutHistory />
                <div className="space-y-6">
                  <CommissionTracker />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <PerformanceInsightsCard />
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
