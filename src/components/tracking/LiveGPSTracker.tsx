import { useGPSTracking } from '@/hooks/useGPSTracking';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LiveGPSTrackerProps {
  landscaperId: string;
  jobId: string | null;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

export function LiveGPSTracker({ landscaperId, jobId, onLocationUpdate }: LiveGPSTrackerProps) {
  const { isTracking, currentLocation, error, startTracking, stopTracking } = useGPSTracking(
    landscaperId,
    jobId
  );

  const handleLocationUpdate = async () => {
    if (currentLocation && jobId) {
      try {
        await supabase.functions.invoke('process-gps-location', {
          body: {
            landscaperId,
            jobId,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            speed: currentLocation.speed,
          },
        });
        onLocationUpdate?.(currentLocation.latitude, currentLocation.longitude);
      } catch (err) {
        console.error('Failed to process location:', err);
      }
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">GPS Tracking</h3>
        </div>
        {isTracking ? (
          <Button onClick={stopTracking} variant="destructive" size="sm">
            Stop Tracking
          </Button>
        ) : (
          <Button onClick={startTracking} size="sm">
            Start Tracking
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {currentLocation && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </span>
          </div>
          {currentLocation.speed && (
            <div className="text-gray-600">Speed: {currentLocation.speed.toFixed(1)} mph</div>
          )}
          {currentLocation.accuracy && (
            <div className="text-gray-600">
              Accuracy: ±{currentLocation.accuracy.toFixed(0)}m
            </div>
          )}
          <div className="text-gray-500 text-xs">
            Last update: {currentLocation.timestamp.toLocaleTimeString()}
          </div>
          {jobId && (
            <Button onClick={handleLocationUpdate} size="sm" className="w-full mt-2">
              Update Location
            </Button>
          )}
        </div>
      )}

      {isTracking && !currentLocation && (
        <div className="text-gray-500 text-sm">Acquiring GPS signal...</div>
      )}
    </Card>
  );
}