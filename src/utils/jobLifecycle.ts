/**
 * Job Lifecycle Derivation Utility
 * 
 * AUTHORITATIVE SOURCE for determining job lifecycle stage.
 * Uses ONLY real database columns from the jobs table.
 * 
 * This function is the single source of truth for lifecycle derivation.
 * All components (AdminJobsPanel, lifecycle cards, All Jobs table) must use this.
 */

/**
 * Lifecycle stages returned by deriveLifecycle()
 */
export type JobLifecycleStage = 
  | 'needs_pricing'
  | 'scheduled'
  | 'active'
  | 'completed'
  | 'unclassified';

/**
 * Minimal job shape required for lifecycle derivation.
 * Uses ONLY columns that exist in the jobs table.
 */
export interface JobForLifecycle {
  price: number | null;
  priced_at: string | null;
  assigned_to: string | null;
  completed_at: string | null;
}

/**
 * Derives the lifecycle stage of a job based on database columns.
 * 
 * AUTHORITATIVE RULES (evaluated in order):
 * 1. If completed_at IS NOT NULL → 'completed'
 * 2. Else if assigned_to IS NOT NULL → 'active'
 * 3. Else if priced_at IS NOT NULL AND assigned_to IS NULL → 'scheduled'
 * 4. Else if price IS NULL OR priced_at IS NULL → 'needs_pricing'
 * 5. Else → 'unclassified'
 * 
 * @param job - Job object with lifecycle-relevant columns
 * @returns The derived lifecycle stage
 */
export function deriveLifecycle(job: JobForLifecycle): JobLifecycleStage {
  // Rule 1: Job is completed
  if (job.completed_at !== null) {
    return 'completed';
  }

  // Rule 2: Job is active (assigned but not completed)
  if (job.assigned_to !== null) {
    return 'active';
  }

  // Rule 3: Job is scheduled (priced but not assigned)
  if (job.priced_at !== null && job.assigned_to === null) {
    return 'scheduled';
  }

  // Rule 4: Job needs pricing (no price or not priced_at timestamp)
  if (job.price === null || job.priced_at === null) {
    return 'needs_pricing';
  }

  // Rule 5: Fallback for any edge case
  return 'unclassified';
}

/**
 * Human-readable labels for lifecycle stages.
 * For display purposes only.
 */
export const LIFECYCLE_LABELS: Record<JobLifecycleStage, string> = {
  needs_pricing: 'Needs Pricing',
  scheduled: 'Scheduled',
  active: 'Active',
  completed: 'Completed',
  unclassified: 'Unclassified',
};

/**
 * Returns a human-readable label for a lifecycle stage.
 * 
 * @param stage - The lifecycle stage
 * @returns Human-readable label
 */
export function getLifecycleLabel(stage: JobLifecycleStage): string {
  return LIFECYCLE_LABELS[stage];
}
