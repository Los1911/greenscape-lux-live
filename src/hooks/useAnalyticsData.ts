import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AnalyticsFilters {
  dateRange: string;
  serviceType: string;
  location: string;
}

interface AnalyticsData {
  totalRevenue: number;
  revenueChange: number;
  activeLandscapers: number;
  landscaperChange: number;
  completionRate: number;
  completionChange: number;
  userGrowth: number;
  growthChange: number;
  revenueData: Array<{ date: string; amount: number }>;
  userGrowthData: Array<{ date: string; clients: number; landscapers: number }>;
  jobData: Array<{ date: string; completed: number; total: number }>;
  commissionData: Array<{ landscaper: string; commission: number; jobs: number }>;
}

export const useAnalyticsData = (filters: AnalyticsFilters) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const dateFilter = getDateFilter(filters.dateRange);
        
        // Fetch revenue data
        const { data: payments } = await supabase
          .from('payments')
          .select('amount, created_at, status')
          .gte('created_at', dateFilter)
          .eq('status', 'succeeded');

        // Fetch user data
        const { data: users } = await supabase
          .from('profiles')
          .select('role, created_at')
          .gte('created_at', dateFilter);

        // Fetch job data
        const { data: jobs } = await supabase
          .from('jobs')
          .select('status, created_at, service_type, service_address')
          .gte('created_at', dateFilter);


        // Calculate metrics
        const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const activeLandscapers = users?.filter(u => u.role === 'landscaper').length || 0;
        const completedJobs = jobs?.filter(j => j.status === 'completed').length || 0;
        const completionRate = jobs?.length ? (completedJobs / jobs.length) * 100 : 0;

        // Get previous period data for comparison
        const prevDateFilter = getPreviousDateFilter(filters.dateRange);
        const { data: prevPayments } = await supabase
          .from('payments')
          .select('amount')
          .gte('created_at', prevDateFilter)
          .lt('created_at', dateFilter)
          .eq('status', 'succeeded');

        const prevRevenue = prevPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const revenueChange = prevRevenue ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

        // Process chart data
        const revenueData = processRevenueData(payments || []);
        const userGrowthData = processUserGrowthData(users || []);
        const jobData = processJobData(jobs || []);
        const commissionData = await processCommissionData(filters);

        setData({
          totalRevenue,
          revenueChange,
          activeLandscapers,
          landscaperChange: 5.2, // Calculate from previous period
          completionRate,
          completionChange: 2.1, // Calculate from previous period
          userGrowth: 12.5, // Calculate growth rate
          growthChange: 1.8,
          revenueData,
          userGrowthData,
          jobData,
          commissionData
        });

      } catch (err) {
        setError('Failed to fetch analytics data');
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [filters]);

  return { data, loading, error };
};

const getDateFilter = (range: string): string => {
  const now = new Date();
  const days = parseInt(range.replace('d', ''));
  const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return date.toISOString();
};

const getPreviousDateFilter = (range: string): string => {
  const now = new Date();
  const days = parseInt(range.replace('d', ''));
  const date = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);
  return date.toISOString();
};

const processRevenueData = (payments: any[]) => {
  // Group by date and sum amounts
  const grouped = payments.reduce((acc, payment) => {
    const date = new Date(payment.created_at).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + payment.amount;
    return acc;
  }, {});

  return Object.entries(grouped).map(([date, amount]) => ({
    date,
    amount: amount as number
  }));
};

const processUserGrowthData = (users: any[]) => {
  const grouped = users.reduce((acc, user) => {
    const date = new Date(user.created_at).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = { clients: 0, landscapers: 0 };
    if (user.role === 'client') acc[date].clients++;
    if (user.role === 'landscaper') acc[date].landscapers++;
    return acc;
  }, {});

  return Object.entries(grouped).map(([date, counts]) => ({
    date,
    ...(counts as { clients: number; landscapers: number })
  }));
};

const processJobData = (jobs: any[]) => {
  const grouped = jobs.reduce((acc, job) => {
    const date = new Date(job.created_at).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = { completed: 0, total: 0 };
    acc[date].total++;
    if (job.status === 'completed') acc[date].completed++;
    return acc;
  }, {});

  return Object.entries(grouped).map(([date, counts]) => ({
    date,
    ...(counts as { completed: number; total: number })
  }));
};

const processCommissionData = async (filters: AnalyticsFilters) => {
  const { data: commissions } = await supabase
    .from('payments')
    .select(`
      landscaper_id,
      amount,
      profiles!inner(full_name)
    `)
    .eq('status', 'succeeded');

  const grouped = commissions?.reduce((acc, commission) => {
    const landscaper = commission.profiles?.full_name || 'Unknown';
    if (!acc[landscaper]) acc[landscaper] = { commission: 0, jobs: 0 };
    acc[landscaper].commission += commission.amount * 0.1; // 10% commission
    acc[landscaper].jobs++;
    return acc;
  }, {});

  return Object.entries(grouped || {}).map(([landscaper, data]) => ({
    landscaper,
    ...(data as { commission: number; jobs: number })
  }));
};