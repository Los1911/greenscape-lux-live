import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StandardizedButton } from '@/components/ui/standardized-button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRealtimePatch, RealtimeEventType } from '@/hooks/useRealtimePatch';

interface JobStats {
  total: number;
  completed: number;
  active: number;
  awaitingDecision: number;
  totalSpent: number;
}

// ── Module-level StatItem (not inline) ────────────────────────
function StatItem({ value, label, isLoading, highlight }: {
  value: string | number;
  label: string;
  isLoading: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      {isLoading ? (
        <Skeleton className="h-8 w-12 mx-auto mb-1 bg-gray-700" />
      ) : (
        <div className={`text-2xl sm:text-2xl text-xl font-bold mb-1 ${highlight ? 'text-emerald-400' : 'text-white'}`}>
          {value}
        </div>
      )}
      <div className="text-sm text-gray-400 whitespace-nowrap">{label}</div>
    </div>
  );
}

export const JobsOverviewSection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<JobStats>({ total: 0, completed: 0, active: 0, awaitingDecision: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = useCallback((jobs: { status: string; price: number | null }[]) => {
    const total = jobs.length;
    const completed = jobs.filter(job => job.status === 'completed').length;
    const awaitingDecision = jobs.filter(job => job.status === 'priced').length;
    const active = jobs.filter(job => 
      job.status === 'pending' || 
      job.status === 'available' || 
      job.status === 'scheduled' || 
      job.status === 'assigned' || 
      job.status === 'active'
    ).length;

    const totalSpent = jobs
      .filter(job => ['scheduled', 'assigned', 'active', 'completed'].includes(job.status))
      .reduce((sum, job) => sum + (parseFloat(String(job.price)) || 0), 0);


    setStats({ total, completed, active, awaitingDecision, totalSpent });
  }, []);

  const fetchJobStats = useCallback(async (showLoading = true) => {
    if (!user) return;
    
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const userEmail = user.email || '';
      const orConditions: string[] = [`user_id.eq.${user.id}`];
      if (userEmail) {
        orConditions.push(`client_email.eq.${userEmail}`);
      }

      const { data: jobs, error: queryError } = await supabase
        .from('jobs')
        .select('status, price')
        .or(orConditions.join(','));

      if (queryError) {
        let allJobs: { status: string; price: number | null }[] = [];
        const existingIds = new Set<string>();

        const { data: userIdJobs } = await supabase
          .from('jobs')
          .select('id, status, price')
          .eq('user_id', user.id);

        if (userIdJobs) {
          for (const job of userIdJobs) {
            if (!existingIds.has(job.id)) {
              allJobs.push({ status: job.status, price: job.price });
              existingIds.add(job.id);
            }
          }
        }

        if (userEmail) {
          const { data: emailJobs } = await supabase
            .from('jobs')
            .select('id, status, price')
            .eq('client_email', userEmail);

          if (emailJobs) {
            for (const job of emailJobs) {
              if (!existingIds.has(job.id)) {
                allJobs.push({ status: job.status, price: job.price });
                existingIds.add(job.id);
              }
            }
          }
        }

        calculateStats(allJobs);
      } else {
        calculateStats(jobs || []);
      }
    } catch (err) {
      console.error('[JobsOverviewSection] Error fetching job stats:', err);
      setError('Failed to load job statistics');
    } finally {
      setLoading(false);
    }
  }, [user, calculateStats]);

  // ── Initial fetch on mount ──
  useEffect(() => {
    if (!user) return;
    fetchJobStats(true);
  }, [user, fetchJobStats]);

  // ── Realtime: silently re-fetch stats (no loading spinner) ──
  const realtimeSubs = useMemo(() => {
    if (!user?.id) return [];
    const subs: { table: string; event: '*'; filter?: string }[] = [
      { table: 'jobs', event: '*' as const, filter: `user_id=eq.${user.id}` },
    ];
    // Also subscribe by client_email so admin-created jobs (matched only
    // by email) still trigger realtime stat recalculation.
    if (user?.email) {
      subs.push({ table: 'jobs', event: '*' as const, filter: `client_email=eq.${user.email}` });
    }
    return subs;
  }, [user?.id, user?.email]);

  useRealtimePatch({
    channelName: `client-overview-${user?.id || 'anon'}`,
    subscriptions: realtimeSubs,
    enabled: !!user?.id,
    onEvent: (_eventType, _table, newRow, oldRow) => {
      // ── DEBUG: temporary console log — remove after verification ──
      console.log(
        `[JobsOverviewSection:RT] ${_eventType} job=${(newRow.id as string)?.slice(0, 8)} ` +
        `status=${oldRow?.status ?? '?'}→${newRow.status ?? '?'}`
      );

      // Silent re-fetch — no loading state toggled
      fetchJobStats(false);
    },
    debounceMs: 800,
  });



  const handleRequestService = () => {
    navigate('/client-quote');
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white">Jobs Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="text-red-400 text-sm text-center py-2">
            {error}
          </div>
        )}
        
        {/* Stats Grid */}
        <div className={`grid ${stats.awaitingDecision > 0 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'} gap-3 sm:gap-6`}>
          <StatItem value={stats.total} label="Total Jobs" isLoading={loading} />
          {stats.awaitingDecision > 0 && (
            <StatItem value={stats.awaitingDecision} label="Estimates Ready" isLoading={loading} highlight />
          )}
          <StatItem value={stats.active} label="Active" isLoading={loading} />
          <StatItem value={stats.completed} label="Completed" isLoading={loading} />
          <StatItem 
            value={`$${stats.totalSpent.toFixed(0)}`} 
            label="Total Spent" 
            isLoading={loading} 
          />
        </div>

        {/* No Jobs Message */}
        {!loading && stats.total === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">No active jobs found.</div>
            <StandardizedButton
              variant="primary"
              size="lg"
              label="Request Your First Service"
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 border-0"
              onClick={handleRequestService}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

