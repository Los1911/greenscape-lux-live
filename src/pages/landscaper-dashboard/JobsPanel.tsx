import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabaseClient } from '@/lib/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { waitForSupabaseSession } from '@/lib/supabaseHydration';
import { useRealtimePatch, patchArray } from '@/hooks/useRealtimePatch';
import { GeofenceTracker } from '@/components/landscaper/GeofenceTracker';
import { BidSuggestionCard } from '@/components/landscaper/BidSuggestionCard';
import { StructuredJobMessaging } from '@/components/messaging/StructuredJobMessaging';
import CameraCapture from '@/components/mobile/CameraCapture';
import { useMobile } from '@/hooks/use-mobile';
import { compressImage } from '@/utils/imageCompression';
import { PHOTO_CONFIG, JobPhoto } from '@/types/jobPhoto';
import { JOBS_COLUMNS, LANDSCAPERS_COLUMNS, safeString, safeNumber, safeBoolean } from '@/lib/databaseSchema';


import { 
  RefreshCw, CheckCircle, XCircle, MapPin, Calendar, DollarSign, User, Play, 
  AlertTriangle, Lock, Shield, EyeOff, ChevronDown, ChevronUp, MessageSquare, 
  Camera, PlusCircle, ImageIcon, Ban, Upload, X, Loader2, Check, Send, Info
} from 'lucide-react';


import { useToast } from '@/hooks/use-toast';
import { 
  jobRequiresInsurance, 
  landscaperHasVerifiedInsurance,
  canLandscaperAcceptJob,
  INSURANCE_REQUIRED_ERROR 
} from '@/lib/insuranceRequirements';
import { InsuranceRequiredBadge, InsuranceRequiredBanner, LockedJobOverlay } from '@/components/landscaper/InsuranceRequiredBadge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  loadWorkAreaPreferences,
  filterJobsByWorkArea,
  autoAddWorkAreaFromJob,
  WorkAreaPreferences as WorkAreaPrefsType
} from '@/lib/workAreaPreferences';

// Normalize job data to handle missing/renamed columns safely
// Price hierarchy: admin_price > price (only confirmed columns)
// REMOVED: 'amount' (42703 — column does not exist in jobs table)
// LIFECYCLE: Normalizes legacy 'in_progress' status to canonical 'active'
function normalizeJobData(rawJob: Record<string, unknown>) {
  const adminPrice = safeNumber(rawJob, 'admin_price');
  const regularPrice = safeNumber(rawJob, 'price');

  
  // Parse selected_services - could be JSON string or array
  let selectedServices: string[] = [];
  const rawServices = rawJob['selected_services'];
  if (Array.isArray(rawServices)) {
    selectedServices = rawServices;
  } else if (typeof rawServices === 'string' && rawServices.startsWith('[')) {
    try { selectedServices = JSON.parse(rawServices); } catch { /* ignore */ }
  }

  // STATUS NORMALIZATION: Map legacy 'in_progress' to canonical 'active'
  // This ensures all downstream logic uses a single status value
  let normalizedStatus = safeString(rawJob, 'status', 'pending');
  if (normalizedStatus === 'in_progress') {
    normalizedStatus = 'active';
  }

  return {
    ...rawJob,
    id: safeString(rawJob, 'id'),
    status: normalizedStatus,
    service_type: safeString(rawJob, 'service_type') || safeString(rawJob, 'service_name'),
    service_name: safeString(rawJob, 'service_name') || safeString(rawJob, 'service_type'),
    service_address: safeString(rawJob, 'service_address') || safeString(rawJob, 'property_address'),
    // Price hierarchy: admin_price > price (only confirmed columns in jobs table)

    price: adminPrice || regularPrice,
    admin_price: adminPrice,
    is_available: safeBoolean(rawJob, 'is_available'),
    created_at: safeString(rawJob, 'created_at'),
    // New scope fields
    selected_services: selectedServices,
    // NOTE: 'comments' and 'estimated_duration' do NOT exist on the jobs table (42703)
    // Client notes live on quote_requests, not jobs. Do not query or display them from jobs.
    preferred_date: safeString(rawJob, 'preferred_date'),
    started_at: safeString(rawJob, 'started_at'),
    landscaper_id: safeString(rawJob, 'landscaper_id'),
    landscaper_id: safeString(rawJob, 'landscaper_id'),
  };
}




function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl ring-1 ring-emerald-500/20 shadow-[0_0_25px_-10px_rgba(52,211,153,0.25)] p-4 sm:p-6 lg:p-8">
      {children}
    </section>
  );
}

