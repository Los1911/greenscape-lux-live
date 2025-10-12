import React, { useEffect, useRef, useState } from 'react';
import { PhotoMarker } from './PhotoMarker';
import { MapPin, Navigation, Route, AlertTriangle } from 'lucide-react';
import { loadGoogleMaps, validateGoogleMapsApiKey } from '../../lib/googleMaps';
interface MapProps {
  photos: Array<{
    id: string;
    url: string;
    jobId: string;
    jobTitle: string;
    latitude: number;
    longitude: number;
    capturedAt: string;
    type: string;
  }>;
  jobs: Array<{
    id: string;
    title: string;
    address: string;
    latitude: number;
    longitude: number;
    status: string;
  }>;
  onPhotoSelect: (photo: any) => void;
  showRoute?: boolean;
  currentLocation?: { lat: number; lng: number };
}

export const InteractiveMap: React.FC<MapProps> = ({
  photos,
  jobs,
  onPhotoSelect,
  showRoute = false,
  currentLocation
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      // Validate API key first
      const validation = validateGoogleMapsApiKey();
      if (!validation.isValid) {
        setError(validation.error || 'Invalid Google Maps API key');
        setIsLoading(false);
        return;
      }

      try {
        // Use the new Google Maps service
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
                  styles: [
                    {
                      featureType: "poi",
                      elementType: "labels",
                      stylers: [{ visibility: "off" }]
                    }
                  ]
                });

                setMap(mapInstance);
                setIsLoading(false);
                setError(null);
              } catch (mapError) {
                console.error('Error initializing map:', mapError);
                setError('Failed to initialize map');
                setIsLoading(false);
              }
            },
            onError: (loadError) => {
              console.error('Error loading Google Maps:', loadError);
              setError(loadError.message || 'Failed to load Google Maps');
              setIsLoading(false);
            }
          }
        );
      } catch (serviceError) {
        console.error('Google Maps service error:', serviceError);
        setError(serviceError instanceof Error ? serviceError.message : 'Google Maps service error');
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [currentLocation]);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    map.data.forEach((feature) => {
      map.data.remove(feature);
    });

    // Add job location markers
    jobs.forEach((job) => {
      const marker = new google.maps.Marker({
        position: { lat: job.latitude, lng: job.longitude },
        map: map,
        title: job.title,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="${job.status === 'completed' ? '#10b981' : '#3b82f6'}" stroke="white" stroke-width="2"/>
              <path d="M16 8l-4 8h8l-4-8z" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32)
        }
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
    });

    // Add photo markers
    photos.forEach((photo) => {
      const photoMarker = new google.maps.Marker({
        position: { lat: photo.latitude, lng: photo.longitude },
        map: map,
        title: `Photo from ${photo.jobTitle}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#ef4444" stroke="white" stroke-width="2"/>
              <path d="M8 9h8l-1 6H9l-1-6z" fill="white"/>
              <circle cx="12" cy="11" r="2" fill="#ef4444"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24)
        }
      });

      photoMarker.addListener('click', () => {
        setSelectedPhoto(photo.id);
        onPhotoSelect(photo);
      });
    });

    // Fit bounds to show all markers
    if (jobs.length > 0 || photos.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      jobs.forEach(job => bounds.extend({ lat: job.latitude, lng: job.longitude }));
      photos.forEach(photo => bounds.extend({ lat: photo.latitude, lng: photo.longitude }));
      map.fitBounds(bounds);
    }
  }, [map, jobs, photos, onPhotoSelect]);

  if (error) {
    return (
      <div className="w-full h-96 bg-red-50 rounded-lg flex items-center justify-center border border-red-200">
        <div className="text-center p-6">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Google Maps Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <button
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          onClick={() => {
            if (navigator.geolocation && map) {
              navigator.geolocation.getCurrentPosition((position) => {
                const pos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                map.setCenter(pos);
                map.setZoom(15);
              });
            }
          }}
          title="Center on current location"
        >
          <Navigation className="w-5 h-5 text-gray-700" />
        </button>
        
        <button
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          onClick={() => {
            if (map && (jobs.length > 0 || photos.length > 0)) {
              const bounds = new google.maps.LatLngBounds();
              jobs.forEach(job => bounds.extend({ lat: job.latitude, lng: job.longitude }));
              photos.forEach(photo => bounds.extend({ lat: photo.latitude, lng: photo.longitude }));
              map.fitBounds(bounds);
            }
          }}
          title="Fit all markers"
        >
          <MapPin className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md">
        <div className="text-sm font-semibold mb-2">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            Active Jobs
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            Completed Jobs
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            Photos
          </div>
        </div>
      </div>
    </div>
  );
};