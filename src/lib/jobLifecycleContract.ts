/**
 * ============================================================================
 * CANONICAL JOB LIFECYCLE CONTRACT
 * ============================================================================
 *
 * This file defines lifecycle transitions, dashboard bucket mappings, and
 * display configuration for the GreenScape Lux job system.
 *
 * ALL THREE DASHBOARDS (Client, Admin, Landscaper) MUST reference this file.
 *
 * STATUS VALUES are imported from src/constants/jobStatus.ts — the single
 * source of truth. DO NOT redefine status strings here.
 *
 * ============================================================================
 * STATUS FLOW (happy path):
 *
 *   pending
 *     → quoted           (AI advisory or manual quote)
 *     → priced           (admin sets baseline price)
 *     → available        (admin releases to landscaper pool)
 *     → assigned         (landscaper accepts)
 *     → active           (landscaper starts work)
 *     → completed_pending_review  (landscaper submits for review)
 *     → completed        (admin approves)
 *
 * BRANCH PATHS:
 *   active     → blocked          (landscaper cannot complete)
 *   any        → flagged_review   (admin flags for attention)
 *   any        → cancelled        (terminal)
 *   any        → rescheduled      (date change, returns to assigned/available)
 *
 * ============================================================================
 */

import {
  JOB_STATUS_VALUES,
  JOB_STATUS_LABELS,
  isValidJobStatus,
  toJobStatus,
  type JobStatus,
} from '@/constants/jobStatus';

// ── Re-export everything from the canonical constants file ──────────
export {
  JOB_STATUS_VALUES,
  JOB_STATUS_LABELS,
  isValidJobStatus,
  toJobStatus,
  type JobStatus,
};

// ---------------------------------------------------------------------------
// 1. NAMED STATUS CONSTANTS (convenience aliases)
// ---------------------------------------------------------------------------

/**
 * Named constant map for ergonomic access: JOB_STATUSES.PENDING, etc.
 * Values are derived from JOB_STATUS_VALUES — not independently defined.
 */
export const JOB_STATUSES = {
  // ── Creation & Pricing ──────────────────────────────────────────────
  PENDING:                    'pending'                   as JobStatus,
  QUOTED:                     'quoted'                    as JobStatus,
  PRICED:                     'priced'                    as JobStatus,

  // ── Assignment ──────────────────────────────────────────────────────
  AVAILABLE:                  'available'                 as JobStatus,
  ASSIGNED:                   'assigned'                  as JobStatus,
  SCHEDULED:                  'scheduled'                 as JobStatus,

  // ── Execution ───────────────────────────────────────────────────────
  ACTIVE:                     'active'                    as JobStatus,
  PENDING_REVIEW:             'pending_review'            as JobStatus,
  COMPLETED_PENDING_REVIEW:   'completed_pending_review'  as JobStatus,
  COMPLETED:                  'completed'                 as JobStatus,

  // ── Exception paths ─────────────────────────────────────────────────
  COMPLETION_FLAGGED:         'completion_flagged'        as JobStatus,
  FLAGGED_REVIEW:             'flagged_review'            as JobStatus,
  BLOCKED:                    'blocked'                   as JobStatus,
  CANCELLED:                  'cancelled'                 as JobStatus,
  RESCHEDULED:                'rescheduled'               as JobStatus,

  // ── Legacy aliases (for backward compatibility during migration) ────
  /** @deprecated Use ACTIVE */
  IN_PROGRESS:                'active'                    as JobStatus,
  /** @deprecated Use BLOCKED */
  BLOCKED_REVIEW:             'blocked'                   as JobStatus,
} as const;


/**
 * Flat array of every valid status string.
 * Useful for CHECK constraints, select dropdowns, and validation.
 */
export const ALL_JOB_STATUSES: readonly JobStatus[] = JOB_STATUS_VALUES;


// ---------------------------------------------------------------------------
// 2. ADMIN DASHBOARD BUCKETS
// ---------------------------------------------------------------------------

export type AdminBucket =
  | 'needs_pricing'
  | 'ready_to_release'
  | 'active'
  | 'pending_review'
  | 'completed'
  | 'exceptions'
  | 'unclassified';

/**
 * Status → Admin bucket mapping.
 */
