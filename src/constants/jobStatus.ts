/**
 * ============================================================================
 * CANONICAL JOB STATUS CONSTANTS — SINGLE SOURCE OF TRUTH
 * ============================================================================
 *
 * This file defines the FROZEN, AUTHORITATIVE list of all valid job status
 * values in the GreenScape Lux system.
 *
 * ALL components, dashboards, filters, lifecycle logic, and admin tools
 * MUST import from this file. DO NOT hardcode status strings elsewhere.
 *
 * DO NOT add new statuses without a migration plan.
 * DO NOT remove statuses without verifying zero database references.
 * DO NOT modify the enum definition or database schema.
 *
 * ============================================================================
 */

export const JOB_STATUS_VALUES = [
  "pending",
  "quoted",
  "priced",
  "available",
  "assigned",
  "scheduled",
  "active",
  "pending_review",
  "completed",
  "completed_pending_review",
  "completion_flagged",
  "flagged_review",
  "blocked",
  "cancelled",
  "rescheduled"
] as const;


/**
 * Union type derived from JOB_STATUS_VALUES.
 * Use this to type any variable, prop, or parameter that holds a job status.
 */
export type JobStatus = typeof JOB_STATUS_VALUES[number];

/**
 * Human-readable display labels for each status.
 * Used in dropdowns, badges, and admin UI.
 */
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending:                    'Pending',
  quoted:                     'Quoted',
  priced:                     'Priced',
  available:                  'Available',
  assigned:                   'Assigned',
  scheduled:                  'Scheduled',
  active:                     'Active',
  pending_review:             'Pending Review',
  completed:                  'Completed',
  completed_pending_review:   'Completed — Pending Review',
  completion_flagged:         'Flagged — Completion',
  flagged_review:             'Flagged for Review',
  blocked:                    'Blocked',
  cancelled:                  'Cancelled',
  rescheduled:                'Rescheduled',
};


/**
 * Type guard: checks whether an unknown string is a valid JobStatus.
 */
export function isValidJobStatus(value: unknown): value is JobStatus {
  return typeof value === 'string' && (JOB_STATUS_VALUES as readonly string[]).includes(value);
}

/**
 * Safe cast: returns the value as JobStatus if valid, otherwise null.
 * Use this before passing user/form input to the RPC layer.
 */
export function toJobStatus(value: unknown): JobStatus | null {
  return isValidJobStatus(value) ? value : null;
}


// ============================================================================
// CLIENT-FACING STAGE MAPPING — STATUS-FIRST, NO COLUMN INFERENCE
// ============================================================================
//
// Every client-facing component (stepper, badge, card, filter) MUST use this
// mapping to derive the display stage from job.status.
//
// DO NOT derive stage from priced_at, assigned_to, completed_at, or any other
// column. The status field is the single source of truth.
// ============================================================================

/**
 * Client-visible lifecycle stages.
 * These are the 5 stages shown in the stepper + 2 special states.
 */
export const CLIENT_STAGES = [
  'under_review',
  'estimate_ready',
  'scheduled',
  'active',
  'completed',
  'cancelled',
] as const;

export type ClientStage = typeof CLIENT_STAGES[number];

/**
 * Pure status → client stage mapping.
 *
 * If job.status = 'active'  → stage = 'active'
 * If job.status = 'pending' → stage = 'under_review'
 *
 * This is the ONLY function client components should call to determine
 * which stage to render. No column-based fallback.
 */
export function deriveClientStage(status: string | null | undefined): ClientStage {
  switch (status) {
    case 'pending':
    case 'quoted':
      return 'under_review';

    case 'priced':
      return 'estimate_ready';

    case 'available':
    case 'scheduled':
    case 'rescheduled':
      return 'scheduled';

    case 'assigned':
      return 'scheduled';

    case 'active':
    case 'completed_pending_review':
    case 'pending_review':
      return 'active';

    case 'completed':
      return 'completed';

    case 'flagged_review':
    case 'blocked':
      return 'under_review';

    case 'cancelled':
      return 'cancelled';

    default:
      return 'under_review';
  }
}

/**
 * Client-friendly labels for each client stage.
 */
export const CLIENT_STAGE_LABELS: Record<ClientStage, string> = {
  under_review:   'Under Review',
  estimate_ready: 'Estimate Ready',
  scheduled:      'Scheduled',
  active:         'In Progress',
  completed:      'Completed',
  cancelled:      'Cancelled',
};

/**
 * Ordered stepper stages (the 5 shown in the timeline).
 * Cancelled is handled separately (not a step in the linear flow).
 */
export const CLIENT_STEPPER_STAGES: {
  stage: ClientStage;
  label: string;
  description: string;
}[] = [
  { stage: 'under_review',   label: 'Under Review',    description: 'Our team is reviewing your request' },
  { stage: 'estimate_ready', label: 'Estimate Ready',  description: 'Your estimate is ready for review' },
  { stage: 'scheduled',      label: 'Scheduled',       description: 'Payment confirmed, service scheduled' },
  { stage: 'active',         label: 'In Progress',     description: 'Work is being performed' },
  { stage: 'completed',      label: 'Completed',       description: 'Service complete' },
];

/**
 * Returns the 0-based index into CLIENT_STEPPER_STAGES for the given status.
 * Returns -1 for cancelled/unknown (special handling required).
 */
export function deriveClientStepIndex(status: string | null | undefined): number {
  const stage = deriveClientStage(status);
  if (stage === 'cancelled') return -1;
  const idx = CLIENT_STEPPER_STAGES.findIndex(s => s.stage === stage);
  return idx >= 0 ? idx : 0;
}
