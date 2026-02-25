import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { AdvancedRouteOptimizer } from './AdvancedRouteOptimizer';
import { Calendar, User, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Landscaper {
  id: string;
  user_id: string;
  business_name: string;
}

export const RouteOptimizationDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [landscapers, setLandscapers] = useState<Landscaper[]>([]);
  const [selectedLandscaper, setSelectedLandscaper] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to resolve before fetching data
    if (authLoading) return;
    if (!user) return;
    
    fetchLandscapers();
  }, [authLoading, user]);

  const fetchLandscapers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('landscapers')
        .select('id, user_id, business_name')
        .eq('approved', true)
        .order('business_name');



      if (error) throw error;
      setLandscapers(data || []);
    } catch (err) {
      console.error('Error fetching landscapers:', err);
      setError('Failed to load landscapers');
    } finally {
      setLoading(false);
    }
  };

  // Auth loading guard - prevents white screen on refresh
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 p-6">
        <p className="text-gray-400 text-center">Please sign in to access route optimization.</p>
      </Card>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <Card className="bg-black/60 backdrop-blur border border-red-500/25 p-6">
        <p className="text-red-400 text-center mb-4">{error}</p>
        <Button onClick={fetchLandscapers} className="mx-auto block">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 p-6">
        <h2 className="text-xl font-bold text-emerald-300 mb-4">
          Route Optimization System
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-emerald-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Select Landscaper
                </label>
                <select
                  value={selectedLandscaper}
                  onChange={(e) => setSelectedLandscaper(e.target.value)}
                  className="w-full px-4 py-2 bg-black/40 border border-emerald-500/30 rounded-lg text-white"
                >
                  <option value="">Choose a landscaper...</option>
                  {landscapers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.business_name || `Landscaper ${l.id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 bg-black/40 border border-emerald-500/30 rounded-lg text-white"
                />
              </div>
            </div>

            <Button
              onClick={() => setShowMap(!showMap)}
              variant="outline"
              className="border-emerald-500/30 text-emerald-300"
            >
              {showMap ? 'Hide' : 'Show'} Map Visualization
            </Button>
          </>
        )}
      </Card>

      {selectedLandscaper && (
        <AdvancedRouteOptimizer
          landscaperId={selectedLandscaper}
          selectedDate={selectedDate}
          onRouteUpdated={() => {}}
        />
      )}
    </div>
  );
};