export const STATUS_TO_ADMIN_BUCKET: Record<JobStatus, AdminBucket> = {
  // ── Needs Pricing ───────────────────────────────────────────────────
  [JOB_STATUSES.PENDING]:                   'needs_pricing',
  [JOB_STATUSES.QUOTED]:                    'needs_pricing',

  // ── Ready to Release (priced, not yet available to landscapers) ─────
  [JOB_STATUSES.PRICED]:                    'ready_to_release',
  [JOB_STATUSES.AVAILABLE]:                 'ready_to_release',
  [JOB_STATUSES.SCHEDULED]:                 'ready_to_release',

  // ── Active (landscaper is working) ──────────────────────────────────
  [JOB_STATUSES.ASSIGNED]:                  'active',
  [JOB_STATUSES.ACTIVE]:                    'active',

  // ── Pending Review (landscaper submitted, admin must approve) ───────
  [JOB_STATUSES.PENDING_REVIEW]:            'pending_review',
  [JOB_STATUSES.COMPLETED_PENDING_REVIEW]:  'pending_review',

  // ── Completed (admin approved) ──────────────────────────────────────
  [JOB_STATUSES.COMPLETED]:                 'completed',

  // ── Exceptions ──────────────────────────────────────────────────────
  [JOB_STATUSES.COMPLETION_FLAGGED]:        'exceptions',
  [JOB_STATUSES.FLAGGED_REVIEW]:            'exceptions',
  [JOB_STATUSES.BLOCKED]:                   'exceptions',
  [JOB_STATUSES.CANCELLED]:                 'exceptions',
  [JOB_STATUSES.RESCHEDULED]:               'exceptions',
};


/**
 * Derive the admin bucket for a job.
 * Uses status as primary signal, with column-based fallback for safety.
 */
export function deriveAdminBucket(job: {
  status?: string | null;
  price?: number | null;
  priced_at?: string | null;
  assigned_to?: string | null;
  landscaper_id?: string | null;
  completed_at?: string | null;
}): AdminBucket {
  const status = job.status as JobStatus | null | undefined;

  // 1. Status-first: if status is a known value, use the mapping
  if (status && status in STATUS_TO_ADMIN_BUCKET) {
    return STATUS_TO_ADMIN_BUCKET[status];
  }

  // 2. Column-based fallback (for jobs with unknown/null status)
  if (job.completed_at != null) return 'completed';
  if (job.assigned_to != null || job.landscaper_id != null) return 'active';
  if (job.priced_at != null && job.price != null) return 'ready_to_release';
  if (job.price == null || job.priced_at == null) return 'needs_pricing';

  return 'unclassified';
}

/** Display config for admin buckets */
export const ADMIN_BUCKET_CONFIG: Record<AdminBucket, {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  needs_pricing: {
    label: 'Needs Pricing',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    description: 'Jobs awaiting admin price decision',
  },
  ready_to_release: {
    label: 'Ready / Available',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    description: 'Priced and available for landscaper assignment',
  },
  active: {
    label: 'Active',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    description: 'Assigned to a landscaper or work in progress',
  },
  pending_review: {
    label: 'Pending Review',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    description: 'Landscaper submitted — awaiting admin approval',
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    description: 'Admin approved — job fully complete',
  },
  exceptions: {
    label: 'Exceptions',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    description: 'Flagged, blocked, cancelled, or rescheduled',
  },
  unclassified: {
    label: 'Unclassified',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    description: 'Jobs that could not be categorized',
  },
};


// ---------------------------------------------------------------------------
// 3. LANDSCAPER DASHBOARD STATES
// ---------------------------------------------------------------------------

export type LandscaperTab = 'all' | 'available' | 'assigned' | 'active' | 'completed';

export const LANDSCAPER_TAB_STATUSES: Record<LandscaperTab, JobStatus[]> = {
  all:          [...JOB_STATUS_VALUES],
  available:    [JOB_STATUSES.AVAILABLE, JOB_STATUSES.PRICED, JOB_STATUSES.SCHEDULED],
  assigned:     [JOB_STATUSES.ASSIGNED],
  active:       [JOB_STATUSES.ACTIVE],
  completed:    [JOB_STATUSES.COMPLETED_PENDING_REVIEW, JOB_STATUSES.COMPLETED],
};


/**
 * Statuses where the landscaper can see action buttons.
 */
export const LANDSCAPER_ACTIONS = {
  /** Landscaper can accept the job */
  canAccept:    [JOB_STATUSES.AVAILABLE, JOB_STATUSES.PRICED, JOB_STATUSES.SCHEDULED] as JobStatus[],
  /** Landscaper can start the job */
  canStart:     [JOB_STATUSES.ASSIGNED] as JobStatus[],
  /** Landscaper can mark the job complete */
  canComplete:  [JOB_STATUSES.ACTIVE] as JobStatus[],
  /** Landscaper can send messages */
  canMessage:   [
    JOB_STATUSES.ASSIGNED,
    JOB_STATUSES.ACTIVE,
    JOB_STATUSES.COMPLETED,
    JOB_STATUSES.FLAGGED_REVIEW,
    JOB_STATUSES.BLOCKED,
  ] as JobStatus[],
};



