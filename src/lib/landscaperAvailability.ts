/**
 * landscaperAvailability.ts
 * ─────────────────────────────────────────────────────────────
 * Centralized utility for landscaper availability enforcement.
 *
 * The `landscapers.available` column (boolean, default true) controls
 * whether a landscaper can view marketplace jobs and accept new work.
 *
 * This module is the SINGLE SOURCE OF TRUTH for availability checks.
 * All frontend components and backend edge functions should use these
 * helpers rather than inline checks, so the rule is enforced uniformly.
 * ─────────────────────────────────────────────────────────────
 */

/** Error message shown when a landscaper tries to accept a job while unavailable */
export const UNAVAILABLE_ERROR_MESSAGE =
  'You must be available to accept jobs. Update your availability status in your profile settings.';

/** Short label used in tooltips and badges */
export const UNAVAILABLE_TOOLTIP =
  'Set your status to "Available" to accept new jobs';

/** Admin-facing warning when assigning to an unavailable landscaper */
export const ADMIN_UNAVAILABLE_WARNING =
  'This landscaper is currently marked as unavailable. They may not be able to work on this job.';

/**
 * Check whether a landscaper profile indicates they are available.
 *
 * The `available` column on the `landscapers` table defaults to `true`.
 * A value of `false` means the landscaper has opted out of receiving
 * new jobs (vacation, capacity limit, etc.).
 *
 * @param profile - Any object that may contain an `available` field.
 *                  Accepts the raw Supabase row or a partial profile.
 * @returns `true` if the landscaper is available for new work.
 */
export function isLandscaperAvailable(
  profile: { available?: boolean | null } | null | undefined
): boolean {
  if (!profile) return false;
  // Treat null / undefined as available (backwards-compatible default)
  if (profile.available === null || profile.available === undefined) return true;
  return profile.available === true;
}

/**
 * Full availability gate — combines approval + availability.
 * A landscaper must be BOTH approved AND available to accept jobs.
 */
export function canLandscaperWork(
  profile: { approved?: boolean | null; available?: boolean | null } | null | undefined
): { canWork: boolean; reason: string | null } {
  if (!profile) {
    return { canWork: false, reason: 'Landscaper profile not found' };
  }
  if (profile.approved === false) {
    return { canWork: false, reason: 'Your account is pending approval' };
  }
  if (!isLandscaperAvailable(profile)) {
    return { canWork: false, reason: UNAVAILABLE_ERROR_MESSAGE };
  }
  return { canWork: true, reason: null };
}
