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
  RefreshCw,
} from 'lucide-react';


import { useDashboardData } from '@/hooks/useDashboardData';
import { supabase } from '@/lib/supabase';
import { invokeEdgeFunction } from '@/lib/edgeFunctionClient';
import { useAuth } from '@/contexts/AuthContext';


// ─── Types ────────────────────────────────────────────────────
interface PricedJob {
  id: string;
  service_name: string;
  service_type: string;
  price: number;
  created_at: string;
  payment_status: string; // Track payment state for duplicate prevention
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
  // Neutral info banner for 409 "already paid" — auto-clears
  const [acceptInfo, setAcceptInfo] = useState<string | null>(null);


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
        .select('id, service_name, service_type, price, created_at, payment_status')
        .eq('status', 'priced')
        .or(orConditions.join(','))
        .order('created_at', { ascending: false });

      if (qErr) {
        console.warn('[LiveDashboardStats] priced jobs query error:', qErr.message);
        setPricedJobs([]);
      } else {
        const normalized: PricedJob[] = (data || [])
          .filter((j: Record<string, unknown>) => j.payment_status !== 'paid')
          .map((j: Record<string, unknown>) => ({
            id: String(j.id ?? ''),
            service_name: String(j.service_name ?? j.service_type ?? 'Service'),
            service_type: String(j.service_type ?? ''),
            price: Number(j.price) || 0,
            created_at: String(j.created_at ?? ''),
            payment_status: String(j.payment_status ?? 'unpaid'),
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
    async (jobId: string, jobPrice: number) => {
      if (!user?.id || acceptingJobId) return;

      const targetJob = pricedJobs.find(j => j.id === jobId);
      if (targetJob?.payment_status === 'paid') {
        setAcceptInfo('Payment already processed — syncing...');
        setTimeout(() => setAcceptInfo(null), 4000);
        fetchPricedJobs();
        return;
      }

      console.log('[LiveDashboardStats] ACCEPT_CLICK job_id:', jobId, 'payment_status:', targetJob?.payment_status);

      setAcceptingJobId(jobId);
      setAcceptError(null);
      setAcceptInfo(null);

      try {
        // Use invokeEdgeFunction (native fetch with JWT refresh) instead of
        // supabase.functions.invoke() to avoid FunctionsFetchError when
        // verify_jwt=true and JWT is near-expiry.
        const { data: fnData, error: fnErrMsg } = await invokeEdgeFunction(
          'create-checkout-session',
          {
            job_id: jobId,
            price: jobPrice,
            client_user_id: user.id,
          },
        );

        // invokeEdgeFunction returns { data, error: string | null }
        if (fnErrMsg) {
          // Check for "already paid" style messages
          if (fnErrMsg.includes('already been paid') || fnErrMsg.includes('not available')) {
            console.log('[LiveDashboardStats] Backend confirmed already paid — refetching');
            setPricedJobs(prev => prev.filter(j => j.id !== jobId));
            setAcceptInfo('Payment already processed — syncing...');
            setTimeout(() => setAcceptInfo(null), 4000);
            setAcceptingJobId(null);
            fetchPricedJobs().catch(() => {});
            return;
          }
          throw new Error('Checkout session error: ' + fnErrMsg);
        }

        if (!fnData?.success || !fnData?.url) {
          if (fnData?.error?.includes('already been paid') || fnData?.error?.includes('not available')) {
            console.log('[LiveDashboardStats] Backend confirmed already paid — refetching');
            setPricedJobs(prev => prev.filter(j => j.id !== jobId));
            setAcceptInfo('Payment already processed — syncing...');
            setTimeout(() => setAcceptInfo(null), 4000);
            setAcceptingJobId(null);
            fetchPricedJobs().catch(() => {});
            return;
          }
          throw new Error(fnData?.error || 'No checkout URL returned');
        }

        console.log('[LiveDashboardStats] Redirecting to Stripe Checkout for job', jobId);
        window.location.href = fnData.url;

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[LiveDashboardStats] acceptEstimate error for job', jobId, ':', message);
        if (message.includes('already been paid') || message.includes('not available for payment')) {
          setPricedJobs(prev => prev.filter(j => j.id !== jobId));
          setAcceptInfo('Payment already processed — syncing...');
          setTimeout(() => setAcceptInfo(null), 4000);
          fetchPricedJobs().catch(() => {});
        } else {
          setAcceptError(message);
        }
        setAcceptingJobId(null);
      }
    },
    [user?.id, acceptingJobId, pricedJobs, fetchPricedJobs]
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
                    onClick={() => handleAcceptEstimate(job.id, job.price)}
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
