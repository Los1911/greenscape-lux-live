import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Job } from '@/types/job';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalEarnings: number;
  monthlyEarnings: number;
  pendingPayments: number;
  rating: number;
  totalReviews: number;
}

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
  read: boolean;
}

export function useDashboardData(userRole: 'client' | 'landscaper' | 'admin') {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    pendingPayments: 0,
    rating: 0,
    totalReviews: 0
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, userRole]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (userRole === 'client') {
        await fetchClientData();
      } else if (userRole === 'landscaper') {
        await fetchLandscaperData();
      } else if (userRole === 'admin') {
        await fetchAdminData();
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientData = async () => {
    if (!user) return;

    // Get client profile
    const { data: clientProfile } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!clientProfile) return;

    // Fetch client jobs
    // Fetch client jobs
    const { data: jobs } = await supabase
      .from('jobs')
      .select(`
        id, service_name, service_type, service_address, status, created_at, preferred_date, price
      `)
      .eq('client_id', clientProfile.id)

      .order('created_at', { ascending: false })
      .limit(10);


    if (jobs) {
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter(job => 
        ['pending', 'quoted', 'accepted', 'in_progress'].includes(job.status)
      ).length;
      const completedJobs = jobs.filter(job => job.status === 'completed').length;

      setStats(prev => ({
        ...prev,
        totalJobs,
        activeJobs,
        completedJobs
      }));

      setRecentJobs(jobs.map(job => ({
        id: job.id,
        service_name: job.service_name,
        service_type: job.service_type,
        status: job.status,
        created_at: job.created_at,
        preferred_date: job.preferred_date,
        service_address: job.service_address,
        price: job.price
      })));


    }
  };

  const fetchLandscaperData = async () => {
    if (!user) return;

    // Get landscaper profile
    const { data: landscaperProfile } = await supabase
      .from('landscapers')
      .select('id, rating, total_reviews')
      .eq('user_id', user.id)
      .single();

    if (!landscaperProfile) return;

    // Fetch landscaper jobs
    const { data: jobs } = await supabase
      .from('jobs')
      .select(`
        id, service_name, service_type, service_address, status, created_at, preferred_date, price, customer_name
      `)
      .eq('landscaper_id', landscaperProfile.id)
      .order('created_at', { ascending: false })
      .limit(10);



    // Fetch payments/earnings
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, status, created_at')
      .eq('landscaper_id', landscaperProfile.id);

    if (jobs) {
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter(job => 
        ['accepted', 'in_progress'].includes(job.status)
      ).length;
      const completedJobs = jobs.filter(job => job.status === 'completed').length;

      setRecentJobs(jobs.map(job => ({
        id: job.id,
        service_name: job.service_name,
        service_type: job.service_type,
        status: job.status,
        created_at: job.created_at,
        preferred_date: job.preferred_date,
        service_address: job.service_address,
        customer_name: job.customer_name,
        price: job.price
      })));



      setStats(prev => ({
        ...prev,
        totalJobs,
        activeJobs,
        completedJobs,
        rating: landscaperProfile.rating || 0,
        totalReviews: landscaperProfile.total_reviews || 0
      }));
    }

    if (payments) {
      const totalEarnings = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      const currentMonth = new Date().getMonth();
      const monthlyEarnings = payments
        .filter(p => 
          p.status === 'completed' && 
          new Date(p.created_at).getMonth() === currentMonth
        )
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const pendingPayments = payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      setStats(prev => ({
        ...prev,
        totalEarnings,
        monthlyEarnings,
        pendingPayments
      }));
    }
  };

  const fetchAdminData = async () => {
    // Fetch admin overview data
    const [
      { data: allJobs },
      { data: allPayments },
      { data: allLandscapers }
    ] = await Promise.all([
      supabase.from('jobs').select('id, status, created_at'),
      supabase.from('payments').select('amount, status, created_at'),
      supabase.from('landscapers').select('id, is_approved')
    ]);

    if (allJobs) {
      const totalJobs = allJobs.length;
      const activeJobs = allJobs.filter(job => 
        ['pending', 'quoted', 'accepted', 'in_progress'].includes(job.status)
      ).length;
      const completedJobs = allJobs.filter(job => job.status === 'completed').length;

      setStats(prev => ({
        ...prev,
        totalJobs,
        activeJobs,
        completedJobs
      }));
    }

    if (allPayments) {
      const totalEarnings = allPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      setStats(prev => ({
        ...prev,
        totalEarnings
      }));
    }
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    stats,
    recentJobs,
    notifications,
    loading,
    error,
    refreshData
  };
}