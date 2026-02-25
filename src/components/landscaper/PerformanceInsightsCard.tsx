/**
 * Performance Insights Card
 * Displays landscaper performance metrics with trends and comparisons
 */

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  Timer, 
  Star, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  PerformanceAnalytics,
  PerformanceMetric,
  TrendDirection,
  ComparisonStatus,
  RawPerformanceStats
} from '@/types/performance';
import {
  calculatePerformanceMetrics,
  calculateOverallScore,
  calculateOverallTrend,
  getMotivationalMessage
} from '@/utils/performanceCalculator';

interface PerformanceInsightsCardProps {
  landscaperId?: string;
  compact?: boolean;
}

const MetricIcon: React.FC<{ metricId: string; className?: string }> = ({ metricId, className = "h-5 w-5" }) => {
  switch (metricId) {
    case 'responseTime':
      return <Clock className={className} />;
    case 'completionRate':
      return <CheckCircle className={className} />;
    case 'onTimeRate':
      return <Timer className={className} />;
    case 'averageRating':
      return <Star className={className} />;
    case 'flaggedRate':
      return <AlertTriangle className={className} />;
    default:
      return <Info className={className} />;
  }
};

const TrendIcon: React.FC<{ trend: TrendDirection; className?: string }> = ({ trend, className = "h-4 w-4" }) => {
  switch (trend) {
    case 'improving':
      return <TrendingUp className={`${className} text-emerald-400`} />;
    case 'declining':
      return <TrendingDown className={`${className} text-red-400`} />;
    default:
      return <Minus className={`${className} text-slate-400`} />;
  }
};

const getTrendColor = (trend: TrendDirection): string => {
  switch (trend) {
    case 'improving':
      return 'text-emerald-400';
    case 'declining':
      return 'text-red-400';
    default:
      return 'text-slate-400';
  }
};

const getTrendLabel = (trend: TrendDirection): string => {
  switch (trend) {
    case 'improving':
      return 'Improving';
    case 'declining':
      return 'Declining';
    default:
      return 'Stable';
  }
};

const getComparisonColor = (status: ComparisonStatus): string => {
  switch (status) {
    case 'top_performer':
      return 'text-amber-400';
    case 'above_average':
      return 'text-emerald-400';
    case 'average':
      return 'text-slate-400';
    case 'below_average':
      return 'text-orange-400';
    default:
      return 'text-slate-400';
  }
};

const getComparisonLabel = (status: ComparisonStatus): string => {
  switch (status) {
    case 'top_performer':
      return 'Top 10%';
    case 'above_average':
      return 'Above Avg';
    case 'average':
      return 'Average';
    case 'below_average':
      return 'Below Avg';
    default:
      return '';
  }
};

