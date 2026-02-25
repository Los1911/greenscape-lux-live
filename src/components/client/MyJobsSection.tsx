import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimePatch, patchArray, RealtimeEventType } from '@/hooks/useRealtimePatch';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase,

  MapPin, 
  Calendar, 
  DollarSign, 
  Clock, 
  RefreshCw, 
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  ArrowRight,
  XCircle,
  CreditCard
} from 'lucide-react';
import { MessageNotificationBadge } from '@/components/messaging/MessageNotificationBadge';
import { JOBS_COLUMNS, safeString, safeNumber } from '@/lib/databaseSchema';
import JobDetailsModal from './JobDetailsModal';
import { Job } from '@/types/job';

interface LocalJob {
  id: string;
  service_type: string;
  service_name?: string;
  service_address?: string;
  preferred_date?: string;
  scheduled_date?: string;
  status: string;
  price?: number;
  landscaper_id?: string;
  landscaper_email?: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  client_email?: string;
  customer_name?: string;
  flagged_at?: string;
  flagged_reason?: string;
  remediation_deadline?: string;
  remediation_status?: string;
  remediation_notes?: string;
}

interface UnreadCounts {
  [jobId: string]: number;
}

// Normalize job data to handle missing/renamed columns safely
function normalizeJobData(rawJob: Record<string, unknown>): LocalJob {
  return {
    id: safeString(rawJob, 'id'),
    service_type: safeString(rawJob, 'service_type') || safeString(rawJob, 'service_name') || 'Service',
    service_name: safeString(rawJob, 'service_name') || safeString(rawJob, 'service_type'),
    service_address: safeString(rawJob, 'service_address') || safeString(rawJob, 'property_address'),
    preferred_date: safeString(rawJob, 'preferred_date'),
    scheduled_date: safeString(rawJob, 'scheduled_date'),
    status: safeString(rawJob, 'status', 'pending'),
    price: safeNumber(rawJob, 'price'),

    landscaper_id: safeString(rawJob, 'landscaper_id'),
    landscaper_email: safeString(rawJob, 'landscaper_email'),
    created_at: safeString(rawJob, 'created_at'),
    updated_at: safeString(rawJob, 'updated_at'),
    user_id: safeString(rawJob, 'user_id'),
    client_email: safeString(rawJob, 'client_email'),
    customer_name: safeString(rawJob, 'customer_name'),
    flagged_at: safeString(rawJob, 'flagged_at'),
    flagged_reason: safeString(rawJob, 'flagged_reason'),
    remediation_deadline: safeString(rawJob, 'remediation_deadline'),
    remediation_status: safeString(rawJob, 'remediation_status'),
    remediation_notes: safeString(rawJob, 'remediation_notes'),
  };
}

// Convert LocalJob to Job type for modal
function toJob(localJob: LocalJob): Job {
  return {
    id: localJob.id,
    service_name: localJob.service_name || localJob.service_type || 'Service',
    service_type: localJob.service_type || null,
    service_address: localJob.service_address || null,
    price: localJob.price || null,
    preferred_date: localJob.preferred_date || localJob.scheduled_date || null,
    status: localJob.status,
    customer_name: localJob.customer_name || 'Customer',
    created_at: localJob.created_at,
    updated_at: localJob.updated_at || localJob.created_at,
    landscaper_id: localJob.landscaper_id || null,
    flagged_at: localJob.flagged_at || null,
    flagged_reason: localJob.flagged_reason || null,
    remediation_deadline: localJob.remediation_deadline || null,
    remediation_status: localJob.remediation_status as any || null,
    remediation_notes: localJob.remediation_notes || null,
  };
}

