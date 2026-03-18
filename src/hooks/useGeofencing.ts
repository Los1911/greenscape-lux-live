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
  checkInterval?: number;
  dwellThreshold?: number;
  onDwellThresholdReached?: (geofenceId: string) => void;
}

interface DwellTime {
  geofenceId: string;
  enteredAt: number;
  dwellSeconds: number;
}

export type GeocodeStatus =
  | 'idle'
  | 'checking'
  | 'geocoding'
  | 'ready'
  | 'no_address'
  | 'failed';

export function useGeofencing(options: UseGeofencingOptions) {
  const {
    jobId,
    landscaperId,
    enabled = true,
    checkInterval = 10000,
    dwellThreshold = 120,
    onDwellThresholdReached,
  } = options;

  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [currentLocation, setCurrentLocation] =
    useState<GeolocationPosition | null>(null);
  const [insideGeofences, setInsideGeofences] = useState<Set<string>>(new Set());
  const [dwellTimes, setDwellTimes] = useState<Map<string, DwellTime>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [geocodeStatus, setGeocodeStatus] =
    useState<GeocodeStatus>('idle');
  const [jobCoordinates, setJobCoordinates] =
    useState<{ lat: number; lng: number } | null>(null);

  const previousInsideRef = useRef<Set<string>>(new Set());
  const watchIdRef = useRef<number | null>(null);
  const dwellIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const thresholdReachedRef = useRef<Set<string>>(new Set());
  const geocodeAttemptedRef = useRef(false);

  /*
  =====================================================
  LOAD GEOFENCES + AUTO GEOCODE
  =====================================================
  */

  useEffect(() => {
    if (!enabled || !jobId) return;

    geocodeAttemptedRef.current = false;

    const loadGeofences = async () => {
      try {
        setGeocodeStatus('checking');

        const existing = await getActiveGeofences([jobId]);

        if (existing.length > 0) {
          setGeofences(existing);
          setJobCoordinates({
            lat: existing[0].center_lat,
            lng: existing[0].center_lng,
          });
          setGeocodeStatus('ready');
          return;
        }

        const { data: job } = await supabase
          .from('jobs')
          .select('id, service_address, location_lat, location_lng')
          .eq('id', jobId)
          .maybeSingle();

        if (!job) {
          setGeocodeStatus('failed');
          return;
        }

        if (job.location_lat && job.location_lng) {
          const refreshed = await getActiveGeofences([jobId]);

          if (refreshed.length > 0) {
            setGeofences(refreshed);
            setJobCoordinates({
              lat: job.location_lat,
              lng: job.location_lng,
            });
            setGeocodeStatus('ready');
            return;
          }
        }

        if (!job.service_address) {
          setGeocodeStatus('no_address');
          return;
        }

        if (geocodeAttemptedRef.current) return;
        geocodeAttemptedRef.current = true;

        setGeocodeStatus('geocoding');

        const { data: result } = await supabase.functions.invoke(
          'geocode-job-address',
          { body: { jobId } }
        );

        if (result?.success) {
          const refreshed = await getActiveGeofences([jobId]);

          if (refreshed.length > 0) {
            setGeofences(refreshed);
            setJobCoordinates({
              lat: result.lat,
              lng: result.lng,
            });
            setGeocodeStatus('ready');
          }
        } else {
          setGeocodeStatus('failed');
        }
      } catch (err) {
        console.error('[useGeofencing] load error', err);
        setGeocodeStatus('failed');
      }
    };

    loadGeofences();
  }, [jobId, enabled]);

  /*
  =====================================================
  DWELL TIMER
  =====================================================
  */

  useEffect(() => {
    if (!enabled || insideGeofences.size === 0) {
      if (dwellIntervalRef.current) clearInterval(dwellIntervalRef.current);
      return;
    }

    dwellIntervalRef.current = setInterval(() => {
      setDwellTimes((prev) => {
        const updated = new Map(prev);
        const now = Date.now();

        insideGeofences.forEach((id) => {
          const existing = updated.get(id);

          if (existing) {
            const seconds = Math.floor((now - existing.enteredAt) / 1000);

            updated.set(id, {
              ...existing,
              dwellSeconds: seconds,
            });

            if (
              seconds >= dwellThreshold &&
              !thresholdReachedRef.current.has(id)
            ) {
              thresholdReachedRef.current.add(id);
              onDwellThresholdReached?.(id);
            }
          }
        });

        return updated;
      });
    }, 1000);

    return () => {
      if (dwellIntervalRef.current) clearInterval(dellIntervalRef.current);
    };
  }, [enabled, insideGeofences]);

  /*
  =====================================================
  LOCATION MONITOR
  =====================================================
  */

  useEffect(() => {
    if (!enabled || !landscaperId || geofences.length === 0) {
      setIsTracking(false);
      return;
    }

    setIsTracking(true);

    const checkGeofences = (position: GeolocationPosition) => {
      setCurrentLocation(position);

      const { latitude, longitude } = position.coords;

      const inside = new Set<string>();

      geofences.forEach((geofence) => {
        if (isInsideGeofence(latitude, longitude, geofence)) {
          inside.add(geofence.id);
        }
      });

      const previous = previousInsideRef.current;

      inside.forEach((id) => {
        if (!previous.has(id)) {
          setDwellTimes((prev) => {
            const updated = new Map(prev);

            updated.set(id, {
              geofenceId: id,
              enteredAt: Date.now(),
              dwellSeconds: 0,
            });

            return updated;
          });
        }
      });

      previous.forEach((id) => {
        if (!inside.has(id)) {
          setDwellTimes((prev) => {
            const updated = new Map(prev);
            updated.delete(id);
            return updated;
          });

          thresholdReachedRef.current.delete(id);
        }
      });

      setInsideGeofences(inside);
      previousInsideRef.current = inside;
    };

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        checkGeofences,
        (err) => {
          setError(err.message);
          setIsTracking(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [enabled, landscaperId, geofences]);

  /*
  =====================================================
  HELPERS
  =====================================================
  */

  const getDwellTime = useCallback(
    (id: string) => dwellTimes.get(id)?.dwellSeconds || 0,
    [dwellTimes]
  );

  const hasReachedDwellThreshold = useCallback(() => {
    for (const [, dwell] of dwellTimes) {
      if (dwell.dwellSeconds >= dwellThreshold) return true;
    }
    return false;
  }, [dwellTimes]);

  return {
    geofences,
    currentLocation,
    insideGeofences,
    dwellTimes,
    error,
    isTracking,
    geocodeStatus,
    jobCoordinates,
    getDwellTime,
    hasReachedDwellThreshold,
  };
}