// ---------------------------------------------------------------------------
// 4. CLIENT DASHBOARD STATES
// ---------------------------------------------------------------------------

/**
 * Client-facing status labels. Clients see simplified, friendly labels.
 */
export const CLIENT_STATUS_LABELS: Record<JobStatus, string> = {
  [JOB_STATUSES.PENDING]:                   'Request Submitted',
  [JOB_STATUSES.QUOTED]:                    'Quote Ready',
  [JOB_STATUSES.PRICED]:                    'Priced',
  [JOB_STATUSES.AVAILABLE]:                 'Finding Landscaper',
  [JOB_STATUSES.SCHEDULED]:                 'Scheduled',
  [JOB_STATUSES.ASSIGNED]:                  'Landscaper Assigned',
  [JOB_STATUSES.ACTIVE]:                    'Work In Progress',
  [JOB_STATUSES.PENDING_REVIEW]:            'Work Submitted',
  [JOB_STATUSES.COMPLETED_PENDING_REVIEW]:  'Work Submitted',
  [JOB_STATUSES.COMPLETED]:                 'Completed',
  [JOB_STATUSES.COMPLETION_FLAGGED]:        'Under Review',
  [JOB_STATUSES.FLAGGED_REVIEW]:            'Under Review',
  [JOB_STATUSES.BLOCKED]:                   'Paused',
  [JOB_STATUSES.CANCELLED]:                 'Cancelled',
  [JOB_STATUSES.RESCHEDULED]:               'Rescheduled',
};


/** Statuses the client considers "active" (not terminal) */
export const CLIENT_ACTIVE_STATUSES: JobStatus[] = [
  JOB_STATUSES.PENDING,
  JOB_STATUSES.QUOTED,
  JOB_STATUSES.PRICED,
  JOB_STATUSES.AVAILABLE,
  JOB_STATUSES.SCHEDULED,
  JOB_STATUSES.ASSIGNED,
  JOB_STATUSES.ACTIVE,
  JOB_STATUSES.PENDING_REVIEW,
  JOB_STATUSES.COMPLETED_PENDING_REVIEW,
];


// ---------------------------------------------------------------------------
// 5. ALLOWED TRANSITIONS
// ---------------------------------------------------------------------------

/**
 * Defines which status transitions are valid and WHO can perform them.
 * This is the authoritative transition table.
 */