export default function JobsPanel() {
  const supabase = useSupabaseClient();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'available' | 'assigned' | 'active' | 'completed'>('all');

  const [landscaperProfile, setLandscaperProfile] = useState<any>(null);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [workAreaPrefs, setWorkAreaPrefs] = useState<WorkAreaPrefsType>({ requestedAreas: [], excludedAreas: [] });
  const [hiddenJobCount, setHiddenJobCount] = useState(0);

  // Load landscaper profile including insurance status - use explicit columns
  const loadLandscaperProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('landscapers')
        .select('id, user_id, business_name, insurance_verified, approved')
        .eq('user_id', userId)
        .maybeSingle();
      return data;
    } catch (error) {
      console.warn('[JobsPanel] Error loading landscaper profile:', error);
      return null;
    }
  };

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Reset error state on retry
      await waitForSupabaseSession();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) {
        throw new Error('Not authenticated');
      }
      
      // Load landscaper profile with insurance status
      const profile = await loadLandscaperProfile(authUser.id);
      setLandscaperProfile(profile);
      setHasInsurance(landscaperHasVerifiedInsurance(profile || {}));

      // Load work area preferences
      if (profile?.id) {
        const prefs = await loadWorkAreaPreferences(profile.id);
        setWorkAreaPrefs(prefs);
      }

      // Query jobs with explicit column selection instead of select('*')
      // Include 'priced' and 'scheduled' status as available for landscapers
      // 1. Available jobs (status='available' OR status='priced' OR status='scheduled', is_available=true, assigned_to IS NULL)
      // 2. Jobs assigned to this landscaper
      const { data: jobsData, error: fetchError } = await supabase
        .from('jobs')
        .select(JOBS_COLUMNS.landscaperView + ',admin_price,admin_notes,priced_at')
        .or(`and(status.in.(available,priced,scheduled),is_available.eq.true,assigned_to.is.null),landscaper_id.eq.${authUser.id},assigned_to.eq.${authUser.id}`)
        .order('created_at', { ascending: false });




      if (fetchError) {
        console.error('[JobsPanel] Supabase fetch error:', fetchError);
        throw new Error('Failed to load jobs from server');
      }
      
      // Normalize jobs to handle missing columns safely
      const normalizedJobs = (jobsData || []).map(job => normalizeJobData(job as Record<string, unknown>));
      setJobs(normalizedJobs);
    } catch (err: any) {
      console.error('[JobsPanel] Error loading jobs:', err);
      setError(err?.message || 'Unable to load jobs. Please try again.');
      // Don't show toast on error - we'll show inline error UI instead
    } finally {
      setLoading(false);
    }
  }, [supabase]);


  // ── Realtime: patch jobs array in-place (no loading toggle, no remount) ──
  const jobsSubs = useMemo(() => {
    if (!user?.id) return [];
    return [
      { table: 'jobs', event: '*' as const, filter: `landscaper_id=eq.${user.id}` },
      { table: 'jobs', event: '*' as const, filter: `assigned_to=eq.${user.id}` },
      { table: 'jobs', event: 'INSERT' as const },
    ];
  }, [user?.id]);


  useRealtimePatch({
    channelName: `landscaper-jobs-panel-${user?.id || 'anon'}`,
    subscriptions: jobsSubs,
    enabled: !!user?.id && !authLoading,
    onEvent: (eventType, table, newRow, oldRow) => {
      if (table !== 'jobs') return;
      const normalized = normalizeJobData(newRow as Record<string, unknown>);
      if (eventType === 'INSERT') {
        setJobs(prev => {
          if (prev.some(j => j.id === normalized.id)) return prev;
          return [normalized, ...prev];
        });
      } else if (eventType === 'UPDATE') {
        setJobs(prev => prev.map(j => j.id === normalized.id ? { ...j, ...normalized } : j));
      } else if (eventType === 'DELETE') {
        const deletedId = oldRow?.id || newRow?.id;
        if (deletedId) setJobs(prev => prev.filter(j => j.id !== deletedId));
      }
    },
  });

  // Initial data load - call loadJobs when auth is ready
  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) return;
    loadJobs();
  }, [authLoading, user?.id, loadJobs]);



  // LIFECYCLE FIX: When filter is 'available', also include 'scheduled' and 'priced' statuses
  const AVAILABLE_FILTER_STATUSES = ['available', 'scheduled', 'priced'];
  const filteredJobs = jobs?.filter(job => {
    if (filter === 'all') return true;
    if (filter === 'available') return AVAILABLE_FILTER_STATUSES.includes(job?.status);
    return job?.status === filter;
  }) ?? [];



  const handleAcceptJob = async (jobId: string, bidAmount?: number) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    // Frontend check for insurance requirement
    const { canAccept, reason } = canLandscaperAcceptJob(job, landscaperProfile || {});
    if (!canAccept) {
      toast({
        title: "Insurance Required",
        description: reason || INSURANCE_REQUIRED_ERROR,
        variant: "destructive"
      });
      return;
    }

    try {
      setActionLoading(jobId);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) {
        toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
        return;
      }

      // Get landscaper profile for email
      const profile = landscaperProfile || await loadLandscaperProfile(authUser.id);
      if (!profile) {
        toast({ title: "Error", description: "Landscaper profile not found", variant: "destructive" });
        return;
      }

      // Backend validation - call edge function to verify insurance
      const { data: validationResult, error: validationError } = await supabase.functions.invoke(
        'validate-job-acceptance',
        { body: { jobId, landscaperId: authUser.id } }
      );

      if (validationError) {
        console.error('[JobsPanel] Validation error:', validationError);
        throw new Error('Failed to validate job acceptance');
      }

      if (!validationResult?.success) {
        throw new Error(validationResult?.error || INSURANCE_REQUIRED_ERROR);
      }

      // Build update payload with ALL required fields
      // Job status becomes "assigned" - NOT "active"

      // Tracking will NOT start until landscaper arrives onsite
      const updatePayload: Record<string, any> = {
        status: 'assigned', // IMPORTANT: Only "assigned", not "active"

        is_available: false,
        assigned_to: authUser.id,
        landscaper_id: profile.id,
      };

      // Optional fields
      if (profile.email) {
        updatePayload.landscaper_email = profile.email;
      }

      // If bid amount provided, update price only
      // REMOVED: updatePayload.amount = bidAmount (42703 — 'amount' column does not exist in jobs table)
      if (bidAmount) {
        updatePayload.price = bidAmount;
      }


      console.log('[JobsPanel] Accept Job - Final Update Payload:', {
        jobId,
        updatePayload,
        authUserId: authUser.id,
        landscaperProfileId: profile.id,
      });

      // LIFECYCLE GUARD: Only update if assigned_to IS NULL (prevents race condition / double-assignment)
      const { data, error } = await supabase
        .from('jobs')
        .update(updatePayload)
        .eq('id', jobId)
        .is('assigned_to', null)
        .select();


      console.log('[JobsPanel] Accept Job - Supabase Response:', {
        success: !error,
        data,
        error,
        jobId,
      });

      if (error) throw error;

      // OPTIMISTIC UI UPDATE: Update local state immediately
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, ...updatePayload }
          : job
      ));

      // Auto-add job's ZIP code as a temporary work area for the day
      // This enables batching nearby jobs without additional setup
      if (job.service_address && profile.id) {
        autoAddWorkAreaFromJob(profile.id, job.service_address)
          .then(result => {
            if (result.success) {
              console.log('[JobsPanel] Auto-added work area for job ZIP');
            }
          })
          .catch(err => console.warn('[JobsPanel] Failed to auto-add work area:', err));
      }

      toast({
        title: "Job Accepted!",
        description: "Drive to the job site to begin. Tracking starts automatically when you arrive.",
      });

      // Background refresh (non-blocking) - don't await
      loadJobs().catch(err => console.warn('[JobsPanel] Background refresh failed:', err));
    } catch (error: any) {
      console.error('[JobsPanel] Error accepting job:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept job",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };





  const handleDeclineJob = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      toast({
        title: "Job Declined",
        description: "The job remains available for other landscapers.",
      });
      // Remove from local state to hide it
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (error) {
      console.error('Error declining job:', error);
      toast({
        title: "Error",
        description: "Failed to decline job",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };


  // Complete job - Uses edge function for server-side validation
  // V1: Requires at least 1 before and 1 after photo
  // V1: Sets status to 'completed_pending_review' for admin approval
  const handleCompleteJob = async (
  jobId: string,
  completionMethod: 'gps_verified' | 'manual_override' = 'manual_override'
) => {
  try {
    setActionLoading(jobId);

    console.log('[JobsPanel] Attempting job completion:', {
      jobId,
      completionMethod
    });

    const { data, error } = await supabase.functions.invoke('job-execution', {
      body: {
        action: 'complete',
        jobId
      }
    });

    // 🔥 Log full response
    console.log('[JobsPanel] Edge Function Response:', {
      data,
      error
    });

    // Transport-level failure (non-2xx)
    if (error) {
      console.error('[JobsPanel] Edge function transport error:', error);
      throw error; // DO NOT wrap in generic error
    }

    // Logical failure returned from function
    if (!data?.success) {
      console.error('[JobsPanel] Edge function logical failure:', data);

      if (data?.validation) {
        const { beforePhotos, afterPhotos } = data.validation;

        if (beforePhotos === 0) {
          toast({
            title: "Before Photo Required",
            description: "Please upload at least 1 before photo to complete this job.",
            variant: "destructive"
          });
          return;
        }

        if (afterPhotos === 0) {
          toast({
            title: "After Photo Required",
            description: "Please upload at least 1 after photo to complete this job.",
            variant: "destructive"
          });
          return;
        }
      }

      throw new Error(data?.error || 'Edge function returned failure');
    }

    // ✅ SUCCESS
    setJobs(prev =>
      prev.map(job =>
        job.id === jobId
          ? {
              ...job,
              status: 'completed_pending_review',
              completed_at: data?.job?.completed_at,
              completion_method: completionMethod
            }
          : job
      )
    );

    toast({
      title: "Job Submitted for Review!",
      description:
        "Your work has been submitted. An admin will review and approve shortly."
    });

    loadJobs().catch(err =>
      console.warn('[JobsPanel] Background refresh failed:', err)
    );

  } catch (err: any) {
    console.error('[JobsPanel] Completion crash:', err);

    toast({
      title: "Job Completion Failed",
      description: err?.message || "Unexpected error occurred",
      variant: "destructive"
    });
  } finally {
    setActionLoading(null);
  }
};


  // Manual job start - bypasses GPS requirement (mobile-safe fallback)
  // CRITICAL FIX: Optimistic UI update + non-blocking refetch
  const handleManualStartJob = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      
      const startedAt = new Date().toISOString();
      
      const { error } = await supabase
        .from('jobs')
        .update({
          status: 'active',

          started_at: startedAt,
          start_method: 'manual_override'
        })
        .eq('id', jobId)
.eq('assigned_to', user?.id)
.eq('status', 'assigned');

      if (error) throw error;

      // OPTIMISTIC UI UPDATE: Update local state immediately
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: 'active', 

              started_at: startedAt,
              start_method: 'manual_override' 
            }
          : job
      ));

      toast({
        title: "Job Started!",
        description: "You can now work on this job. Mark as complete when finished.",
      });

      // NON-BLOCKING background refresh
      loadJobs().catch(err => {
        console.warn('[JobsPanel] Background refresh after start failed:', err);
      });

    } catch (error) {
      console.error('Error starting job:', error);
      toast({
        title: "Error",
        description: "Failed to start job",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Callback when a job is auto-started via geofencing
  const handleJobAutoStarted = useCallback(() => {
    console.log('[JobsPanel] Job auto-started via geofencing, reloading jobs');
    loadJobs();
  }, [loadJobs]);

  // Auth loading guard
  if (authLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  // Loading state - shows spinner while fetching
  if (loading) {
    return (
      <div className="py-6 sm:py-8">

        <Panel>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
            <p className="text-emerald-300/70 text-sm">Loading jobs...</p>
          </div>
        </Panel>
      </div>
    );
  }

  // Error state - shows friendly message with retry button
  if (error) {
    return (
      <div className="py-6 sm:py-8">

        <Panel>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-emerald-300">Unable to Load Jobs</h3>
              <p className="text-emerald-300/70 text-sm max-w-md">
                We couldn't load your jobs right now. This might be a temporary issue.
              </p>
            </div>
            <button
              onClick={() => loadJobs()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-medium transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            {/* Debug info for console - not shown to user */}
            {console.warn('[JobsPanel] Error displayed to user:', error)}
          </div>
        </Panel>
      </div>
    );
  }



  // Filter available jobs by work area preferences
  // LIFECYCLE FIX: Include 'scheduled' and 'priced' status jobs as available
  // Webhook sets 'scheduled' after payment; admin may set 'priced' before release
  const AVAILABLE_STATUSES = ['available', 'scheduled', 'priced'];
  const allAvailableJobs = jobs.filter(j => AVAILABLE_STATUSES.includes(j.status) && !j.assigned_to);

  
  // Apply work area filtering
  const { visibleJobs: workAreaVisibleJobs, hiddenJobs: workAreaHiddenJobs } = filterJobsByWorkArea(
    allAvailableJobs,
    workAreaPrefs
  );
  
  // Update hidden job count for display
  const workAreaHiddenCount = workAreaHiddenJobs.length;
  
  // Now apply insurance filtering to work-area-visible jobs
  const availableJobs = workAreaVisibleJobs;
  
  // Separate jobs into accessible and insurance-locked
  const accessibleAvailableJobs = availableJobs.filter(job => !jobRequiresInsurance(job) || hasInsurance);
  const lockedAvailableJobs = availableJobs.filter(job => jobRequiresInsurance(job) && !hasInsurance);
  const hasLockedJobs = lockedAvailableJobs.length > 0;

  return (
    <div className="py-6 sm:py-8 space-y-6">

      {/* Filter Tabs */}
      <Panel>
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-emerald-300">Job Management</h2>
          <div className="flex flex-wrap gap-2">
            {['all', 'available', 'assigned', 'active', 'completed'].map((key) => {

              const count = key === 'all' ? jobs.length : jobs.filter(j => j.status === key).length;
              return (
                <button key={key} onClick={() => setFilter(key as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    filter === key 
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50' 
                      : 'bg-black/40 text-emerald-300/70 border border-emerald-500/25 hover:border-emerald-500/40'
                  }`}>
                  {key === 'all' ? 'All Jobs' : key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  <span className="bg-emerald-500/30 px-2 py-0.5 rounded-full text-xs">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Panel>

      {/* Work Area Hidden Jobs Notice */}
      {workAreaHiddenCount > 0 && (filter === 'all' || filter === 'available') && (
        <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <EyeOff className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div className="text-sm text-blue-300">
            <span className="font-medium">{workAreaHiddenCount} job{workAreaHiddenCount !== 1 ? 's' : ''}</span> hidden based on your work area preferences.
            <a href="/landscaper-dashboard/profile" className="ml-2 underline hover:text-blue-200">
              Manage preferences
            </a>
          </div>
        </div>
      )}

      {/* Insurance Banner - show if there are locked jobs */}
      {hasLockedJobs && (filter === 'all' || filter === 'available') && (
        <InsuranceRequiredBanner 
          onUploadClick={() => {
            window.location.href = '/landscaper/profile?tab=documents';
          }}
        />
      )}

      {/* Available Jobs Section */}
      {(filter === 'all' || filter === 'available') && availableJobs.length > 0 && (
        <Panel>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-semibold text-emerald-300">
              Available Jobs ({accessibleAvailableJobs.length}
              {hasLockedJobs ? ` + ${lockedAvailableJobs.length} locked` : ''})
            </h3>
          </div>
          <div className="space-y-4">
            {/* Accessible Jobs First */}
            {accessibleAvailableJobs.map((job) => (
              <AvailableJobCard 
                key={job.id} 
                job={job} 
                onAccept={handleAcceptJob}
                onDecline={handleDeclineJob}
                isLoading={actionLoading === job.id}
                requiresInsurance={jobRequiresInsurance(job)}
                isLocked={false}
              />
            ))}
            
            {/* Locked Jobs (shown in disabled state) */}
            {lockedAvailableJobs.map((job) => (
              <AvailableJobCard 
                key={job.id} 
                job={job} 
                onAccept={handleAcceptJob}
                onDecline={handleDeclineJob}
                isLoading={actionLoading === job.id}
                requiresInsurance={true}
                isLocked={true}
              />
            ))}
          </div>
        </Panel>
      )}

      {/* My Jobs Section */}
      <Panel>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-emerald-300">
            {filter === 'available' ? 'Available Jobs' : `Jobs (${filteredJobs.length})`}
          </h3>
          {/* Manual refresh button */}
          <button
            onClick={() => loadJobs()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-sm transition-all disabled:opacity-50"
            title="Refresh jobs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        {filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-emerald-400/50" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-lg font-medium text-emerald-300">
                {filter === 'available' 
                  ? 'No Available Jobs' 
                  : filter === 'assigned'
                  ? 'No Assigned Jobs'
                  : filter === 'active'

                  ? 'No Jobs In Progress'
                  : filter === 'completed'
                  ? 'No Completed Jobs Yet'
                  : 'No Jobs Found'}
              </h4>
              <p className="text-emerald-300/60 text-sm max-w-sm">
                {filter === 'available' 
                  ? 'No jobs are available right now. Check back soon or expand your work areas.'
                  : filter === 'assigned'
                  ? 'You don\'t have any assigned jobs. Accept available jobs to get started.'
                  : filter === 'active'

                  ? 'You don\'t have any jobs in progress. Start an assigned job to begin.'
                  : filter === 'completed'
                  ? 'You haven\'t completed any jobs yet. Complete jobs to build your history.'
                  : 'No jobs match your current filter. Try selecting a different category.'}
              </p>
            </div>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-emerald-400 hover:text-emerald-300 text-sm underline transition-colors"
              >
                View all jobs
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.filter(j => filter !== 'available' || (j.status === 'available')).map((job) => (
              <JobCard 
                key={job.id} 
                job={job} 
                onAccept={handleAcceptJob}
                onComplete={handleCompleteJob}
                onManualStart={handleManualStartJob}
                onJobAutoStarted={handleJobAutoStarted}
                isLoading={actionLoading === job.id}
                isMyJob={job.assigned_to === user?.id || job.landscaper_id === user?.id}
              />
            ))}

          </div>
        )}
      </Panel>

    </div>
  );
}

// Available Job Card Component with insurance gating
function AvailableJobCard({ job, onAccept, onDecline, isLoading, requiresInsurance, isLocked }: { 
  job: any; 
  onAccept: (id: string, amount?: number) => void;
  onDecline: (id: string) => void;
  isLoading: boolean;
  requiresInsurance: boolean;
  isLocked: boolean;
}) {
  return (
    <div className={`relative bg-gradient-to-r from-emerald-500/10 to-transparent border rounded-xl p-5 space-y-4 transition-all ${
      isLocked 
        ? 'border-amber-500/30 opacity-75' 
        : 'border-emerald-500/30'
    }`}>
      {/* Locked overlay */}
      {isLocked && <LockedJobOverlay />}

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-300 text-xs font-medium">
              Available
            </span>
            {requiresInsurance && (
              <InsuranceRequiredBadge variant="badge" />
            )}
          </div>
          <h4 className="text-lg font-semibold text-emerald-300">{job?.service_type || job?.service_name || 'Service'}</h4>
          <div className="flex items-center gap-2 text-sm text-emerald-300/70">
            <MapPin className="w-4 h-4" />
            <span>{job?.service_address || 'No address provided'}</span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm pt-2">
            {job?.preferred_date && (
              <div className="flex items-center gap-1 text-emerald-300/70">
                <Calendar className="w-4 h-4" />
                <span>{new Date(job.preferred_date).toLocaleDateString()}</span>
              </div>
            )}
            {job?.price > 0 && (
              <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                <DollarSign className="w-4 h-4" />
                <span>${job.price.toFixed(2)}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Bid Suggestion - only show for accessible jobs */}
      {!isLocked && (
        <BidSuggestionCard 
          jobId={job.id} 
          quoteRequestId={job.quote_request_id || job.id} 
          currentPrice={job.price} 
          onBidAccept={(amt: number) => onAccept(job.id, amt)} 
        />
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {isLocked ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  disabled
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-700 text-gray-500 font-medium cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  Insurance Required
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-gray-900 border-amber-500/30 text-amber-200">
                <p className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Verify your insurance to unlock this job
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <>
            <button
              onClick={() => onAccept(job.id)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Accept Job
            </button>
            <button
              onClick={() => onDecline(job.id)}
              disabled={isLoading}
              className="px-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium transition-all disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}


// Job Card Component for assigned/active/completed jobs
// Enhanced with: scope visibility, price fix, photo guardrails, active banner

function JobCard({ job, onAccept, onComplete, onManualStart, onJobAutoStarted, isLoading, isMyJob }: { 
  job: any; 
  onAccept: (id: string, amount?: number) => void;
  onComplete: (id: string, method?: 'gps_verified' | 'manual_override') => void;
  onManualStart: (id: string) => void;
  onJobAutoStarted: () => void;
  isLoading: boolean;
  isMyJob: boolean;
}) {
  const supabase = useSupabaseClient();
  const [landscaperId, setLandscaperId] = useState('');
  const [gpsUnavailable, setGpsUnavailable] = useState(false);
  const [scopeExpanded, setScopeExpanded] = useState(false);
  const [photoCounts, setPhotoCounts] = useState<{ before: number; after: number }>({ before: 0, after: 0 });
  const [photoCountsLoaded, setPhotoCountsLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => { 
      if (data?.user?.id) setLandscaperId(data.user.id); 
    });
  }, [supabase]);

  // Fetch photo counts for active jobs (needed for completion guardrail)
  useEffect(() => {
    if (job?.status === 'active' && isMyJob && job?.id) {
      supabase
        .from('job_photos')
        .select('id, type')
        .eq('job_id', job.id)
        .then(({ data }) => {
          const photos = data || [];
          setPhotoCounts({
            before: photos.filter((p: any) => p.type === 'before').length,
            after: photos.filter((p: any) => p.type === 'after').length,
          });
          setPhotoCountsLoaded(true);
        })
        .catch(() => setPhotoCountsLoaded(true));
    }
  }, [job?.status, job?.id, isMyJob, supabase]);
  useEffect(() => {
  const refreshCounts = () => {
    if (job?.status === 'active' && isMyJob && job?.id) {
      supabase
        .from('job_photos')
        .select('id, type')
        .eq('job_id', job.id)
        .then(({ data }) => {
          const photos = data || [];
          setPhotoCounts({
            before: photos.filter((p: any) => p.type === 'before').length,
            after: photos.filter((p: any) => p.type === 'after').length,
          });
        });
    }
  };

  window.addEventListener('job-photos-updated', refreshCounts);

  return () => {
    window.removeEventListener('job-photos-updated', refreshCounts);
  };
}, [job?.id, job?.status, isMyJob, supabase]);

  // Check GPS availability on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsUnavailable(true);
      return;
    }
    const timeoutId = setTimeout(() => setGpsUnavailable(true), 5000);
    navigator.geolocation.getCurrentPosition(
      () => { clearTimeout(timeoutId); setGpsUnavailable(false); },
      () => { clearTimeout(timeoutId); setGpsUnavailable(true); },
      { timeout: 5000, maximumAge: 60000 }
    );
    return () => clearTimeout(timeoutId);
  }, []);

  // Derive job price - use price field (already normalized with admin_price priority)
  const jobPrice = typeof job?.price === 'number' && job.price > 0 ? job.price : null;
  const isActive = job?.status === 'active';
  const canComplete = photoCounts.before > 0 && photoCounts.after > 0;
  const selectedServices: string[] = Array.isArray(job?.selected_services) ? job.selected_services : [];
  // NOTE: 'comments' and 'estimated_duration' do NOT exist on the jobs table (42703)
  const hasScope = selectedServices.length > 0;


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="px-2.5 py-1 rounded-lg bg-green-500/20 text-green-300 text-xs font-medium">Available</span>;
      case 'scheduled':
        return <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-medium">Scheduled</span>;
      case 'assigned':
        return <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-medium">Assigned</span>;
      case 'active':
        return <span className="px-2.5 py-1 rounded-lg bg-yellow-500/30 text-yellow-200 text-xs font-bold border border-yellow-500/40 animate-pulse">ACTIVE - In Progress</span>;
      case 'completed_pending_review':
        return <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-medium">Pending Review</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium">Completed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg bg-gray-500/20 text-gray-300 text-xs">{status}</span>;
    }
  };

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      isActive 
        ? 'bg-gradient-to-br from-yellow-500/5 via-black/40 to-yellow-500/5 border-yellow-500/40 ring-1 ring-yellow-500/20 shadow-[0_0_20px_-8px_rgba(234,179,8,0.3)]' 
        : 'bg-black/40 border-emerald-500/25'
    }`}>
      {/* ── ACTIVE JOB BANNER ── */}
      {isActive && isMyJob && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-yellow-500/20 via-amber-500/15 to-yellow-500/20 border-b border-yellow-500/30 flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
          <span className="text-sm font-bold text-yellow-200 tracking-wide">JOB IN PROGRESS</span>
          {job?.started_at && (
            <span className="text-xs text-yellow-300/60 ml-auto">
              Started {new Date(job.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Header Row: Status + Badges */}
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(job?.status)}
              {isMyJob && <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs">My Job</span>}
              {gpsUnavailable && job?.status === 'assigned' && isMyJob && (
                <span className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-300 text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  GPS Unavailable
                </span>
              )}
            </div>

            {/* Service Type */}
            <h4 className="text-lg font-semibold text-emerald-300">{job?.service_type || job?.service_name || 'Service'}</h4>
            
            {/* Address */}
            <div className="flex items-center gap-2 text-sm text-emerald-300/70">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{job?.service_address || 'No address'}</span>
            </div>

            {/* Key Details Row: Date + Price */}
            <div className="flex flex-wrap gap-4 text-sm pt-1">
              {job?.preferred_date && (
                <div className="flex items-center gap-1.5 text-emerald-300/70">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(job.preferred_date).toLocaleDateString()}</span>
                </div>
              )}
              {/* ── FIXED PRICE DISPLAY ── */}
              {/* Show job.price (not earnings). Earnings are calculated post-completion. */}
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                {jobPrice ? (
                  <span className="text-emerald-400 font-bold text-base">${jobPrice.toFixed(2)}</span>
                ) : (
                  <span className="text-gray-500 italic text-sm">Price pending</span>
                )}
                <span className="text-emerald-300/40 text-xs ml-1">Job Price</span>
              </div>
            </div>

            {/* Client Email */}
            {job?.client_email && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <User className="w-4 h-4" />
                <span>{job.client_email}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── JOB SCOPE SECTION (Expandable) ── */}
        {hasScope && (
          <div className="border border-emerald-500/15 rounded-lg overflow-hidden">
            <button
              onClick={() => setScopeExpanded(!scopeExpanded)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors"
            >
              <span className="text-xs font-medium text-emerald-300/80 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" />
                Job Scope Details
                {selectedServices.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">{selectedServices.length} services</span>
                )}
              </span>
              {scopeExpanded ? <ChevronUp className="w-4 h-4 text-emerald-400/60" /> : <ChevronDown className="w-4 h-4 text-emerald-400/60" />}
            </button>
            {scopeExpanded && (
              <div className="px-4 py-3 space-y-3 bg-black/20">
                {/* Selected Services Breakdown */}
                {selectedServices.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Selected Services</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedServices.map((svc, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* NOTE: 'comments' and 'estimated_duration' columns do NOT exist on the jobs table (42703).
                   Client notes live on quote_requests. Do not render them from jobs. */}

                {/* Customer Name */}
                {job?.customer_name && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">Client:</p>
                    <span className="text-sm text-emerald-300">{job.customer_name}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Geofence tracker for assigned/active jobs */}
        {['assigned', 'active'].includes(job?.status) && landscaperId && isMyJob && job?.id && !gpsUnavailable && (
          <GeofenceTracker 
            jobId={job.id} 
            landscaperId={landscaperId} 
            jobStatus={job.status}
            onJobStarted={onJobAutoStarted}
          />
        )}

        {/* MANUAL START BUTTON - Shows for assigned jobs */}
        {job?.status === 'assigned' && isMyJob && (
          <div className="space-y-3">
            {gpsUnavailable && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-orange-300 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>GPS unavailable. You can start the job manually.</span>
                </div>
              </div>
            )}
            <button
              onClick={() => onManualStart(job.id)}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-medium transition-all disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {gpsUnavailable ? 'Start Job (Manual)' : 'Start Job Now'}
            </button>
            {!gpsUnavailable && (
              <p className="text-center text-xs text-emerald-300/50">
                Or wait for GPS auto-start when you arrive onsite
              </p>
            )}
          </div>
        )}

        {/* Job Actions Panel - visible for assigned, active, flagged_review */}
        {['assigned', 'active', 'flagged_review'].includes(job?.status) && isMyJob && (
          <JobActionsPanel jobId={job.id} jobStatus={job.status} />
        )}

        {/* ── MARK AS COMPLETE BUTTON with Photo Guardrails ── */}
        {job?.status === 'active' && isMyJob && (
          <div className="space-y-2">
            {/* Photo requirement message */}
            {photoCountsLoaded && !canComplete && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <Camera className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-300">
                  <p className="font-medium">Photos required to complete this job</p>
                  <p className="text-amber-300/70 mt-1">
                    {photoCounts.before === 0 && photoCounts.after === 0
                      ? 'Upload at least 1 before photo and 1 after photo using the Job Actions panel above.'
                      : photoCounts.before === 0
                      ? 'Upload at least 1 before photo using the Job Actions panel above.'
                      : 'Upload at least 1 after photo using the Job Actions panel above.'}
                  </p>
                  <div className="flex gap-3 mt-2">
                    <span className={`text-xs ${photoCounts.before > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      Before: {photoCounts.before > 0 ? `${photoCounts.before} uploaded` : 'Missing'}
                    </span>
                    <span className={`text-xs ${photoCounts.after > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      After: {photoCounts.after > 0 ? `${photoCounts.after} uploaded` : 'Missing'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Completion button - disabled unless both photo types exist */}
            <button
              onClick={() => onComplete(job.id, 'manual_override')}
              disabled={isLoading || !canComplete}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                canComplete
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              } disabled:opacity-60`}
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {canComplete ? 'Mark as Complete' : 'Upload Photos to Complete'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


// Predefined add-on types
const ADDON_TYPES = [
  { value: 'debris_removal', label: 'Debris Removal', priceRange: '$25-$75' },
  { value: 'extra_trimming', label: 'Extra Trimming/Edging', priceRange: '$15-$50' },
  { value: 'weed_treatment', label: 'Weed Treatment', priceRange: '$30-$80' },
  { value: 'fertilizer_application', label: 'Fertilizer Application', priceRange: '$40-$100' },
  { value: 'mulch_spreading', label: 'Mulch Spreading', priceRange: '$50-$150' },
  { value: 'leaf_cleanup', label: 'Leaf Cleanup', priceRange: '$35-$100' },
  { value: 'hedge_shaping', label: 'Hedge Shaping', priceRange: '$40-$120' },
  { value: 'pest_treatment', label: 'Pest Treatment', priceRange: '$45-$125' },
  { value: 'irrigation_check', label: 'Irrigation System Check', priceRange: '$25-$60' },
  { value: 'other', label: 'Other Service', priceRange: 'Varies' },
];

// Add-on type for state
interface JobAddOn {
  id: string;
  job_id: string;
  addon_type: string;
  description: string;
  estimated_price_min: number | null;
  estimated_price_max: number | null;
  photo_url: string | null;
  client_informed: boolean;
  status: string;
  created_at: string;
}

// Predefined reasons for "Unable to Complete Job"
const UNABLE_TO_COMPLETE_REASONS = [
  { value: 'no_access', label: 'No access / client unavailable', requiresPhoto: true },
  { value: 'weather_unsafe', label: 'Weather unsafe', requiresPhoto: false },
  { value: 'property_unsafe', label: 'Property unsafe', requiresPhoto: true },
  { value: 'scope_incorrect', label: 'Scope materially incorrect', requiresPhoto: true },
  { value: 'addon_not_approved', label: 'Add-on not approved', requiresPhoto: false },
  { value: 'equipment_failure', label: 'Equipment failure', requiresPhoto: false },
  { value: 'client_requested_stop', label: 'Client requested stop', requiresPhoto: false },
  { value: 'other', label: 'Other (requires explanation)', requiresPhoto: false },
];


// Helper function for color classes - defined at module level for better performance
const getColorClasses = (color: string, isActive: boolean) => {
  const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    blue: {
      bg: isActive ? 'bg-blue-500/10' : 'bg-black/30',
      border: isActive ? 'border-blue-500/40' : 'border-emerald-500/20',
      text: 'text-blue-300',
      icon: 'text-blue-400',
    },
    amber: {
      bg: isActive ? 'bg-amber-500/10' : 'bg-black/30',
      border: isActive ? 'border-amber-500/40' : 'border-emerald-500/20',
      text: 'text-amber-300',
      icon: 'text-amber-400',
    },
    purple: {
      bg: isActive ? 'bg-purple-500/10' : 'bg-black/30',
      border: isActive ? 'border-purple-500/40' : 'border-emerald-500/20',
      text: 'text-purple-300',
      icon: 'text-purple-400',
    },
    emerald: {
      bg: isActive ? 'bg-emerald-500/10' : 'bg-black/30',
      border: isActive ? 'border-emerald-500/40' : 'border-emerald-500/20',
      text: 'text-emerald-300',
      icon: 'text-emerald-400',
    },
    red: {
      bg: isActive ? 'bg-red-500/10' : 'bg-black/30',
      border: isActive ? 'border-red-500/40' : 'border-emerald-500/20',
      text: 'text-red-300',
      icon: 'text-red-400',
    },
  };
  return colors[color] || colors.emerald;
};


// Job Actions Panel - UI shell for job workflow features with integrated messaging, photos, and add-ons
function JobActionsPanel({ jobId, jobStatus }: { jobId: string; jobStatus: string }) {
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const { isMobile } = useMobile();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    messaging: false,
    beforePhotos: false,
    addOns: false,
    afterPhotos: false,
    unableToComplete: false,
  });
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [messagingError, setMessagingError] = useState<string | null>(null);
  
  // Photo state
  const [existingPhotos, setExistingPhotos] = useState<JobPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<'before' | 'after' | null>(null);
  const [cameraMode, setCameraMode] = useState<'before' | 'after' | null>(null);

  // Add-on state
  const [existingAddOns, setExistingAddOns] = useState<JobAddOn[]>([]);
  const [loadingAddOns, setLoadingAddOns] = useState(false);
  const [addOnError, setAddOnError] = useState<string | null>(null);
  const [addOnTableExists, setAddOnTableExists] = useState(true);
  const [submittingAddOn, setSubmittingAddOn] = useState(false);
  
  // Add-on form state
  const [addOnForm, setAddOnForm] = useState({
    addon_type: '',
    description: '',
    estimated_price_min: '',
    estimated_price_max: '',
    client_informed: false,
  });
  const [addOnPhotoFile, setAddOnPhotoFile] = useState<File | null>(null);
  const [addOnPhotoPreview, setAddOnPhotoPreview] = useState<string | null>(null);
  const [addOnCameraOpen, setAddOnCameraOpen] = useState(false);

  // Unable to Complete state
  const [unableToCompleteForm, setUnableToCompleteForm] = useState({
    reason: '',
    explanation: '',
    reschedule_date: '',
  });
  const [blockedPhotoFile, setBlockedPhotoFile] = useState<File | null>(null);
  const [blockedPhotoPreview, setBlockedPhotoPreview] = useState<string | null>(null);
  const [blockedCameraOpen, setBlockedCameraOpen] = useState(false);
  const [submittingBlocked, setSubmittingBlocked] = useState(false);
  // job_blocked_reviews feature disabled — table not present
  const blockedTableExists = false;



  // Fetch existing photos when panel expands
  useEffect(() => {
    if (isExpanded && jobId) {
      fetchExistingPhotos();
      fetchExistingAddOns();
      // job_blocked_reviews feature disabled — table not present
    }
  }, [isExpanded, jobId]);



  const fetchExistingPhotos = async () => {
    setLoadingPhotos(true);
    setPhotoError(null);
    try {
      const { data, error } = await supabase
        .from('job_photos')
        .select('id, job_id, file_url, type, uploaded_at, sort_order')
        .eq('job_id', jobId)
        .order('uploaded_at', { ascending: true });

      if (error) throw error;
      setExistingPhotos(data || []);
    } catch (err: any) {
      console.error('[JobActionsPanel] Error fetching photos:', err);
      setPhotoError('Unable to load photos');
    } finally {
      setLoadingPhotos(false);
    }
  };

  const fetchExistingAddOns = async () => {
    setLoadingAddOns(true);
    setAddOnError(null);
    try {
      const { data, error } = await supabase
        .from('job_addons')
        .select('id, job_id, addon_type, description, estimated_price_min, estimated_price_max, photo_url, client_informed, status, created_at')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) {
        // Check if table doesn't exist
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[JobActionsPanel] job_addons table does not exist');
          setAddOnTableExists(false);
          return;
        }
        throw error;
      }
      setExistingAddOns(data || []);
      setAddOnTableExists(true);
    } catch (err: any) {
      console.error('[JobActionsPanel] Error fetching add-ons:', err);
      setAddOnError('Unable to load add-ons');
    } finally {
      setLoadingAddOns(false);
    }
  };

  const beforePhotos = existingPhotos.filter(p => p.type === 'before');
  const afterPhotos = existingPhotos.filter(p => p.type === 'after');


  // Sanitize filename for Supabase Storage - remove special chars, spaces, unicode
  const sanitizeFileName = (name: string): string => {
    // Get extension
    const lastDot = name.lastIndexOf('.');
    const ext = lastDot > 0 ? name.slice(lastDot).toLowerCase() : '.jpg';
    const baseName = lastDot > 0 ? name.slice(0, lastDot) : name;
    
    // Sanitize: keep only alphanumeric, hyphens, underscores
    const sanitized = baseName
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
      .replace(/_+/g, '_') // Collapse multiple underscores
      .slice(0, 50); // Limit length
    
    return `${sanitized || 'photo'}${ext}`;
  };

  // Get proper content type from file or extension
  const getContentType = (file: File): string => {
    // Use file's reported type if valid
    if (file.type && file.type.startsWith('image/')) {
      return file.type;
    }
    
    // Fallback based on extension
    const ext = file.name.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'heic': 'image/heic',
      'heif': 'image/heif',
    };
    
    return mimeTypes[ext || ''] || 'image/jpeg';
  };

  const handleFileSelect = async (type: 'before' | 'after', files: FileList | null) => {
    if (!files || files.length === 0) return;

    const maxPhotos = type === 'before' ? PHOTO_CONFIG.MAX_BEFORE_PHOTOS : PHOTO_CONFIG.MAX_AFTER_PHOTOS;
    const currentCount = type === 'before' ? beforePhotos.length : afterPhotos.length;
    
    if (currentCount >= maxPhotos) {
      toast({
        title: "Maximum photos reached",
        description: `You can only upload ${maxPhotos} ${type} photos`,
        variant: "destructive"
      });
      return;
    }

    const remainingSlots = maxPhotos - currentCount;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    setUploadingType(type);

    for (const file of filesToUpload) {
      // Validate file
      if (file.size > PHOTO_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `File must be under ${PHOTO_CONFIG.MAX_FILE_SIZE_MB}MB`,
          variant: "destructive"
        });
        continue;
      }

      if (!PHOTO_CONFIG.ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Only JPG, PNG, and WebP files are allowed",
          variant: "destructive"
        });
        continue;
      }

      try {
        // Compress image
        const compressedFile = await compressImage(file);
        
        // Build safe upload path with sanitized filename
        const timestamp = Date.now();
        const safeFileName = sanitizeFileName(file.name);
        const contentType = getContentType(compressedFile);
        
        // Path format: {jobId}/{timestamp}_{type}_{sanitizedName}
        const path = `${jobId}/${timestamp}_${type}_${safeFileName}`;
        
        console.log('[JobActionsPanel] Uploading photo:', {
          path,
          contentType,
          originalName: file.name,
          sanitizedName: safeFileName,
          fileSize: compressedFile.size,
          jobId
        });
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('job-photos')
          .upload(path, compressedFile, { 
            upsert: false, 
            contentType: contentType,
            cacheControl: '3600'
          });

        if (uploadError) {
          console.error('[JobActionsPanel] Storage upload error:', {
            error: uploadError,
            path,
            contentType,
            bucket: 'job-photos'
          });
          throw uploadError;
        }

        console.log('[JobActionsPanel] Upload successful:', uploadData);

        // Get public URL
        const { data: urlData } = supabase.storage.from('job-photos').getPublicUrl(path);

        // Get authenticated user for uploaded_by field (required by RLS)
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser?.id) {
          throw new Error('Not authenticated - cannot save photo metadata');
        }

        // Insert into database with uploaded_by field to satisfy RLS policy
        const { error: insertError } = await supabase
          .from('job_photos')
          .insert({
            job_id: jobId,
            file_url: urlData.publicUrl,
            type: type,
            uploaded_at: new Date().toISOString(),
            sort_order: currentCount,
            uploaded_by: authUser.id  // Required by RLS policy: uploaded_by = auth.uid()
          });

        if (insertError) {
          console.error('[JobActionsPanel] Database insert error:', insertError);
          throw insertError;
        }

        toast({
          title: "Photo uploaded",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} photo uploaded successfully`,
        });

        // Refresh photos
        await fetchExistingPhotos();
        window.dispatchEvent(new Event('job-photos-updated'));
      } catch (err: any) {
        console.error('[JobActionsPanel] Photo upload error:', err);
        toast({
          title: "Upload failed",
          description: err.message || "Failed to upload photo",
          variant: "destructive"
        });
      }
    }

    setUploadingType(null);
  };


  const handleCameraCapture = async (file: File) => {
    if (!cameraMode) return;
    
    // Create a FileList-like object
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    await handleFileSelect(cameraMode, dataTransfer.files);
    setCameraMode(null);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle opening messaging dialog with error boundary
  const handleOpenMessaging = () => {
    try {
      setMessagingError(null);
      setMessagingOpen(true);
    } catch (err) {
      console.error('[JobActionsPanel] Error opening messaging:', err);
      setMessagingError('Unable to open messaging. Please try again.');
    }
  };

  // Handle closing messaging dialog
  const handleCloseMessaging = () => {
    setMessagingOpen(false);
  };

  // Add-on form handlers
  const handleAddOnPhotoSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    if (file.size > PHOTO_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File must be under ${PHOTO_CONFIG.MAX_FILE_SIZE_MB}MB`,
        variant: "destructive"
      });
      return;
    }

    setAddOnPhotoFile(file);
    setAddOnPhotoPreview(URL.createObjectURL(file));
  };

  const handleAddOnCameraCapture = (file: File) => {
    setAddOnPhotoFile(file);
    setAddOnPhotoPreview(URL.createObjectURL(file));
    setAddOnCameraOpen(false);
  };

  const clearAddOnPhoto = () => {
    setAddOnPhotoFile(null);
    if (addOnPhotoPreview) {
      URL.revokeObjectURL(addOnPhotoPreview);
    }
    setAddOnPhotoPreview(null);
  };

  const resetAddOnForm = () => {
    setAddOnForm({
      addon_type: '',
      description: '',
      estimated_price_min: '',
      estimated_price_max: '',
      client_informed: false,
    });
    clearAddOnPhoto();
  };

  const handleSubmitAddOn = async () => {
    // Validation
    if (!addOnForm.addon_type) {
      toast({
        title: "Missing add-on type",
        description: "Please select an add-on type",
        variant: "destructive"
      });
      return;
    }

    if (!addOnForm.description.trim()) {
      toast({
        title: "Missing description",
        description: "Please provide a brief explanation",
        variant: "destructive"
      });
      return;
    }

    setSubmittingAddOn(true);

    try {
      // Get landscaper ID
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) {
        throw new Error('Not authenticated');
      }

      // Get landscaper profile ID
      const { data: landscaperData } = await supabase
        .from('landscapers')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (!landscaperData?.id) {
        throw new Error('Landscaper profile not found');
      }

      let photoUrl: string | null = null;

      // Upload photo if provided
      if (addOnPhotoFile) {
        const compressedFile = await compressImage(addOnPhotoFile);
        const timestamp = Date.now();
        const path = `addons/${jobId}/${timestamp}_${addOnPhotoFile.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('job-photos')
          .upload(path, compressedFile, { upsert: false, contentType: addOnPhotoFile.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('job-photos').getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      // Parse price range
      const priceMin = addOnForm.estimated_price_min ? parseFloat(addOnForm.estimated_price_min) : null;
      const priceMax = addOnForm.estimated_price_max ? parseFloat(addOnForm.estimated_price_max) : null;

      // Insert add-on
      const { error: insertError } = await supabase
        .from('job_addons')
        .insert({
          job_id: jobId,
          landscaper_id: landscaperData.id,
          addon_type: addOnForm.addon_type,
          description: addOnForm.description.trim(),
          estimated_price_min: priceMin,
          estimated_price_max: priceMax,
          photo_url: photoUrl,
          client_informed: addOnForm.client_informed,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      toast({
        title: "Add-on submitted",
        description: "Your add-on request has been saved and is visible to the client and admin.",
      });

      // Reset form and refresh list
      resetAddOnForm();
      await fetchExistingAddOns();

    } catch (err: any) {
      console.error('[JobActionsPanel] Add-on submission error:', err);
      toast({
        title: "Submission failed",
        description: err.message || "Failed to submit add-on",
        variant: "destructive"
      });
    } finally {
      setSubmittingAddOn(false);
    }
  };

  const getAddOnTypeLabel = (value: string) => {
    const type = ADDON_TYPES.find(t => t.value === value);
    return type?.label || value;
  };

  const getAddOnStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-300">Pending</span>;
      case 'approved':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300">Approved</span>;
      case 'declined':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300">Declined</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-500/20 text-gray-300">{status}</span>;
    }
  };

  // Unable to Complete handlers
  const handleBlockedPhotoSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    if (file.size > PHOTO_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File must be under ${PHOTO_CONFIG.MAX_FILE_SIZE_MB}MB`,
        variant: "destructive"
      });
      return;
    }

    setBlockedPhotoFile(file);
    setBlockedPhotoPreview(URL.createObjectURL(file));
  };

  const handleBlockedCameraCapture = (file: File) => {
    setBlockedPhotoFile(file);
    setBlockedPhotoPreview(URL.createObjectURL(file));
    setBlockedCameraOpen(false);
  };

  const clearBlockedPhoto = () => {
    setBlockedPhotoFile(null);
    if (blockedPhotoPreview) {
      URL.revokeObjectURL(blockedPhotoPreview);
    }
    setBlockedPhotoPreview(null);
  };

  const resetUnableToCompleteForm = () => {
    setUnableToCompleteForm({
      reason: '',
      explanation: '',
      reschedule_date: '',
    });
    clearBlockedPhoto();
  };

  const selectedBlockedReason = UNABLE_TO_COMPLETE_REASONS.find(r => r.value === unableToCompleteForm.reason);
  const photoRequiredForReason = selectedBlockedReason?.requiresPhoto ?? false;

  const handleSubmitUnableToComplete = async () => {
    // Validation
    if (!unableToCompleteForm.reason) {
      toast({
        title: "Missing reason",
        description: "Please select a reason why you cannot complete this job",
        variant: "destructive"
      });
      return;
    }

    if (!unableToCompleteForm.explanation.trim()) {
      toast({
        title: "Missing explanation",
        description: "Please provide a detailed explanation",
        variant: "destructive"
      });
      return;
    }

    // Check if photo is required but not provided
    if (photoRequiredForReason && !blockedPhotoFile) {
      toast({
        title: "Photo required",
        description: "This reason requires photo documentation",
        variant: "destructive"
      });
      return;
    }

    setSubmittingBlocked(true);

    try {
      // Get landscaper ID
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) {
        throw new Error('Not authenticated');
      }

      // Get landscaper profile ID
      const { data: landscaperData } = await supabase
        .from('landscapers')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (!landscaperData?.id) {
        throw new Error('Landscaper profile not found');
      }

      let photoUrl: string | null = null;

      // Upload photo if provided
      if (blockedPhotoFile) {
        const compressedFile = await compressImage(blockedPhotoFile);
        const timestamp = Date.now();
        const path = `blocked/${jobId}/${timestamp}_${blockedPhotoFile.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('job-photos')
          .upload(path, compressedFile, { upsert: false, contentType: blockedPhotoFile.type });

        if (uploadError) {
          console.error('[JobActionsPanel] Photo upload error:', uploadError);
          // Don't fail the whole submission if photo upload fails
          toast({
            title: "Photo upload failed",
            description: "Continuing without photo. You can add it later.",
            variant: "destructive"
          });
        } else {
          const { data: urlData } = supabase.storage.from('job-photos').getPublicUrl(path);
          photoUrl = urlData.publicUrl;
        }
      }

      // Update job status to blocked (valid enum value)
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          status: 'blocked',
        })
        .eq('id', jobId);

      if (updateError) {
        console.error('[JobActionsPanel] Job status update error:', updateError);
        throw new Error('Failed to update job status: ' + (updateError.message || 'Unknown error'));
      }

      // job_blocked_reviews feature disabled — table not present


      // job_blocked_reviews feature disabled — table not present


      toast({
        title: "Job paused for review",
        description: "An admin will review your request. Payment is paused, not canceled.",
      });

      // Reset form
      resetUnableToCompleteForm();

      // Trigger a page refresh to update job status
      window.location.reload();

    } catch (err: any) {
      console.error('[JobActionsPanel] Unable to complete submission error:', err);
      toast({
        title: "Submission failed",
        description: err.message || "Failed to submit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingBlocked(false);
    }
  };

  // Check if add-ons section should be visible (only for assigned/active)
  const showAddOnsSection = ['assigned', 'active'].includes(jobStatus);
  
  // Check if unable to complete section should be visible
  const showUnableToCompleteSection = ['assigned', 'active'].includes(jobStatus);


  const sections = [
    {
      id: 'messaging',
      label: 'Messaging',
      icon: MessageSquare,
      placeholder: 'Client messaging coming next',
      color: 'blue',
      hasAction: true,
    },
    {
      id: 'beforePhotos',
      label: 'Before Photos',
      icon: Camera,
      placeholder: 'Before photo upload wiring next step',
      color: 'amber',
      hasAction: true,
    },
    {
      id: 'addOns',
      label: 'Add-Ons',
      icon: PlusCircle,
      placeholder: 'Service add-ons coming next',
      color: 'purple',
      hasAction: showAddOnsSection && addOnTableExists,
      hidden: !showAddOnsSection || !addOnTableExists,
    },
    {
      id: 'afterPhotos',
      label: 'After Photos',
      icon: ImageIcon,
      placeholder: 'After photo upload wiring next step',
      color: 'emerald',
      hasAction: true,
    },
    {
      id: 'unableToComplete',
      label: 'Unable to Complete Job',
      icon: Ban,
      placeholder: 'Report issues preventing job completion',
      color: 'red',
      hasAction: showUnableToCompleteSection,
      hidden: !showUnableToCompleteSection,
    },
  ].filter(s => !s.hidden);



  // Render photo section content
  const renderPhotoSection = (type: 'before' | 'after') => {
    const photos = type === 'before' ? beforePhotos : afterPhotos;
    const maxPhotos = type === 'before' ? PHOTO_CONFIG.MAX_BEFORE_PHOTOS : PHOTO_CONFIG.MAX_AFTER_PHOTOS;
    const canAddMore = photos.length < maxPhotos;
    const isUploading = uploadingType === type;
    const isBeforeType = type === 'before';

    return (
      <div className="space-y-3">
        {/* Photo count */}
        <div className="flex items-center justify-between text-xs">
          <span className={isBeforeType ? 'text-amber-300' : 'text-emerald-300'}>
            {photos.length} / {maxPhotos} photos
          </span>
          {isUploading && (
            <span className="flex items-center gap-1 text-emerald-300">
              <Loader2 className="w-3 h-3 animate-spin" />
              Uploading...
            </span>
          )}
        </div>

        {/* Loading state */}
        {loadingPhotos && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {photoError && (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-xs text-red-300">{photoError}</p>
          </div>
        )}

        {/* Photo grid */}
        {!loadingPhotos && (
          <div className="grid grid-cols-3 gap-2">
            {/* Existing photos */}
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                <img 
                  src={photo.file_url} 
                  alt={`${type} photo`} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 right-1">
                  <span className={`px-1 py-0.5 rounded text-[10px] text-white font-medium ${isBeforeType ? 'bg-amber-500/80' : 'bg-emerald-500/80'}`}>
                    <Check className="w-2.5 h-2.5 inline" />
                  </span>
                </div>
              </div>
            ))}

            {/* Add photo button */}
            {canAddMore && !isUploading && (
              <label className={`aspect-square rounded-lg border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 ${
                isBeforeType 
                  ? 'border-amber-500/30 hover:border-amber-500/50' 
                  : 'border-emerald-500/30 hover:border-emerald-500/50'
              }`}>
                <Upload className={`w-5 h-5 ${isBeforeType ? 'text-amber-400/70' : 'text-emerald-400/70'}`} />
                <span className="text-[10px] text-gray-400">Add</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(type, e.target.files)}
                />
              </label>
            )}

            {/* Uploading placeholder */}
            {isUploading && (
              <div className={`aspect-square rounded-lg border-2 border-dashed flex items-center justify-center ${
                isBeforeType ? 'border-amber-500/30' : 'border-emerald-500/30'
              }`}>
                <Loader2 className={`w-5 h-5 animate-spin ${isBeforeType ? 'text-amber-400' : 'text-emerald-400'}`} />
              </div>
            )}
          </div>
        )}

        {/* Camera button for mobile */}
        {isMobile && canAddMore && !isUploading && (
          <button
            onClick={() => setCameraMode(type)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
              isBeforeType 
                ? 'border-amber-500/30 text-amber-300 hover:bg-amber-500/10' 
                : 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
            }`}
          >
            <Camera className="w-4 h-4" />
            Take {type} Photo
          </button>
        )}

        {/* Info text */}
        <p className="text-xs text-emerald-300/50 text-center">
          {type === 'before' 
            ? 'Document the job site before starting work'
            : 'Show the completed work to the client'}
        </p>
      </div>
    );
  };

  // Render add-ons section content
  const renderAddOnsSection = () => {
    const selectedType = ADDON_TYPES.find(t => t.value === addOnForm.addon_type);

    return (
      <div className="space-y-4">
        {/* Loading state */}
        {loadingAddOns && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {addOnError && (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-xs text-red-300">{addOnError}</p>
          </div>
        )}

        {/* Existing add-ons list */}
        {!loadingAddOns && existingAddOns.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-purple-300 font-medium">Submitted Add-Ons ({existingAddOns.length})</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {existingAddOns.map((addon) => (
                <div key={addon.id} className="p-2 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-purple-200">{getAddOnTypeLabel(addon.addon_type)}</span>
                        {getAddOnStatusBadge(addon.status)}
                        {addon.client_informed && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300">Client Notified</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{addon.description}</p>
                      {(addon.estimated_price_min || addon.estimated_price_max) && (
                        <p className="text-xs text-purple-300/70 mt-1">
                          Est: ${addon.estimated_price_min || '?'} - ${addon.estimated_price_max || '?'}
                        </p>
                      )}
                    </div>
                    {addon.photo_url && (
                      <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                        <img src={addon.photo_url} alt="Add-on" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add new add-on form */}
        {!loadingAddOns && (
          <div className="space-y-3 pt-2 border-t border-purple-500/20">
            <p className="text-xs text-purple-300 font-medium">Request New Add-On</p>
            
            {/* Add-on type dropdown */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Add-On Type *</label>
              <select
                value={addOnForm.addon_type}
                onChange={(e) => setAddOnForm(prev => ({ ...prev, addon_type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-purple-500/60"
              >
                <option value="">Select type...</option>
                {ADDON_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} ({type.priceRange})
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Explanation *</label>
              <textarea
                value={addOnForm.description}
                onChange={(e) => setAddOnForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Briefly explain why this add-on is needed..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-purple-500/30 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60 resize-none"
              />
            </div>

            {/* Price range (informational) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Est. Min ($)</label>
                <input
                  type="number"
                  value={addOnForm.estimated_price_min}
                  onChange={(e) => setAddOnForm(prev => ({ ...prev, estimated_price_min: e.target.value }))}
                  placeholder={selectedType?.priceRange.split('-')[0]?.replace('$', '') || '0'}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-purple-500/30 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Est. Max ($)</label>
                <input
                  type="number"
                  value={addOnForm.estimated_price_max}
                  onChange={(e) => setAddOnForm(prev => ({ ...prev, estimated_price_max: e.target.value }))}
                  placeholder={selectedType?.priceRange.split('-')[1]?.replace('$', '') || '0'}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-purple-500/30 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60"
                />
              </div>
            </div>

            {/* Info about price */}
            <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-purple-300/70">
                Price estimates are informational only. Final pricing will be determined by admin review.
              </p>
            </div>

            {/* Optional photo */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Photo (optional)</label>
              {addOnPhotoPreview ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <img src={addOnPhotoPreview} alt="Add-on preview" className="w-full h-full object-cover" />
                  <button
                    onClick={clearAddOnPhoto}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-purple-500/30 cursor-pointer hover:border-purple-500/50 transition-colors">
                    <Upload className="w-4 h-4 text-purple-400/70" />
                    <span className="text-xs text-gray-400">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAddOnPhotoSelect(e.target.files)}
                    />
                  </label>
                  {isMobile && (
                    <button
                      onClick={() => setAddOnCameraOpen(true)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-purple-500/30 hover:bg-purple-500/10 transition-colors"
                    >
                      <Camera className="w-4 h-4 text-purple-400" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Client informed checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addOnForm.client_informed}
                onChange={(e) => setAddOnForm(prev => ({ ...prev, client_informed: e.target.checked }))}
                className="w-4 h-4 rounded border-purple-500/30 bg-black/40 text-purple-500 focus:ring-purple-500/50"
              />
              <span className="text-xs text-gray-300">I have informed the client about this add-on</span>
            </label>

            {/* Submit button */}
            <button
              onClick={handleSubmitAddOn}
              disabled={submittingAddOn || !addOnForm.addon_type || !addOnForm.description.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingAddOn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit Add-On Request
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render Unable to Complete section
  const renderUnableToCompleteSection = () => {
    return (
      <div className="space-y-4">
        {/* Warning banner */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-300">
            <p className="font-medium">This will pause the job for admin review</p>
            <p className="text-red-300/70 mt-1">Payment will be paused (not canceled). The client will see "Job paused – under review".</p>
          </div>
        </div>

        {/* Reason dropdown */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Reason *</label>
          <select
            value={unableToCompleteForm.reason}
            onChange={(e) => setUnableToCompleteForm(prev => ({ ...prev, reason: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-red-500/30 text-sm text-white focus:outline-none focus:border-red-500/60"
          >
            <option value="">Select reason...</option>
            {UNABLE_TO_COMPLETE_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>

        {/* Photo requirement indicator */}
        {unableToCompleteForm.reason && (
          <div className={`flex items-center gap-2 text-xs ${photoRequiredForReason ? 'text-amber-300' : 'text-gray-400'}`}>
            <Camera className="w-3 h-3" />
            <span>
              {photoRequiredForReason 
                ? 'Photo documentation required for this reason' 
                : 'Photo documentation optional'}
            </span>
          </div>
        )}

        {/* Explanation */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Detailed Explanation *</label>
          <textarea
            value={unableToCompleteForm.explanation}
            onChange={(e) => setUnableToCompleteForm(prev => ({ ...prev, explanation: e.target.value }))}
            placeholder="Provide a detailed explanation of the issue..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-red-500/30 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/60 resize-none"
          />
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Photo Evidence {photoRequiredForReason ? '*' : '(optional)'}
          </label>
          {blockedPhotoPreview ? (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden">
              <img src={blockedPhotoPreview} alt="Evidence preview" className="w-full h-full object-cover" />
              <button
                onClick={clearBlockedPhoto}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg border border-dashed border-red-500/30 cursor-pointer hover:border-red-500/50 transition-colors">
                <Upload className="w-4 h-4 text-red-400/70" />
                <span className="text-xs text-gray-400">Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleBlockedPhotoSelect(e.target.files)}
                />
              </label>
              {isMobile && (
                <button
                  onClick={() => setBlockedCameraOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-500/30 hover:bg-red-500/10 transition-colors"
                >
                  <Camera className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Optional reschedule request */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Request Reschedule Date (optional)</label>
          <input
            type="date"
            value={unableToCompleteForm.reschedule_date}
            onChange={(e) => setUnableToCompleteForm(prev => ({ ...prev, reschedule_date: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-red-500/30 text-sm text-white focus:outline-none focus:border-red-500/60"
          />
          <p className="text-xs text-gray-500 mt-1">This is a non-binding request. Admin will confirm.</p>
        </div>

        {/* Info box */}
        <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300/70">
            Messaging will remain enabled. The admin will review and may convert this to a remediation, approve reschedule, or reassign the job.
          </p>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmitUnableToComplete}
          disabled={submittingBlocked || !unableToCompleteForm.reason || !unableToCompleteForm.explanation.trim() || (photoRequiredForReason && !blockedPhotoFile)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submittingBlocked ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Ban className="w-4 h-4" />
          )}
          Submit for Admin Review
        </button>
      </div>
    );
  };


  return (
    <>
      <div className="mt-4 border border-emerald-500/30 rounded-xl overflow-hidden">
        {/* Panel Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Play className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-semibold text-emerald-300">Job Actions</h4>
              <p className="text-xs text-emerald-300/60">
                {jobStatus === 'assigned' ? 'Prepare for job' : 
                 jobStatus === 'active' ? 'Job in progress' : 

                 'Review required'}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-emerald-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-emerald-400" />
          )}
        </button>

        {/* Panel Content */}
        {isExpanded && (
          <div className="p-4 space-y-3 bg-black/20">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = expandedSections[section.id];
              const colorClasses = getColorClasses(section.color, isActive);

              return (
                <div
                  key={section.id}
                  className={`rounded-lg border transition-all ${colorClasses.bg} ${colorClasses.border}`}
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${colorClasses.icon}`} />
                      <span className={`text-sm font-medium ${colorClasses.text}`}>
                        {section.label}
                      </span>
                      {section.hasAction && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-medium">
                          Active
                        </span>
                      )}
                      {/* Photo count badges */}
                      {section.id === 'beforePhotos' && beforePhotos.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300">
                          {beforePhotos.length}
                        </span>
                      )}
                      {section.id === 'afterPhotos' && afterPhotos.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300">
                          {afterPhotos.length}
                        </span>
                      )}
                      {/* Add-on count badge */}
                      {section.id === 'addOns' && existingAddOns.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300">
                          {existingAddOns.length}
                        </span>
                      )}
                    </div>
                    {isActive ? (
                      <ChevronUp className="w-4 h-4 text-emerald-400/60" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-emerald-400/60" />
                    )}
                  </button>

                  {isActive && (
                    <div className="px-3 pb-3">
                      {/* Messaging Section */}
                      {section.id === 'messaging' && (
                        <div className="space-y-3">
                          {messagingError && (
                            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                              <p className="text-xs text-red-300">{messagingError}</p>
                            </div>
                          )}
                          <button
                            onClick={handleOpenMessaging}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-200 font-medium transition-all"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Open Client Messaging
                          </button>
                          <p className="text-xs text-emerald-300/50 text-center">
                            Send structured messages to the client about this job
                          </p>
                        </div>
                      )}

                      {/* Before Photos Section */}
                      {section.id === 'beforePhotos' && renderPhotoSection('before')}

                      {/* Add-Ons Section */}
                      {section.id === 'addOns' && renderAddOnsSection()}

                      {/* After Photos Section */}
                      {section.id === 'afterPhotos' && renderPhotoSection('after')}

                      {/* Unable to Complete Section */}
                      {section.id === 'unableToComplete' && renderUnableToCompleteSection()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Structured Job Messaging Dialog */}
      <StructuredJobMessaging
        jobId={jobId}
        jobStatus={jobStatus}
        isOpen={messagingOpen}
        onClose={handleCloseMessaging}
        jobTitle={`Job ${jobId.slice(0, 8)}...`}
      />

      {/* Camera Capture Modal for Photos */}
      {cameraMode && (
        <CameraCapture
          isOpen={!!cameraMode}
          onClose={() => setCameraMode(null)}
          onCapture={handleCameraCapture}
          title={`Take ${cameraMode} Photo`}
          includeGPS={true}
        />
      )}

      {/* Camera Capture Modal for Add-On Photo */}
      {addOnCameraOpen && (
        <CameraCapture
          isOpen={addOnCameraOpen}
          onClose={() => setAddOnCameraOpen(false)}
          onCapture={handleAddOnCameraCapture}
          title="Take Add-On Photo"
          includeGPS={true}
        />
      )}

      {/* Camera Capture Modal for Blocked Job Photo */}
      {blockedCameraOpen && (
        <CameraCapture
          isOpen={blockedCameraOpen}
          onClose={() => setBlockedCameraOpen(false)}
          onCapture={handleBlockedCameraCapture}
          title="Take Evidence Photo"
          includeGPS={true}
        />
      )}
    </>
  );
}

