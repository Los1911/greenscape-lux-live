import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { loadGoogleMaps, validateGoogleMapsApiKey } from '../../lib/googleMaps';

interface MapLocationPickerProps {
  onLocationSelect?: (location: { address: string; lat: number; lng: number }) => void;
  defaultCenter?: { lat: number; lng: number };
  defaultAddress?: string;
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  onLocationSelect,
  defaultCenter = { lat: 35.2271, lng: -80.8431 }, // Charlotte, NC
  defaultAddress = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [selectedAddress, setSelectedAddress] = useState(defaultAddress);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      const validation = validateGoogleMapsApiKey();
      if (!validation.isValid) {
        setError(validation.error || 'Invalid API key');
        setIsLoading(false);
        return;
      }

      try {
        await loadGoogleMaps(
          { libraries: ['places'] },
          {
            onLoad: async () => {
              const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
              
              const mapInstance = new Map(mapRef.current!, {
                zoom: 12,
                center: defaultCenter,
                mapTypeId: google.maps.MapTypeId.ROADMAP
              });

              const markerInstance = new google.maps.Marker({
                position: defaultCenter,
                map: mapInstance,
                draggable: true,
                title: 'Selected Location'
              });

              markerInstance.addListener('dragend', async () => {
                const pos = markerInstance.getPosition();
                if (pos) {
                  const geocoder = new google.maps.Geocoder();
                  const result = await geocoder.geocode({ location: pos });
                  if (result.results[0]) {
                    setSelectedAddress(result.results[0].formatted_address);
                    onLocationSelect?.({
                      address: result.results[0].formatted_address,
                      lat: pos.lat(),
                      lng: pos.lng()
                    });
                  }
                }
              });

              setMap(mapInstance);
              setMarker(markerInstance);
              setIsLoading(false);
            }
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (!map || !inputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'geometry']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        map.setCenter(place.geometry.location);
        marker?.setPosition(place.geometry.location);
        setSelectedAddress(place.formatted_address || '');
        onLocationSelect?.({
          address: place.formatted_address || '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
      }
    });
  }, [map, marker]);

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-black border border-emerald-500/30 rounded-lg overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-emerald-900/20 to-black border-b border-emerald-500/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for an address..."
            className="w-full pl-10 pr-4 py-3 bg-black border border-emerald-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        )}
        <div ref={mapRef} className="w-full h-96" />
      </div>

      {selectedAddress && (
        <div className="p-4 bg-gradient-to-r from-black to-emerald-900/20 border-t border-emerald-500/30">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-400 mb-1">Selected Address:</p>
              <p className="text-white font-medium">{selectedAddress}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
