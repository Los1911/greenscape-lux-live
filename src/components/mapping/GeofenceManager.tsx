import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Geofence, upsertGeofence, getGeofenceEvents, GeofenceEvent } from '@/utils/geofencing';
import { MapPin, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';

interface GeofenceManagerProps {
  jobId: string;
  jobLocation: { lat: number; lng: number };
  onGeofenceUpdate?: (geofence: Geofence) => void;
}

export function GeofenceManager({ jobId, jobLocation, onGeofenceUpdate }: GeofenceManagerProps) {
  const [geofence, setGeofence] = useState<Geofence | null>(null);
  const [radius, setRadius] = useState(50);
  const [events, setEvents] = useState<GeofenceEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGeofence();
    loadEvents();
  }, [jobId]);

  const loadGeofence = async () => {
    const { data } = await supabase
      .from('geofences')
      .select('*')
      .eq('job_id', jobId)
      .single();
    
    if (data) {
      setGeofence(data);
      setRadius(data.radius_meters);
    }
  };

  const loadEvents = async () => {
    const data = await getGeofenceEvents(jobId);
    setEvents(data);
  };

  const handleSaveGeofence = async () => {
    setLoading(true);
    try {
      const data = await upsertGeofence(
        jobId,
        jobLocation.lat,
        jobLocation.lng,
        radius
      );
      setGeofence(data);
      onGeofenceUpdate?.(data);
    } catch (error) {
      console.error('Failed to save geofence:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Geofence Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Geofence Radius (meters)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="number"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                min={10}
                max={500}
              />
              <Button onClick={handleSaveGeofence} disabled={loading}>
                {geofence ? 'Update' : 'Create'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Recommended: 50-100 meters for accurate detection
            </p>
          </div>

          {geofence && (
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Geofence Active</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Radius: {geofence.radius_meters}m | Auto-tracking enabled
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Entry/Exit History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm">No events recorded yet</p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {event.event_type === 'entry' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-orange-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {event.event_type === 'entry' ? 'Arrived' : 'Departed'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.job_status_before} → {event.job_status_after}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                    <Badge variant="outline" className="mt-1">
                      {event.distance_from_center?.toFixed(0)}m from center
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
