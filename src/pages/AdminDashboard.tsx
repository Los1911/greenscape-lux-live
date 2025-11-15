import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { signOutAndRedirect } from '@/lib/logout';
import { stripeKeyMonitor } from '@/utils/stripeKeyMonitor';

import StripeProductionDashboard from '@/components/admin/StripeProductionDashboard';
import SystemHealthMonitor from '@/components/admin/SystemHealthMonitor';
import UserManagementCard from '@/components/admin/UserManagementCard';
import LandscaperApprovalPanel from '@/components/admin/LandscaperApprovalPanel';
import SystemLogs from '@/components/admin/SystemLogs';
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
  AlertTriangle,
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

      const totalRevenue =
        paymentsResult.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

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
      await signOutAndRedirect(supabase, '/admin-login');
    } catch (error) {
      window.location.href = '/admin-login';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-emerald-300">Admin Dashboard</h1>
            <p className="text-emerald-300/70">Manage your platform and monitor security</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className={`h-5 w-5 ${monitoringStatus ? 'text-green-500' : 'text-red-500'}`} />
              <span className="text-gray-300">
                Security Monitor: {monitoringStatus ? 'Active' : 'Inactive'}
              </span>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-red-500/10 border-red-500/30 text-red-400"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-black/60 border border-emerald-500/25">
            <CardHeader className="flex justify-between p-6">
              <CardTitle>Total Users</CardTitle>
              <Users className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent className="p-6 pt-0 text-2xl font-bold text-emerald-300">
              {stats.totalUsers}
            </CardContent>
          </Card>

          <Card className="bg-black/60 border border-emerald-500/25">
            <CardHeader className="flex justify-between p-6">
              <CardTitle>Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent className="p-6 pt-0 text-2xl font-bold text-emerald-300">
              ${stats.totalRevenue}
            </CardContent>
          </Card>

          <Card className="bg-black/60 border border-emerald-500/25">
            <CardHeader className="flex justify-between p-6">
              <CardTitle>Active Jobs</CardTitle>
              <Activity className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent className="p-6 pt-0 text-2xl font-bold text-emerald-300">
              {stats.activeJobs}
            </CardContent>
          </Card>

          <Card className="bg-black/60 border border-emerald-500/25">
            <CardHeader className="flex justify-between p-6">
              <CardTitle>Pending Approvals</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent className="p-6 pt-0 text-2xl font-bold text-yellow-300">
              {stats.pendingApprovals}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-8">

          <TabsList className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 bg-black/60 border border-emerald-500/25 p-1 gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stripe-connect">Connect Test</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="stripe-prod">Stripe</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="vercel">Vercel</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <UserManagementCard />
              <LandscaperApprovalPanel />
            </div>
          </TabsContent>

          <TabsContent value="stripe-connect">
            <div className="flex justify-center">
              <StripeConnectDiagnostic />
            </div>
          </TabsContent>

          <TabsContent value="security">
            <SystemHealthMonitor />
          </TabsContent>

          <TabsContent value="users">
            <UserManagementCard />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentMonitoringDashboard />
          </TabsContent>

          <TabsContent value="disputes">
            <DisputeQueuePanel />
          </TabsContent>

          <TabsContent value="analytics">
            <DisputeAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="stripe-prod">
            <StripeProductionDashboard />
          </TabsContent>

          <TabsContent value="system">
            <SystemHealthMonitor />
          </TabsContent>

          <TabsContent value="vercel">
            <VercelIntegrationDashboard />
          </TabsContent>

          <TabsContent value="logs">
            <SystemLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}