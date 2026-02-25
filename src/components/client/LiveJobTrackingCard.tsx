import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  User, 
  Truck, 
  RefreshCw, 
  ChevronRight,
  Circle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import JobDetailsModal from './JobDetailsModal';
import { Job } from '@/types/job';

interface ActiveJob {
  id: string;
  service_name?: string;
  service_type?: string;
  service_address?: string;
  status: string;
  price?: number;
  landscaper_id?: string;
  landscaper_email?: string;
  preferred_date?: string;
  scheduled_date?: string;
  created_at?: string;
  updated_at?: string;
  customer_name?: string;
  flagged_at?: string;
  flagged_reason?: string;
  remediation_deadline?: string;
  remediation_status?: string;
  remediation_notes?: string;
}

// Convert ActiveJob to Job type for modal
function toJob(activeJob: ActiveJob): Job {
  return {
    id: activeJob.id,
    service_name: activeJob.service_name || activeJob.service_type || 'Service',
    service_type: activeJob.service_type || null,
    service_address: activeJob.service_address || null,
    price: activeJob.price || null,
    preferred_date: activeJob.preferred_date || activeJob.scheduled_date || null,
    status: activeJob.status,
    customer_name: activeJob.customer_name || 'Customer',
    created_at: activeJob.created_at || new Date().toISOString(),
    updated_at: activeJob.updated_at || activeJob.created_at || new Date().toISOString(),
    landscaper_id: activeJob.landscaper_id || null,
    flagged_at: activeJob.flagged_at || null,
    flagged_reason: activeJob.flagged_reason || null,
    remediation_deadline: activeJob.remediation_deadline || null,
    remediation_status: activeJob.remediation_status as any || null,
    remediation_notes: activeJob.remediation_notes || null,
  };
}

// Status indicator with pulse animation for active jobs
function LiveStatusIndicator({ status }: { status: string }) {
  const getConfig = () => {
    switch (status) {
      case 'pending':
      case 'available':
        return { color: 'bg-slate-400', pulse: false, label: 'Awaiting' };
      case 'assigned':
        return { color: 'bg-blue-400', pulse: false, label: 'Assigned' };

      case 'active':

        return { color: 'bg-emerald-400', pulse: true, label: 'In Progress' };
      default:
        return { color: 'bg-slate-400', pulse: false, label: status };
    }
  };

  const config = getConfig();

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        {config.pulse && (
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${config.color} animate-ping`} />
        )}
      </div>
      <span className="text-xs text-slate-400">{config.label}</span>
    </div>
  );
}

export function LiveJobTrackingCard() {
  const { user } = useAuth();
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const loadActiveJobs = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userEmail = user.email || '';

      // Build OR conditions for the query
      const orConditions: string[] = [`user_id.eq.${user.id}`];
      if (userEmail) {
        orConditions.push(`client_email.eq.${userEmail}`);
      }

      const activeStatuses = ['pending', 'available', 'assigned', 'scheduled', 'active'];


      // Try combined OR query
      const { data: jobsData, error: queryError } = await supabase
        .from('jobs')
        .select('id, service_name, service_type, service_address, status, price, landscaper_id, landscaper_email, preferred_date, scheduled_date, created_at, updated_at, customer_name, flagged_at, flagged_reason, remediation_deadline, remediation_status, remediation_notes')
        .or(orConditions.join(','))
        .in('status', activeStatuses)
        .order('created_at', { ascending: false })
        .limit(5);

      if (queryError) {
        // Fallback: Query separately and merge
        let allJobs: ActiveJob[] = [];
        const existingIds = new Set<string>();

        // Query by user_id
        const { data: userIdJobs } = await supabase
          .from('jobs')
          .select('id, service_name, service_type, service_address, status, price, landscaper_id, landscaper_email, preferred_date, scheduled_date, created_at, updated_at, customer_name')
          .eq('user_id', user.id)
          .in('status', activeStatuses)
          .order('created_at', { ascending: false })
          .limit(5);

        if (userIdJobs) {
          for (const job of userIdJobs) {
            if (!existingIds.has(job.id)) {
              allJobs.push(job as ActiveJob);
              existingIds.add(job.id);
            }
          }
        }

        // Query by client_email
        if (userEmail) {
          const { data: emailJobs } = await supabase
            .from('jobs')
            .select('id, service_name, service_type, service_address, status, price, landscaper_id, landscaper_email, preferred_date, scheduled_date, created_at, updated_at, customer_name')
            .eq('client_email', userEmail)
            .in('status', activeStatuses)
            .order('created_at', { ascending: false })
            .limit(5);

          if (emailJobs) {
            for (const job of emailJobs) {
              if (!existingIds.has(job.id)) {
                allJobs.push(job as ActiveJob);
              }
            }
          }
        }

        setActiveJobs(allJobs.slice(0, 5));
      } else {
        setActiveJobs((jobsData || []) as ActiveJob[]);
      }
    } catch (err) {
      console.error('[LiveJobTrackingCard] Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (!user?.id) return;

    loadActiveJobs();

    // Set up realtime subscription for ALL job changes
    const channel = supabase
      .channel('live-tracking-realtime-' + user.id)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs'
        },
        () => {
          loadActiveJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadActiveJobs]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleJobClick = (job: ActiveJob) => {
    setSelectedJob(toJob(job));
  };

  if (loading) {
    return (
      <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Truck className="w-4 h-4 text-emerald-400" />
            Active Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Truck className="w-4 h-4 text-emerald-400" />
            Active Jobs
            {activeJobs.length > 0 && (
              <Badge className="ml-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/50 text-xs">
                {activeJobs.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {activeJobs.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3">
                <Truck className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">No active jobs</p>
              <p className="text-xs text-slate-500 mt-1">Your in-progress jobs will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => handleJobClick(job)}
                  className="w-full text-left p-3 bg-slate-900/60 border border-slate-700/50 rounded-xl hover:border-emerald-500/40 hover:bg-slate-800/60 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-medium text-white truncate group-hover:text-emerald-300 transition-colors">
                      {job.service_name || job.service_type || 'Service'}
                    </h4>
                    <LiveStatusIndicator status={job.status} />
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {job.service_address && (
                      <div className="flex items-center gap-1 truncate max-w-[150px]">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{job.service_address}</span>
                      </div>
                    )}
                    {(job.preferred_date || job.scheduled_date) && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(job.scheduled_date || job.preferred_date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Landscaper indicator */}
                  {job.landscaper_id && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-700/30">
                      <User className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-blue-400">Landscaper assigned</span>
                    </div>
                  )}

                  {/* Tap indicator */}
                  <div className="flex items-center justify-end mt-2">
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
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
      />
    </>
  );
}

export default LiveJobTrackingCard;
