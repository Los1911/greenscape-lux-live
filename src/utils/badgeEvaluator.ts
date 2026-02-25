/**
 * Badge Evaluation Utility
 * Calculates badge progress and eligibility for landscapers
 */

import { Badge, BadgeWithProgress, BadgeCriteria } from '@/types/job';

export interface LandscaperStats {
  completed_jobs_count: number;
  average_rating: number;
  on_time_rate?: number;
  avg_response_minutes?: number;
  flagged_jobs_last_30_days?: number;
  current_streak_days?: number;
  created_at?: string;
}

/**
 * Calculate progress for a specific badge based on landscaper stats
 */
export function calculateBadgeProgress(
  badge: Badge,
  stats: LandscaperStats
): { progress: number; progressText: string; currentValue: number; targetValue: number } {
  const criteria = badge.criteria;
  
  // Milestone badges - based on completed jobs
  if (criteria.completed_jobs !== undefined) {
    const current = stats.completed_jobs_count;
    const target = criteria.completed_jobs;
    const progress = Math.min(100, Math.round((current / target) * 100));
    return {
      progress,
      progressText: `${current} of ${target} jobs`,
      currentValue: current,
      targetValue: target
    };
  }

  // Quality badges - based on rating
  if (criteria.min_rating !== undefined) {
    const minJobs = criteria.min_jobs || 1;
    const hasEnoughJobs = stats.completed_jobs_count >= minJobs;
    const meetsRating = stats.average_rating >= criteria.min_rating;
    
    if (!hasEnoughJobs) {
      const progress = Math.min(100, Math.round((stats.completed_jobs_count / minJobs) * 100));
      return {
        progress,
        progressText: `${stats.completed_jobs_count} of ${minJobs} jobs needed`,
        currentValue: stats.completed_jobs_count,
        targetValue: minJobs
      };
    }
    
    if (meetsRating) {
      return { progress: 100, progressText: 'Completed!', currentValue: stats.average_rating, targetValue: criteria.min_rating };
    }
    
    const ratingProgress = Math.min(100, Math.round((stats.average_rating / criteria.min_rating) * 100));
    return {
      progress: ratingProgress,
      progressText: `${stats.average_rating.toFixed(1)} of ${criteria.min_rating} rating`,
      currentValue: stats.average_rating,
      targetValue: criteria.min_rating
    };
  }

  // On-time badge
  if (criteria.on_time_rate !== undefined) {
    const minJobs = criteria.min_jobs || 10;
    const hasEnoughJobs = stats.completed_jobs_count >= minJobs;
    const onTimeRate = stats.on_time_rate || 0;
    
    if (!hasEnoughJobs) {
      const progress = Math.min(100, Math.round((stats.completed_jobs_count / minJobs) * 100));
      return {
        progress,
        progressText: `${stats.completed_jobs_count} of ${minJobs} jobs needed`,
        currentValue: stats.completed_jobs_count,
        targetValue: minJobs
      };
    }
    
    const progress = Math.min(100, Math.round((onTimeRate / criteria.on_time_rate) * 100));
    return {
      progress,
      progressText: `${Math.round(onTimeRate * 100)}% on-time`,
      currentValue: onTimeRate,
      targetValue: criteria.on_time_rate
    };
  }

  // Quick responder badge
  if (criteria.max_response_minutes !== undefined) {
    const minResponses = criteria.min_responses || 10;
    const avgResponse = stats.avg_response_minutes || 999;
    
    if (avgResponse <= criteria.max_response_minutes) {
      return { progress: 100, progressText: 'Completed!', currentValue: avgResponse, targetValue: criteria.max_response_minutes };
    }
    
    // Inverse progress - lower is better
    const progress = Math.max(0, Math.round((criteria.max_response_minutes / avgResponse) * 100));
    return {
      progress,
      progressText: `${Math.round(avgResponse)} min avg response`,
      currentValue: avgResponse,
      targetValue: criteria.max_response_minutes
    };
  }

  // Reliable Pro badge
  if (criteria.no_flags_days !== undefined) {
    const minJobs = criteria.min_jobs || 10;
    const hasEnoughJobs = stats.completed_jobs_count >= minJobs;
    const flaggedCount = stats.flagged_jobs_last_30_days || 0;
    
    if (!hasEnoughJobs) {
      const progress = Math.min(100, Math.round((stats.completed_jobs_count / minJobs) * 100));
      return {
        progress,
        progressText: `${stats.completed_jobs_count} of ${minJobs} jobs needed`,
        currentValue: stats.completed_jobs_count,
        targetValue: minJobs
      };
    }
    
    if (flaggedCount === 0) {
      return { progress: 100, progressText: 'No flags - Great job!', currentValue: 0, targetValue: 0 };
    }
    
    return {
      progress: 0,
      progressText: `${flaggedCount} flagged job(s) in last 30 days`,
      currentValue: flaggedCount,
      targetValue: 0
    };
  }

  // Streak badge
  if (criteria.streak_days !== undefined) {
    const currentStreak = stats.current_streak_days || 0;
    const progress = Math.min(100, Math.round((currentStreak / criteria.streak_days) * 100));
    return {
      progress,
      progressText: `${currentStreak} of ${criteria.streak_days} days`,
      currentValue: currentStreak,
      targetValue: criteria.streak_days
    };
  }

  // Early adopter badge
  if (criteria.early_adopter) {
    const cutoffDate = new Date('2026-01-01');
    const createdAt = stats.created_at ? new Date(stats.created_at) : new Date();
    
    if (createdAt < cutoffDate) {
      return { progress: 100, progressText: 'Early member!', currentValue: 1, targetValue: 1 };
    }
    
    return {
      progress: 0,
      progressText: 'Joined after early period',
      currentValue: 0,
      targetValue: 1
    };
  }

  // Default fallback
  return { progress: 0, progressText: 'In progress', currentValue: 0, targetValue: 1 };
}

/**
 * Combine all badges with earned status and progress
 */
export function getBadgesWithProgress(
  allBadges: Badge[],
  earnedBadgeIds: Set<string>,
  earnedBadges: { badge_id: string; earned_at: string }[],
  stats: LandscaperStats
): BadgeWithProgress[] {
  return allBadges.map(badge => {
    const isEarned = earnedBadgeIds.has(badge.id);
    const earnedInfo = earnedBadges.find(eb => eb.badge_id === badge.id);
    
    if (isEarned) {
      return {
        ...badge,
        earned: true,
        earned_at: earnedInfo?.earned_at,
        progress: 100,
        progressText: 'Earned!',
        currentValue: 0,
        targetValue: 0
      };
    }
    
    const progressInfo = calculateBadgeProgress(badge, stats);
    return {
      ...badge,
      earned: false,
      ...progressInfo
    };
  }).sort((a, b) => {
    // Sort: earned first, then by sort_order
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    return a.sort_order - b.sort_order;
  });
}

/**
 * Get badge color based on category
 */
export function getBadgeColor(category: string): { bg: string; text: string; border: string } {
  switch (category) {
    case 'milestone':
      return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
    case 'quality':
      return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' };
    case 'engagement':
      return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
  }
}

/**
 * Get earned badge color (more vibrant)
 */
export function getEarnedBadgeColor(category: string): { bg: string; text: string; border: string; glow: string } {
  switch (category) {
    case 'milestone':
      return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', glow: 'shadow-amber-200' };
    case 'quality':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', glow: 'shadow-emerald-200' };
    case 'engagement':
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', glow: 'shadow-blue-200' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', glow: 'shadow-gray-200' };
  }
}
