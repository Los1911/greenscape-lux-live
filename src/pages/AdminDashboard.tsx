import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { signOutAndRedirect } from '@/lib/logout';
import { stripeKeyMonitor } from '@/utils/stripeKeyMonitor';
import StripeKeyRotationDashboard from '@/components/admin/StripeKeyRotationDashboard';
import StripeProductionDashboard from '@/components/admin/StripeProductionDashboard';
import SystemHealthMonitor from '@/components/admin/SystemHealthMonitor';
import UserManagementCard from '@/components/admin/UserManagementCard';
import LandscaperApprovalPanel from '@/components/admin/LandscaperApprovalPanel';
import SystemLogs from '@/components/admin/SystemLogs';
import { EnvironmentVariablesDashboard } from '@/components/admin/EnvironmentVariablesDashboard';
import { VercelIntegrationDashboard } from '@/components/admin/VercelIntegrationDashboard';
import { DisputeQueuePanel } from '@/components/admin/DisputeQueuePanel';
import { DisputeAnalyticsDashboard } from '@/components/admin/DisputeAnalyticsDashboard';
import { PaymentMonitoringDashboard } from '@/components/admin/PaymentMonitoringDashboard';
import { StripeConnectDiagnostic } from '@/components/admin/StripeConnectDiagnostic';




import { 
  Users, 
  DollarSign, 
  Activity, 
  Shield,
  Key,
  AlertTriangle,
  CheckCircle,
  LogOut
} from 'lucide-react';



export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    activeJobs: 0,
    pendingApprovals: 0
  });
  const [monitoringStatus, setMonitoringStatus] = useState(false);

  useEffect(() => {
    loadStats();
    initializeMonitoring();
  }, []);

  const loadStats = async () => {
    try {
      const [usersResult, jobsResult, paymentsResult, approvalsResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('jobs').select('id, status', { count: 'exact' }).eq('status', 'active'),
        supabase.from('payments').select('amount, status').eq('status', 'completed'),
        supabase.from('landscapers').select('id, approved', { count: 'exact' }).eq('approved', false)
      ]);

      const totalRevenue = paymentsResult.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalRevenue,
        activeJobs: jobsResult.count || 0,
        pendingApprovals: approvalsResult.count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const initializeMonitoring = async () => {
    if (!stripeKeyMonitor.isMonitoring()) {
      await stripeKeyMonitor.startMonitoring();
      setMonitoringStatus(true);
    } else {
      setMonitoringStatus(true);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Admin logout initiated');
      await signOutAndRedirect(supabase, '/admin-login');
    } catch (error) {
      console.error('Admin logout error:', error);
      window.location.href = '/admin-login';
    }
  };
  

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 space-y-8 sm:space-y-12 lg:space-y-16">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 flex-wrap">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-300 mb-1">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-emerald-300/70">Manage your platform and monitor security</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-2">
                <Shield className={`h-5 w-5 ${monitoringStatus ? 'text-green-500' : 'text-red-500'} flex-shrink-0`} />
                <span className="text-sm sm:text-base text-gray-300 whitespace-nowrap">
                  Security Monitor: {monitoringStatus ? 'Active' : 'Inactive'}
                </span>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300 transition-all duration-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>


        {/* Stats Overview */}
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6 lg:p-8">
                <CardTitle className="text-sm font-medium text-white whitespace-nowrap">Total Users</CardTitle>
                <Users className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8 pt-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-300">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6 lg:p-8">
                <CardTitle className="text-sm font-medium text-white whitespace-nowrap">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8 pt-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-300">${stats.totalRevenue}</div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6 lg:p-8">
                <CardTitle className="text-sm font-medium text-white whitespace-nowrap">Active Jobs</CardTitle>
                <Activity className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8 pt-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-300">{stats.activeJobs}</div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6 lg:p-8">
                <CardTitle className="text-sm font-medium text-white whitespace-nowrap">Pending Approvals</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8 pt-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-300">{stats.pendingApprovals}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Dashboard Tabs */}
        <div className="w-full">
          <Tabs defaultValue="overview" className="space-y-6 sm:space-y-8 lg:space-y-10">
            <div className="overflow-x-auto">
              <TabsList className="flex flex-wrap sm:grid sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-12 w-full bg-black/60 backdrop-blur border border-emerald-500/25 p-1 gap-1 overflow-x-auto">
                <TabsTrigger value="overview" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Overview</TabsTrigger>
                <TabsTrigger value="stripe-connect" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Connect Test</TabsTrigger>
                <TabsTrigger value="security" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Security</TabsTrigger>
                <TabsTrigger value="users" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Users</TabsTrigger>
                <TabsTrigger value="payments" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Payments</TabsTrigger>
                <TabsTrigger value="disputes" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Disputes</TabsTrigger>
                <TabsTrigger value="analytics" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Analytics</TabsTrigger>
                <TabsTrigger value="stripe-prod" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Stripe</TabsTrigger>
                <TabsTrigger value="system" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">System</TabsTrigger>
                <TabsTrigger value="stripe" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Keys</TabsTrigger>
                <TabsTrigger value="env-vars" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Environment</TabsTrigger>
                <TabsTrigger value="vercel" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Vercel</TabsTrigger>
                <TabsTrigger value="logs" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Logs</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6 sm:space-y-8 lg:space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
                <div className="w-full">
                  <UserManagementCard />
                </div>
                <div className="w-full">
                  <LandscaperApprovalPanel />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stripe-connect" className="space-y-6 sm:space-y-8 lg:space-y-10">
              <div className="flex justify-center">
                <StripeConnectDiagnostic />
              </div>
            </TabsContent>


            <TabsContent value="security" className="space-y-6 sm:space-y-8 lg:space-y-10">
              <SystemHealthMonitor />
            </TabsContent>

            <TabsContent value="users" className="space-y-6 sm:space-y-8 lg:space-y-10">
              <UserManagementCard />
            </TabsContent>

            <TabsContent value="payments" className="space-y-6 sm:space-y-8 lg:space-y-10">
              <PaymentMonitoringDashboard />
            </TabsContent>


            <TabsContent value="disputes" className="space-y-6 sm:space-y-8 lg:space-y-10">
              <DisputeQueuePanel />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 sm:space-y-8 lg:space-y-10">
              <DisputeAnalyticsDashboard />
            </TabsContent>

            <TabsContent value="stripe-prod" className="space-y-6 sm:space-y-8 lg:space-y-10">
              <StripeProductionDashboard />
            </TabsContent>

            <TabsContent value="system" className="space-y-6 sm:space-y-8 lg:space-y-10">
              <SystemHealthMonitor />
            </TabsContent>

            <TabsContent value="stripe" className="space-y-6 sm:space-y-8 lg:space-y-10">
              <StripeKeyRotationDashboard />
            </TabsContent>

            <TabsContent value="env-vars" className="space-y-6 sm:space-y-8 lg:space-y-10">
              <EnvironmentVariablesDashboard />
            </TabsContent>

            <TabsContent value="vercel" className="space-y-6 sm:space-y-8 lg:space-y-10">
              <VercelIntegrationDashboard />
            </TabsContent>

            <TabsContent value="logs" className="space-y-6 sm:space-y-8 lg:space-y-10">
              <SystemLogs />
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </div>
  );
}