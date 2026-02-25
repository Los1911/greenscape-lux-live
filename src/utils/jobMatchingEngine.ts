import { supabase } from '@/lib/supabase';
import { checkScheduleConflicts } from './intelligentScheduling';

export interface LandscaperMatch {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  rating: number;
  totalReviews: number;
  avgResponseTimeHours: number;
  available: boolean;
  distance: number;
  matchScore: number;
  matchReasons: string[];
  hasScheduleConflict?: boolean;
  conflictPenalty?: number;
}

interface MatchCriteria {
  quote_id: string; // This is actually job_id now, kept for backward compatibility
  client_location: { lat: number; lng: number };
  service_type: string;
  urgency?: 'low' | 'medium' | 'high';
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function findBestMatches(
  criteria: MatchCriteria, 
  limit: number = 5,
  proposedDate?: Date,
  estimatedDuration: number = 2
): Promise<LandscaperMatch[]> {
  try {
    const { data: landscapers, error } = await supabase
      .from('landscapers')
      .select('id, user_id, business_name, service_radius, hourly_rate, rating, approved')
      .eq('approved', true);



    if (error) throw error;
    if (!landscapers || landscapers.length === 0) return [];

    const matches: LandscaperMatch[] = [];

    for (const landscaper of landscapers) {
      const reasons: string[] = [];
      let score = 0;
      let hasConflict = false;
      let conflictPenalty = 0;

      const distance = calculateDistance(
        criteria.client_location.lat,
        criteria.client_location.lng,
        landscaper.service_area?.lat || 0,
        landscaper.service_area?.lng || 0
      );
      
      if (distance <= 5) {
        score += 40;
        reasons.push(`within ${distance.toFixed(1)} miles`);
      } else if (distance <= 15) {
        score += 30;
        reasons.push(`${distance.toFixed(1)} miles away`);
      } else if (distance <= 30) {
        score += 15;
        reasons.push(`${distance.toFixed(1)} miles away`);
      }

      const specialties = landscaper.specialties || [];
      if (specialties.includes(criteria.service_type)) {
        score += 25;
        reasons.push(`${criteria.service_type} specialist`);
      } else if (specialties.length > 0) {
        score += 10;
      }

      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('landscaper_id', landscaper.id);
      
      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
      
      if (avgRating >= 4.5) {
        score += 20;
        reasons.push(`${avgRating.toFixed(1)}★ rating`);
      } else if (avgRating >= 4.0) {
        score += 15;
        reasons.push(`${avgRating.toFixed(1)}★ rating`);
      }

      const responseTime = landscaper.avg_response_time_hours || 24;
      if (responseTime <= 2) {
        score += 10;
        reasons.push('fast responder');
      } else if (responseTime <= 6) {
        score += 7;
      }

      if (landscaper.available) {
        score += 5;
        reasons.push('available now');
      }

      // Check for schedule conflicts if date provided
      if (proposedDate) {
        const conflict = await checkScheduleConflicts(landscaper.id, proposedDate, estimatedDuration);
        if (conflict.hasConflict) {
          hasConflict = true;
          conflictPenalty = 20;
          score -= conflictPenalty;
          reasons.push(`⚠️ ${conflict.conflictingJobs.length} schedule conflict(s)`);
        } else {
          reasons.push('✓ no schedule conflicts');
        }
      }

      const { data: userData } = await supabase
        .from('users')
        .select('email, full_name, phone')
        .eq('id', landscaper.user_id)
        .single();

      matches.push({
        id: landscaper.id,
        name: landscaper.business_name || userData?.full_name || 'Landscaper',
        email: userData?.email || '',
        phone: userData?.phone || '',
        specialties,
        rating: parseFloat(avgRating.toFixed(1)),
        totalReviews: reviews?.length || 0,
        avgResponseTimeHours: responseTime,
        available: landscaper.available || false,
        distance: parseFloat(distance.toFixed(1)),
        matchScore: Math.round(score),
        matchReasons: reasons,
        hasScheduleConflict: hasConflict,
        conflictPenalty
      });
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
  } catch (error) {
    console.error('Error finding matches:', error);
    return [];
  }
}


/**
 * Auto-assign a job to a landscaper
 * Updates the jobs table directly and creates a job_assignments record
 * @param jobId - The job ID to assign (previously called quoteId for backward compatibility)
 * @param landscaperId - The landscaper ID to assign the job to
 */
export async function autoAssignJob(jobId: string, landscaperId: string): Promise<boolean> {
  try {
    // First, update the job with the assigned landscaper
    const { error: jobError } = await supabase
      .from('jobs')
      .update({
        landscaper_id: landscaperId,
        status: 'assigned',
        is_available: false,
        accepted_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (jobError) {
      console.error('[autoAssignJob] Error updating job:', jobError);
      throw jobError;
    }

    // Also create a job_assignments record for tracking
    const { error: assignmentError } = await supabase
      .from('job_assignments')
      .insert({
        job_id: jobId,
        landscaper_id: landscaperId,
        assigned_at: new Date().toISOString(),
        assigned_by: 'admin',
        status: 'assigned'
      });

    // Don't fail if job_assignments insert fails (table might not exist or have different schema)
    if (assignmentError) {
      console.warn('[autoAssignJob] Could not create job_assignment record:', assignmentError.message);
      // Continue - the job update was successful
    }

    // Optionally update the related quote if it exists
    const { error: quoteError } = await supabase
      .from('quotes')
      .update({
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('job_id', jobId);

    if (quoteError) {
      console.warn('[autoAssignJob] Could not update quote:', quoteError.message);
      // Continue - the job update was successful
    }

    return true;
  } catch (error) {
    console.error('Error auto-assigning job:', error);
    return false;
  }
}
