import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import {
  RefreshCw,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

import { MessageNotificationBadge } from '@/components/messaging/MessageNotificationBadge';
import JobDetailsModal from './JobDetailsModal';
import { JOBS_COLUMNS, safeString, safeNumber } from '@/lib/databaseSchema';
import { Job } from '@/types/job';

interface LocalJob {
  id: string;
  service_type?: string;
  service_name?: string;
  service_address?: string;
  preferred_date?: string;
  scheduled_date?: string;
  status: string;
  price?: number;
  landscaper_id?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  client_email?: string;
  customer_name?: string;
}

function normalizeJobData(raw: Record<string, unknown>): LocalJob {
  return {
    id: safeString(raw, 'id'),
    service_type: safeString(raw, 'service_type'),
    service_name: safeString(raw, 'service_name'),
    service_address: safeString(raw, 'service_address'),
    preferred_date: safeString(raw, 'preferred_date'),
    scheduled_date: safeString(raw, 'scheduled_date'),
    status: safeString(raw, 'status', 'pending'),
    price: safeNumber(raw, 'price'),
    landscaper_id: safeString(raw, 'landscaper_id'),
    created_at: safeString(raw, 'created_at'),
    updated_at: safeString(raw, 'updated_at'),
    user_id: safeString(raw, 'user_id'),
    client_email: safeString(raw, 'client_email'),
    customer_name: safeString(raw, 'customer_name'),
  };
}

function toJob(local: LocalJob): Job {
  return {
    id: local.id,
    service_name: local.service_name || local.service_type || 'Service',
    service_type: local.service_type || null,
    service_address: local.service_address || null,
    price: local.price || null,
    preferred_date: local.preferred_date || null,
    scheduled_date: local.scheduled_date || null,
    status: local.status as any,
    customer_name: local.customer_name || 'Customer',
    created_at: local.created_at || '',
    updated_at: local.updated_at || local.created_at || '',
    landscaper_id: local.landscaper_id || null,
  } as Job;
}

function JobStatusIndicator({ status }: { status: string }) {
  switch (status) {
    case 'pending':
    case 'quoted':
      return <Badge className="bg-slate-500/20 text-slate-400">Requested</Badge>;

    case 'priced':
      return <Badge className="bg-emerald-500/20 text-emerald-400">Estimate Ready</Badge>;

    case 'scheduled':
      return <Badge className="bg-blue-500/20 text-blue-400">Scheduled</Badge>;

    case 'assigned':
      return <Badge className="bg-blue-500/20 text-blue-400">Assigned</Badge>;

    case 'active':
      return <Badge className="bg-amber-500/20 text-amber-400">Active</Badge>;

    case 'completed':
    case 'completed_pending_review':
      return <Badge className="bg-emerald-500/20 text-emerald-400">Completed</Badge>;

    case 'cancelled':
      return <Badge className="bg-slate-600/20 text-slate-500">Cancelled</Badge>;

    default:
      return <Badge className="bg-slate-500/20 text-slate-400">{status}</Badge>;
  }
}

export default function MyJobsSection() {
  const { user } = useAuth();

  const [jobs, setJobs] = useState<LocalJob[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [actionJobId, setActionJobId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setActionError(null);

    const { data, error } = await supabase
      .from('jobs')
      .select(JOBS_COLUMNS.clientView)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[MyJobsSection] loadJobs error:', error);
      setActionError(error.message);
      setJobs([]);
      setLoading(false);
      return;
    }

    const normalized = (data || []).map((row: any) => normalizeJobData(row));
    setJobs(normalized);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const pricedJobs = useMemo(() => jobs.filter(j => j.status === 'priced'), [jobs]);
  const otherJobs = useMemo(() => jobs.filter(j => j.status !== 'priced'), [jobs]);

  const handleAcceptEstimate = async (job: LocalJob) => {
    if (!user?.id || actionJobId) return;

    setActionJobId(job.id);
    setActionError(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          job_id: job.id,
          price: job.price,
          client_user_id: user.id,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL returned');

      console.log('[MyJobsSection] Redirecting to Stripe checkout');
      window.location.href = data.url;
    } catch (err: any) {
      console.error('[MyJobsSection] Accept failed:', err);
      setActionError(err?.message || 'Failed to start checkout');
    } finally {
      setActionJobId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center p-8">
          <RefreshCw className="animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            My Jobs
            <MessageNotificationBadge />
          </CardTitle>

          <button
            onClick={loadJobs}
            className="text-emerald-300 hover:text-emerald-200 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </CardHeader>

        <CardContent>
          {actionError && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-red-500/30 bg-red-900/20 px-3 py-2 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <span>{actionError}</span>
            </div>
          )}

          {pricedJobs.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 text-emerald-200 text-sm">
                Estimates Ready
                <span className="text-emerald-400"> Action Required</span>
              </div>

              <div className="space-y-3">
                {pricedJobs.map(job => (
                  <div
                    key={job.id}
                    className="rounded-lg border border-emerald-500/20 bg-black/30 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-emerald-100 truncate">
                          {job.service_name || job.service_type || 'Service'}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                          {job.preferred_date && <span>{job.preferred_date}</span>}
                          {job.service_address && <span className="truncate">{job.service_address}</span>}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-emerald-200 font-semibold">
                          {typeof job.price === 'number' ? `$${job.price.toFixed(2)}` : '$0.00'}
                        </div>
                        <div className="text-xs text-slate-400">Estimate</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <JobStatusIndicator status={job.status} />

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptEstimate(job)}
                          disabled={actionJobId === job.id}
                          className="rounded-md bg-emerald-600/80 hover:bg-emerald-600 text-black px-4 py-2 text-sm font-semibold disabled:opacity-60"
                        >
                          {actionJobId === job.id ? 'Processing...' : 'Accept Estimate'}
                          <ChevronRight className="inline-block h-4 w-4 ml-1" />
                        </button>

                        <button
                          onClick={() => setSelectedJob(toJob(job))}
                          className="rounded-md border border-emerald-500/30 text-emerald-200 px-3 py-2 text-sm hover:bg-emerald-500/10"
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherJobs.length > 0 && (
            <div className="space-y-3">
              {otherJobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJob(toJob(job))}
                  className="block w-full text-left rounded-lg border border-emerald-500/10 bg-black/20 hover:bg-black/30 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-emerald-100 font-medium truncate">
                        {job.service_name || job.service_type || 'Service'}
                      </div>
                      <div className="mt-1 text-xs text-slate-300 truncate">
                        {job.service_address || 'Address not provided'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <JobStatusIndicator status={job.status} />
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {jobs.length === 0 && (
            <div className="text-slate-400 text-sm">
              No jobs yet.
            </div>
          )}
        </CardContent>
      </Card>

      <JobDetailsModal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        job={selectedJob}
      />
    </>
  );
}
