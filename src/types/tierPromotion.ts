/**
 * Tier Promotion Types
 * 
 * Types for automatic tier qualification checks and admin approval workflow
 */

import { LandscaperTier, TIER_REQUIREMENTS } from './job';

/**
 * Promotion status values
 */
export type PromotionStatus = 'pending' | 'approved' | 'deferred' | 'denied';

/**
 * Promotion action types for history
 */
export type PromotionAction = 'promoted' | 'deferred' | 'denied' | 'auto_eligible';

/**
 * Tier promotion record
 */
export interface TierPromotion {
  id: string;
  landscaper_id: string;
  current_tier: LandscaperTier;
  eligible_tier: LandscaperTier;
  status: PromotionStatus;
  
  // Qualification metrics
  completed_jobs_count: number;
  average_rating: number;
  on_time_percentage: number | null;
  flagged_jobs_count: number;
  insurance_verified: boolean;
  
  // Admin action
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  denial_reason: string | null;
  
  // Timestamps
  eligible_at: string;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  landscaper?: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    tier: LandscaperTier;
    insurance_file?: string | null;
  };
}

/**
 * Promotion history record
 */
export interface PromotionHistory {
  id: string;
  landscaper_id: string;
  promotion_id: string | null;
  from_tier: LandscaperTier;
  to_tier: LandscaperTier;
  action: PromotionAction;
  action_by: string | null;
  action_by_type: 'system' | 'admin';
  notes: string | null;
  metrics_snapshot: QualificationMetrics | null;
  created_at: string;
}

/**
 * Qualification metrics snapshot
 */
export interface QualificationMetrics {
  completed_jobs_count: number;
  average_rating: number;
  on_time_percentage: number | null;
  flagged_jobs_count: number;
  insurance_verified: boolean;
  reliability_score?: number;
}

/**
 * Eligibility check result
 */
export interface EligibilityResult {
  eligible: boolean;
  currentTier: LandscaperTier;
  eligibleTier: LandscaperTier | null;
  metrics: QualificationMetrics;
  missingRequirements: string[];
  meetsAllRequirements: boolean;
}

/**
 * Admin promotion action request
 */
export interface PromotionActionRequest {
  promotionId: string;
  action: 'approve' | 'defer' | 'deny';
  notes?: string;
  denialReason?: string;
}

/**
 * Promotion queue statistics
 */
export interface PromotionQueueStats {
  pending: number;
  approved: number;
  deferred: number;
  denied: number;
  byTier: {
    pro: number;
    elite: number;
  };
}

/**
 * Landscaper eligibility status for dashboard display
 */
export interface LandscaperEligibilityStatus {
  hasPromotion: boolean;
  promotion: TierPromotion | null;
  currentTier: LandscaperTier;
  eligibleTier: LandscaperTier | null;
  status: PromotionStatus | 'not_eligible' | 'at_max_tier';
  statusMessage: string;
  progress: TierProgress;
}

/**
 * Progress towards next tier
 */
export interface TierProgress {
  nextTier: LandscaperTier | null;
  requirements: {
    jobs: { current: number; required: number; met: boolean };
    rating: { current: number; required: number; met: boolean };
    insurance: { verified: boolean; required: boolean; met: boolean };
  };
  overallProgress: number; // 0-100
}

/**
 * Check if a landscaper meets tier requirements
 */
export function checkTierEligibility(
  currentTier: LandscaperTier,
  metrics: QualificationMetrics
): EligibilityResult {
  const tierOrder: LandscaperTier[] = ['starter', 'pro', 'elite'];
  const currentIndex = tierOrder.indexOf(currentTier);
  
  // Already at max tier
  if (currentIndex >= tierOrder.length - 1) {
    return {
      eligible: false,
      currentTier,
      eligibleTier: null,
      metrics,
      missingRequirements: [],
      meetsAllRequirements: true
    };
  }
  
  const nextTier = tierOrder[currentIndex + 1];
  const requirements = TIER_REQUIREMENTS[nextTier];
  const missing: string[] = [];
  
  if (metrics.completed_jobs_count < requirements.minJobs) {
    missing.push(`${requirements.minJobs} completed jobs (have ${metrics.completed_jobs_count})`);
  }
  
  if (metrics.average_rating < requirements.minRating) {
    missing.push(`${requirements.minRating}+ rating (have ${metrics.average_rating.toFixed(1)})`);
  }
  
  if (requirements.requiresInsurance && !metrics.insurance_verified) {
    missing.push('Verified insurance');
  }
  
  // Additional checks for Elite tier
  if (nextTier === 'elite') {
    // Check on-time percentage (minimum 90%)
    if (metrics.on_time_percentage !== null && metrics.on_time_percentage < 90) {
      missing.push(`90%+ on-time rate (have ${metrics.on_time_percentage.toFixed(0)}%)`);
    }
    
    // Check flagged jobs (maximum 2 in last 90 days)
    if (metrics.flagged_jobs_count > 2) {
      missing.push(`No more than 2 flagged jobs (have ${metrics.flagged_jobs_count})`);
    }
  }
  
  return {
    eligible: missing.length === 0,
    currentTier,
    eligibleTier: missing.length === 0 ? nextTier : null,
    metrics,
    missingRequirements: missing,
    meetsAllRequirements: missing.length === 0
  };
}