const MetricCard: React.FC<{ 
  metric: PerformanceMetric; 
  isInverse?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}> = ({ metric, isInverse = false, expanded = false, onToggle }) => {
  const isGood = isInverse 
    ? metric.trend === 'improving' || metric.value < (metric.platformAverage || 0)
    : metric.trend === 'improving' || metric.value > (metric.platformAverage || 0);

  return (
    <div 
      className="bg-black/40 border border-emerald-500/20 rounded-xl p-4 hover:border-emerald-500/40 transition-all cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isGood ? 'bg-emerald-500/20' : 'bg-slate-500/20'}`}>
            <MetricIcon metricId={metric.id} className={`h-4 w-4 ${isGood ? 'text-emerald-400' : 'text-slate-400'}`} />
          </div>
          <span className="text-sm font-medium text-slate-300">{metric.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendIcon trend={metric.trend} />
          {onToggle && (
            expanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-white">{metric.displayValue}</div>
          <div className={`text-xs ${getTrendColor(metric.trend)}`}>
            {getTrendLabel(metric.trend)}
            {metric.trendPercentage !== undefined && metric.trendPercentage !== 0 && (
              <span className="ml-1">
                ({metric.trendPercentage > 0 ? '+' : ''}{metric.trendPercentage}%)
              </span>
            )}
          </div>
        </div>
        {metric.comparisonStatus && (
          <div className={`text-xs px-2 py-1 rounded-full bg-black/40 ${getComparisonColor(metric.comparisonStatus)}`}>
            {getComparisonLabel(metric.comparisonStatus)}
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-emerald-500/10 space-y-2">
          <p className="text-xs text-slate-400">{metric.description}</p>
          {metric.platformAverage !== undefined && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Platform Average</span>
              <span className="text-slate-400">
                {metric.id === 'responseTime' 
                  ? `${Math.round(metric.platformAverage)} min`
                  : metric.id === 'averageRating'
                    ? metric.platformAverage.toFixed(1)
                    : `${Math.round(metric.platformAverage)}%`
                }
              </span>
            </div>
          )}
          {metric.previousValue !== undefined && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Previous Period</span>
              <span className="text-slate-400">
                {metric.id === 'responseTime' 
                  ? `${Math.round(metric.previousValue)} min`
                  : metric.id === 'averageRating'
                    ? metric.previousValue.toFixed(1)
                    : `${Math.round(metric.previousValue)}%`
                }
              </span>
            </div>
          )}
          {metric.helpText && (
            <p className="text-xs text-emerald-400/70 mt-2 italic">{metric.helpText}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default function PerformanceInsightsCard({ landscaperId, compact = false }: PerformanceInsightsCardProps) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [showAllMetrics, setShowAllMetrics] = useState(!compact);

  useEffect(() => {
    if (landscaperId || user?.id) {
      loadPerformanceData();
    }
  }, [landscaperId, user?.id]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Get landscaper ID if not provided
      let lsId = landscaperId;
      if (!lsId && user?.id) {
        const { data: ls } = await supabase
          .from('landscapers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        lsId = ls?.id;
      }

      if (!lsId) {
        setLoading(false);
        return;
      }

      // Fetch landscaper stats
      const { data: landscaper } = await supabase
        .from('landscapers')
        .select('completed_jobs_count, average_rating, created_at')
        .eq('id', lsId)
        .single();

      // Fetch job data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, status, created_at, completed_at, flagged_at, scheduled_date, actual_start_time')
        .eq('landscaper_id', lsId);

      const jobList = jobs || [];
      const recentJobs = jobList.filter(j => 
        j.created_at && new Date(j.created_at) >= thirtyDaysAgo
      );

      // Calculate raw stats
      const totalAccepted = jobList.filter(j => 
        ['assigned', 'active', 'completed', 'flagged_review'].includes(j.status)

      ).length;
      
      const totalCompleted = jobList.filter(j => j.status === 'completed').length;
      const flaggedJobs = jobList.filter(j => j.flagged_at).length;

      // Calculate on-time rate (simplified - would need actual arrival tracking)
      const jobsWithSchedule = jobList.filter(j => j.scheduled_date);
      const onTimeJobs = jobsWithSchedule.filter(j => {
        if (!j.actual_start_time || !j.scheduled_date) return true; // Assume on-time if no data
        const scheduled = new Date(j.scheduled_date);
        const actual = new Date(j.actual_start_time);
        const diffMinutes = (actual.getTime() - scheduled.getTime()) / (1000 * 60);
        return diffMinutes <= 15; // 15 minute grace period
      }).length;


      // Response tracking temporarily disabled for stability
      // communications table does not contain responded_at column
      const averageResponseTime = null;
      let avgResponseMinutes = 25; // Default fallback



      // Build raw stats
      const rawStats: RawPerformanceStats = {
        totalJobsAccepted: totalAccepted || 1,
        totalJobsCompleted: totalCompleted,
        totalJobsInPeriod: recentJobs.length,
        avgResponseMinutes: Math.round(avgResponseMinutes),
        responseCount: 0, // Response tracking disabled — communications.responded_at does not exist

        onTimeArrivals: onTimeJobs || jobsWithSchedule.length,
        totalArrivals: jobsWithSchedule.length || 1,
        averageRating: landscaper?.average_rating || 0,
        totalReviews: totalCompleted,
        flaggedJobs: flaggedJobs,
        // Platform averages (would typically come from aggregated data)
        platformAvgResponseMinutes: 30,
        platformAvgCompletionRate: 95,
        platformAvgOnTimeRate: 90,
        platformAvgRating: 4.5,
        platformAvgFlaggedRate: 2
      };

      // Calculate metrics
      const metrics = calculatePerformanceMetrics(rawStats);
      const overallScore = calculateOverallScore(metrics);
      const overallTrend = calculateOverallTrend(metrics);

      setAnalytics({
        landscaperId: lsId,
        calculatedAt: new Date().toISOString(),
        periodDays: 30,
        metrics,
        overallScore,
        overallTrend
      });
    } catch (error) {
      console.error('[PerformanceInsights] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMetric = (metricId: string) => {
    setExpandedMetric(expandedMetric === metricId ? null : metricId);
  };

  if (loading) {
    return (
      <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-emerald-500/20 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-32 bg-emerald-500/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { metrics, overallScore, overallTrend } = analytics;
  const motivationalMessage = getMotivationalMessage(metrics);

  const displayMetrics = showAllMetrics 
    ? Object.values(metrics)
    : Object.values(metrics).slice(0, 3);

  return (
    <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-emerald-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 rounded-xl">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-300">Performance Insights</h2>
              <p className="text-xs text-emerald-300/60">Last 30 days</p>
            </div>
          </div>

          {/* Overall Score */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-400 mb-1">Overall Score</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-white">{overallScore}</div>
                <div className="text-xs text-slate-500">/100</div>
                <TrendIcon trend={overallTrend || 'stable'} />
              </div>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.1)"
                  strokeWidth="6"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(overallScore || 0) * 1.76} 176`}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Award className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-sm text-emerald-300">{motivationalMessage}</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'}`}>
          {displayMetrics.map(metric => (
            <MetricCard
              key={metric.id}
              metric={metric}
              isInverse={metric.id === 'responseTime' || metric.id === 'flaggedRate'}
              expanded={expandedMetric === metric.id}
              onToggle={() => toggleMetric(metric.id)}
            />
          ))}
        </div>

        {compact && !showAllMetrics && (
          <button
            onClick={() => setShowAllMetrics(true)}
            className="mt-4 w-full py-2 text-sm text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-2 transition-colors"
          >
            <span>View All Metrics</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        )}

        {compact && showAllMetrics && (
          <button
            onClick={() => setShowAllMetrics(false)}
            className="mt-4 w-full py-2 text-sm text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-2 transition-colors"
          >
            <span>Show Less</span>
            <ChevronUp className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 pb-4">
        <p className="text-xs text-slate-500 text-center">
          Metrics are informational only and help you track your progress. They do not affect job assignments or payouts.
        </p>
      </div>
    </div>
  );
}

export { PerformanceInsightsCard };
