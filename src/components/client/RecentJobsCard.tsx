import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  MapPin, 
  RefreshCw, 
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertCircle,
  Briefcase,
  Clock,
  DollarSign,
  User,
  Play
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import JobDetailsModal from './JobDetailsModal';
import { Job } from '@/types/job';

interface LocalJob {
  id: string;
  service_name?: string;
  service_type?: string;
  service_address?: string;
  status: string;
  price?: number;
  admin_price?: number;
  preferred_date?: string;
  created_at: string;
  updated_at?: string;
  customer_name?: string;
  landscaper_id?: string;
  flagged_at?: string;
  flagged_reason?: string;
  remediation_deadline?: string;
  remediation_status?: string;
  remediation_notes?: string;
}

function toJob(localJob: LocalJob): Job {
  return {
    id: localJob.id,
    service_name: localJob.service_name || localJob.service_type || 'Service',
    service_type: localJob.service_type || null,
    service_address: localJob.service_address || null,
    price: localJob.admin_price || localJob.price || null,
    preferred_date: localJob.preferred_date || null,
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

// Phase 1: Client-friendly status display
// Shows "Under Review" for pending, "Estimate Ready" for priced, etc.
function StatusIndicator({ status, price }: { status: string; price?: number }) {
  const getConfig = () => {
    switch (status) {
      case 'pending':
      case 'available':
        // Under Review - awaiting admin pricing
        return { 
          icon: Clock, 
          color: 'text-amber-400', 
          bg: 'bg-amber-500/15',
          label: 'Under Review'
        };
      case 'priced':
      case 'quoted':
        // Estimate Ready - admin has priced, awaiting landscaper
        return { 
          icon: DollarSign, 
          color: 'text-blue-400', 
          bg: 'bg-blue-500/15',
          label: 'Estimate Ready'
        };
      case 'assigned':
        // Scheduled - landscaper assigned

        return { 
          icon: User, 
          color: 'text-purple-400', 
          bg: 'bg-purple-500/15',
          label: 'Scheduled'
        };
      case 'in_progress':
        return { 
          icon: Play, 
          color: 'text-yellow-400', 
          bg: 'bg-yellow-500/15',
          label: 'In Progress'
        };
      case 'completed':
        return { 
          icon: CheckCircle2, 
          color: 'text-emerald-400', 
          bg: 'bg-emerald-500/15',
          label: 'Completed'
        };
      case 'flagged_review':
      case 'blocked_review':
        return { 
          icon: AlertCircle, 
          color: 'text-amber-400', 
          bg: 'bg-amber-500/15',
          label: 'Under Review'
        };
      default:
        return { 
          icon: Circle, 
          color: 'text-slate-400', 
          bg: 'bg-slate-500/15',
          label: status
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div className={`p-1.5 rounded-lg ${config.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
      </div>
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
}



export function RecentJobsCard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<LocalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const loadJobs = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // SYSTEM STABILIZATION: Use client_user_id as primary, with fallbacks for backwards compatibility
      const userEmail = user.email || '';
      
      // Primary query: Use canonical client_user_id, with fallback to user_id and client_email
      const orConditions: string[] = [
        `client_user_id.eq.${user.id}`,
        `user_id.eq.${user.id}`
      ];
      if (userEmail) {
        orConditions.push(`client_email.eq.${userEmail}`);
      }

      const { data: jobsData, error: queryError } = await supabase
        .from('jobs')
        .select('id, service_name, service_type, service_address, status, price, admin_price, preferred_date, created_at, updated_at, customer_name, landscaper_id, flagged_at, flagged_reason, remediation_deadline, remediation_status, remediation_notes')
        .or(orConditions.join(','))
        .order('created_at', { ascending: false })
        .limit(5);



      if (queryError) {
        let allJobs: LocalJob[] = [];
        const existingIds = new Set<string>();

        const { data: userIdJobs } = await supabase
          .from('jobs')
          .select('id, service_name, service_type, service_address, status, price, preferred_date, created_at, updated_at, customer_name, landscaper_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (userIdJobs) {
          for (const job of userIdJobs) {
            if (!existingIds.has(job.id)) {
              allJobs.push(job as LocalJob);
              existingIds.add(job.id);
            }
          }
        }

        if (userEmail) {
          const { data: emailJobs } = await supabase
            .from('jobs')
            .select('id, service_name, service_type, service_address, status, price, preferred_date, created_at, updated_at, customer_name, landscaper_id')
            .eq('client_email', userEmail)
            .order('created_at', { ascending: false })
            .limit(5);

          if (emailJobs) {
            for (const job of emailJobs) {
              if (!existingIds.has(job.id)) {
                allJobs.push(job as LocalJob);
              }
            }
          }
        }

        allJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setJobs(allJobs.slice(0, 5));
      } else {
        setJobs((jobsData || []) as LocalJob[]);
      }
    } catch (err) {
      console.error('[RecentJobsCard] Error loading jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (!user?.id) return;

    loadJobs();

    const channel = supabase
      .channel('recent-jobs-realtime-' + user.id)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs'
        },
        () => {
          loadJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadJobs]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleJobClick = (job: LocalJob) => {
    setSelectedJob(toJob(job));
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl">
        <div className="p-5 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-base font-medium text-white">Recent Jobs</h3>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (error || !jobs.length) {
    return (
      <div className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl">
        <div className="p-5 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-base font-medium text-white">Recent Jobs</h3>
          </div>
        </div>
        <div className="p-5">
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-xl bg-slate-800/60 flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-5 h-5 text-slate-500" />
            </div>
            <p className="text-sm text-slate-500">
              {error ? 'Unable to load jobs' : 'No jobs yet'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl">
        <div className="p-5 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-base font-medium text-white">Recent Jobs</h3>
          </div>
        </div>
        <div className="p-3">
          <div className="space-y-1">
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => handleJobClick(job)}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-800/50 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <StatusIndicator status={job.status} />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-emerald-300 transition-colors">
                      {job.service_name || job.service_type || 'Service'}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                      {job.preferred_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(job.preferred_date)}
                        </span>
                      )}
                      {job.service_address && (
                        <span className="flex items-center gap-1 truncate max-w-[140px]">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {job.service_address}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {job.price != null && job.price > 0 && (
                      <span className="text-sm text-emerald-400 font-medium">
                        ${Number(job.price).toFixed(0)}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <JobDetailsModal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        job={selectedJob}
      />
    </>
  );
}
