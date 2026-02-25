import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { MapPin, Navigation, Clock, TrendingUp } from 'lucide-react';
import { calculateDistance, calculateETA } from '@/utils/gpsTracking';

interface LiveJobTrackerProps {
  jobId: string;
  jobLat: number;
  jobLng: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp: string;
}

export function LiveJobTracker({ jobId, jobLat, jobLng }: LiveJobTrackerProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [eta, setEta] = useState<Date | null>(null);
  const [routeHistory, setRouteHistory] = useState<LocationData[]>([]);

  // CRITICAL: Early guard - do not proceed if jobId is missing
  console.log('[LiveJobTracker] Mounted with jobId:', jobId);
  
  // Early return if no jobId - prevents queries with job_id=undefined
  if (!jobId) {
    console.warn('[LiveJobTracker] No jobId provided, not rendering');
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">No job selected for tracking</div>
      </Card>
    );
  }

  useEffect(() => {
    // Double-check jobId before any operations
    if (!jobId) {
      console.warn('[LiveJobTracker] useEffect skipped - no jobId');
      return;
    }

    console.log('[LiveJobTracker] Setting up tracking for jobId:', jobId);
    
    // Fetch initial location
    fetchCurrentLocation();

    // Subscribe to real-time updates - only if jobId is valid
    const channel = supabase
      .channel(`job-tracking-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gps_tracking',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          console.log('[LiveJobTracker] Received GPS update for jobId:', jobId);
          const newLocation = payload.new as any;
          updateLocation(newLocation);
        }
      )
      .subscribe();

    return () => {
      console.log('[LiveJobTracker] Cleaning up subscription for jobId:', jobId);
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  const fetchCurrentLocation = async () => {
    // Guard against undefined jobId
    if (!jobId) {
      console.warn('[LiveJobTracker] fetchCurrentLocation skipped - no jobId');
      return;
    }

    console.log('[LiveJobTracker] Fetching current location for jobId:', jobId);
    
    const { data, error } = await supabase
      .from('gps_tracking')
      .select('*')
      .eq('job_id', jobId)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[LiveJobTracker] Error fetching location:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('[LiveJobTracker] Found', data.length, 'location records for jobId:', jobId);
      updateLocation(data[0]);
      setRouteHistory(data.reverse());
    } else {
      console.log('[LiveJobTracker] No location data found for jobId:', jobId);
    }
  };

  const updateLocation = (loc: any) => {
    if (!loc) return;
    
    const newLocation: LocationData = {
      latitude: loc.latitude,
      longitude: loc.longitude,
      speed: loc.speed,
      timestamp: loc.timestamp,
    };

    setLocation(newLocation);

    const dist = calculateDistance(loc.latitude, loc.longitude, jobLat, jobLng);
    setDistance(dist);

    const estimatedEta = calculateETA(loc.latitude, loc.longitude, jobLat, jobLng, loc.speed || 30);
    setEta(estimatedEta);
  };

  if (!location) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">Waiting for GPS signal...</div>
      </Card>
    );
  }

  const minutesAway = eta ? Math.round((eta.getTime() - Date.now()) / 60000) : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Navigation className="h-5 w-5 text-blue-600" />
          Live Tracking
        </h3>
        <div className="flex items-center gap-2 text-green-600">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Active</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <MapPin className="h-4 w-4" />
            <span className="text-xs">Distance</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{distance.toFixed(1)}</div>
          <div className="text-xs text-gray-500">miles away</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs">ETA</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{minutesAway}</div>
          <div className="text-xs text-gray-500">minutes</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Speed</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {location.speed ? location.speed.toFixed(0) : '—'}
          </div>
          <div className="text-xs text-gray-500">mph</div>
        </div>
      </div>

      {minutesAway <= 15 && minutesAway > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-green-800">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">Arriving Soon!</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Your landscaper will arrive in approximately {minutesAway} minutes.
          </p>
        </div>
      )}

      <div className="text-xs text-gray-500">
        Last updated: {new Date(location.timestamp).toLocaleTimeString()}
      </div>
    </Card>
  );
}
