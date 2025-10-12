import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LocationData {
  id: string;
  lat: number;
  lng: number;
  photoCount: number;
  address: string;
  jobType: string;
}

interface LocationHeatmapProps {
  locations: LocationData[];
  onLocationClick?: (location: LocationData) => void;
}

export const LocationHeatmap: React.FC<LocationHeatmapProps> = ({ locations, onLocationClick }) => {
  const maxPhotos = Math.max(...locations.map(l => l.photoCount), 1);
  
  const getIntensity = (count: number) => {
    const intensity = count / maxPhotos;
    return Math.max(0.2, intensity);
  };

  const getColor = (count: number) => {
    const intensity = getIntensity(count);
    if (intensity > 0.8) return '#dc2626'; // red-600
    if (intensity > 0.6) return '#ea580c'; // orange-600
    if (intensity > 0.4) return '#f59e0b'; // amber-500
    if (intensity > 0.2) return '#eab308'; // yellow-500
    return '#84cc16'; // lime-500
  };

  const topLocations = locations
    .sort((a, b) => b.photoCount - a.photoCount)
    .slice(0, 10);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📍 Work Site Activity Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Simplified location list since we can't embed actual maps */}
          <div className="grid gap-3">
            {topLocations.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onLocationClick?.(location)}
                style={{
                  borderLeftColor: getColor(location.photoCount),
                  borderLeftWidth: '4px'
                }}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{location.address}</div>
                  <div className="text-xs text-gray-500">{location.jobType}</div>
                  <div className="text-xs text-gray-400">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{location.photoCount}</div>
                  <div className="text-xs text-gray-500">photos</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
            <span>Activity Level:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-lime-500"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span>High</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};