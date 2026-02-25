/**
 * Canonical Job type matching actual database schema
 * 
 * Schema columns:
 * - id: UUID (primary key)
 * - service_name: TEXT NOT NULL
 * - service_type: TEXT
 * - service_address: TEXT
 * - price: NUMERIC
 * - preferred_date: TIMESTAMPTZ
 * - status: TEXT NOT NULL (default 'pending')
 * - customer_name: TEXT NOT NULL
 * - created_at: TIMESTAMPTZ
 * - updated_at: TIMESTAMPTZ
 * 
 * DO NOT modify without updating database schema.
 * See src/constants/jobStatus.ts for the canonical status values.
 * See src/lib/jobLifecycleContract.ts for the lifecycle contract.
 */

// ── Import the canonical JobStatus type from the single source of truth ──
import { type JobStatus as CanonicalJobStatus } from '@/constants/jobStatus';

/**
 * Re-export the canonical JobStatus type.
 * All consumers of this file get the same type as src/constants/jobStatus.ts.
 */
export type JobStatus = CanonicalJobStatus;

export interface Job {
  id: string;
  service_name: string;        // NOT NULL
  service_type: string | null;
  service_address: string | null;
  price: number | null;
  preferred_date: string | null; // ISO timestamp
  status: string;              // NOT NULL (default 'pending')
  customer_name: string;       // NOT NULL
  created_at: string;          // ISO timestamp
  updated_at: string;          // ISO timestamp
  
  // Remediation fields
  flagged_at?: string | null;
  flagged_reason?: string | null;
  remediation_deadline?: string | null;
  remediation_status?: RemediationStatus | null;
  remediation_notes?: string | null;
  weather_extension_hours?: number;
  
  // Tier requirements
  min_tier_required?: LandscaperTier;
  job_complexity?: JobComplexity;
  
  // Landscaper reference
  landscaper_id?: string | null;
}

/**
 * Type for inserting new jobs (omits auto-generated fields)
 */
export type JobInsert = Omit<Job, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; // Optional for manual ID assignment
};

/**
 * Type for updating jobs (all fields optional except id)
 */
export type JobUpdate = Partial<Omit<Job, 'id' | 'created_at' | 'updated_at'>>;


/**
 * Remediation status values
 */
export type RemediationStatus = 
  | 'pending_response'      // Waiting for landscaper to respond
  | 'accepted'              // Landscaper accepted remediation
  | 'scheduled'             // Return visit scheduled
  | 'active'               // Remediation work active

  | 'completed'             // Remediation completed successfully
  | 'weather_extended'      // Extended due to weather
  | 'escalated'             // Escalated to admin
  | 'resolved_partial'      // Partial resolution
  | 'resolved_refund';      // Resolved with refund

/**
 * Landscaper tier levels
 */
export type LandscaperTier = 'starter' | 'pro' | 'elite';

/**
 * Job complexity levels
 */
export type JobComplexity = 'standard' | 'large' | 'multi_day' | 'recurring' | 'premium' | 'hoa_contract';

/**
 * Tier configuration for job visibility
 */
export const TIER_JOB_ACCESS: Record<LandscaperTier, JobComplexity[]> = {
  starter: ['standard'],
  pro: ['standard', 'large', 'multi_day', 'recurring'],
  elite: ['standard', 'large', 'multi_day', 'recurring', 'premium', 'hoa_contract']
};

/**
 * Tier requirements
 */
export const TIER_REQUIREMENTS: Record<LandscaperTier, {
  minJobs: number;
  minRating: number;
  requiresInsurance: boolean;
  requiresAdminApproval: boolean;
  description: string;
}> = {
  starter: {
    minJobs: 0,
    minRating: 0,
    requiresInsurance: false,
    requiresAdminApproval: false,
    description: 'New or limited history. Access to standard, low-risk jobs only.'
  },
  pro: {
    minJobs: 15,
    minRating: 4.0,
    requiresInsurance: true,
    requiresAdminApproval: false,
    description: 'Consistent completion history. Access to larger jobs, multi-day jobs, and recurring services.'
  },
  elite: {
    minJobs: 50,
    minRating: 4.5,
    requiresInsurance: true,
    requiresAdminApproval: true,
    description: 'High reliability and excellent ratings. Access to premium clients, HOA contracts, and priority visibility.'
  }
};