// ── Module-level status indicator (not inline) ────────────────
function JobStatusIndicator({ status }: { status: string }) {
  const getConfig = () => {
    switch (status) {
      case 'pending':
      case 'quoted':
        return { 
          icon: Circle, 
          color: 'text-slate-400', 
          bg: 'bg-slate-500/20',
          label: 'Requested' 
        };
      case 'priced':
        return {
          icon: CreditCard,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/20',
          label: 'Estimate Ready'
        };
      case 'assigned':
        return {
          icon: Clock,
          color: 'text-blue-400',
          bg: 'bg-blue-500/20',
          label: 'Assigned'
        };

      case 'scheduled':
        return {
          icon: Calendar,
          color: 'text-blue-400',
          bg: 'bg-blue-500/20',
          label: 'Scheduled'
        };
      case 'assigned':
        return { 
          icon: Circle, 
          color: 'text-blue-400', 
          bg: 'bg-blue-500/20',
          label: 'Assigned' 
        };
      case 'in_progress':
        return { 
          icon: Circle, 
          color: 'text-amber-400', 
          bg: 'bg-amber-500/20',
          label: 'In Progress' 
        };
      case 'completed':
        return { 
          icon: CheckCircle2, 
          color: 'text-emerald-400', 
          bg: 'bg-emerald-500/20',
          label: 'Completed' 
        };
      case 'flagged_review':
        return { 
          icon: AlertCircle, 
          color: 'text-amber-400', 
          bg: 'bg-amber-500/20',
          label: 'Issue' 
        };
      case 'cancelled':
        return { 
          icon: XCircle, 
          color: 'text-slate-500', 
          bg: 'bg-slate-600/20',
          label: 'Cancelled' 
        };
      default:
        return { 
          icon: Circle, 
          color: 'text-slate-400', 
          bg: 'bg-slate-500/20',
          label: status 
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Badge className={`${config.bg} ${config.color} border-transparent text-xs font-medium`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

export function MyJobsSection() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<LocalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});

  // ── Accept / Reject state ─────────────────────────────────
  const [actionJobId, setActionJobId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      const userEmail = user.email || '';

      // Build OR conditions for the query
      const orConditions: string[] = [`user_id.eq.${user.id}`];
      if (userEmail) {
        orConditions.push(`client_email.eq.${userEmail}`);
      }

      // Use explicit column selection instead of select('*')
      const { data: jobsData, error: queryError } = await supabase
        .from('jobs')
        .select(JOBS_COLUMNS.clientView)
        .or(orConditions.join(','))
        .order('created_at', { ascending: false });

      if (queryError) {
        // Fallback: Query separately and merge
        let allJobs: LocalJob[] = [];
        const existingIds = new Set<string>();

        // Query by user_id with explicit columns
        const { data: userIdJobs } = await supabase
          .from('jobs')
          .select(JOBS_COLUMNS.clientView)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (userIdJobs) {
          for (const job of userIdJobs) {
            const normalized = normalizeJobData(job as Record<string, unknown>);
            if (!existingIds.has(normalized.id)) {
              allJobs.push(normalized);
              existingIds.add(normalized.id);
            }
          }
        }

        // Query by client_email with explicit columns
        if (userEmail) {
          const { data: emailJobs } = await supabase
            .from('jobs')
            .select(JOBS_COLUMNS.clientView)
            .eq('client_email', userEmail)
            .order('created_at', { ascending: false });

          if (emailJobs) {
            for (const job of emailJobs) {
              const normalized = normalizeJobData(job as Record<string, unknown>);
              if (!existingIds.has(normalized.id)) {
                allJobs.push(normalized);
                existingIds.add(normalized.id);
              }
            }
          }
        }

        // Sort by created_at descending
        allJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setJobs(allJobs);
      } else {
        // Normalize all jobs to handle missing columns safely
        const normalizedJobs = (jobsData || []).map(job => normalizeJobData(job as Record<string, unknown>));
        setJobs(normalizedJobs);
      }
    } catch (err) {
      console.error('[MyJobsSection] Error loading jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]);

  // ── Realtime: patch jobs array in-place (no loading state) ──
  //
  // BUG FIX: patchArray is a FACTORY — call it once with (setState, transform)
  // to get a patcher callback. Previously it was called inline as
  //   setJobs(prev => patchArray(prev, eventType, ...))
  // which passed an array as setState and a string as transform, returning
  // a function that React set as the new state value — crashing on next render.
  //
  const jobsPatcher = useMemo(() => patchArray<LocalJob>(setJobs, normalizeJobData), []);

  const realtimeSubs = useMemo(() => {
    if (!user?.id) return [];
    const subs: { table: string; event: '*'; filter?: string }[] = [
      { table: 'jobs', event: '*' as const, filter: `user_id=eq.${user.id}` },
    ];
    // Also subscribe by client_email so jobs matched only by email
    // (e.g. admin-created) still trigger realtime updates.
    // Supabase Realtime only supports a single equality filter per
    // subscription entry, so we need a second entry.
    if (user?.email) {
      subs.push({ table: 'jobs', event: '*' as const, filter: `client_email=eq.${user.email}` });
    }
    return subs;
  }, [user?.id, user?.email]);

  useRealtimePatch({
    channelName: `client-myjobs-${user?.id || 'anon'}`,
    subscriptions: realtimeSubs,
    enabled: !!user?.id,
    onEvent: (eventType: RealtimeEventType, table: string, newRow: Record<string, any>, oldRow: Record<string, any>) => {
      if (table !== 'jobs') return;

      // ── DEBUG: temporary console log — remove after verification ──
      console.log(
        `[MyJobsSection:RT] ${eventType} job=${newRow.id?.slice(0, 8)} ` +
        `status=${oldRow?.status ?? '?'}→${newRow.status ?? '?'}`
      );

      // Patch the jobs array in-place via the factory patcher.
      // This handles INSERT (prepend + dedup), UPDATE (merge by id),
      // and DELETE (remove by id). normalizeJobData runs on every row.
      jobsPatcher(eventType, newRow, oldRow);

      // Patch selectedJob if the modal is open for this job
      if (eventType === 'UPDATE' && newRow.id) {
        setSelectedJob(prev => {
          if (prev && prev.id === newRow.id) {
            return toJob(normalizeJobData(newRow));
          }
          return prev;
        });
      }
    },
    debounceMs: 400,
  });



  // Load unread message counts for all jobs
  const loadUnreadCounts = useCallback(async () => {
    if (!user?.id || jobs.length === 0) return;

    try {
      const jobIds = jobs.map(j => j.id);
      
      // Get user's read status for each job
      const { data: readStatuses } = await supabase
        .from('message_read_status')
        .select('job_id, last_read_at')
        .eq('user_id', user.id)
        .in('job_id', jobIds);

      const readStatusMap = new Map<string, string>();
      (readStatuses || []).forEach(rs => {
        readStatusMap.set(rs.job_id, rs.last_read_at);
      });

      // Get messages for all jobs
      const { data: messages } = await supabase
        .from('job_messages')
        .select('job_id, created_at, sender_id')
        .in('job_id', jobIds)
        .neq('sender_id', user.id);

      // Calculate unread counts
      const counts: UnreadCounts = {};
      (messages || []).forEach(msg => {
        const lastReadAt = readStatusMap.get(msg.job_id);
        const isUnread = !lastReadAt || new Date(msg.created_at) > new Date(lastReadAt);
        if (isUnread) {
          counts[msg.job_id] = (counts[msg.job_id] || 0) + 1;
        }
      });

      setUnreadCounts(counts);
    } catch (error) {
      console.error('[MyJobsSection] Error loading unread counts:', error);
    }
  }, [user?.id, jobs]);

  // ── Initial fetch on mount only (no refreshTrigger) ─────────
  useEffect(() => {
    if (!user?.id) return;
    loadJobs();
  }, [user?.id, user?.email, loadJobs]);

  // Load unread counts when jobs change
  useEffect(() => {
    loadUnreadCounts();
  }, [jobs, loadUnreadCounts]);


  // ── Accept estimate handler ─────────────────────────────────
  const handleAcceptEstimate = useCallback(async (job: LocalJob, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't open the detail modal
    if (!user?.id || actionJobId) return;

    setActionJobId(job.id);
    setActionError(null);

    try {
     

      // Step 3: Call edge function to create Stripe Checkout Session
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

        throw new Error(parsed?.error || 'No checkout URL returned');
      }

      console.log('[MyJobsSection] Redirecting to Stripe Checkout');

      // Step 4: Redirect to Stripe Checkout
      window.location.href = parsed.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[MyJobsSection] acceptEstimate error:', message);
      setActionError(message);
      setActionJobId(null);
    }
  }, [user?.id, actionJobId]);

  // ── Reject estimate handler ─────────────────────────────────
  const handleRejectEstimate = useCallback(async (job: LocalJob, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't open the detail modal
    if (!user?.id || actionJobId) return;

    setActionJobId(job.id);
    setActionError(null);

    try {
      const { data: updatedRows, error: updateErr } = await supabase
        .from('jobs')
        .update({
          status: 'cancelled',
          rejected_at: new Date().toISOString(),
          rejected_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)
        .eq('status', 'priced')   // guard: only transition from priced
        .select('id');

      if (updateErr) {
        throw new Error('Failed to reject estimate: ' + updateErr.message);
      }

      if (!updatedRows || updatedRows.length === 0) {
        throw new Error('Could not reject. The estimate may have already been actioned.');
      }

      console.log('[MyJobsSection] Job', job.id, 'status → cancelled (rejected)');

      // Update local state to remove from priced display
      setJobs(prev => prev.map(j =>
        j.id === job.id ? { ...j, status: 'cancelled' } : j
      ));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[MyJobsSection] rejectEstimate error:', message);
      setActionError(message);
    } finally {
      setActionJobId(null);
    }
  }, [user?.id, actionJobId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleJobClick = (job: LocalJob) => {
    setSelectedJob(toJob(job));
    // Clear unread count when opening job
    if (unreadCounts[job.id]) {
      setUnreadCounts(prev => ({ ...prev, [job.id]: 0 }));
    }
  };

  // ── Callback when modal triggers accept/reject ──────────────
  const handleModalJobUpdate = useCallback((jobId: string, newStatus: string) => {
    setJobs(prev => prev.map(j =>
      j.id === jobId ? { ...j, status: newStatus } : j
    ));
    setSelectedJob(null);
  }, []);

  if (loading) {
    return (
      <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            My Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            My Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-red-400">{error}</div>
        </CardContent>
      </Card>
    );
  }

  // ── Partition jobs: priced first, then the rest ─────────────
  const pricedJobs = jobs.filter(j => j.status === 'priced');
  const otherJobs = jobs.filter(j => j.status !== 'priced');

  return (
    <>
      <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            My Jobs
            {jobs.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-sm rounded-full">
                {jobs.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium mb-1">No jobs yet</p>
              <p className="text-sm text-slate-500">Request a service to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* ── Action error banner ──────────────────────── */}
              {actionError && (
                <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{actionError}</span>
                  <button
                    onClick={() => setActionError(null)}
                    className="ml-auto text-red-400 hover:text-red-300"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ── Priced jobs: explicit decision required ──── */}
              {pricedJobs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-300">
                      Estimates Ready — Action Required
                    </span>
                    <span className="ml-auto px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-medium rounded-full">
                      {pricedJobs.length}
                    </span>
                  </div>

                  {pricedJobs.map((job) => {
                    const isActioning = actionJobId === job.id;

                    return (
                      <div
                        key={job.id}
                        className="p-4 bg-gradient-to-r from-emerald-950/40 to-slate-900/60 border border-emerald-500/30 rounded-xl"
                      >
                        {/* Job info row */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-semibold text-white truncate">
                              {job.service_name || job.service_type || 'Service Request'}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-400">
                              {(job.scheduled_date || job.preferred_date) && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-emerald-500/70" />
                                  <span>{formatDate(job.scheduled_date || job.preferred_date)}</span>
                                </div>
                              )}
                              {job.service_address && (
                                <div className="flex items-center gap-1.5 max-w-[180px]">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-500/70 shrink-0" />
                                  <span className="truncate">{job.service_address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-emerald-300">
                              ${Number(job.price || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500">Estimate</p>
                          </div>
                        </div>

                        {/* ── Accept / Reject buttons ──────────── */}
                        {job.status === 'priced' && (
                          <div className="flex gap-3 pt-3 border-t border-emerald-500/15">
                            <button
                              onClick={(e) => handleAcceptEstimate(job, e)}
                              disabled={isActioning || !!actionJobId}
                              className={`
                                flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                                transition-all duration-200
                                ${isActioning
                                  ? 'bg-emerald-700/50 text-emerald-300 cursor-wait'
                                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40'
                                }
                                disabled:opacity-50 disabled:cursor-not-allowed
                              `}
                            >
                              {isActioning ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Processing...</span>
                                </>
                              ) : (
                                <>
                                  <span>Accept Estimate</span>
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </button>

                            <button
                              onClick={(e) => handleRejectEstimate(job, e)}
                              disabled={isActioning || !!actionJobId}
                              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── All other jobs ──────────────────────────── */}
              {otherJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => handleJobClick(job)}
                  className="w-full text-left p-4 bg-slate-900/60 border border-slate-700/50 rounded-xl hover:border-emerald-500/40 hover:bg-slate-800/60 transition-all duration-200 group"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
                        {job.service_name || job.service_type || 'Service Request'}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {unreadCounts[job.id] > 0 && (
                        <MessageNotificationBadge count={unreadCounts[job.id]} size="sm" />
                      )}
                      <JobStatusIndicator status={job.status} />
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
                    {/* Date */}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500/70" />
                      <span>
                        {formatDate(job.scheduled_date || job.preferred_date)}
                      </span>
                    </div>

                    {/* Address (truncated) */}
                    {job.service_address && (
                      <div className="flex items-center gap-1.5 max-w-[180px]">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500/70 shrink-0" />
                        <span className="truncate">{job.service_address}</span>
                      </div>
                    )}

                    {/* Price */}
                    {job.price != null && job.price > 0 && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500/70" />
                        <span className="text-emerald-400 font-medium">
                          ${Number(job.price).toFixed(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tap indicator */}
                  <div className="flex items-center justify-end mt-3 pt-3 border-t border-slate-700/30">
                    <div className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-emerald-400 transition-colors">
                      <span>View details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Details Bottom Sheet Modal */}
      <JobDetailsModal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        job={selectedJob}
        onJobStatusChange={handleModalJobUpdate}
      />
    </>
  );
}

export default MyJobsSection;