/**
 * Calculate progress towards next tier
 */
export function calculateTierProgress(
  currentTier: LandscaperTier,
  metrics: QualificationMetrics
): TierProgress {
  const tierOrder: LandscaperTier[] = ['starter', 'pro', 'elite'];
  const currentIndex = tierOrder.indexOf(currentTier);
  
  // Already at max tier
  if (currentIndex >= tierOrder.length - 1) {
    return {
      nextTier: null,
      requirements: {
        jobs: { current: metrics.completed_jobs_count, required: 0, met: true },
        rating: { current: metrics.average_rating, required: 0, met: true },
        insurance: { verified: metrics.insurance_verified, required: false, met: true }
      },
      overallProgress: 100
    };
  }
  
  const nextTier = tierOrder[currentIndex + 1];
  const requirements = TIER_REQUIREMENTS[nextTier];
  
  const jobsMet = metrics.completed_jobs_count >= requirements.minJobs;
  const ratingMet = metrics.average_rating >= requirements.minRating;
  const insuranceMet = !requirements.requiresInsurance || metrics.insurance_verified;
  
  // Calculate progress percentage
  const jobsProgress = Math.min(100, (metrics.completed_jobs_count / requirements.minJobs) * 100);
  const ratingProgress = requirements.minRating > 0 
    ? Math.min(100, (metrics.average_rating / requirements.minRating) * 100)
    : 100;
  const insuranceProgress = insuranceMet ? 100 : 0;
  
  // Weight: jobs 50%, rating 30%, insurance 20%
  const overallProgress = Math.round(
    (jobsProgress * 0.5) + (ratingProgress * 0.3) + (insuranceProgress * 0.2)
  );
  
  return {
    nextTier,
    requirements: {
      jobs: { 
        current: metrics.completed_jobs_count, 
        required: requirements.minJobs, 
        met: jobsMet 
      },
      rating: { 
        current: metrics.average_rating, 
        required: requirements.minRating, 
        met: ratingMet 
      },
      insurance: { 
        verified: metrics.insurance_verified, 
        required: requirements.requiresInsurance, 
        met: insuranceMet 
      }
    },
    overallProgress
  };
}

/**
 * Get status message for landscaper dashboard
 */
export function getEligibilityStatusMessage(status: LandscaperEligibilityStatus): string {
  switch (status.status) {
    case 'pending':
      return `You're eligible for ${status.eligibleTier?.toUpperCase()} tier! Pending admin review.`;
    case 'approved':
      return `Congratulations! You've been promoted to ${status.eligibleTier?.toUpperCase()} tier.`;
    case 'deferred':
      return 'Your promotion has been deferred. Keep up the great work!';
    case 'denied':
      return 'Your promotion was not approved at this time.';
    case 'at_max_tier':
      return 'You\'ve reached the highest tier - Elite!';
    case 'not_eligible':
      return `Keep working towards ${status.progress.nextTier?.toUpperCase() || 'the next'} tier!`;
    default:
      return '';
  }
}

/**
 * Tier display configuration
 */
export const TIER_DISPLAY: Record<LandscaperTier, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  starter: {
    label: 'Starter',
    color: 'text-slate-300',
    bgColor: 'bg-slate-800/60',
    borderColor: 'border-slate-600',
    icon: 'Star'
  },
  pro: {
    label: 'Pro',
    color: 'text-emerald-300',
    bgColor: 'bg-emerald-900/40',
    borderColor: 'border-emerald-500/50',
    icon: 'Award'
  },
  elite: {
    label: 'Elite',
    color: 'text-amber-300',
    bgColor: 'bg-amber-900/40',
    borderColor: 'border-amber-500/50',
    icon: 'Crown'
  }
};
