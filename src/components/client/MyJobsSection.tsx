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
  created_at: string;
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
    preferred_date: local.preferred_date || local.scheduled_date || null,
    status: local.status,
    customer_name: local.customer_name || 'Customer',
    created_at: local.created_at,
    updated_at: local.updated_at || local.created_at,
    landscaper_id: local.landscaper_id || null,
  };
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
      return <Badge className="bg-emerald-500/20 text-emerald-400">Completed</Badge>;
    case 'cancelled':
      return <Badge className="bg-slate-600/20 text-slate-500">Cancelled</Badge>;
    default:
      return <Badge className="bg-slate-500/20 text-slate-400">{status}</Badge>;
  }
}

export function MyJobsSection() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<LocalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [actionJobId, setActionJobId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from('jobs')
      .select(JOBS_COLUMNS.clientView)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setJobs((data || []).map(normalizeJobData));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleAcceptEstimate = async (job: LocalJob) => {
    if (!user?.id || actionJobId) return;

    setActionJobId(job.id);
    setActionError(null);

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'scheduled' }) // ✅ FIXED
        .eq('id', job.id)
        .eq('status', 'priced');

      if (error) throw error;

      console.log('[MyJobsSection] Job status → scheduled');

      loadJobs();
    } catch (err: any) {
      setActionError(err.message);
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

  const pricedJobs = jobs.filter(j => j.status === 'priced');
  const otherJobs = jobs.filter(j => j.status !== 'priced');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {actionError && (
            <div className="text-red-400 mb-4">{actionError}</div>
          )}

          {pricedJobs.map(job => (
            <div key={job.id} className="mb-4 p-4 border rounded">
              <div className="flex justify-between">
                <div>
                  <h4>{job.service_name}</h4>
                  <p>${job.price}</p>
                </div>
                <button
                  onClick={() => handleAcceptEstimate(job)}
                  disabled={actionJobId === job.id}
                >
                  {actionJobId === job.id ? 'Processing...' : 'Accept Estimate'}
                </button>
              </div>
            </div>
          ))}

          {otherJobs.map(job => (
            <button
              key={job.id}
              onClick={() => setSelectedJob(toJob(job))}
              className="block w-full text-left p-4 border rounded mb-3"
            >
              <div className="flex justify-between">
                <span>{job.service_name}</span>
                <JobStatusIndicator status={job.status} />
              </div>
            </button>
          ))}
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

export default MyJobsSection;
