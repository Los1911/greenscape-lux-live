import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, AlertTriangle } from 'lucide-react';
import { loadGoogleMaps, validateGoogleMapsApiKey } from '@/lib/googleMaps';
import { Geofence } from '@/utils/geofencing';

interface MapProps {
  jobs: Array<{
    id: string;
    title: string;
    address: string;
    latitude: number;
    longitude: number;
    status: string;
  }>;
  geofences?: Geofence[];
  currentLocation?: { lat: number; lng: number };
  showRoute?: boolean;
}

export const InteractiveMapWithGeofences: React.FC<MapProps> = ({
  jobs,
  geofences = [],
  currentLocation,
  showRoute = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const circlesRef = useRef<google.maps.Circle[]>([]);

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      const validation = validateGoogleMapsApiKey();
      if (!validation.isValid) {
        setError(validation.error || 'Invalid Google Maps API key');
        setIsLoading(false);
        return;
      }

      try {
        await loadGoogleMaps(
          { libraries: ['places', 'geometry'] },
          {
            onLoad: async () => {
              try {
                const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
                
                const mapInstance = new Map(mapRef.current!, {
                  zoom: 12,
                  center: currentLocation || { lat: 40.7128, lng: -74.0060 },
                  mapTypeId: google.maps.MapTypeId.ROADMAP,
                });

                setMap(mapInstance);
                setIsLoading(false);
                setError(null);
              } catch (mapError) {
                setError('Failed to initialize map');
                setIsLoading(false);
              }
            },
            onError: (loadError) => {
              setError(loadError.message || 'Failed to load Google Maps');
              setIsLoading(false);
            }
          }
        );
      } catch (serviceError) {
        setError('Google Maps service error');
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [currentLocation]);

  useEffect(() => {
    if (!map) return;

    // Clear existing circles
    circlesRef.current.forEach(circle => circle.setMap(null));
    circlesRef.current = [];

    // Add job markers and geofence circles
    jobs.forEach((job) => {
      const marker = new google.maps.Marker({
        position: { lat: job.latitude, lng: job.longitude },
        map: map,
        title: job.title,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold">${job.title}</h3>
            <p class="text-sm text-gray-600">${job.address}</p>
            <p class="text-xs text-gray-500">Status: ${job.status}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      // Add geofence circle if exists
      const geofence = geofences.find(g => g.job_id === job.id);
      if (geofence) {
        const circle = new google.maps.Circle({
          strokeColor: '#3b82f6',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
          map: map,
          center: { lat: geofence.center_lat, lng: geofence.center_lng },
          radius: geofence.radius_meters,
        });
        circlesRef.current.push(circle);
      }
    });

    // Fit bounds
    if (jobs.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      jobs.forEach(job => bounds.extend({ lat: job.latitude, lng: job.longitude }));
      map.fitBounds(bounds);
    }
  }, [map, jobs, geofences]);

  if (error) {
    return (
      <div className="w-full h-96 bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};
