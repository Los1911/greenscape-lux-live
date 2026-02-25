import { supabase } from '@/lib/supabase';

export interface TimeSlot {
  start: Date;
  end: Date;
  landscaperId: string;
  jobId?: string;
  isAvailable: boolean;
}

export interface ScheduleConflict {
  hasConflict: boolean;
  conflictingJobs: Array<{
    id: string;
    scheduledDate: Date;
    estimatedDuration: number;
  }>;
}

export interface OptimalTimeSlot {
  start: Date;
  end: Date;
  score: number;
  reason: string;
  nearbyJobs: number;
}

// Check for scheduling conflicts
export async function checkScheduleConflicts(
  landscaperId: string,
  proposedStart: Date,
  estimatedDuration: number
): Promise<ScheduleConflict> {
  const proposedEnd = new Date(proposedStart.getTime() + estimatedDuration * 60 * 60 * 1000);
  
  const { data: existingJobs, error } = await supabase
    .from('jobs')
    .select('id, scheduled_date')

    .eq('landscaper_id', landscaperId)
    .eq('status', 'scheduled')
    .gte('scheduled_date', new Date(proposedStart.getTime() - 24 * 60 * 60 * 1000).toISOString())
    .lte('scheduled_date', new Date(proposedEnd.getTime() + 24 * 60 * 60 * 1000).toISOString());

  if (error || !existingJobs) {
    return { hasConflict: false, conflictingJobs: [] };
  }

  const conflicts = existingJobs.filter(job => {
    const jobStart = new Date(job.scheduled_date);
    const jobEnd = new Date(jobStart.getTime() + (job.estimated_duration || 2) * 60 * 60 * 1000);
    
    return (proposedStart < jobEnd && proposedEnd > jobStart);
  });

  return {
    hasConflict: conflicts.length > 0,
    conflictingJobs: conflicts.map(job => ({
      id: job.id,
      scheduledDate: new Date(job.scheduled_date),
      estimatedDuration: job.estimated_duration || 2
    }))
  };
}

// Calculate location clustering score
function calculateClusterScore(jobs: Array<{ lat: number; lng: number }>, newLat: number, newLng: number): number {
  if (jobs.length === 0) return 0;
  
  const distances = jobs.map(job => {
    const R = 3959; // Earth radius in miles
    const dLat = (newLat - job.lat) * Math.PI / 180;
    const dLng = (newLng - job.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(job.lat * Math.PI / 180) * Math.cos(newLat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  });
  
  const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
  return Math.max(0, 100 - avgDistance * 10);
}

// Suggest optimal time slots
export async function suggestOptimalTimeSlots(
  landscaperId: string,
  jobLat: number,
  jobLng: number,
  estimatedDuration: number
): Promise<OptimalTimeSlot[]> {
  const slots: OptimalTimeSlot[] = [];
  const now = new Date();
  
  for (let day = 1; day <= 7; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);
    
    for (let hour = 8; hour <= 16; hour++) {
      date.setHours(hour, 0, 0, 0);
      const end = new Date(date.getTime() + estimatedDuration * 60 * 60 * 1000);
      
      const conflict = await checkScheduleConflicts(landscaperId, date, estimatedDuration);
      
      if (!conflict.hasConflict) {
        const { data: nearbyJobs } = await supabase
          .from('jobs')
          .select('location_lat, location_lng')
          .eq('landscaper_id', landscaperId)
          .eq('scheduled_date', date.toISOString().split('T')[0]);
        
        const nearby = nearbyJobs?.filter(job => job.location_lat && job.location_lng) || [];
        const clusterScore = calculateClusterScore(
          nearby.map(j => ({ lat: j.location_lat, lng: j.location_lng })),
          jobLat,
          jobLng
        );
        
        slots.push({
          start: new Date(date),
          end,
          score: clusterScore,
          reason: clusterScore > 70 
            ? `${nearby.length} nearby jobs - efficient route` 
            : nearby.length > 0 
            ? `${nearby.length} jobs in area` 
            : 'Available slot',
          nearbyJobs: nearby.length
        });
      }
    }
  }
  
  return slots.sort((a, b) => b.score - a.score).slice(0, 10);
}
