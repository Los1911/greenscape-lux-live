import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StandardizedButton } from '@/components/ui/standardized-button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface JobStats {
  total: number;
  completed: number;
  active: number;
  totalSpent: number;
}

export const JobsOverviewSection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<JobStats>({ total: 0, completed: 0, active: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchJobStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')
          .select('status, price')
          .eq('client_id', user.id);

        if (jobsError) throw jobsError;

        const total = jobs?.length || 0;
        const completed = jobs?.filter(job => job.status === 'completed').length || 0;
        const active = jobs?.filter(job => job.status === 'pending' || job.status === 'scheduled').length || 0;
        const totalSpent = jobs?.reduce((sum, job) => sum + (parseFloat(job.price) || 0), 0) || 0;

        setStats({ total, completed, active, totalSpent });
      } catch (err) {
        console.error('Error fetching job stats:', err);
        setError('Failed to load job statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchJobStats();
  }, [user]);

  const handleRequestService = () => {
    navigate('/instant-quote');
  };

  const StatItem = ({ value, label, isLoading }: { value: string | number; label: string; isLoading: boolean }) => (
    <div className="text-center">
      {isLoading ? (
        <Skeleton className="h-8 w-12 mx-auto mb-1 bg-gray-700" />
      ) : (
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
      )}
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white">Jobs Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="text-red-400 text-sm text-center py-2">
            {error}
          </div>
        )}
        
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6">
          <StatItem value={stats.total} label="Total Jobs" isLoading={loading} />
          <StatItem value={stats.completed} label="Completed" isLoading={loading} />
          <StatItem value={stats.active} label="Active" isLoading={loading} />
          <StatItem 
            value={`$${stats.totalSpent.toFixed(0)}`} 
            label="Total Spent" 
            isLoading={loading} 
          />
        </div>

        {/* No Jobs Message */}
        {!loading && stats.total === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">No active jobs found.</div>
            <StandardizedButton
              variant="primary"
              size="lg"
              label="Request Your First Service"
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 border-0"
              onClick={handleRequestService}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};