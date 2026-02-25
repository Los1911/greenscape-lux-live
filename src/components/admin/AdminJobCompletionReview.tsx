import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  User, 
  Calendar,
  Camera,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Eye,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { JobPhoto, groupPhotosByType } from '@/types/jobPhoto';
import BeforeAfterComparison from '@/components/photos/BeforeAfterComparison';

interface JobPendingReview {
  id: string;
  service_name: string;
  service_type: string;
  service_address: string | null;
  customer_name: string;
  customer_email: string | null;
  preferred_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  price: number | null;
  landscaper_id: string | null;
  landscaper_name?: string;
  landscaper_email?: string;
  photos: JobPhoto[];
  rejection_reason?: string | null;
}

interface AdminJobCompletionReviewProps {
  className?: string;
}

export default function AdminJobCompletionReview({ className = '' }: AdminJobCompletionReviewProps) {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobPendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  const fetchPendingReviewJobs = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch jobs with completed_pending_review status
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          service_name,
          service_type,
          service_address,
          customer_name,
          customer_email,
          preferred_date,
          started_at,
          completed_at,
          price,
          landscaper_id,
          rejection_reason
        `)
        .eq('status', 'completed_pending_review')
        .order('completed_at', { ascending: false });

      if (jobsError) throw jobsError;

      if (!jobsData || jobsData.length === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }

      // Fetch photos for all jobs
      const jobIds = jobsData.map(j => j.id);
      const { data: photosData, error: photosError } = await supabase
        .from('job_photos')
        .select('id, job_id, file_url, type, uploaded_at, caption')
        .in('job_id', jobIds)
        .order('uploaded_at', { ascending: true });

      if (photosError) {
        console.warn('[AdminJobCompletionReview] Error fetching photos:', photosError);
      }

      // Fetch landscaper info
      const landscaperIds = [...new Set(jobsData.map(j => j.landscaper_id).filter(Boolean))];
      let landscaperMap = new Map<string, { name: string; email: string }>();
      
      if (landscaperIds.length > 0) {
        const { data: landscapers } = await supabase
          .from('landscapers')
          .select('id, first_name, last_name, email')
          .in('id', landscaperIds);

        if (landscapers) {
          landscaperMap = new Map(
            landscapers.map(l => [
              l.id, 
              { name: `${l.first_name} ${l.last_name}`, email: l.email || '' }
            ])
          );
        }
      }

      // Combine data
      const jobsWithDetails: JobPendingReview[] = jobsData.map(job => {
        const jobPhotos = (photosData || [])
          .filter(p => p.job_id === job.id)
          .map(p => ({
            id: p.id,
            job_id: p.job_id,
            file_url: p.file_url,
            type: p.type as 'before' | 'after',
            uploaded_at: p.uploaded_at,
            caption: p.caption
          }));

        const landscaperInfo = job.landscaper_id ? landscaperMap.get(job.landscaper_id) : null;

        return {
          ...job,
          photos: jobPhotos,
          landscaper_name: landscaperInfo?.name,
          landscaper_email: landscaperInfo?.email
        };
      });

      setJobs(jobsWithDetails);
    } catch (err) {
      console.error('[AdminJobCompletionReview] Error:', err);
      toast({
        title: 'Error',
        description: 'Failed to load pending review jobs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPendingReviewJobs();
  }, [fetchPendingReviewJobs]);

  const handleApprove = async (jobId: string) => {
    setActionLoading(jobId);
    try {
      const { data, error } = await supabase.functions.invoke('job-execution', {
        body: {
          action: 'admin_approve',
          jobId
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to approve job');

      toast({
        title: 'Job Approved',
        description: 'The job has been marked as completed.',
      });

      // Remove from list
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (err: any) {
      console.error('[AdminJobCompletionReview] Approve error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to approve job',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (jobId: string) => {
    const reason = rejectionReasons[jobId]?.trim();
    if (!reason) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejecting this job.',
        variant: 'destructive'
      });
      return;
    }

    setActionLoading(jobId);
    try {
      const { data, error } = await supabase.functions.invoke('job-execution', {
        body: {
          action: 'admin_reject',
          jobId,
          rejectionReason: reason
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to reject job');

      toast({
        title: 'Job Rejected',
        description: 'The job has been returned to the landscaper for corrections.',
      });

      // Remove from list and clear reason
      setJobs(prev => prev.filter(j => j.id !== jobId));
      setRejectionReasons(prev => {
        const updated = { ...prev };
        delete updated[jobId];
        return updated;
      });
    } catch (err: any) {
      console.error('[AdminJobCompletionReview] Reject error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to reject job',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpand = (jobId: string) => {
    setExpandedJobId(prev => prev === jobId ? null : jobId);
  };

  if (loading) {
    return (
      <Card className={`bg-slate-900/50 border-slate-700/50 ${className}`}>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-emerald-300/70">Loading pending reviews...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-emerald-300 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Job Completion Review
              {jobs.length > 0 && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 ml-2">
                  {jobs.length} Pending
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPendingReviewJobs}
              disabled={loading}
              className="border-slate-600"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">
            Review completed jobs before final approval. Verify photos show work was completed satisfactorily.
          </p>
        </CardContent>
      </Card>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
            <p className="text-emerald-300">No jobs pending review</p>
            <p className="text-sm text-slate-500 mt-1">
              All completed jobs have been reviewed
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => {
            const isExpanded = expandedJobId === job.id;
            const photoGroups = groupPhotosByType(job.photos);
            const isProcessing = actionLoading === job.id;

            return (
              <Card 
                key={job.id} 
                className="bg-slate-900/50 border-slate-700/50 overflow-hidden"
              >
                {/* Job Header - Always Visible */}
                <div 
                  className="p-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => toggleExpand(job.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-semibold text-white truncate">
                          {job.service_name || job.service_type || 'Service'}
                        </h3>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                          Pending Review
                        </Badge>
                        {job.rejection_reason && (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                            Previously Rejected
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {job.customer_name}
                        </span>
                        {job.landscaper_name && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <User className="w-4 h-4" />
                            {job.landscaper_name}
                          </span>
                        )}
                        {job.service_address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate max-w-[200px]">{job.service_address}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                        {job.started_at && (
                          <span>Started: {formatDate(job.started_at)}</span>
                        )}
                        {job.completed_at && (
                          <span>Submitted: {formatDate(job.completed_at)}</span>
                        )}
                        {job.price && (
                          <span className="text-emerald-400">${job.price.toFixed(2)}</span>
                        )}
                      </div>
                    </div>

                    {/* Photo Count & Expand Button */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Camera className="w-4 h-4 text-slate-400" />
                        <span className="text-amber-300">{photoGroups.before.length}B</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-emerald-300">{photoGroups.after.length}A</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-700/50">
                    {/* Previous Rejection Warning */}
                    {job.rejection_reason && (
                      <div className="p-4 bg-red-500/10 border-b border-red-500/20">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-300">Previously Rejected</p>
                            <p className="text-sm text-red-300/70 mt-1">{job.rejection_reason}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Photo Comparison */}
                    <div className="p-4">
                      {job.photos.length > 0 ? (
                        <BeforeAfterComparison 
                          photos={job.photos}
                          showTimestamps={true}
                          title="Work Documentation"
                        />
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No photos uploaded</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 bg-slate-800/30 border-t border-slate-700/50 space-y-4">
                      {/* Rejection Reason Input */}
                      <div>
                        <label className="block text-xs text-slate-400 mb-2">
                          Rejection Reason (required if rejecting)
                        </label>
                        <Textarea
                          placeholder="Explain why the job is being rejected and what needs to be fixed..."
                          value={rejectionReasons[job.id] || ''}
                          onChange={(e) => setRejectionReasons(prev => ({
                            ...prev,
                            [job.id]: e.target.value
                          }))}
                          className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 resize-none"
                          rows={2}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(job.id)}
                          disabled={isProcessing}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Approve & Complete
                        </Button>
                        <Button
                          onClick={() => handleReject(job.id)}
                          disabled={isProcessing || !rejectionReasons[job.id]?.trim()}
                          variant="outline"
                          className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          Reject & Return
                        </Button>
                      </div>

                      <p className="text-xs text-slate-500 text-center">
                        Approving will mark the job as completed. Rejecting will return it to the landscaper for corrections.
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
