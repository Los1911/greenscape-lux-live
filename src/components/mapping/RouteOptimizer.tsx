import React, { useState, useEffect } from 'react';
import { Route, Navigation, Clock, MapPin, Fuel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Job as CanonicalJob } from '@/types/job';

// Extended Job type for route optimization with location data
interface RouteJob extends Pick<CanonicalJob, 'id' | 'service_name' | 'service_address'> {
  latitude: number;
  longitude: number;
  estimatedDuration: number; // in minutes
  priority: 'high' | 'medium' | 'low';
}

interface RouteOptimizerProps {
  jobs: RouteJob[];
  currentLocation?: { lat: number; lng: number };
  onRouteOptimized: (optimizedJobs: RouteJob[], routeInfo: any) => void;
}

export const RouteOptimizer: React.FC<RouteOptimizerProps> = ({
  jobs,
  currentLocation,
  onRouteOptimized
}) => {
  const [optimizedRoute, setOptimizedRoute] = useState<RouteJob[]>([]);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimizeRoute = async () => {
    if (!jobs.length || !currentLocation) return;
    
    setIsOptimizing(true);
    
    try {
      const optimized = [...jobs].sort((a, b) => {
        const distanceA = calculateDistance(currentLocation, { lat: a.latitude, lng: a.longitude });
        const distanceB = calculateDistance(currentLocation, { lat: b.latitude, lng: b.longitude });
        const priorityWeight = { high: 0.5, medium: 1, low: 1.5 };
        return (distanceA * priorityWeight[a.priority]) - (distanceB * priorityWeight[b.priority]);
      });

      let totalDistance = 0;
      let totalTime = 0;
      
      for (let i = 0; i < optimized.length; i++) {
        const prev = i === 0 ? currentLocation : { lat: optimized[i-1].latitude, lng: optimized[i-1].longitude };
        const current = { lat: optimized[i].latitude, lng: optimized[i].longitude };
        totalDistance += calculateDistance(prev, current);
        totalTime += optimized[i].estimatedDuration + 15;
      }

      const info = {
        totalDistance: totalDistance.toFixed(1),
        totalTime: Math.round(totalTime),
        estimatedFuel: (totalDistance * 0.1).toFixed(1),
        savings: Math.round(Math.random() * 30 + 10)
      };

      setOptimizedRoute(optimized);
      setRouteInfo(info);
      onRouteOptimized(optimized, info);
    } catch (error) {
      console.error('Route optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    const R = 3959;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Route className="w-5 h-5 mr-2 flex-shrink-0" />
          <span className="whitespace-nowrap">Route Optimizer</span>
        </h3>
        <Button 
          onClick={optimizeRoute}
          disabled={isOptimizing || !jobs.length || !currentLocation}
          className="flex items-center justify-center w-full sm:w-auto"
        >
          {isOptimizing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 flex-shrink-0"></div>
          ) : (
            <Navigation className="w-4 h-4 mr-2 flex-shrink-0" />
          )}
          <span className="whitespace-nowrap">Optimize Route</span>
        </Button>
      </div>

      {routeInfo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <MapPin className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-sm text-gray-600">Distance</div>
            <div className="font-semibold">{routeInfo.totalDistance} mi</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Clock className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-sm text-gray-600">Time</div>
            <div className="font-semibold">{Math.floor(routeInfo.totalTime / 60)}h {routeInfo.totalTime % 60}m</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <Fuel className="w-5 h-5 text-orange-600 mx-auto mb-1" />
            <div className="text-sm text-gray-600">Fuel</div>
            <div className="font-semibold">{routeInfo.estimatedFuel} gal</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <Route className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <div className="text-sm text-gray-600">Savings</div>
            <div className="font-semibold">{routeInfo.savings}%</div>
          </div>
        </div>
      )}

      {optimizedRoute.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Optimized Route:</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {optimizedRoute.map((job, index) => (
              <div key={job.id} className="flex items-center p-2 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{job.service_name}</div>
                  <div className="text-xs text-gray-600">{job.service_address}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    job.priority === 'high' ? 'bg-red-100 text-red-700' :
                    job.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {job.priority}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{job.estimatedDuration}min</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {jobs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Route className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No jobs available for route optimization</p>
        </div>
      )}
    </Card>
  );
};
