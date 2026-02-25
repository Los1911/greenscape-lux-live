/**
 * Job Visibility Filter - Filters jobs based on landscaper tier
 * 
 * Tier-based job access:
 * - Starter: Standard jobs only
 * - Pro: Standard, large, multi-day, recurring
 * - Elite: All job types including premium and HOA contracts
 */

import { LandscaperTier, JobComplexity, TIER_JOB_ACCESS } from '@/types/job';

interface JobWithTier {
  id: string;
  min_tier_required?: LandscaperTier;
  job_complexity?: JobComplexity;
  [key: string]: any;
}

interface LandscaperWithTier {
  tier?: LandscaperTier;
  completed_jobs_count?: number;
  average_rating?: number;
  [key: string]: any;
}

/**
 * Check if a landscaper can see/accept a specific job based on tier
 */
export function canAccessJob(
  landscaper: LandscaperWithTier,
  job: JobWithTier
): boolean {
  const landscaperTier = landscaper.tier || 'starter';
  const jobComplexity = job.job_complexity || 'standard';
  const minTierRequired = job.min_tier_required || 'starter';
  
  // Check if landscaper's tier meets minimum requirement
  const tierOrder: LandscaperTier[] = ['starter', 'pro', 'elite'];
  const landscaperTierIndex = tierOrder.indexOf(landscaperTier);
  const requiredTierIndex = tierOrder.indexOf(minTierRequired);
  
  if (landscaperTierIndex < requiredTierIndex) {
    return false;
  }
  
  // Check if landscaper's tier allows this job complexity
  const allowedComplexities = TIER_JOB_ACCESS[landscaperTier];
  return allowedComplexities.includes(jobComplexity);
}

/**
 * Filter a list of jobs to only those visible to a landscaper
 */
export function filterJobsByTier<T extends JobWithTier>(
  jobs: T[],
  landscaper: LandscaperWithTier
): T[] {
  return jobs.filter(job => canAccessJob(landscaper, job));
}

/**
 * Get the reason why a job is not accessible
 */
export function getAccessDeniedReason(
  landscaper: LandscaperWithTier,
  job: JobWithTier
): string | null {
  const landscaperTier = landscaper.tier || 'starter';
  const jobComplexity = job.job_complexity || 'standard';
  const minTierRequired = job.min_tier_required || 'starter';
  
  const tierOrder: LandscaperTier[] = ['starter', 'pro', 'elite'];
  const landscaperTierIndex = tierOrder.indexOf(landscaperTier);
  const requiredTierIndex = tierOrder.indexOf(minTierRequired);
  
  if (landscaperTierIndex < requiredTierIndex) {
    return `This job requires ${minTierRequired.toUpperCase()} tier or higher.`;
  }
  
  const allowedComplexities = TIER_JOB_ACCESS[landscaperTier];
  if (!allowedComplexities.includes(jobComplexity)) {
    return `${jobComplexity.replace('_', ' ')} jobs require a higher tier.`;
  }
  
  return null;
}

/**
 * Calculate what tier a landscaper should be based on their stats
 */
export function calculateRecommendedTier(landscaper: LandscaperWithTier): LandscaperTier {
  const jobs = landscaper.completed_jobs_count || 0;
  const rating = landscaper.average_rating || 0;
  
  // Elite: 50+ jobs, 4.5+ rating
  if (jobs >= 50 && rating >= 4.5) {
    return 'elite';
  }
  
  // Pro: 15+ jobs, 4.0+ rating
  if (jobs >= 15 && rating >= 4.0) {
    return 'pro';
  }
  
  return 'starter';
}
