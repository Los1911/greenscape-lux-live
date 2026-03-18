import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGeofencing } from '@/hooks/useGeofencing';
import { MapPin, Activity, Radio, CheckCircle, Clock, Navigation, AlertTriangle, Loader2, MapPinOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface GeofenceTrackerProps {
  jobId: string;
  landscaperId: string;
  jobStatus?: string;
  onJobStarted?: () => void;
  onGpsStatusChange?: (available: boolean) => void;
  onGeofenceStatusChange?: (isInside: boolean) => void;
}


// Dwell time threshold in seconds (2 minutes)
const DWELL_THRESHOLD_SECONDS = 120;

export function GeofenceTracker({ 
  jobId, 
  landscaperId, 
  jobStatus = 'assigned',
  onJobStarted,
  onGpsStatusChange,
  onGeofenceStatusChange,
}: GeofenceTrackerProps) {

  console.log('[GeofenceTracker] Mounted with jobId:', jobId, 'landscaperId:', landscaperId, 'status:', jobStatus);
  
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [jobAutoStarted, setJobAutoStarted] = useState(false);
  const [currentDwellTime, setCurrentDwellTime] = useState(0);

  // Early return if no jobId
  if (!jobId) {
    console.warn('[GeofenceTracker] No jobId provided, not rendering');
    return null;
  }

  if (!landscaperId) {
    console.warn('[GeofenceTracker] No landscaperId provided, not rendering');
    return null;
  }

  // Callback when dwell threshold is reached - auto-start the job
  const handleDwellThresholdReached = useCallback(async (geofenceId: string) => {
    console.log('[GeofenceTracker] Dwell threshold reached for geofence:', geofenceId);
    
    if (jobStatus !== 'assigned') {
      console.log('[GeofenceTracker] Job not in assigned status, skipping auto-start. Current status:', jobStatus);
      return;
    }

    if (jobAutoStarted || isStartingJob) {
      console.log('[GeofenceTracker] Job already started or starting, skipping');
      return;
    }

    if (jobDetails?.started_at) {
      console.log('[GeofenceTracker] Job already has started_at, skipping auto-start');
      return;
    }

    await autoStartJob();
  }, [jobStatus, jobAutoStarted, isStartingJob, jobDetails]);

  // Tracking is ALWAYS enabled for assigned/active jobs
  const shouldTrack = ['assigned', 'active'].includes(jobStatus);

  const { 
    geofences, 
    currentLocation, 
    insideGeofences, 
    dwellTimes,
    error,
    isTracking,
    geocodeStatus,
    jobCoordinates,
    getDwellTime,
  } = useGeofencing({
    jobId,
    landscaperId,
    enabled: shouldTrack && !!jobId && !!landscaperId,
    dwellThreshold: DWELL_THRESHOLD_SECONDS,
    onDwellThresholdReached: handleDwellThresholdReached,
  });

  // Notify parent about GPS availability based on geocode status
  useEffect(() => {
    if (onGpsStatusChange) {
      const available = geocodeStatus === 'ready' && geofences.length > 0;
      onGpsStatusChange(available);
    }
  }, [geocodeStatus, geofences.length, onGpsStatusChange]);

  // ─── Notify parent about geofence entry/exit ────────────────────────
  // Exposes isInsideGeofence boolean to parent (JobCard) so the
  // Start Job button can be gated on arrival verification.
  useEffect(() => {
    if (onGeofenceStatusChange) {
      const isInside = insideGeofences.size > 0;
      onGeofenceStatusChange(isInside);
    }
  }, [insideGeofences, onGeofenceStatusChange]);


  // Update current dwell time for display
  useEffect(() => {
    if (insideGeofences.size > 0) {
      const firstGeofenceId = Array.from(insideGeofences)[0];
      const dwellTime = getDwellTime(firstGeofenceId);
      setCurrentDwellTime(dwellTime);
    } else {
      setCurrentDwellTime(0);
    }
  }, [insideGeofences, getDwellTime, dwellTimes]);

  useEffect(() => {
    if (!jobId) {
      console.warn('[GeofenceTracker] loadJobDetails skipped - no jobId');
      return;
    }
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    if (!jobId) {
      console.warn('[GeofenceTracker] loadJobDetails called without jobId');
      return;
    }
    
    console.log('[GeofenceTracker] Loading job details for jobId:', jobId);
    
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, status, service_address, property_address, property_city, property_state, property_zip, service_type, service_name, started_at, location_lat, location_lng, client_email')
        .eq('id', jobId)
        .maybeSingle();

      if (error) {
        console.error('[GeofenceTracker] Error loading job details:', error);
        return;
      }
      
      if (data) {
        console.log('[GeofenceTracker] Job details loaded:', data?.id, 'status:', data?.status, 'coords:', data?.location_lat, data?.location_lng);
        setJobDetails(data);
        
        if (data?.status === 'active') {
          setJobAutoStarted(true);
        }
      } else {
        console.warn('[GeofenceTracker] No job found with id:', jobId);
      }
    } catch (err) {
      console.warn('[GeofenceTracker] Failed to load job details:', err);
    }
  };

  const autoStartJob = async () => {
    if (!jobId || !landscaperId) {
      console.error('[GeofenceTracker] Cannot auto-start job - missing jobId or landscaperId');
      return;
    }

    console.log('[GeofenceTracker] Auto-starting job:', jobId);
    setIsStartingJob(true);

    try {
      const { data, error } = await supabase
        .from('jobs')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('status', 'assigned')
        .select()
        .single();

      if (error) {
        console.error('[GeofenceTracker] Error auto-starting job:', error);
        return;
      }

      console.log('[GeofenceTracker] Job auto-started successfully:', data);
      setJobAutoStarted(true);
      setJobDetails(data);

      if (currentLocation) {
        await supabase.from('gps_tracking').insert({
          job_id: jobId,
          landscaper_id: landscaperId,
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy,
          event_type: 'job_auto_started',
          recorded_at: new Date().toISOString(),
        });
      }

      onJobStarted?.();

    } catch (err) {
      console.error('[GeofenceTracker] Failed to auto-start job:', err);
    } finally {
      setIsStartingJob(false);
    }
  };

  const isInsideAnyGeofence = insideGeofences.size > 0;
  const progressPercent = Math.min((currentDwellTime / DWELL_THRESHOLD_SECONDS) * 100, 100);
  const timeRemaining = Math.max(DWELL_THRESHOLD_SECONDS - currentDwellTime, 0);

  // Don't show tracker for completed jobs
  if (jobStatus === 'completed') {
    return null;
  }

  // Derive the address display string
  const displayAddress = jobDetails?.service_address || jobDetails?.property_address || 
    (jobDetails?.property_city && jobDetails?.property_state 
      ? `${jobDetails.property_city}, ${jobDetails.property_state}` 
      : null);

  // ─── Coordinate check ───────────────────────────────────────────────
  // Check BOTH the database record (jobDetails) and the hook's resolved
  // coordinates (jobCoordinates). If either source has valid lat/lng,
  // the job has coordinates — regardless of what geocodeStatus reports.
  const hasCoordinates =
    (jobDetails?.location_lat != null && jobDetails?.location_lng != null) ||
    (jobCoordinates?.lat != null && jobCoordinates?.lng != null);

  // ─── Determine which UI state to render ─────────────────────────────
  // Priority order:
  //   1. isTracking → show active tracking UI (GPS running silently)
  //   2. hasCoordinates && !isTracking → "Initializing location…"
  //   3. !hasCoordinates && terminal status → "Location data unavailable"
  //   4. Checking / geocoding states → loading spinners
  //   5. Idle fallback → waiting message

  return (
    <Card className="bg-black/40 border-emerald-500/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-emerald-300">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <span className="text-base">Location Tracking</span>
          </div>
          <Badge 
            variant={isTracking ? 'default' : 'secondary'}
            className={
              isTracking 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' 
                : (!hasCoordinates && (geocodeStatus === 'failed' || geocodeStatus === 'no_address'))
                  ? 'bg-red-500/20 text-red-300 border-red-500/50'
                  : (geocodeStatus === 'geocoding' || geocodeStatus === 'checking' || (hasCoordinates && !isTracking))
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : ''
            }
          >
            {isTracking 
              ? 'Active' 
              : hasCoordinates && !isTracking
                ? 'Initializing'
                : geocodeStatus === 'geocoding' 
                  ? 'Geocoding' 
                  : geocodeStatus === 'checking'
                    ? 'Loading'
                    : (geocodeStatus === 'failed' || geocodeStatus === 'no_address')
                      ? 'Unavailable'
                      : 'Waiting'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ════════════════════════════════════════════════════════════
            STATE 1: GPS tracking is active
            ─ Show the full active tracking UI. No status messages.
            ════════════════════════════════════════════════════════════ */}
        {isTracking && (
          <>
            {/* Active Tracking Indicator */}
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                <span className="font-medium text-emerald-200">GPS Active</span>
              </div>
              <Badge 
                variant={isInsideAnyGeofence ? 'default' : 'secondary'}
                className={isInsideAnyGeofence 
                  ? 'bg-green-500/20 text-green-300 border-green-500/50' 
                  : 'bg-gray-500/20 text-gray-300'
                }
              >
                {isInsideAnyGeofence ? 'Onsite' : 'En Route'}
              </Badge>
            </div>

            {/* Onsite Detection & Auto-Start Progress */}
            {isInsideAnyGeofence && jobStatus === 'assigned' && !jobAutoStarted && (
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Navigation className="w-5 h-5 text-blue-400" />
                  <span className="font-medium text-blue-200">Arrived Onsite</span>
                </div>
                
                {/* Dwell Time Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-300/70">Auto-start in:</span>
                    <span className="text-blue-200 font-mono">
                      {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="w-full bg-blue-900/30 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-300/60 text-center">
                    Job will start automatically after 2 minutes onsite
                  </p>
                </div>
              </div>
            )}

            {/* Job Auto-Started Confirmation */}
            {(jobAutoStarted || jobStatus === 'active') && (
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2 text-green-300">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Job In Progress</span>
                </div>
                <p className="text-sm text-green-300/70 mt-2">
                  {jobDetails?.started_at 
                    ? `Started at ${new Date(jobDetails.started_at).toLocaleTimeString()}`
                    : 'Tracking your work time'
                  }
                </p>
              </div>
            )}

            {/* Starting Job Indicator */}
            {isStartingJob && (
              <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                <div className="flex items-center gap-2 text-yellow-300">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Starting job...</span>
                </div>
              </div>
            )}

            {/* Job Details */}
            {jobDetails && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-300/70">Location</span>
                  <span className="text-emerald-200 text-right max-w-[60%] truncate">
                    {displayAddress || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-emerald-300/70">Service</span>
                  <span className="text-emerald-200">
                    {jobDetails.service_type || jobDetails.service_name || 'N/A'}
                  </span>
                </div>

                {/* Show geofence coordinates when tracking */}
                {jobCoordinates && (
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-300/70">Geofence</span>
                    <span className="text-emerald-200 font-mono text-xs">
                      {jobCoordinates.lat.toFixed(5)}, {jobCoordinates.lng.toFixed(5)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Current Location */}
            {currentLocation && (
              <div className="p-3 bg-black/30 rounded-lg text-xs">
                <p className="text-emerald-300/70 mb-1">Current Position</p>
                <p className="text-emerald-200 font-mono">
                  {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
                </p>
                <p className="text-emerald-300/50 mt-1">
                  Accuracy: ±{currentLocation.coords.accuracy.toFixed(0)}m
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-500/10 rounded-lg text-red-300 text-sm border border-red-500/30">
                {error}
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════
            STATE 2: NOT tracking, but coordinates EXIST in the DB
            ─ GPS is still initializing. Show a calm "Initializing" msg.
            ─ This covers the case where geocodeStatus may be 'failed'
              or 'no_address' but the job record already has valid
              location_lat / location_lng.
            ════════════════════════════════════════════════════════════ */}
        {!isTracking && hasCoordinates && (
          <div className="text-center py-4 text-emerald-300/70">
            <Loader2 className="w-10 h-10 mx-auto mb-2 animate-spin opacity-60" />
            <p className="text-sm font-medium">Initializing location&hellip;</p>
            <p className="text-xs text-emerald-300/50 mt-1">
              GPS coordinates found &mdash; setting up geofence tracking
            </p>
            {(jobDetails?.location_lat != null && jobDetails?.location_lng != null) && (
              <div className="mt-3 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <p className="text-xs text-emerald-300/60">
                  Coordinates: {Number(jobDetails.location_lat).toFixed(5)}, {Number(jobDetails.location_lng).toFixed(5)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STATE 3: NOT tracking, NO coordinates, and geocode is
            still in progress (checking / geocoding)
            ─ Show a loading spinner while the system resolves.
            ════════════════════════════════════════════════════════════ */}
        {!isTracking && !hasCoordinates && (geocodeStatus === 'checking' || geocodeStatus === 'geocoding') && (
          <div className="text-center py-4 text-amber-300/80">
            <Loader2 className="w-10 h-10 mx-auto mb-2 animate-spin opacity-70" />
            <p className="text-sm font-medium">
              {geocodeStatus === 'checking' ? 'Loading job location...' : 'Resolving address coordinates...'}
            </p>
            <p className="text-xs text-amber-300/50 mt-1">
              {geocodeStatus === 'geocoding' 
                ? 'Converting service address to GPS coordinates' 
                : 'Checking for existing geofence data'}
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STATE 4: NOT tracking, NO coordinates, terminal failure
            ─ Geocoding failed or no address exists AND the job truly
              has no location_lat / location_lng.
            ─ Only NOW show "Location data unavailable".
            ════════════════════════════════════════════════════════════ */}
        {!isTracking && !hasCoordinates && (geocodeStatus === 'no_address') && (
          <div className="text-center py-4">
            <MapPinOff className="w-10 h-10 mx-auto mb-2 text-red-400/60" />
            <p className="text-sm font-medium text-red-300">Location data unavailable</p>
            <p className="text-xs text-red-300/50 mt-1">
              This job has no service address on file. GPS tracking cannot be activated.
            </p>
          </div>
        )}

        {!isTracking && !hasCoordinates && (geocodeStatus === 'failed') && (
          <div className="text-center py-4">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-400/60" />
            <p className="text-sm font-medium text-red-300">Location data unavailable</p>
            <p className="text-xs text-red-300/50 mt-1">
              Could not resolve coordinates for this job address. GPS tracking is inactive.
            </p>
            {error && (
              <p className="text-xs text-red-400/40 mt-2 italic">{error}</p>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STATE 5: NOT tracking, NO coordinates, idle / ready
            ─ Fallback waiting state before geocode flow kicks in.
            ════════════════════════════════════════════════════════════ */}
        {!isTracking && !hasCoordinates && (geocodeStatus === 'idle' || geocodeStatus === 'ready') && (
          <div className="text-center py-4 text-emerald-300/70">
            <Radio className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Waiting for GPS signal...</p>
            <p className="text-xs text-emerald-300/50 mt-1">
              Tracking starts automatically when you arrive onsite
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

