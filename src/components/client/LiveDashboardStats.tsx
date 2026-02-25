import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  Loader2,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────
interface PricedJob {
  id: string;
  service_name: string;
  service_type: string;
  price: number;
  created_at: string;
}

// ─── StatCard (module-level, not inline) ──────────────────────
function StatCard({
  title,
  value,
  icon,
  accentColor = 'emerald',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: 'emerald' | 'blue' | 'amber' | 'slate';
}) {
  const accentStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    slate: 'bg-slate-800/60 text-slate-400 border-slate-700/50',
  };

  const iconBgStyles = {
    emerald: 'bg-emerald-500/15',
    blue: 'bg-blue-500/15',
    amber: 'bg-amber-500/15',
    slate: 'bg-slate-700/50',
  };

  const iconColorStyles = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    slate: 'text-slate-400',
  };

  return (
    <div
      className={`bg-black/60 backdrop-blur border rounded-2xl p-4 sm:p-5 ${accentStyles[accentColor]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-lg ${iconBgStyles[accentColor]} flex items-center justify-center`}
        >
          <div className={iconColorStyles[accentColor]}>{icon}</div>
        </div>
      </div>
      <div className="text-2xl font-semibold text-white mb-0.5">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <p className="text-xs text-slate-500">{title}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export function LiveDashboardStats() {
  const { stats, loading, error } = useDashboardData('client');
  const { user } = useAuth();

  // Local state for priced jobs — no realtime
  const [pricedJobs, setPricedJobs] = useState<PricedJob[]>([]);
  const [pricedLoading, setPricedLoading] = useState(true);
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // ── Fetch priced jobs once on mount ─────────────────────────
  const fetchPricedJobs = useCallback(async () => {
    if (!user?.id) {
      setPricedLoading(false);
      return;
    }

    try {
      setPricedLoading(true);

      const userEmail = user.email || '';
      const orConditions: string[] = [`user_id.eq.${user.id}`];
      if (userEmail) {
        orConditions.push(`client_email.eq.${userEmail}`);
      }

      const { data, error: qErr } = await supabase
        .from('jobs')
        .select('id, service_name, service_type, price, created_at')
        .eq('status', 'priced')
        .or(orConditions.join(','))
        .order('created_at', { ascending: false });

      if (qErr) {
        console.warn('[LiveDashboardStats] priced jobs query error:', qErr.message);
        setPricedJobs([]);
      } else {
        const normalized: PricedJob[] = (data || []).map((j: Record<string, unknown>) => ({
          id: String(j.id ?? ''),
          service_name: String(j.service_name ?? j.service_type ?? 'Service'),
          service_type: String(j.service_type ?? ''),
          price: Number(j.price) || 0,
          created_at: String(j.created_at ?? ''),
        }));
        setPricedJobs(normalized);
      }
    } catch (err) {
      console.error('[LiveDashboardStats] fetchPricedJobs error:', err);
      setPricedJobs([]);
    } finally {
      setPricedLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    fetchPricedJobs();
  }, [fetchPricedJobs]);

  // ── Accept estimate handler ─────────────────────────────────
  const handleAcceptEstimate = useCallback(
    async (job: PricedJob) => {
      if (!user?.id || acceptingJobId) return;

      setAcceptingJobId(job.id);
      setAcceptError(null);

      try {
        // Step 1: Update job status to 'assigned' (client-side via RLS)
        const { data: updatedRows, error: updateErr } = await supabase
          .from('jobs')
          .update({ status: 'assigned', updated_at: new Date().toISOString() })

          .eq('id', job.id)
          .eq('status', 'priced')
          .select('id');

        if (updateErr) {
          throw new Error('Failed to accept estimate: ' + updateErr.message);
        }

        if (!updatedRows || updatedRows.length === 0) {
          throw new Error(
            'Could not update job status. The estimate may have already been accepted or the job is no longer available.'
          );
        }

        console.log('[LiveDashboardStats] Job', job.id, 'status → assigned');


        // Step 2: Call edge function to create Stripe Checkout Session
        const { data: fnData, error: fnErr } = await supabase.functions.invoke(
          'create-checkout-session',
          {
            body: {
              job_id: job.id,
              price: job.price,
              client_user_id: user.id,
            },
          }
        );

        if (fnErr) {
          throw new Error('Checkout session error: ' + fnErr.message);
        }

        const parsed = typeof fnData === 'string' ? JSON.parse(fnData) : fnData;

        if (!parsed?.success || !parsed?.url) {
          // Revert status on failure
          await supabase
            .from('jobs')
            .update({ status: 'priced', updated_at: new Date().toISOString() })
            .eq('id', job.id);

          throw new Error(parsed?.error || 'No checkout URL returned');
        }

        console.log('[LiveDashboardStats] Redirecting to Stripe Checkout:', parsed.url);

        // Step 3: Redirect to Stripe Checkout
        window.location.href = parsed.url;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[LiveDashboardStats] acceptEstimate error:', message);
        setAcceptError(message);
        setAcceptingJobId(null);
      }
    },
    [user?.id, acceptingJobId]
  );

  // ── Loading skeleton ────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="bg-black/60 backdrop-blur border border-slate-800 rounded-2xl p-4 sm:p-5 animate-pulse"
          >
            <div className="w-9 h-9 bg-slate-800 rounded-lg mb-3" />
            <div className="h-7 bg-slate-800 rounded w-16 mb-1" />
            <div className="h-3 bg-slate-800 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Unable to load stats</span>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        <StatCard
          title="Requests"
          value={stats.totalJobs}
          icon={<Calendar className="w-4 h-4" />}
          accentColor="blue"
        />
        <StatCard
          title="Active"
          value={stats.activeJobs}
          icon={<Clock className="w-4 h-4" />}
          accentColor="amber"
        />
        <StatCard
          title="Completed"
          value={stats.completedJobs}
          icon={<CheckCircle2 className="w-4 h-4" />}
          accentColor="emerald"
        />
        <StatCard
          title="Spent"
          value={`$${stats.totalEarnings.toFixed(0)}`}
          icon={<DollarSign className="w-4 h-4" />}
          accentColor="slate"
        />
      </div>

      {/* Priced jobs — estimate acceptance */}
      {!pricedLoading && pricedJobs.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 border border-emerald-500/30 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">
              Estimates Ready
            </h3>
            <span className="ml-auto px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-medium rounded-full">
              {pricedJobs.length}
            </span>
          </div>

          {acceptError && (
            <div className="mb-3 p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{acceptError}</span>
            </div>
          )}

          <div className="space-y-3">
            {pricedJobs.map((job) => {
              const isAccepting = acceptingJobId === job.id;

              return (
                <div
                  key={job.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-black/40 border border-emerald-500/15 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {job.service_name || job.service_type || 'Service'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Estimate:{' '}
                      <span className="text-emerald-400 font-semibold">
                        ${job.price.toFixed(2)}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleAcceptEstimate(job)}
                    disabled={isAccepting || !!acceptingJobId}
                    className={`
                      flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                      transition-all duration-200 shrink-0
                      ${
                        isAccepting
                          ? 'bg-emerald-700/50 text-emerald-300 cursor-wait'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {isAccepting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing…</span>
                      </>
                    ) : (
                      <>
                        <span>Accept Estimate</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