/**
 * Remediation log entry
 */
export interface RemediationLog {
  id: string;
  job_id: string;
  landscaper_id: string;
  action: string;
  action_by: string;
  notes?: string;
  weather_reason?: string;
  created_at: string;
}

/**
 * Flagged job with admin context
 */
export interface FlaggedJobAdmin extends Job {
  landscaper_first_name?: string;
  landscaper_last_name?: string;
  ls_email?: string;
  landscaper_tier?: LandscaperTier;
  ls_phone?: string;
  hours_remaining?: number;
}


/**
 * Badge category types
 */
export type BadgeCategory = 'milestone' | 'quality' | 'engagement';

/**
 * Badge definition
 */
export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  criteria: BadgeCriteria;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

/**
 * Badge criteria for automatic evaluation
 */
export interface BadgeCriteria {
  completed_jobs?: number;
  min_rating?: number;
  min_jobs?: number;
  on_time_rate?: number;
  max_response_minutes?: number;
  min_responses?: number;
  no_flags_days?: number;
  streak_days?: number;
  early_adopter?: boolean;
}

/**
 * Landscaper's earned badge
 */
export interface LandscaperBadge {
  id: string;
  landscaper_id: string;
  badge_id: string;
  earned_at: string;
  granted_by?: string | null;
  revoked_at?: string | null;
  revoked_by?: string | null;
  revoke_reason?: string | null;
  // Joined badge info
  badge?: Badge;
  slug?: string;
  name?: string;
  description?: string;
  icon?: string;
  category?: BadgeCategory;
  sort_order?: number;
}

/**
 * Badge with progress tracking for UI
 */
export interface BadgeWithProgress extends Badge {
  earned: boolean;
  earned_at?: string;
  progress?: number; // 0-100
  progressText?: string; // e.g., "3 of 5 jobs"
  currentValue?: number;
  targetValue?: number;
}

/**
 * Badge icon mapping
 */
export const BADGE_ICONS: Record<string, string> = {
  trophy: 'Trophy',
  star: 'Star',
  award: 'Award',
  medal: 'Medal',
  crown: 'Crown',
  gem: 'Gem',
  sparkles: 'Sparkles',
  'thumbs-up': 'ThumbsUp',
  clock: 'Clock',
  zap: 'Zap',
  'shield-check': 'ShieldCheck',
  flame: 'Flame',
  rocket: 'Rocket'
};

/**
 * Badge category labels and colors
 */
export const BADGE_CATEGORIES: Record<BadgeCategory, { label: string; color: string; bgColor: string }> = {
  milestone: { label: 'Milestone', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  quality: { label: 'Quality', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  engagement: { label: 'Engagement', color: 'text-blue-600', bgColor: 'bg-blue-100' }
};


/**
 * Earnings Goal types
 */
export interface EarningsGoal {
  id: string;
  landscaper_id: string;
  goal_amount: number;
  goal_period: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type EarningsGoalInsert = Omit<EarningsGoal, 'id' | 'created_at' | 'updated_at'>;

export type EarningsGoalUpdate = Partial<Omit<EarningsGoal, 'id' | 'landscaper_id' | 'created_at' | 'updated_at'>>;

/**
 * Pace status for goal tracking
 */
export type GoalPaceStatus = 'ahead' | 'on_track' | 'behind';

/**
 * Goal progress calculation result
 */
export interface GoalProgress {
  percentage: number;
  paceStatus: GoalPaceStatus;
  projectedEarnings: number;
  timeProgress: number;
  remainingDays: number;
  currentEarnings: number;
  goalAmount: number;
}
