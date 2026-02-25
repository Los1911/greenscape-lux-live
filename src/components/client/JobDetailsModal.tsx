import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  MessageCircle, 
  Lock, 
  Clock, 
  Camera,
  Loader2,
  User,
  CheckCircle2,
  Circle,
  AlertCircle,
  CreditCard,
  ChevronRight,
  ArrowRight,
  XCircle
} from 'lucide-react';
import { Job } from '@/types/job';
import { JobPhoto } from '@/types/jobPhoto';
import { StructuredJobMessaging } from '@/components/messaging/StructuredJobMessaging';
import BeforeAfterComparison from '@/components/photos/BeforeAfterComparison';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  deriveClientStage,
  deriveClientStepIndex,
  CLIENT_STEPPER_STAGES,
  CLIENT_STAGE_LABELS,
  type ClientStage,
} from '@/constants/jobStatus';


interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onJobStatusChange?: (jobId: string, newStatus: string) => void;
}


// ── Job Progress Timeline — PURELY STATUS-DRIVEN ──────────────
// Uses deriveClientStepIndex() and CLIENT_STEPPER_STAGES from the
// canonical jobStatus.ts. No column-based inference.
function JobTimeline({ status }: { status: string | undefined }) {
  const currentStepIndex = deriveClientStepIndex(status);
  const clientStage = deriveClientStage(status);
  const isFlagged = status === 'flagged_review' || status === 'blocked';
  const isCancelled = clientStage === 'cancelled';
  const isAccepted = status === 'assigned';

  
  return (
    <div className="w-full py-4">
      {/* Timeline track */}
      <div className="relative flex items-center justify-between">
        {/* Background line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-700/50 -translate-y-1/2" />
        
        {/* Progress line */}
        {currentStepIndex >= 0 && (
          <div 
            className="absolute left-0 top-1/2 h-0.5 bg-emerald-500/60 -translate-y-1/2 transition-all duration-500"
            style={{ 
              width: `${Math.min(100, (currentStepIndex / (CLIENT_STEPPER_STAGES.length - 1)) * 100)}%` 
            }}
          />
        )}
        
        {/* Steps — rendered from canonical CLIENT_STEPPER_STAGES */}
        {CLIENT_STEPPER_STAGES.map((step, index) => {
          const isCompleted = currentStepIndex >= 0 && index < currentStepIndex;
          const isCurrent = currentStepIndex >= 0 && index === currentStepIndex;
          
          return (
            <div key={step.stage} className="relative flex flex-col items-center z-10">
              {/* Step indicator */}
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                  ${isCompleted 
                    ? 'bg-emerald-500/30 border-2 border-emerald-500' 
                    : isCurrent 
                      ? 'bg-emerald-500/20 border-2 border-emerald-400 ring-4 ring-emerald-500/20' 
                      : 'bg-slate-800/80 border-2 border-slate-600/50'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Circle className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                ) : (
                  <Circle className="w-3 h-3 text-slate-500" />
                )}
              </div>
              
              {/* Step label */}
              <span 
                className={`
                  mt-2 text-xs font-medium text-center whitespace-nowrap
                  ${isCompleted 
                    ? 'text-emerald-400/80' 
                    : isCurrent 
                      ? 'text-emerald-300' 
                      : 'text-slate-500'
                  }
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Accepted = payment in progress indicator */}
      {isAccepted && (
        <div className="mt-4 flex items-center justify-center gap-2 text-blue-400/80">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs font-medium">Payment processing — awaiting confirmation</span>
        </div>
      )}
      
      {/* Issue indicator (shown separately if flagged/blocked) */}
      {isFlagged && (
        <div className="mt-4 flex items-center justify-center gap-2 text-amber-400/80">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-medium">Issue Being Addressed</span>
        </div>
      )}
      
      {/* Cancelled indicator */}
      {isCancelled && (
        <div className="mt-4 flex items-center justify-center gap-2 text-slate-400">
          <XCircle className="w-4 h-4" />
          <span className="text-xs font-medium">Cancelled</span>
        </div>
      )}
    </div>
  );
}


// Job Details Card Component
function JobDetailsCard({ job }: { job: Job }) {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Date TBD';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch { 
      return dateString; 
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 space-y-4">
      {/* Date */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Calendar className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Scheduled</p>
          <p className="text-sm text-white font-medium mt-0.5">
            {formatDate(job.preferred_date)}
          </p>
        </div>
      </div>
      
      {/* Address */}
      {job.service_address && (
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Location</p>
            <p className="text-sm text-white font-medium mt-0.5 break-words">
              {job.service_address}
            </p>
          </div>
        </div>
      )}
      
      {/* Price */}
      {job.price != null && (
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              {job.status === 'priced' ? 'Estimate' : 'Service Cost'}
            </p>
            <p className="text-lg text-emerald-300 font-semibold mt-0.5">
              ${Number(job.price).toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Landscaper Info Component
function LandscaperInfo({ landscaperId }: { landscaperId: string | null | undefined }) {
  const [landscaper, setLandscaper] = useState<{
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!landscaperId) return;
    
    setLoading(true);
    supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('id', landscaperId)
      .single()
      .then(({ data }) => {
        setLandscaper(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [landscaperId]);

  if (!landscaperId) return null;
  
  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-16 bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const displayName = landscaper?.first_name 
    ? `${landscaper.first_name} ${landscaper.last_name || ''}`.trim()
    : 'Your Landscaper';

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Assigned Professional</p>
      <div className="flex items-center gap-3">
        {landscaper?.avatar_url ? (
          <img 
            src={landscaper.avatar_url} 
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/30"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500/30 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{displayName}</p>
          <p className="text-xs text-emerald-400/70">GreenScape Professional</p>
        </div>
      </div>
    </div>
  );
}

// Photos Section Component
function PhotosSection({ 
  photos, 
  loading, 
  jobStatus 
}: { 
  photos: JobPhoto[]; 
  loading: boolean;
  jobStatus: string | undefined;
}) {
  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
        <div className="text-center">
          <p className="text-sm text-slate-400">No photos yet</p>
          {(jobStatus === 'active') && (

            <p className="text-xs text-slate-500 mt-1">
              Photos will appear once work is documented
            </p>
          )}
        </div>
      </div>
    );
  }


  return (
    <BeforeAfterComparison 
      photos={photos}
      showTimestamps={true}
      showMetadata={false}
      title="Work Documentation"
    />
  );
}

// Payment Summary Component — status-driven, no column inference
function PaymentSummary({ job }: { job: Job }) {
  if (job.price == null) return null;
  
  // Derive payment state strictly from job.status — no column checks
  const getPaymentState = () => {
    switch (job.status) {
      case 'priced':
      case 'quoted':
        return { label: 'Awaiting Decision', style: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'scheduled':
      case 'assigned':
      case 'active':
      case 'completed_pending_review':
      case 'pending_review':
        return { label: 'Paid', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'completed':
        return { label: 'Paid', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'cancelled':
        return { label: 'Cancelled', style: 'bg-slate-800/80 text-slate-400 border-slate-600/50' };
      default:
        return { label: 'Not Yet Priced', style: 'bg-slate-800/80 text-slate-400 border-slate-600/50' };
    }
  };


  const paymentState = getPaymentState();
  
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Payment</p>
            <p className="text-sm text-white font-medium mt-0.5">
              ${Number(job.price).toFixed(2)}
            </p>
          </div>
        </div>
        <Badge className={`text-xs font-medium border ${paymentState.style}`}>
          {paymentState.label}
        </Badge>
      </div>
    </div>
  );
}


// Admin Guardrail Banner Component
function AdminGuardrailBanner({ job }: { job: Job }) {
  const [isStuck, setIsStuck] = useState(false);
  
  useEffect(() => {
    if (job.status === 'assigned' && job.updated_at) {
      const updatedAt = new Date(job.updated_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
      setIsStuck(hoursDiff > 24);
    } else {
      setIsStuck(false);
    }
  }, [job.status, job.updated_at]);
  
  if (job.status === 'flagged_review') {
    return (
      <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-amber-300 font-medium">Issue Being Addressed</p>
            <p className="text-xs text-amber-200/60 mt-1">
              Your landscaper has been notified. Payment is held until resolved.
            </p>
            {job.remediation_deadline && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-200/50">
                <Clock className="w-3 h-3" />
                <span>Expected resolution by {new Date(job.remediation_deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  if (isStuck) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs">Pending update from your landscaper</span>
        </div>
      </div>
    );
  }
  
  return null;
}

// ── Main Component ────────────────────────────────────────────
export default function JobDetailsModal({ isOpen, onClose, job, onJobStatusChange }: JobDetailsModalProps) {
  const { user } = useAuth();
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [activeSection, setActiveSection] = useState<'details' | 'photos'>('details');

  // Accept/Reject state for modal actions
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch photos when job changes or modal opens
  useEffect(() => {
    if (isOpen && job?.id) {
      fetchJobPhotos();
    }
    if (isOpen) {
      setActiveSection('details');
      setActionError(null);
    }
  }, [isOpen, job?.id]);

  const fetchJobPhotos = async () => {
    if (!job?.id) return;
    
    setLoadingPhotos(true);
    try {
      const { data, error } = await supabase
        .from('job_photos')
        .select('*')
        .eq('job_id', job.id)
        .order('uploaded_at', { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (err) {
      console.error('Error fetching job photos:', err);
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };

  // ── Accept estimate from modal ──────────────────────────────
  const handleAcceptFromModal = useCallback(async () => {
    if (!job || !user?.id || actionLoading) return;

    setActionLoading(true);
    setActionError(null);

    try {
      const { data: updatedRows, error: updateErr } = await supabase
        .from('jobs')
        .update({ status: 'assigned', updated_at: new Date().toISOString() })

        .eq('id', job.id)
        .eq('status', 'priced')
        .select('id');

      if (updateErr) throw new Error('Failed to accept: ' + updateErr.message);
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error('Estimate may have already been actioned.');
      }

      // Create checkout session
      const { data: fnData, error: fnErr } = await supabase.functions.invoke(
        'create-checkout-session',
        { body: { job_id: job.id, price: job.price, client_user_id: user.id } }
      );

      if (fnErr) throw new Error('Checkout error: ' + fnErr.message);

      const parsed = typeof fnData === 'string' ? JSON.parse(fnData) : fnData;

      if (!parsed?.success || !parsed?.url) {
        // Revert
        await supabase
          .from('jobs')
          .update({ status: 'priced', updated_at: new Date().toISOString() })
          .eq('id', job.id);
        throw new Error(parsed?.error || 'No checkout URL returned');
      }

      window.location.href = parsed.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setActionError(message);
      setActionLoading(false);
    }
  }, [job, user?.id, actionLoading]);

  // ── Reject estimate from modal ──────────────────────────────
  const handleRejectFromModal = useCallback(async () => {
    if (!job || !user?.id || actionLoading) return;

    setActionLoading(true);
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
        .eq('status', 'priced')
        .select('id');

      if (updateErr) throw new Error('Failed to reject: ' + updateErr.message);
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error('Estimate may have already been actioned.');
      }

      // Notify parent to update local state
      onJobStatusChange?.(job.id, 'cancelled');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  }, [job, user?.id, actionLoading, onJobStatusChange]);

  // ── Derived state — status-driven via deriveClientStage() ──
  const clientStage = deriveClientStage(job?.status);

  const canMessage = useMemo(() => {
    if (!job?.status) return false;
    const stage = deriveClientStage(job.status);
    // Messaging available when active or completed
    return stage === 'active' || stage === 'completed';
  }, [job?.status]);

  const isMessagingActive = useMemo(() => {
    if (!job?.status) return false;
    const stage = deriveClientStage(job.status);
    return stage === 'in_progress';
  }, [job?.status]);

  const hasPhotos = photos.length > 0;
  const showPhotosSection = useMemo(() => {
    if (!job?.status) return false;
    const stage = deriveClientStage(job.status);
    return stage === 'completed' || stage === 'in_progress' || hasPhotos;
  }, [job?.status, hasPhotos]);


  const hasLandscaper = !!job?.landscaper_id;
  const isPriced = job?.status === 'priced';

  // Status badge styling — uses deriveClientStage() for label, status for fine-grained color
  const getStatusConfig = (status: string | undefined) => {
    const stage = deriveClientStage(status);
    switch (status) {
      case 'pending':
      case 'quoted':
        return { 
          label: CLIENT_STAGE_LABELS[stage], 
          className: 'bg-slate-800/80 text-slate-300 border-slate-600/50' 
        };
      case 'priced':
        return {
          label: CLIENT_STAGE_LABELS[stage],
          className: 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30'
        };
      case 'available':

      case 'scheduled':
      case 'rescheduled':
        return {
          label: CLIENT_STAGE_LABELS[stage],
          className: 'bg-blue-900/30 text-blue-300 border-blue-500/30'
        };
      case 'assigned':
      case 'active':
      case 'pending_review':
      case 'completed_pending_review':
        return { 
          label: CLIENT_STAGE_LABELS[stage], 
          className: 'bg-amber-900/30 text-amber-300 border-amber-500/30' 
        };
      case 'completed':
        return { 
          label: CLIENT_STAGE_LABELS[stage], 
          className: 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30' 
        };
      case 'cancelled':
        return { 
          label: CLIENT_STAGE_LABELS[stage], 
          className: 'bg-slate-800/80 text-slate-400 border-slate-600/50' 
        };
      case 'flagged_review':
      case 'blocked':
        return { 
          label: CLIENT_STAGE_LABELS[stage], 
          className: 'bg-amber-900/30 text-amber-300 border-amber-500/30' 
        };
      default:
        return { 
          label: CLIENT_STAGE_LABELS[stage] || status || 'Unknown', 
          className: 'bg-slate-800/80 text-slate-400 border-slate-600/50' 
        };
    }
  };


  if (!job) return null;

  const statusConfig = getStatusConfig(job.status);

  // Custom header for the bottom sheet
  const customHeader = (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-white leading-tight">
          {job.service_name || 'Landscaping Service'}
        </h2>
        <Badge className={`${statusConfig.className} border text-xs font-medium shrink-0`}>
          {statusConfig.label}
        </Badge>
      </div>
      {job.service_type && (
        <p className="text-sm text-slate-400">{job.service_type}</p>
      )}
    </div>
  );

  return (
    <>
      <MobileBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={job.service_name || 'Job Details'}
        customHeader={customHeader}
        height="full"
      >
        <div className="space-y-4 pb-8">
          {/* Job Progress Timeline */}
          <JobTimeline status={job.status} />
          
          {/* Admin Guardrail Banner */}
          <AdminGuardrailBanner job={job} />

          {/* ── Priced: Accept / Reject action block ─────── */}
          {isPriced && job.price != null && (
            <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900/60 border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Your Estimate</p>
                  <p className="text-xs text-slate-400 mt-0.5">Review and decide</p>
                </div>
                <p className="text-xl font-bold text-emerald-300">
                  ${Number(job.price).toFixed(2)}
                </p>
              </div>

              {actionError && (
                <div className="p-2.5 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAcceptFromModal}
                  disabled={actionLoading}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold
                    transition-all duration-200
                    ${actionLoading
                      ? 'bg-emerald-700/50 text-emerald-300 cursor-wait'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black shadow-lg shadow-emerald-500/25'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Accept & Pay</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  onClick={handleRejectFromModal}
                  disabled={actionLoading}
                  className="px-4 py-3 rounded-xl text-sm font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
          
          {/* Section Toggle (Details / Photos) */}
          {showPhotosSection && (
            <div className="flex gap-2 p-1 bg-slate-900/60 rounded-xl border border-slate-700/50">
              <button
                onClick={() => setActiveSection('details')}
                className={`
                  flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200
                  ${activeSection === 'details'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-300'
                  }
                `}
              >
                Details
              </button>
              <button
                onClick={() => setActiveSection('photos')}
                className={`
                  flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2
                  ${activeSection === 'photos'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-300'
                  }
                `}
              >
                <Camera className="w-4 h-4" />
                Photos
                {hasPhotos && (
                  <span className="text-xs bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-full">
                    {photos.length}
                  </span>
                )}
              </button>
            </div>
          )}
          
          {/* Details Section */}
          {activeSection === 'details' && (
            <div className="space-y-4">
              {/* Job Details Card */}
              <JobDetailsCard job={job} />
              
              {/* Landscaper Info */}
              {hasLandscaper && (
                <LandscaperInfo landscaperId={job.landscaper_id} />
              )}
              
              {/* Messaging Entry Point */}
              {canMessage ? (
                <button
                  onClick={() => setMessagingOpen(true)}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-white font-medium">
                        {isMessagingActive ? 'Message Landscaper' : 'View Messages'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {isMessagingActive 
                          ? 'Ask questions or provide access details' 
                          : 'View conversation history'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isMessagingActive && (
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </button>
              ) : job.status !== 'cancelled' && job.status !== 'priced' && (
                <div className="bg-slate-900/40 border border-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm">Messaging available once assigned</span>
                  </div>
                </div>
              )}
              
              {/* Payment Summary — lifecycle-aware */}
              <PaymentSummary job={job} />
            </div>
          )}
          
          {/* Photos Section */}
          {activeSection === 'photos' && showPhotosSection && (
            <PhotosSection 
              photos={photos} 
              loading={loadingPhotos}
              jobStatus={job.status}
            />
          )}
          
          {/* Thumb-safe footer spacing */}
          <div className="h-4" />
        </div>
      </MobileBottomSheet>

      {/* Structured Messaging Modal */}
      {job && (
        <StructuredJobMessaging
          jobId={job.id}
          jobStatus={job.status || 'pending'}
          isOpen={messagingOpen}
          onClose={() => setMessagingOpen(false)}
          jobTitle={job.service_name || 'Job'}
        />
      )}
    </>
  );
}
