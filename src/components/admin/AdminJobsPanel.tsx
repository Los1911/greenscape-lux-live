import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, RefreshCw, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { AdminJobsTable } from './AdminJobsTable';
import { AdminCompactFilters, FilterConfig } from './layout/AdminCompactFilters';
import { useRealtimePatch, patchArray } from '@/hooks/useRealtimePatch';
import {
  deriveAdminBucket,
  type AdminBucket,
  ADMIN_BUCKET_CONFIG,
} from '@/lib/jobLifecycleContract';
import CompletionReviewPanel from './CompletionReviewPanel';
import type { JobPhoto } from '@/types/jobPhoto';

/* ----------------------------------------
   Types
---------------------------------------- */

interface Job {
  id: string;
  service_name?: string;
  service_type: string;
  status: string;
  price: number | null;
  priced_at: string | null;
  assigned_to: string | null;
  completed_at: string | null;
  flagged_at: string | null;
  client_email: string | null;
  landscaper_id?: string | null;
  landscaper_email?: string | null;
  customer_name?: string;
  created_at: string;
  /** Populated on-demand when a job is selected for review */
  photos?: JobPhoto[];
}

/* ----------------------------------------
   Component
---------------------------------------- */

export function AdminJobsPanel() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lifecycleFilter, setLifecycleFilter] =
    useState<AdminBucket | 'all'>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [photosLoading, setPhotosLoading] = useState(false);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          service_name,
          service_type,
          status,
          price,
          priced_at,
          assigned_to,
          completed_at,
          flagged_at,
          client_email,
          landscaper_id,
          landscaper_email,
          customer_name,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setJobs(data || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  // Initial load only — NO realtime inside this effect
  useEffect(() => {
    loadJobs();
  }, []);

  // ── Realtime: patch jobs array in-place (no loading state, no remount) ──
  const jobPatcher = useMemo(() => patchArray<Job>(setJobs), []);

  useRealtimePatch({
    channelName: 'admin-jobs-panel-rt',
    subscriptions: [
      { table: 'jobs', event: 'INSERT' },
      { table: 'jobs', event: 'UPDATE' },
      { table: 'jobs', event: 'DELETE' },
    ],
    enabled: true,
    onEvent: useCallback((eventType: any, table: string, newRow: any, oldRow: any) => {
      if (table === 'jobs') {
        jobPatcher(eventType, newRow, oldRow);
        // If the currently-selected job was updated, merge but PRESERVE photos
        // (realtime events from `jobs` table never carry photos)
        if (eventType === 'UPDATE' && newRow?.id && selectedJob?.id === newRow.id) {
          setSelectedJob(prev => {
            if (!prev) return null;
            return { ...prev, ...newRow, photos: prev.photos };
          });
        }
      }
    }, [jobPatcher, selectedJob?.id]),
  });

  /* ── Fetch photos on-demand for a single job ──────────────────────── */

  const fetchJobPhotos = useCallback(async (jobId: string): Promise<JobPhoto[]> => {
    const { data, error } = await supabase
      .from('job_photos')
      .select('id, job_id, file_url, type, uploaded_at, uploaded_by, metadata, caption, sort_order')
      .eq('job_id', jobId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[AdminJobsPanel] Failed to fetch job_photos:', error);
      return [];
    }

    return (data || []) as JobPhoto[];
  }, []);

  /* ── Job click handler ─────────────────────────────────────────── */

  const handleJobClick = useCallback(async (job: any) => {
    if (job.status === 'completed_pending_review' || job.status === 'pending_review') {
      setPhotosLoading(true);
      setSelectedJob({ ...(job as Job), photos: undefined });

      try {
        const photos = await fetchJobPhotos(job.id);
        setSelectedJob(prev => prev ? { ...prev, photos } : null);
      } catch (err) {
        console.error('[AdminJobsPanel] Photo fetch error:', err);
        // Still show the panel — photos will be empty
        setSelectedJob(prev => prev ? { ...prev, photos: [] } : null);
      } finally {
        setPhotosLoading(false);
      }
    }
  }, [fetchJobPhotos]);

  const handleReviewActionComplete = useCallback((_jobId: string, _newStatus: string) => {
    // Realtime will patch the array automatically; just close the panel
    setSelectedJob(null);
  }, []);

  /* ----------------------------------------
     Derived Data — uses deriveAdminBucket()
     from the canonical lifecycle contract
  ---------------------------------------- */

  const jobsWithLifecycle = jobs.map(job => ({
    ...job,
    lifecycle: deriveAdminBucket(job),
  }));

  const ALL_BUCKETS: AdminBucket[] = [
    'needs_pricing',
    'ready_to_release',
    'active',
    'pending_review',
    'completed',
    'exceptions',
    'unclassified',
  ];

  const lifecycleCounts = jobsWithLifecycle.reduce<Record<AdminBucket, number>>(
    (acc, job) => {
      acc[job.lifecycle] = (acc[job.lifecycle] || 0) + 1;
      return acc;
    },
    {
      needs_pricing: 0,
      ready_to_release: 0,
      active: 0,
      pending_review: 0,
      completed: 0,
      exceptions: 0,
      unclassified: 0,
    }
  );

  const filteredJobs =
    lifecycleFilter === 'all'
      ? jobsWithLifecycle
      : jobsWithLifecycle.filter(j => j.lifecycle === lifecycleFilter);

  /* ----------------------------------------
     Filters — built from ADMIN_BUCKET_CONFIG
  ---------------------------------------- */

  const filters: FilterConfig[] = [
    {
      id: 'lifecycle',
      label: 'Lifecycle',
      value: lifecycleFilter,
      onChange: setLifecycleFilter,
      options: [
        { id: 'all', label: `All (${jobs.length})`, value: 'all' },
        ...ALL_BUCKETS.map(bucket => ({
          id: bucket,
          label: `${ADMIN_BUCKET_CONFIG[bucket].label} (${lifecycleCounts[bucket]})`,
          value: bucket,
        })),
      ],
    },
  ];

  /* ----------------------------------------
     UI States
  ---------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 mb-4">{error}</p>
        <Button
          onClick={loadJobs}
          variant="outline"
          className="border-emerald-500/30 text-emerald-300"
        >
          Retry
        </Button>
      </div>
    );
  }

  /* ----------------------------------------
     Render
  ---------------------------------------- */

  return (
    <div className="space-y-4">
      <AdminCompactFilters
        filters={filters}
        onClearAll={() => setLifecycleFilter('all')}
      />

      {/* ── Completion Review Panel (shown when a pending_review job is selected) ── */}
      {selectedJob && (selectedJob.status === 'completed_pending_review' || selectedJob.status === 'pending_review') && (
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedJob(null)}
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Jobs
          </Button>

          {/* Photo loading indicator */}
          {photosLoading && (
            <div className="flex items-center gap-2 px-4 py-2 bg-black/30 border border-emerald-500/20 rounded-lg">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-sm text-gray-400">Loading job photos...</span>
            </div>
          )}

          <CompletionReviewPanel
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onActionComplete={handleReviewActionComplete}
          />
        </div>
      )}

      <Card className="bg-black/40 backdrop-blur border border-emerald-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-medium">
              Jobs ({filteredJobs.length})
            </span>
          </div>

          <AdminJobsTable jobs={filteredJobs} onJobClick={handleJobClick} />
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminJobsPanel;
