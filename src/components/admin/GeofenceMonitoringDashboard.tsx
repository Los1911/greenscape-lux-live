import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { getGeofenceEvents, GeofenceEvent } from '@/utils/geofencing';
import { MapPin, Activity, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function GeofenceMonitoringDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<GeofenceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalEvents: 0,
    entriesToday: 0,
    exitsToday: 0,
    activeJobs: 0,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [authLoading, user]);

  const loadData = async () => {
    try {
      setError(null);
      const eventsData = await getGeofenceEvents(undefined, undefined, 100);
      setEvents(eventsData || []);

      const today = new Date().toISOString().split('T')[0];
      const todayEvents = (eventsData || []).filter(e => e.created_at?.startsWith(today));

      const { data: activeJobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('status', 'active');


      setStats({
        totalEvents: eventsData?.length || 0,
        entriesToday: todayEvents.filter(e => e.event_type === 'entry').length,
        exitsToday: todayEvents.filter(e => e.event_type === 'exit').length,
        activeJobs: activeJobs?.length || 0,
      });
    } catch (err) {
      console.error('Error loading geofence data:', err);
      setError('Failed to load geofence data');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card><CardContent className="pt-6 text-center text-gray-500">Please sign in to view geofence monitoring.</CardContent></Card>
    );
  }

  if (error) {
    return (
      <Card><CardContent className="pt-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={loadData}><RefreshCw className="h-4 w-4 mr-2" />Retry</Button>
      </CardContent></Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Events</p><p className="text-2xl font-bold">{stats.totalEvents}</p></div><Activity className="w-8 h-8 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Entries Today</p><p className="text-2xl font-bold text-green-600">{stats.entriesToday}</p></div><TrendingUp className="w-8 h-8 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Exits Today</p><p className="text-2xl font-bold text-orange-600">{stats.exitsToday}</p></div><TrendingUp className="w-8 h-8 text-orange-600 rotate-180" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Active Jobs</p><p className="text-2xl font-bold">{stats.activeJobs}</p></div><MapPin className="w-8 h-8 text-purple-600" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Geofence Events</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.slice(0, 20).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Badge variant={event.event_type === 'entry' ? 'default' : 'secondary'}>{event.event_type}</Badge>
                  <div>
                    <p className="font-medium text-sm">Job #{event.job_id?.slice(0, 8) || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{event.job_status_before} → {event.job_status_after}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm"><Clock className="w-4 h-4" />{event.created_at ? new Date(event.created_at).toLocaleTimeString() : 'N/A'}</div>
                  <p className="text-xs text-muted-foreground">{event.distance_from_center?.toFixed(0) ?? 'N/A'}m from center</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
