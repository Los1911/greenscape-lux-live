import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';

interface RoutePoint {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}

interface RouteMapVisualizationProps {
  originalRoute: RoutePoint[];
  optimizedRoute: RoutePoint[];
  showOptimized: boolean;
}

export const RouteMapVisualization: React.FC<RouteMapVisualizationProps> = ({
  originalRoute,
  optimizedRoute,
  showOptimized
}) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize map visualization
    // This would integrate with Google Maps API or similar
    // For now, showing a visual representation
  }, [originalRoute, optimizedRoute, showOptimized]);

  const activeRoute = showOptimized ? optimizedRoute : originalRoute;
  const routeColor = showOptimized ? 'green' : 'gray';

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold flex items-center">
          <Navigation className="w-5 h-5 mr-2" />
          Route Visualization
        </h4>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          showOptimized 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {showOptimized ? 'Optimized Route' : 'Current Route'}
        </div>
      </div>

      <div 
        ref={mapRef}
        className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden"
      >
        {/* Map placeholder - would integrate with actual mapping library */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 font-medium">Map Visualization</p>
            <p className="text-sm text-gray-500 mt-2">
              {activeRoute.length} stops • {showOptimized ? 'Optimized' : 'Current'} route
            </p>
          </div>
        </div>

        {/* Route line visualization */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {activeRoute.map((point, idx) => {
            if (idx === 0) return null;
            const prevPoint = activeRoute[idx - 1];
            
            // Simple coordinate mapping for visualization
            const x1 = ((prevPoint.longitude + 180) / 360) * 100;
            const y1 = ((90 - prevPoint.latitude) / 180) * 100;
            const x2 = ((point.longitude + 180) / 360) * 100;
            const y2 = ((90 - point.latitude) / 180) * 100;

            return (
              <line
                key={`line-${idx}`}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke={showOptimized ? '#10b981' : '#6b7280'}
                strokeWidth="3"
                strokeDasharray={showOptimized ? '0' : '5,5'}
              />
            );
          })}
        </svg>

        {/* Markers */}
        {activeRoute.map((point, idx) => {
          const x = ((point.longitude + 180) / 360) * 100;
          const y = ((90 - point.latitude) / 180) * 100;

          return (
            <div
              key={point.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                showOptimized ? 'bg-green-600' : 'bg-gray-600'
              }`}>
                {idx + 1}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-600 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Current Route</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-600 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Optimized Route</span>
        </div>
      </div>
    </Card>
  );
};
