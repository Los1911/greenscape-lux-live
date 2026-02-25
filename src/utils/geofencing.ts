import { supabase } from '@/lib/supabase';

export interface Geofence {
  id: string;
  job_id: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  is_active: boolean;
}

export interface GeofenceEvent {
  id: string;
  geofence_id: string;
  job_id: string;
  landscaper_id: string;
  event_type: 'entry' | 'exit';
  location_lat: number;
  location_lng: number;
  distance_from_center: number;
  job_status_before: string | null;
  job_status_after: string | null;
  notification_sent: boolean;
  created_at: string;
}

// Haversine formula to calculate distance between two points
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Check if a point is inside a geofence
export function isInsideGeofence(
  lat: number,
  lng: number,
  geofence: Geofence
): boolean {
  const distance = calculateDistance(
    lat,
    lng,
    geofence.center_lat,
    geofence.center_lng
  );
  return distance <= geofence.radius_meters;
}

// Create or update geofence for a job
export async function upsertGeofence(
  jobId: string,
  centerLat: number,
  centerLng: number,
  radiusMeters: number = 50
) {
  const { data, error } = await supabase
    .from('geofences')
    .upsert(
      {
        job_id: jobId,
        center_lat: centerLat,
        center_lng: centerLng,
        radius_meters: radiusMeters,
        is_active: true,
      },
      { onConflict: 'job_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get active geofences for jobs
export async function getActiveGeofences(jobIds: string[]): Promise<Geofence[]> {
  const { data, error } = await supabase
    .from('geofences')
    .select('*')
    .in('job_id', jobIds)
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

// Log geofence event
export async function logGeofenceEvent(
  geofenceId: string,
  jobId: string,
  landscaperId: string,
  eventType: 'entry' | 'exit',
  lat: number,
  lng: number,
  distanceFromCenter: number,
  statusBefore: string | null,
  statusAfter: string | null
): Promise<void> {
  const { error } = await supabase
    .from('geofence_events')
    .insert({
      geofence_id: geofenceId,
      job_id: jobId,
      landscaper_id: landscaperId,
      event_type: eventType,
      location_lat: lat,
      location_lng: lng,
      distance_from_center: distanceFromCenter,
      job_status_before: statusBefore,
      job_status_after: statusAfter,
    });

  if (error) throw error;
}


// Get geofence events history
export async function getGeofenceEvents(
  jobId?: string,
  landscaperId?: string,
  limit: number = 50
): Promise<GeofenceEvent[]> {
  let query = supabase
    .from('geofence_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (jobId) query = query.eq('job_id', jobId);
  if (landscaperId) query = query.eq('landscaper_id', landscaperId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
