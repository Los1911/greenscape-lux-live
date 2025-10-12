import React from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  Star,
  Users
} from 'lucide-react';
import { UnifiedStatsCard } from '@/components/shared/UnifiedDashboardComponents';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/contexts/AuthContext';

export function LiveLandscaperStats() {
  const { user } = useAuth();
  const { stats, loading, error } = useDashboardData('landscaper');

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-black/60 backdrop-blur rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-8 bg-gray-700 rounded mb-1"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/25 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load dashboard stats</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <UnifiedStatsCard
        title="Total Earnings"
        value={`$${stats.totalEarnings.toFixed(2)}`}
        subtitle="Lifetime earnings"
        icon={<DollarSign className="w-5 h-5" />}
        variant="green"
        trend={{
          value: stats.monthlyEarnings > 0 ? 12 : 0,
          isPositive: true
        }}
      />
      
      <UnifiedStatsCard
        title="Active Jobs"
        value={stats.activeJobs}
        subtitle="Currently working"
        icon={<Clock className="w-5 h-5" />}
        variant="blue"
      />
      
      <UnifiedStatsCard
        title="Completed Jobs"
        value={stats.completedJobs}
        subtitle="Successfully finished"
        icon={<CheckCircle2 className="w-5 h-5" />}
        variant="default"
        trend={{
          value: stats.completedJobs > 0 ? 5 : 0,
          isPositive: true
        }}
      />
      
      <UnifiedStatsCard
        title="Rating"
        value={stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A'}
        subtitle={`${stats.totalReviews} reviews`}
        icon={<Star className="w-5 h-5" />}
        variant="yellow"
      />
    </div>
  );
}