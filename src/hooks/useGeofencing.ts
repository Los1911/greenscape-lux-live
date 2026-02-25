import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Geofence,
  isInsideGeofence,
  calculateDistance,
  getActiveGeofences,
} from '@/utils/geofencing';

interface UseGeofencingOptions {
  jobId?: string;
  landscaperId?: string;
  enabled?: boolean;
  checkInterval?: number; // milliseconds
  dwellThreshold?: number; // seconds required inside geofence before triggering
  onDwellThresholdReached?: (geofenceId: string) => void;
}

interface DwellTime {
  geofenceId: string;
  enteredAt: number;
  dwellSeconds: number;
}

export function useGeofencing(options: UseGeofencingOptions) {
  const { 
    jobId, 
    landscaperId, 
    enabled = true, 
    checkInterval = 10000,
    dwellThreshold = 120, // Default 120 seconds (2 minutes)
    onDwellThresholdReached,
  } = options;
  
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [insideGeofences, setInsideGeofences] = useState<Set<string>>(new Set());
  const [dwellTimes, setDwellTimes] = useState<Map<string, DwellTime>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  
  const previousInsideRef = useRef<Set<string>>(new Set());
  const watchIdRef = useRef<number | null>(null);
  const dwellIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const thresholdReachedRef = useRef<Set<string>>(new Set()); // Track which geofences have triggered

  // Log hook initialization for debugging
  console.log('[useGeofencing] Hook called with:', { jobId, landscaperId, enabled, dwellThreshold });

  // Load geofences
  useEffect(() => {
    // CRITICAL: Guard against undefined/null jobId
    if (!enabled) {
      console.log('[useGeofencing] Not enabled, skipping geofence load');
      return;
    }
    
    if (!jobId) {
      console.warn('[useGeofencing] No jobId provided, skipping geofence load');
      return;
    }

    const loadGeofences = async () => {
      try {
        console.log('[useGeofencing] Loading geofences for jobId:', jobId);
        const data = await getActiveGeofences([jobId]);
        console.log('[useGeofencing] Loaded', data.length, 'geofences for jobId:', jobId);
        setGeofences(data);
      } catch (err) {
        console.error('[useGeofencing] Failed to load geofences:', err);
        setError(err instanceof Error ? err.message : 'Failed to load geofences');
      }
    };

    loadGeofences();
  }, [jobId, enabled]);

  // Dwell time tracking interval
  useEffect(() => {
    if (!enabled || insideGeofences.size === 0) {
      if (dwellIntervalRef.current) {
        clearInterval(dwellIntervalRef.current);
        dwellIntervalRef.current = null;
      }
      return;
    }

    // Update dwell times every second
    dwellIntervalRef.current = setInterval(() => {
      setDwellTimes(prev => {
        const updated = new Map(prev);
        const now = Date.now();
        
        insideGeofences.forEach(geofenceId => {
          const existing = updated.get(geofenceId);
          if (existing) {
            const dwellSeconds = Math.floor((now - existing.enteredAt) / 1000);
            updated.set(geofenceId, { ...existing, dwellSeconds });
            
            // Check if threshold reached and callback not yet fired for this geofence
            if (dwellSeconds >= dwellThreshold && !thresholdReachedRef.current.has(geofenceId)) {
              console.log('[useGeofencing] Dwell threshold reached for geofence:', geofenceId, 'after', dwellSeconds, 'seconds');
              thresholdReachedRef.current.add(geofenceId);
              onDwellThresholdReached?.(geofenceId);
            }
          }
        });
        
        return updated;
      });
    }, 1000);

    return () => {
      if (dwellIntervalRef.current) {
        clearInterval(dwellIntervalRef.current);
      }
    };
  }, [enabled, insideGeofences, dwellThreshold, onDwellThresholdReached]);

  // Monitor location and check geofences
  useEffect(() => {
    // CRITICAL: Guard against missing required params
    if (!enabled) {
      console.log('[useGeofencing] Location monitoring disabled');
      setIsTracking(false);
      return;
    }
    
    if (!landscaperId) {
      console.warn('[useGeofencing] No landscaperId, skipping location monitoring');
      setIsTracking(false);
      return;
    }
    
    if (geofences.length === 0) {
      console.log('[useGeofencing] No geofences loaded, skipping location monitoring');
      setIsTracking(false);
      return;
    }

    console.log('[useGeofencing] Starting location monitoring for landscaperId:', landscaperId);
    setIsTracking(true);

    const checkGeofences = (position: GeolocationPosition) => {
      setCurrentLocation(position);
      const { latitude, longitude } = position.coords;
      const currentInside = new Set<string>();

      geofences.forEach((geofence) => {
        const inside = isInsideGeofence(latitude, longitude, geofence);
        if (inside) {
          currentInside.add(geofence.id);
        }
      });

      // Detect entry/exit events
      const previous = previousInsideRef.current;

      // Entry events - start dwell time tracking
      currentInside.forEach((geofenceId) => {
        if (!previous.has(geofenceId)) {
          const geofence = geofences.find((g) => g.id === geofenceId);
          if (geofence) {
            console.log('[useGeofencing] Entered geofence:', geofenceId);
            // Start tracking dwell time
            setDwellTimes(prev => {
              const updated = new Map(prev);
              updated.set(geofenceId, {
                geofenceId,
                enteredAt: Date.now(),
                dwellSeconds: 0,
              });
              return updated;
            });
            handleGeofenceEvent(geofence, 'entry', latitude, longitude);
          }
        }
      });

      // Exit events - reset dwell time and threshold tracking
      previous.forEach((geofenceId) => {
        if (!currentInside.has(geofenceId)) {
          const geofence = geofences.find((g) => g.id === geofenceId);
          if (geofence) {
            console.log('[useGeofencing] Exited geofence:', geofenceId);
            // Clear dwell time tracking
            setDwellTimes(prev => {
              const updated = new Map(prev);
              updated.delete(geofenceId);
              return updated;
            });
            // Reset threshold reached flag so it can trigger again on re-entry
            thresholdReachedRef.current.delete(geofenceId);
            handleGeofenceEvent(geofence, 'exit', latitude, longitude);
          }
        }
      });

      setInsideGeofences(currentInside);
      previousInsideRef.current = currentInside;
    };

    const handleGeofenceEvent = async (
      geofence: Geofence,
      eventType: 'entry' | 'exit',
      lat: number,
      lng: number
    ) => {
      // CRITICAL: Validate geofence.job_id before making API call
      if (!geofence.job_id) {
        console.error('[useGeofencing] Cannot process geofence event - geofence has no job_id');
        return;
      }

      const distance = calculateDistance(
        lat,
        lng,
        geofence.center_lat,
        geofence.center_lng
      );

      console.log('[useGeofencing] Processing geofence event:', {
        eventType,
        geofenceId: geofence.id,
        jobId: geofence.job_id,
        landscaperId,
        distance,
      });

      // Record GPS tracking point
      try {
        console.log('[useGeofencing] Recording GPS point for jobId:', geofence.job_id);
        await supabase.from('gps_tracking').insert({
          job_id: geofence.job_id,
          landscaper_id: landscaperId,
          latitude: lat,
          longitude: lng,
          accuracy: 10, // Default accuracy
          event_type: eventType,
          recorded_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[useGeofencing] Failed to record GPS point:', err);
      }
    };

    // Start watching position
    if (navigator.geolocation) {
      console.log('[useGeofencing] Starting geolocation watch');
      watchIdRef.current = navigator.geolocation.watchPosition(
        checkGeofences,
        (err) => {
          console.error('[useGeofencing] Geolocation error:', err.message);
          setError(err.message);
          setIsTracking(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      console.warn('[useGeofencing] Geolocation not supported');
      setError('Geolocation is not supported by this browser');
      setIsTracking(false);
    }

    return () => {
      if (watchIdRef.current !== null) {
        console.log('[useGeofencing] Clearing geolocation watch');
        navigator.geolocation.clearWatch(watchIdRef.current);
        setIsTracking(false);
      }
    };
  }, [enabled, landscaperId, geofences]);

  // Get dwell time for a specific geofence
  const getDwellTime = useCallback((geofenceId: string): number => {
    return dwellTimes.get(geofenceId)?.dwellSeconds || 0;
  }, [dwellTimes]);

  // Check if any geofence has reached dwell threshold
  const hasReachedDwellThreshold = useCallback((): boolean => {
    for (const [, dwell] of dwellTimes) {
      if (dwell.dwellSeconds >= dwellThreshold) {
        return true;
      }
    }
    return false;
  }, [dwellTimes, dwellThreshold]);

  return {
    geofences,
    currentLocation,
    insideGeofences,
    dwellTimes,
    error,
    isTracking,
    getDwellTime,
    hasReachedDwellThreshold,
  };
}
