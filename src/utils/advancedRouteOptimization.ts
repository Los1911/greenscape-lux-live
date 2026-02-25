// Advanced Route Optimization using 2-opt algorithm for TSP

export interface RoutePoint {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  name: string;
  duration: number; // minutes
  sequence_order?: number;
}

export interface RouteAnalysis {
  originalDistance: number;
  optimizedDistance: number;
  distanceSaved: number;
  timeSaved: number; // minutes
  originalRoute: RoutePoint[];
  optimizedRoute: RoutePoint[];
  savings: number; // percentage
}

// Haversine distance calculation in miles
export function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLng = toRad(point2.longitude - point1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
    Math.cos(toRad(point2.latitude)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Calculate total route distance
export function calculateRouteDistance(route: RoutePoint[]): number {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += calculateDistance(route[i], route[i + 1]);
  }
  return total;
}

// 2-opt algorithm for route optimization
export function optimizeRoute2Opt(points: RoutePoint[]): RoutePoint[] {
  if (points.length <= 2) return points;
  
  let route = [...points];
  let improved = true;
  
  while (improved) {
    improved = false;
    
    for (let i = 1; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        const newRoute = twoOptSwap(route, i, j);
        const currentDist = calculateRouteDistance(route);
        const newDist = calculateRouteDistance(newRoute);
        
        if (newDist < currentDist) {
          route = newRoute;
          improved = true;
        }
      }
    }
  }
  
  return route;
}

function twoOptSwap(route: RoutePoint[], i: number, j: number): RoutePoint[] {
  const newRoute = [...route.slice(0, i), ...route.slice(i, j + 1).reverse(), ...route.slice(j + 1)];
  return newRoute;
}

// Analyze and optimize route
export function analyzeAndOptimizeRoute(
  jobs: RoutePoint[],
  startLocation?: { latitude: number; longitude: number }
): RouteAnalysis {
  const originalRoute = [...jobs];
  const originalDistance = calculateRouteDistance(originalRoute);
  
  const optimizedRoute = optimizeRoute2Opt(jobs);
  const optimizedDistance = calculateRouteDistance(optimizedRoute);
  
  const distanceSaved = originalDistance - optimizedDistance;
  const avgSpeed = 30; // mph
  const timeSaved = (distanceSaved / avgSpeed) * 60; // minutes
  const savings = originalDistance > 0 ? (distanceSaved / originalDistance) * 100 : 0;
  
  return {
    originalDistance,
    optimizedDistance,
    distanceSaved,
    timeSaved,
    originalRoute,
    optimizedRoute,
    savings
  };
}
