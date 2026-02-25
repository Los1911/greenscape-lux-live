import { supabase } from '@/lib/supabase';

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
}

export interface RouteComparison {
  planned_distance: number;
  actual_distance: number;
  planned_duration: number;
  actual_duration: number;
  deviation_percentage: number;
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate estimated arrival time based on current location and speed
export function calculateETA(
  currentLat: number,
  currentLon: number,
  destLat: number,
  destLon: number,
  currentSpeed: number = 30 // mph
): Date {
  const distance = calculateDistance(currentLat, currentLon, destLat, destLon);
  const hours = distance / currentSpeed;
  const eta = new Date();
  eta.setMinutes(eta.getMinutes() + hours * 60);
  return eta;
}

// Track landscaper location
// CRITICAL: Validates landscaperId before insert to prevent undefined values
export async function trackLocation(
  landscaperId: string,
  jobId: string | null,
  location: GPSLocation
): Promise<void> {
  // Guard against undefined/null landscaperId
  if (!landscaperId) {
    console.error('[gpsTracking] trackLocation called without landscaperId');
    throw new Error('landscaperId is required for GPS tracking');
  }

  console.log('[gpsTracking] Tracking location:', { landscaperId, jobId: jobId || 'null' });

  const { error } = await supabase.from('gps_tracking').insert({
    landscaper_id: landscaperId,
    job_id: jobId || null, // Explicitly set null if undefined/empty
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    speed: location.speed,
    heading: location.heading,
    timestamp: location.timestamp.toISOString(),
    is_active: true,
  });

  if (error) {
    console.error('[gpsTracking] Error inserting GPS data:', error);
    throw error;
  }
  
  console.log('[gpsTracking] Location tracked successfully');
}


// Get current location of landscaper
export async function getCurrentLocation(landscaperId: string) {
  // Guard against undefined landscaperId
  if (!landscaperId) {
    console.error('[gpsTracking] getCurrentLocation called without landscaperId');
    return null;
  }

  console.log('[gpsTracking] Getting current location for landscaperId:', landscaperId);

  const { data, error } = await supabase
    .from('gps_tracking')
    .select('*')
    .eq('landscaper_id', landscaperId)
    .eq('is_active', true)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[gpsTracking] Error getting current location:', error);
    throw error;
  }
  
  return data;
}

// Get route history for a job
// CRITICAL: Validates jobId before query to prevent job_id=eq.undefined
export async function getRouteHistory(jobId: string) {
  // Guard against undefined/null jobId
  if (!jobId) {
    console.error('[gpsTracking] getRouteHistory called without jobId');
    return [];
  }

  console.log('[gpsTracking] Getting route history for jobId:', jobId);

  const { data, error } = await supabase
    .from('gps_tracking')
    .select('*')
    .eq('job_id', jobId)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('[gpsTracking] Error getting route history:', error);
    throw error;
  }
  
  return data || [];
}

// Calculate total distance traveled
export function calculateTotalDistance(locations: GPSLocation[]): number {
  let total = 0;
  for (let i = 1; i < locations.length; i++) {
    total += calculateDistance(
      locations[i - 1].latitude,
      locations[i - 1].longitude,
      locations[i].latitude,
      locations[i].longitude
    );
  }
  return total;
}
