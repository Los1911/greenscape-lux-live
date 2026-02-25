import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGeofencing } from '@/hooks/useGeofencing';
import { MapPin, Activity, Radio, CheckCircle, Clock, Navigation } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface GeofenceTrackerProps {
  jobId: string;
  landscaperId: string;
  jobStatus?: string;
  onJobStarted?: () => void;
  onGpsStatusChange?: (available: boolean) => void;
}


// Dwell time threshold in seconds (2 minutes)
const DWELL_THRESHOLD_SECONDS = 120;

export function GeofenceTracker({ 
  jobId, 
  landscaperId, 
  jobStatus = 'assigned',
  onJobStarted 
}: GeofenceTrackerProps) {
  // CRITICAL: Early guard - do not render if jobId is missing
  console.log('[GeofenceTracker] Mounted with jobId:', jobId, 'landscaperId:', landscaperId, 'status:', jobStatus);
  
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [jobAutoStarted, setJobAutoStarted] = useState(false);
  const [currentDwellTime, setCurrentDwellTime] = useState(0);

  // Early return if no jobId - prevents any queries with undefined
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
    
    // Only auto-start if job is in "assigned" status
    if (jobStatus !== 'assigned') {
      console.log('[GeofenceTracker] Job not in assigned status, skipping auto-start. Current status:', jobStatus);
      return;
    }

    // Prevent duplicate auto-starts
    if (jobAutoStarted || isStartingJob) {
      console.log('[GeofenceTracker] Job already started or starting, skipping');
      return;
    }

    // Check if job already has started_at set
    if (jobDetails?.started_at) {
      console.log('[GeofenceTracker] Job already has started_at, skipping auto-start');
      return;
    }

    await autoStartJob();
  }, [jobStatus, jobAutoStarted, isStartingJob, jobDetails]);

  // Auto-enable tracking for assigned jobs
  // Tracking is ALWAYS enabled for assigned/active jobs - no button needed
  const shouldTrack = ['assigned', 'active'].includes(jobStatus);


  const { 
    geofences, 
    currentLocation, 
    insideGeofences, 
    dwellTimes,
    error,
    isTracking,
    getDwellTime,
  } = useGeofencing({
    jobId,
    landscaperId,
    enabled: shouldTrack && !!jobId && !!landscaperId,
    dwellThreshold: DWELL_THRESHOLD_SECONDS,
    onDwellThresholdReached: handleDwellThresholdReached,
  });

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
      // Query jobs table directly without joining to clients
      // (no FK relationship exists between jobs and clients)
      // NOTE: 'location' column does not exist - use service_address, property_address fields instead
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
        console.log('[GeofenceTracker] Job details loaded:', data?.id, 'status:', data?.status);
        setJobDetails(data);
        
        // If job is already active, mark as auto-started
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
      // Update job status to active with started_at timestamp
      const { data, error } = await supabase
        .from('jobs')
        .update({
          status: 'active',

          started_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('status', 'assigned') // Only update if still assigned (prevents race conditions)
        .select()
        .single();

      if (error) {
        console.error('[GeofenceTracker] Error auto-starting job:', error);
        return;
      }

      console.log('[GeofenceTracker] Job auto-started successfully:', data);
      setJobAutoStarted(true);
      setJobDetails(data);

      // Record the auto-start event in GPS tracking
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

      // Notify parent component
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
            className={isTracking ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : ''}
          >
            {isTracking ? 'Active' : 'Waiting'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tracking Status */}
        {!isTracking ? (
          <div className="text-center py-4 text-emerald-300/70">
            <Radio className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Waiting for GPS signal...</p>
            <p className="text-xs text-emerald-300/50 mt-1">
              Tracking starts automatically when you arrive onsite
            </p>
          </div>
        ) : (
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
                    {jobDetails.service_address || jobDetails.property_address || 
                     (jobDetails.property_city && jobDetails.property_state 
                       ? `${jobDetails.property_city}, ${jobDetails.property_state}` 
                       : 'N/A')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-emerald-300/70">Service</span>
                  <span className="text-emerald-200">
                    {jobDetails.service_type || jobDetails.service_name || 'N/A'}
                  </span>
                </div>
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
      </CardContent>
    </Card>
  );
}