export const ALLOWED_TRANSITIONS: Record<JobStatus, Array<{
  to: JobStatus;
  actor: 'admin' | 'landscaper' | 'system' | 'client';
  description: string;
}>> = {
  [JOB_STATUSES.PENDING]: [
    { to: JOB_STATUSES.QUOTED,     actor: 'system',     description: 'AI or manual quote generated' },
    { to: JOB_STATUSES.PRICED,     actor: 'admin',      description: 'Admin sets baseline price' },
    { to: JOB_STATUSES.CANCELLED,  actor: 'admin',      description: 'Admin cancels job' },
    { to: JOB_STATUSES.CANCELLED,  actor: 'client',     description: 'Client cancels request' },
  ],
  [JOB_STATUSES.QUOTED]: [
    { to: JOB_STATUSES.PRICED,     actor: 'admin',      description: 'Admin confirms/adjusts price' },
    { to: JOB_STATUSES.CANCELLED,  actor: 'admin',      description: 'Admin cancels job' },
    { to: JOB_STATUSES.CANCELLED,  actor: 'client',     description: 'Client declines quote' },
  ],
  [JOB_STATUSES.PRICED]: [
    { to: JOB_STATUSES.AVAILABLE,  actor: 'admin',      description: 'Admin releases to landscaper pool' },
    { to: JOB_STATUSES.ASSIGNED,   actor: 'admin',      description: 'Admin directly assigns landscaper' },
    { to: JOB_STATUSES.CANCELLED,  actor: 'admin',      description: 'Admin cancels job' },
  ],
  [JOB_STATUSES.AVAILABLE]: [
    { to: JOB_STATUSES.ASSIGNED,   actor: 'landscaper', description: 'Landscaper accepts job' },
    { to: JOB_STATUSES.PRICED,     actor: 'admin',      description: 'Admin pulls back from pool' },
    { to: JOB_STATUSES.CANCELLED,  actor: 'admin',      description: 'Admin cancels job' },
  ],
  [JOB_STATUSES.SCHEDULED]: [
    { to: JOB_STATUSES.ASSIGNED,   actor: 'landscaper', description: 'Landscaper accepts scheduled job' },
    { to: JOB_STATUSES.AVAILABLE,  actor: 'admin',      description: 'Admin re-releases to pool' },
    { to: JOB_STATUSES.RESCHEDULED, actor: 'admin',     description: 'Admin reschedules' },
    { to: JOB_STATUSES.CANCELLED,  actor: 'admin',      description: 'Admin cancels job' },
  ],
  [JOB_STATUSES.ASSIGNED]: [
    { to: JOB_STATUSES.ACTIVE,     actor: 'landscaper', description: 'Landscaper starts work (manual or GPS)' },
    { to: JOB_STATUSES.ACTIVE,     actor: 'system',     description: 'GPS geofence auto-start' },
    { to: JOB_STATUSES.AVAILABLE,  actor: 'admin',      description: 'Admin unassigns landscaper' },
    { to: JOB_STATUSES.BLOCKED,    actor: 'landscaper', description: 'Landscaper reports unable to complete' },
    { to: JOB_STATUSES.CANCELLED,  actor: 'admin',      description: 'Admin cancels job' },
  ],
  [JOB_STATUSES.ACTIVE]: [
    { to: JOB_STATUSES.COMPLETED_PENDING_REVIEW, actor: 'landscaper', description: 'Landscaper submits completed work' },
    { to: JOB_STATUSES.COMPLETED_PENDING_REVIEW, actor: 'system',     description: 'GPS geofence auto-complete' },
    { to: JOB_STATUSES.BLOCKED,                  actor: 'landscaper', description: 'Landscaper reports unable to complete' },
    { to: JOB_STATUSES.FLAGGED_REVIEW,           actor: 'admin',      description: 'Admin flags for review' },
    { to: JOB_STATUSES.CANCELLED,                actor: 'admin',      description: 'Admin cancels job' },
  ],
  [JOB_STATUSES.PENDING_REVIEW]: [
    { to: JOB_STATUSES.COMPLETED,    actor: 'admin',      description: 'Admin approves completion' },
    { to: JOB_STATUSES.ACTIVE,       actor: 'admin',      description: 'Admin rejects, returns to landscaper' },
    { to: JOB_STATUSES.FLAGGED_REVIEW, actor: 'admin',    description: 'Admin flags for deeper review' },
  ],
  [JOB_STATUSES.COMPLETED_PENDING_REVIEW]: [
    { to: JOB_STATUSES.COMPLETED,          actor: 'admin',      description: 'Admin approves completion' },
    { to: JOB_STATUSES.ACTIVE,             actor: 'admin',      description: 'Admin rejects, returns to landscaper' },
    { to: JOB_STATUSES.COMPLETION_FLAGGED, actor: 'admin',      description: 'Admin flags completion for investigation' },
    { to: JOB_STATUSES.FLAGGED_REVIEW,     actor: 'admin',      description: 'Admin flags for deeper review' },
  ],
  [JOB_STATUSES.COMPLETED]: [
    { to: JOB_STATUSES.FLAGGED_REVIEW, actor: 'admin',    description: 'Admin flags completed job for review' },
  ],
  [JOB_STATUSES.COMPLETION_FLAGGED]: [
    { to: JOB_STATUSES.ACTIVE,       actor: 'admin',      description: 'Admin resolves, returns to landscaper' },
    { to: JOB_STATUSES.COMPLETED,    actor: 'admin',      description: 'Admin resolves, marks complete' },
    { to: JOB_STATUSES.CANCELLED,    actor: 'admin',      description: 'Admin cancels flagged job' },
  ],
  [JOB_STATUSES.FLAGGED_REVIEW]: [
    { to: JOB_STATUSES.ACTIVE,       actor: 'admin',      description: 'Admin resolves, returns to landscaper' },
    { to: JOB_STATUSES.COMPLETED,    actor: 'admin',      description: 'Admin resolves, marks complete' },
    { to: JOB_STATUSES.CANCELLED,    actor: 'admin',      description: 'Admin cancels flagged job' },
  ],
  [JOB_STATUSES.BLOCKED]: [
    { to: JOB_STATUSES.ASSIGNED,     actor: 'admin',      description: 'Admin resolves, reassigns' },
    { to: JOB_STATUSES.AVAILABLE,    actor: 'admin',      description: 'Admin resolves, re-releases to pool' },
    { to: JOB_STATUSES.RESCHEDULED,  actor: 'admin',      description: 'Admin approves reschedule' },
    { to: JOB_STATUSES.CANCELLED,    actor: 'admin',      description: 'Admin cancels blocked job' },
  ],
  [JOB_STATUSES.CANCELLED]: [],  // Terminal state
  [JOB_STATUSES.RESCHEDULED]: [
    { to: JOB_STATUSES.AVAILABLE,    actor: 'admin',      description: 'Admin re-releases rescheduled job' },
    { to: JOB_STATUSES.ASSIGNED,     actor: 'admin',      description: 'Admin reassigns rescheduled job' },
    { to: JOB_STATUSES.CANCELLED,    actor: 'admin',      description: 'Admin cancels rescheduled job' },
  ],
};


