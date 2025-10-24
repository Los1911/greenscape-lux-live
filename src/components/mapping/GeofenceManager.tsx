import React, { useState, useEffect } from 'react';
import { MapPin, Shield, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface GeofenceZone {
  id: string;
  jobId: string;
  jobTitle: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  isActive: boolean;
  autoCheckin: boolean;
}

interface GeofenceManagerProps {
  jobs: Array<{
    id: string;
    title: string;
    latitude: number;
    longitude: number;
    status: string;
  }>;
  onAutoCheckin: (jobId: string, location: { lat: number; lng: number }) => void;
}

export const GeofenceManager: React.FC<GeofenceManagerProps> = ({
  jobs,
  onAutoCheckin
}) => {
  const [geofences, setGeofences] = useState<GeofenceZone[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [checkedInJobs, setCheckedInJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initialize geofences for active jobs
    const initialGeofences: GeofenceZone[] = jobs
      .filter(job => job.status === 'assigned' || job.status === 'in_progress')
      .map(job => ({
        id: `geofence-${job.id}`,
        jobId: job.id,
        jobTitle: job.title,
        latitude: job.latitude,
        longitude: job.longitude,
        radius: 100, // 100 meter radius
        isActive: true,
        autoCheckin: true
      }));
    
    setGeofences(initialGeofences);
  }, [jobs]);

  useEffect(() => {
    if (isTracking) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => stopLocationTracking();
  }, [isTracking]);

  useEffect(() => {
    if (currentLocation && geofences.length > 0) {
      checkGeofences();
    }
  }, [currentLocation, geofences]);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );

    setWatchId(id);
  };

  const stopLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  const calculateDistance = (
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const checkGeofences = () => {
    if (!currentLocation) return;

    geofences.forEach(geofence => {
      if (!geofence.isActive || !geofence.autoCheckin) return;

      const distance = calculateDistance(
        currentLocation,
        { lat: geofence.latitude, lng: geofence.longitude }
      );

      if (distance <= geofence.radius && !checkedInJobs.has(geofence.jobId)) {
        // Auto check-in
        setCheckedInJobs(prev => new Set(prev).add(geofence.jobId));
        onAutoCheckin(geofence.jobId, currentLocation);
        
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Auto checked-in to ${geofence.jobTitle}`, {
            body: 'You have entered the job site area.',
            icon: '/favicon.ico'
          });
        }
      }
    });
  };

  const toggleGeofence = (geofenceId: string) => {
    setGeofences(prev => prev.map(g => 
      g.id === geofenceId ? { ...g, isActive: !g.isActive } : g
    ));
  };

  const toggleAutoCheckin = (geofenceId: string) => {
    setGeofences(prev => prev.map(g => 
      g.id === geofenceId ? { ...g, autoCheckin: !g.autoCheckin } : g
    ));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h3 className="text-xl sm:text-2xl font-semibold flex items-center text-green-300">
          <Shield className="w-5 h-5 mr-2" />
          Geofence Manager
        </h3>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-sm text-green-200/70">GPS Tracking</span>
          <Switch
            checked={isTracking}
            onCheckedChange={setIsTracking}
          />
        </div>
      </div>

      {/* Current location status */}
      <div className="p-3 sm:p-4 bg-black/40 border border-green-500/25 rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center">
            <MapPin className={`w-4 h-4 mr-2 ${currentLocation ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="text-sm font-medium text-green-300">Current Location</span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs ${
            currentLocation ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {currentLocation ? 'Active' : 'Inactive'}
          </div>
        </div>
        {currentLocation && (
          <div className="text-xs text-green-200/70 mt-2">
            {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          </div>
        )}
      </div>

      {/* Geofence zones */}
      <div className="space-y-3 sm:space-y-4">
        <h4 className="font-medium text-green-300">Active Geofences:</h4>
        {geofences.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-green-300/50">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active job sites for geofencing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {geofences.map(geofence => {
              const isCheckedIn = checkedInJobs.has(geofence.jobId);
              const distance = currentLocation ? 
                calculateDistance(currentLocation, { lat: geofence.latitude, lng: geofence.longitude }) : 
                null;

              return (
                <div key={geofence.id} className="border border-green-500/25 rounded-lg p-3 sm:p-4 bg-black/40">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3">
                    <div className="flex items-center min-w-0 flex-1">
                      {isCheckedIn ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                      )}
                      <span className="font-medium text-sm text-green-300 truncate">{geofence.jobTitle}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={geofence.isActive}
                        onCheckedChange={() => toggleGeofence(geofence.id)}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-green-200/70 space-y-1 mb-3">
                    <div>Radius: {geofence.radius}m</div>
                    <div>
                      Location: {geofence.latitude.toFixed(4)}, {geofence.longitude.toFixed(4)}
                    </div>
                    {distance !== null && (
                      <div className={`font-medium ${distance <= geofence.radius ? 'text-green-400' : 'text-green-200/70'}`}>
                        Distance: {Math.round(distance)}m {distance <= geofence.radius ? '(Inside zone)' : '(Outside zone)'}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={geofence.autoCheckin}
                        onCheckedChange={() => toggleAutoCheckin(geofence.id)}
                        size="sm"
                      />
                      <span className="text-xs text-green-200/70">Auto check-in</span>
                    </div>
                    {isCheckedIn && (
                      <div className="flex items-center text-xs text-green-400">
                        <Clock className="w-3 h-3 mr-1" />
                        Checked in
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!isTracking && (
        <div className="p-3 sm:p-4 bg-yellow-50/10 border border-yellow-500/25 rounded-lg">
          <div className="flex items-center text-yellow-300">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm">Enable GPS tracking to use geofencing features</span>
          </div>
        </div>
      )}
    </div>
  );
};