import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Calendar, DollarSign, CheckCircle, XCircle, RefreshCw, Lock, Shield } from "lucide-react";
import { 
  jobRequiresInsurance, 
  landscaperHasVerifiedInsurance,
  canLandscaperAcceptJob,
  INSURANCE_REQUIRED_ERROR 
} from "@/lib/insuranceRequirements";
import { InsuranceRequiredBadge, InsuranceRequiredBanner, LockedJobOverlay } from "@/components/landscaper/InsuranceRequiredBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Job {
  id: string;
  service_type: string;
  service_name?: string;
  service_address?: string;
  preferred_date?: string;
  status: string;
  price?: number;
  is_available: boolean;
  assigned_to?: string;
  created_at: string;
  selected_services?: string[];
}



export default function AvailableJobs() {
  const [isApproved, setIsApproved] = useState(true);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [landscaperProfile, setLandscaperProfile] = useState<any>(null);
  const [hasInsurance, setHasInsurance] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkApprovalAndLoadJobs = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Load landscaper profile including insurance_verified
          const { data: landscaper } = await supabase
            .from('landscapers')
            .select('id, user_id, business_name, approved, insurance_verified')
            .eq('user_id', user.id)
            .maybeSingle();
          
          const approved = landscaper?.approved || false;
          const insuranceVerified = landscaperHasVerifiedInsurance(landscaper || {});
          
          setIsApproved(approved);
          setLandscaperProfile(landscaper);
          setHasInsurance(insuranceVerified);

          if (approved) {
            await loadAvailableJobs();
          }
        }
      } catch (error) {
        console.error('Error checking approval:', error);
      } finally {
        setLoading(false);
      }
    };
    checkApprovalAndLoadJobs();
  }, []);

  const loadAvailableJobs = async () => {
    try {
      // Query jobs where: status='available', is_available=true, assigned_to IS NULL
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'available')
        .eq('is_available', true)
        .is('assigned_to', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load available jobs",
        variant: "destructive"
      });
    }
  };

  const handleAcceptJob = async (jobId: string) => {
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

    setActionLoading(jobId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!landscaperProfile) throw new Error('Landscaper profile not found');

      // Backend validation - call edge function to verify insurance
      const { data: validationResult, error: validationError } = await supabase.functions.invoke(
        'validate-job-acceptance',
        { body: { jobId, landscaperId: user.id } }
      );

      if (validationError) {
        console.error('[AvailableJobs] Validation error:', validationError);
        throw new Error('Failed to validate job acceptance');
      }

      if (!validationResult?.success) {
        throw new Error(validationResult?.error || INSURANCE_REQUIRED_ERROR);
      }

      // Build update payload with ALL required fields
      const updatePayload: Record<string, any> = {
        status: 'assigned',
        is_available: false,
        assigned_to: user.id,
        landscaper_id: landscaperProfile.id,
      };

      // Optional fields
      if (landscaperProfile.email) {
        updatePayload.landscaper_email = landscaperProfile.email;
      }

      // CRITICAL: Explicitly remove any non-existent fields
      delete updatePayload.accepted_at;
      delete updatePayload.acceptance_date;
      delete updatePayload.accepted_by;

      console.log('[AvailableJobs] Accept Job - Final Update Payload:', {
        jobId,
        updatePayload,
        authUserId: user.id,
        landscaperProfileId: landscaperProfile.id,
        fieldsIncluded: Object.keys(updatePayload),
      });

      const { data, error: updateError } = await supabase
        .from('jobs')
        .update(updatePayload)
        .eq('id', jobId)
        .select();

      console.log('[AvailableJobs] Accept Job - Supabase Response:', {
        success: !updateError,
        data,
        error: updateError,
        jobId,
      });

      if (updateError) throw updateError;

      // Remove job from local state
      setJobs(prev => prev.filter(j => j.id !== jobId));
      
      toast({
        title: "Job Accepted!",
        description: "You have successfully accepted this job.",
      });

    } catch (error: any) {
      console.error('[AvailableJobs] Error accepting job:', error);
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
    setActionLoading(jobId);
    try {
      // For decline, just remove from local view - job stays available for others
      setJobs(prev => prev.filter(j => j.id !== jobId));
      
      toast({
        title: "Job Declined",
        description: "The job remains available for other landscapers.",
      });

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

  if (loading) return <div className="text-emerald-300/70">Loading...</div>;

  // Separate jobs into accessible and insurance-locked
  const accessibleJobs = jobs.filter(job => !jobRequiresInsurance(job) || hasInsurance);
  const lockedJobs = jobs.filter(job => jobRequiresInsurance(job) && !hasInsurance);
  const hasLockedJobs = lockedJobs.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
        </svg>
        <h3 className="text-lg font-semibold text-white">Available Jobs</h3>
        {jobs.length > 0 && (
          <span className="bg-emerald-600 text-white px-2 py-1 rounded-full text-xs">
            {accessibleJobs.length}{hasLockedJobs ? ` (+${lockedJobs.length} locked)` : ''}
          </span>
        )}
      </div>

      {/* Insurance banner for landscapers without verified insurance */}
      {hasLockedJobs && (
        <InsuranceRequiredBanner 
          className="mb-4"
          onUploadClick={() => {
            // Navigate to documents upload
            window.location.href = '/landscaper/profile?tab=documents';
          }}
        />
      )}
      
      {!isApproved ? (
        <div className="text-gray-400">Account approval required to view jobs.</div>
      ) : jobs.length === 0 ? (
        <div className="text-gray-400">No available jobs at the moment.</div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {/* Accessible Jobs */}
          {accessibleJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onAccept={handleAcceptJob}
              onDecline={handleDeclineJob}
              actionLoading={actionLoading}
              requiresInsurance={jobRequiresInsurance(job)}
              isLocked={false}
            />
          ))}

          {/* Locked Jobs (shown in disabled state) */}
          {lockedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onAccept={handleAcceptJob}
              onDecline={handleDeclineJob}
              actionLoading={actionLoading}
              requiresInsurance={true}
              isLocked={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface JobCardProps {
  job: Job;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  actionLoading: string | null;
  requiresInsurance: boolean;
  isLocked: boolean;
}

function JobCard({ job, onAccept, onDecline, actionLoading, requiresInsurance, isLocked }: JobCardProps) {
  return (
    <div
      className={`relative bg-black/40 border rounded-xl p-4 space-y-3 transition-all ${
        isLocked 
          ? 'border-amber-500/30 opacity-75' 
          : 'border-emerald-500/25'
      }`}
    >
      {/* Locked overlay */}
      {isLocked && <LockedJobOverlay />}

      {/* Job Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-300 text-xs font-medium">
              Available
            </span>
            {requiresInsurance && (
              <InsuranceRequiredBadge variant="badge" />
            )}
          </div>
          <h4 className="text-white font-semibold mt-2">
            {job.service_type || job.service_name || 'Service'}
          </h4>
        </div>
        {job.price && job.price > 0 && (
          <span className="text-emerald-400 font-bold">${job.price.toFixed(2)}</span>
        )}
      </div>

      {/* Job Details */}
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>{job.service_address || 'No address'}</span>
        </div>

        {job.preferred_date && (
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>{new Date(job.preferred_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* NOTE: 'comments' column does NOT exist on jobs table (42703). Removed. */}


      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        {isLocked ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  disabled
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-700 text-gray-500 font-medium text-sm cursor-not-allowed"
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
              disabled={actionLoading === job.id}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-medium text-sm transition-all disabled:opacity-50"
            >
              {actionLoading === job.id ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Accept
            </button>
            <button
              onClick={() => onDecline(job.id)}
              disabled={actionLoading === job.id}
              className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-all disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