/**
 * Validate whether a status transition is allowed.
 */
export function isTransitionAllowed(
  from: JobStatus,
  to: JobStatus,
  actor: 'admin' | 'landscaper' | 'system' | 'client'
): boolean {
  const transitions = ALLOWED_TRANSITIONS[from];
  if (!transitions) return false;
  return transitions.some(t => t.to === to && t.actor === actor);
}


// ---------------------------------------------------------------------------
// 6. STATUS DISPLAY CONFIG (shared across all dashboards)
// ---------------------------------------------------------------------------

export const STATUS_DISPLAY: Record<JobStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  [JOB_STATUSES.PENDING]:                   { label: 'Pending',                   color: 'text-amber-300',   bgColor: 'bg-amber-500/20',   borderColor: 'border-amber-500/30' },
  [JOB_STATUSES.QUOTED]:                    { label: 'Quoted',                    color: 'text-blue-300',    bgColor: 'bg-blue-500/20',     borderColor: 'border-blue-500/30' },
  [JOB_STATUSES.PRICED]:                    { label: 'Priced',                    color: 'text-cyan-300',    bgColor: 'bg-cyan-500/20',     borderColor: 'border-cyan-500/30' },
  [JOB_STATUSES.AVAILABLE]:                 { label: 'Available',                 color: 'text-green-300',   bgColor: 'bg-green-500/20',    borderColor: 'border-green-500/30' },
  [JOB_STATUSES.SCHEDULED]:                 { label: 'Scheduled',                 color: 'text-indigo-300',  bgColor: 'bg-indigo-500/20',   borderColor: 'border-indigo-500/30' },
  [JOB_STATUSES.ASSIGNED]:                  { label: 'Assigned',                  color: 'text-purple-300',  bgColor: 'bg-purple-500/20',   borderColor: 'border-purple-500/30' },
  [JOB_STATUSES.ACTIVE]:                    { label: 'Active',                    color: 'text-yellow-300',  bgColor: 'bg-yellow-500/20',   borderColor: 'border-yellow-500/30' },
  [JOB_STATUSES.PENDING_REVIEW]:            { label: 'Pending Review',            color: 'text-orange-300',  bgColor: 'bg-orange-500/20',   borderColor: 'border-orange-500/30' },
  [JOB_STATUSES.COMPLETED_PENDING_REVIEW]:  { label: 'Completed — Pending Review', color: 'text-orange-300', bgColor: 'bg-orange-500/20',   borderColor: 'border-orange-500/30' },
  [JOB_STATUSES.COMPLETED]:                 { label: 'Completed',                 color: 'text-emerald-300', bgColor: 'bg-emerald-500/20',  borderColor: 'border-emerald-500/30' },
  [JOB_STATUSES.FLAGGED_REVIEW]:            { label: 'Flagged',                   color: 'text-red-300',     bgColor: 'bg-red-500/20',      borderColor: 'border-red-500/30' },
  [JOB_STATUSES.BLOCKED]:                   { label: 'Blocked',                   color: 'text-red-300',     bgColor: 'bg-red-500/20',      borderColor: 'border-red-500/30' },
  [JOB_STATUSES.CANCELLED]:                 { label: 'Cancelled',                 color: 'text-gray-400',    bgColor: 'bg-gray-500/20',     borderColor: 'border-gray-500/30' },
  [JOB_STATUSES.RESCHEDULED]:               { label: 'Rescheduled',               color: 'text-sky-300',     bgColor: 'bg-sky-500/20',      borderColor: 'border-sky-500/30' },
};

/**
 * Safe accessor for status display config.
 * Returns a sensible default for unknown status values.
 */
export function getStatusDisplay(status: string | null | undefined) {
  if (!status) return STATUS_DISPLAY[JOB_STATUSES.PENDING];
  return (STATUS_DISPLAY as Record<string, typeof STATUS_DISPLAY[JobStatus]>)[status]
    ?? { label: status.replace(/_/g, ' '), color: 'text-gray-400', bgColor: 'bg-gray-500/20', borderColor: 'border-gray-500/30' };
}
