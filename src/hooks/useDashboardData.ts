import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { JOBS_COLUMNS, LANDSCAPERS_COLUMNS, safeString, safeNumber } from '@/lib/databaseSchema';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalEarnings: number;
  monthlyEarnings: number;
  rating: number;
  totalReviews: number;
}

interface NormalizedJob {
  id: string;
  status: string;
  price: number;
  created_at: string;
  landscaper_email?: string | null;
  [key: string]: unknown;
}

const defaultStats: DashboardStats = {
  totalJobs: 0,
  activeJobs: 0,
  completedJobs: 0,
  totalEarnings: 0,
  monthlyEarnings: 0,
  rating: 0,
  totalReviews: 0
};

function normalizeJob(rawJob: Record<string, unknown>): NormalizedJob {
  return {
    ...rawJob,
    id: safeString(rawJob, 'id'),
    status: safeString(rawJob, 'status', 'pending'),
    price: safeNumber(rawJob, 'price'),
    created_at: safeString(rawJob, 'created_at'),
  };
}

export const useDashboardData = (role: 'client' | 'landscaper' = 'client') => {
  const { user, session, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<NormalizedJob[]>([]);
  const [notifications] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientJobs = useCallback(async (): Promise<NormalizedJob[]> => {
    if (!user) return [];

    const userEmail = user.email || '';

    const orConditions: string[] = [];
    orConditions.push(`user_id.eq.${user.id}`);
    if (userEmail) {
      orConditions.push(`client_email.eq.${userEmail}`);
    }

    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          ${JOBS_COLUMNS.clientView},
          landscapers (
            id,
            email
          )
        `)
        .or(orConditions.join(','))
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.warn('[useDashboardData] Combined query error:', jobsError.message);
        return [];
      }

      return (jobsData || []).map((job: any) => {
        const normalized = normalizeJob(job);
        return {
          ...normalized,
          landscaper_email: job.landscapers?.email ?? null
        };
      });

    } catch (err) {
      console.error('[useDashboardData] Error fetching client jobs:', err);
      return [];
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!session || !user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let jobsData: NormalizedJob[] = [];

        if (role === 'landscaper') {

          const { data: landscaper } = await supabase
            .from('landscapers')
            .select(LANDSCAPERS_COLUMNS.minimal)
            .eq('user_id', user.id)
            .maybeSingle();

          if (landscaper?.id) {
            const { data } = await supabase
              .from('jobs')
              .select(`
                ${JOBS_COLUMNS.landscaperView},
                landscapers (
                  id,
                  email
                )
              `)
              .eq('landscaper_id', landscaper.id)
              .order('created_at', { ascending: false });

            jobsData = (data || []).map((job: any) => {
              const normalized = normalizeJob(job);
              return {
                ...normalized,
                landscaper_email: job.landscapers?.email ?? null
              };
            });
          }

        } else {
          jobsData = await fetchClientJobs();
        }

        setJobs(jobsData);

        const activeStatuses = ['assigned', 'scheduled', 'active'];
        const completedStatuses = ['completed', 'completed_pending_review'];

        const active = jobsData.filter(j => activeStatuses.includes(j.status));
        const completed = jobsData.filter(j => completedStatuses.includes(j.status));

        const totalEarnings = completed.reduce(
          (sum, j) => sum + (Number(j.price) || 0),
          0
        );

        setStats({
          totalJobs: jobsData.length,
          activeJobs: active.length,
          completedJobs: completed.length,
          totalEarnings,
          monthlyEarnings: 0,
          rating: 0,
          totalReviews: 0
        });

      } catch (err) {
        console.error('[useDashboardData] Error:', err);
        setStats(defaultStats);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (role === 'client' && user) {
      const channel = supabase
        .channel('dashboard-jobs-' + user.id)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'jobs' },
          () => fetchData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

  }, [authLoading, session, user, role, fetchClientJobs]);

  return { jobs, notifications, stats, loading, error };
};