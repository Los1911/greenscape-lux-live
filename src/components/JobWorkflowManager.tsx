import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { invokeJobExecution } from '@/lib/edgeFunctionClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, MapPin, DollarSign, AlertTriangle, Camera, Lock } from 'lucide-react';
import { Job } from '@/types/job';

// ═══════════════════════════════════════════════════════════════════════════
// LIFECYCLE ENFORCEMENT: This component enforces the canonical job lifecycle:
//   scheduled/assigned → active → completed_pending_review → completed
//
// All status transitions go through the job-execution edge function.
// Direct DB status updates are ONLY used for the start action (which sets
// started_at atomically), and even that validates status first.
// ═══════════════════════════════════════════════════════════════════════════

const STARTABLE_STATUSES = ['assigned', 'scheduled'];

const JobWorkflowManager: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // OWNERSHIP MODEL: assigned_to is the ONLY authoritative ownership filter.
      const { data, error } = await supabase
        .from('jobs')
        .select('id, service_name, service_type, service_address, status, landscaper_id, assigned_to, created_at, price, customer_name, preferred_date, started_at, payout_amount')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── START JOB ──
  // LIFECYCLE: Only 'assigned' or 'scheduled' → 'active'
  // Sets started_at atomically. Uses direct DB update with status guard.
  const handleStartJob = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    // Pre-flight status check
    if (!STARTABLE_STATUSES.includes(job.status)) {
      setError(`Cannot start job. Status is "${job.status}", must be "assigned" or "scheduled".`);
      return;
    }

    try {
      setActionLoading(jobId);
      setError('');

      const { data, error: fnErr } = await invokeJobExecution({
        action: 'start',
        jobId,
      });

      if (fnErr) {
        setError(fnErr);
        return;
      }

      // Refresh to get updated state
      await fetchJobs();
    } catch (err: any) {
      setError(err.message || 'Failed to start job');
    } finally {
      setActionLoading(null);
    }
  };

  // ── COMPLETE JOB ──
  // LIFECYCLE: Only 'active' → 'completed_pending_review'
  // Requires started_at, before photos, and after photos.
  // Uses job-execution edge function — NO direct DB update.
  const handleCompleteJob = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    // Pre-flight status check
    if (job.status !== 'active') {
      setError(`Cannot complete job. Status is "${job.status}", must be "active".`);
      return;
    }

    // Pre-flight started_at check
    if (!(job as any).started_at) {
      setError('Cannot complete job without a start time. Start the job first.');
      return;
    }

    try {
      setActionLoading(jobId);
      setError('');

      const { data, error: fnErr } = await invokeJobExecution({
        action: 'complete',
        jobId,
      });

      if (fnErr) {
        setError(fnErr);
        return;
      }

      // Refresh to get updated state
      await fetchJobs();
    } catch (err: any) {
      setError(err.message || 'Failed to complete job');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'assigned': return 'bg-blue-500';
      case 'scheduled': return 'bg-cyan-500';
      case 'active': return 'bg-orange-500';
      case 'completed_pending_review': return 'bg-amber-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading jobs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Job Management</h2>
        <Button onClick={() => navigate('/new-requests')}>
          View New Requests
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => {
          const isStartable = STARTABLE_STATUSES.includes(job.status);
          const isActive = job.status === 'active';
          const isActionLoading = actionLoading === job.id;

          return (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{job.service_name}</CardTitle>
                  <Badge className={`${getStatusColor(job.status)} text-white`}>
                    {job.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm">{job.service_type}</p>

                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-1" />
                  {job.service_address}
                </div>
                
                <div className="flex items-center text-sm font-medium">
                  <DollarSign className="w-4 h-4 mr-1" />
                  ${job.price}
                </div>

                {/* Lifecycle-enforced action buttons */}
                <div className="flex flex-col gap-2 mt-4">
                  {/* START: Only for assigned/scheduled jobs */}
                  {isStartable && (
                    <Button 
                      size="sm" 
                      onClick={() => handleStartJob(job.id)}
                      disabled={isActionLoading}
                      className="flex-1"
                    >
                      {isActionLoading ? (
                        <Clock className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Clock className="w-4 h-4 mr-1" />
                      )}
                      Start Work
                    </Button>
                  )}

                  {/* COMPLETE: Only for active jobs — edge function validates photos */}
                  {isActive && (
                    <Button 
                      size="sm" 
                      onClick={() => handleCompleteJob(job.id)}
                      disabled={isActionLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isActionLoading ? (
                        <Clock className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      )}
                      Complete
                    </Button>
                  )}

                  {/* INFO: Pending review */}
                  {job.status === 'completed_pending_review' && (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Awaiting admin review</span>
                    </div>
                  )}

                  {/* INFO: Completed */}
                  {job.status === 'completed' && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed & approved</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No jobs found</p>
          <Button onClick={() => navigate('/new-requests')}>
            Browse Available Jobs
          </Button>
        </div>
      )}
    </div>
  );
};

export default JobWorkflowManager;
