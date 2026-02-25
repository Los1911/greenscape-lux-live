import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { MapPin, Users, Navigation, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface ActiveLandscaper {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  job_id: string | null;
  timestamp: string;
}

export function LiveGPSMapView() {
  const { user, loading: authLoading } = useAuth();
  const [activeLandscapers, setActiveLandscapers] = useState<ActiveLandscaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to resolve before setting up subscriptions
    if (authLoading) return;
    if (!user) return;

    fetchActiveLandscapers();

    const channel = supabase
      .channel('all-gps-tracking')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gps_tracking',
        },
        () => {
          fetchActiveLandscapers();
        }
      )
      .subscribe();

    const interval = setInterval(fetchActiveLandscapers, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [authLoading, user]);

  const fetchActiveLandscapers = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('gps_tracking')
        .select(`
          *,
          landscaper:landscapers(id, business_name)
        `)
        .eq('is_active', true)
        .order('timestamp', { ascending: false });

      if (fetchError) throw fetchError;

      if (data) {
        const latest = new Map<string, any>();
        data.forEach((item) => {
          if (!latest.has(item.landscaper_id)) {
            latest.set(item.landscaper_id, item);
          }
        });

        const active: ActiveLandscaper[] = Array.from(latest.values()).map((item) => ({
          id: item.landscaper_id,
          name: item.landscaper?.business_name || 'Unknown',
          latitude: item.latitude,
          longitude: item.longitude,
          speed: item.speed,
          job_id: item.job_id,
          timestamp: item.timestamp,
        }));

        setActiveLandscapers(active);
      }
    } catch (err) {
      console.error('Error fetching GPS data:', err);
      setError('Failed to load GPS data');
    } finally {
      setLoading(false);
    }
  };

  // Auth loading guard - prevents white screen on refresh
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">Please sign in to view GPS tracking.</p>
      </Card>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-500 text-center mb-4">{error}</p>
        <Button onClick={fetchActiveLandscapers} className="mx-auto block">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold">Live GPS Tracking</h2>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {activeLandscapers.length} Active
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
        </div>
      ) : activeLandscapers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No active landscapers currently tracking
        </div>
      ) : (
        <div className="space-y-4">
          {activeLandscapers.map((landscaper) => (
            <div
              key={landscaper.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">{landscaper.name}</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      Location: {landscaper.latitude?.toFixed(6) ?? 'N/A'}, {landscaper.longitude?.toFixed(6) ?? 'N/A'}
                    </div>
                    {landscaper.speed && (
                      <div>Speed: {landscaper.speed.toFixed(1)} mph</div>
                    )}
                    <div className="text-xs text-gray-500">
                      Updated: {landscaper.timestamp ? new Date(landscaper.timestamp).toLocaleTimeString() : 'N/A'}
                    </div>
                  </div>
                </div>
                <div>
                  {landscaper.job_id ? (
                    <Badge variant="default">On Job</Badge>
                  ) : (
                    <Badge variant="secondary">Available</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
