import React, { useState, useEffect } from 'react';
import { MapPin, Clock, TrendingDown, Navigation, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { analyzeAndOptimizeRoute, RoutePoint, RouteAnalysis } from '@/utils/advancedRouteOptimization';

interface AdvancedRouteOptimizerProps {
  landscaperId: string;
  selectedDate: string;
  onRouteUpdated?: () => void;
}

export const AdvancedRouteOptimizer: React.FC<AdvancedRouteOptimizerProps> = ({
  landscaperId, selectedDate, onRouteUpdated
}) => {
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<RoutePoint[]>([]);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    if (!landscaperId || !selectedDate) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, service_name, service_address, location_lat, location_lng, sequence_order')

        .eq('landscaper_id', landscaperId)
        .gte('scheduled_date', selectedDate)
        .lt('scheduled_date', new Date(new Date(selectedDate).getTime() + 86400000).toISOString())
        .order('sequence_order', { ascending: true });

      if (error) throw error;
      const routePoints: RoutePoint[] = (data || []).map((job, idx) => ({
        id: job.id,
        latitude: job.location_lat || 0,
        longitude: job.location_lng || 0,
        address: job.service_address || '',
        name: job.service_name || 'Unnamed Job',
        duration: job.estimated_duration || 60,
        sequence_order: job.sequence_order || idx
      }));
      setJobs(routePoints);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && landscaperId && selectedDate) {
      fetchJobs();
    }
  }, [authLoading, user, landscaperId, selectedDate]);

  const analyzeRoute = () => {
    if (jobs.length < 2) return;
    const result = analyzeAndOptimizeRoute(jobs);
    setAnalysis(result);
  };

  const applyOptimization = async () => {
    if (!analysis) return;
    setUpdating(true);
    try {
      for (const [index, job] of analysis.optimizedRoute.entries()) {
        await supabase.from('jobs').update({ sequence_order: index + 1 }).eq('id', job.id);
      }
      await fetchJobs();
      setAnalysis(null);
      onRouteUpdated?.();
    } catch (err) {
      console.error('Error updating route:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2">Loading...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <p className="text-red-500 mb-3">{error}</p>
          <Button onClick={fetchJobs}>Retry</Button>
        </div>
      </Card>
    );
  }

  if (loading) {
    return <Card className="p-6"><div className="text-center">Loading jobs...</div></Card>;
  }

  if (jobs.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No scheduled jobs for this date</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center">
          <Navigation className="w-6 h-6 mr-2 text-blue-600" />Route Optimizer
        </h3>
        <Button onClick={analyzeRoute} disabled={jobs.length < 2}>
          <RefreshCw className="w-4 h-4 mr-2" />Analyze Route
        </Button>
      </div>

      {analysis && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Distance Saved</p>
                  <p className="text-2xl font-bold text-blue-600">{analysis.distanceSaved.toFixed(1)} mi</p>
                </div>
                <TrendingDown className="w-8 h-8 text-blue-600" />
              </div>
            </Card>
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Time Saved</p>
                  <p className="text-2xl font-bold text-green-600">{Math.round(analysis.timeSaved)} min</p>
                </div>
                <Clock className="w-8 h-8 text-green-600" />
              </div>
            </Card>
            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Efficiency</p>
                  <p className="text-2xl font-bold text-purple-600">{analysis.savings.toFixed(1)}%</p>
                </div>
                <TrendingDown className="w-8 h-8 text-purple-600" />
              </div>
            </Card>
            <Card className="p-4 bg-orange-50 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Distance</p>
                  <p className="text-2xl font-bold text-orange-600">{analysis.optimizedDistance.toFixed(1)} mi</p>
                </div>
                <MapPin className="w-8 h-8 text-orange-600" />
              </div>
            </Card>
          </div>

          <Button onClick={applyOptimization} disabled={updating} className="w-full bg-green-600 hover:bg-green-700">
            {updating ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Applying...</> : <><Check className="w-4 h-4 mr-2" />Apply Optimized Route</>}
          </Button>
        </>
      )}
    </Card>
  );
};