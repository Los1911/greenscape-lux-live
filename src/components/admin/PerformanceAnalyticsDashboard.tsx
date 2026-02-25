/**
 * Admin Performance Analytics Dashboard
 * View performance metrics for all landscapers (read-only)
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
  Search,
  Filter,
  Download,
  RefreshCw,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LandscaperPerformanceSummary,
  TrendDirection,
  RawPerformanceStats
} from '@/types/performance';
import {
  calculatePerformanceMetrics,
  calculateOverallScore,
  calculateOverallTrend
} from '@/utils/performanceCalculator';

interface PerformanceAnalyticsDashboardProps {
  className?: string;
}

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

const getScoreColor = (score: number): string => {
  if (score >= 85) return 'text-emerald-400';
  if (score >= 70) return 'text-yellow-400';
  if (score >= 50) return 'text-orange-400';
  return 'text-red-400';
};

const getScoreBgColor = (score: number): string => {
  if (score >= 85) return 'bg-emerald-500/20';
  if (score >= 70) return 'bg-yellow-500/20';
  if (score >= 50) return 'bg-orange-500/20';
  return 'bg-red-500/20';
};

export default function PerformanceAnalyticsDashboard({ className = '' }: PerformanceAnalyticsDashboardProps) {
  const [landscapers, setLandscapers] = useState<LandscaperPerformanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'rating' | 'completion' | 'response'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterTier, setFilterTier] = useState<string>('all');

  // Platform-wide stats
  const [platformStats, setPlatformStats] = useState({
    avgScore: 0,
    avgRating: 0,
    avgCompletionRate: 0,
    avgResponseTime: 0,
    totalLandscapers: 0,
    improvingCount: 0,
    decliningCount: 0
  });

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);

      // Fetch all landscapers with their stats
      const { data: landscapersData, error } = await supabase
        .from('landscapers')
        .select(`
          id,
          user_id,
          business_name,
          tier,
          completed_jobs_count,
          average_rating,
          users!inner(email, first_name, last_name)
        `)
        .eq('approved', true);

      if (error) throw error;

      const summaries: LandscaperPerformanceSummary[] = [];
      let totalScore = 0;
      let totalRating = 0;
      let totalCompletion = 0;
      let totalResponse = 0;
      let improvingCount = 0;
      let decliningCount = 0;

      for (const ls of landscapersData || []) {
        // Fetch job data for each landscaper
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, status, flagged_at, scheduled_date, actual_start_time')
          .eq('landscaper_id', ls.id);

        const jobList = jobs || [];
        const totalAccepted = jobList.filter(j => 
          ['assigned', 'active', 'completed', 'flagged_review'].includes(j.status)

        ).length;
        const totalCompleted = jobList.filter(j => j.status === 'completed').length;
        const flaggedJobs = jobList.filter(j => j.flagged_at).length;

        // Calculate on-time rate
        const jobsWithSchedule = jobList.filter(j => j.scheduled_date);
        const onTimeJobs = jobsWithSchedule.filter(j => {
          if (!j.actual_start_time || !j.scheduled_date) return true;
          const scheduled = new Date(j.scheduled_date);
          const actual = new Date(j.actual_start_time);
          const diffMinutes = (actual.getTime() - scheduled.getTime()) / (1000 * 60);
          return diffMinutes <= 15;
        }).length;


        // Build raw stats
        const rawStats: RawPerformanceStats = {
          totalJobsAccepted: totalAccepted || 1,
          totalJobsCompleted: totalCompleted,
          totalJobsInPeriod: jobList.length,
          avgResponseMinutes: 25, // Default - would need communications data
          responseCount: 0,
          onTimeArrivals: onTimeJobs || jobsWithSchedule.length,
          totalArrivals: jobsWithSchedule.length || 1,
          averageRating: ls.average_rating || 0,
          totalReviews: totalCompleted,
          flaggedJobs: flaggedJobs,
          platformAvgResponseMinutes: 30,
          platformAvgCompletionRate: 95,
          platformAvgOnTimeRate: 90,
          platformAvgRating: 4.5,
          platformAvgFlaggedRate: 2
        };

        const metrics = calculatePerformanceMetrics(rawStats);
        const overallScore = calculateOverallScore(metrics);
        const overallTrend = calculateOverallTrend(metrics);

        const user = ls.users as any;
        const name = user?.first_name && user?.last_name 
          ? `${user.first_name} ${user.last_name}`
          : ls.business_name || 'Unknown';

        const summary: LandscaperPerformanceSummary = {
          landscaperId: ls.id,
          landscaperName: name,
          email: user?.email || '',
          tier: ls.tier || 'starter',
          responseTime: metrics.responseTime.value,
          completionRate: metrics.completionRate.value,
          onTimeRate: metrics.onTimeRate.value,
          averageRating: metrics.averageRating.value,
          flaggedRate: metrics.flaggedRate.value,
          overallScore,
          trend: overallTrend
        };

        summaries.push(summary);

        // Accumulate for platform stats
        totalScore += overallScore;
        totalRating += metrics.averageRating.value;
        totalCompletion += metrics.completionRate.value;
        totalResponse += metrics.responseTime.value;
        if (overallTrend === 'improving') improvingCount++;
        if (overallTrend === 'declining') decliningCount++;
      }

      setLandscapers(summaries);

      const count = summaries.length || 1;
      setPlatformStats({
        avgScore: Math.round(totalScore / count),
        avgRating: Number((totalRating / count).toFixed(1)),
        avgCompletionRate: Math.round(totalCompletion / count),
        avgResponseTime: Math.round(totalResponse / count),
        totalLandscapers: summaries.length,
        improvingCount,
        decliningCount
      });

    } catch (error) {
      console.error('[PerformanceAnalytics] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedLandscapers = landscapers
    .filter(ls => {
      const matchesSearch = ls.landscaperName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ls.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTier = filterTier === 'all' || ls.tier === filterTier;
      return matchesSearch && matchesTier;
    })
    .sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortBy) {
        case 'score':
          aVal = a.overallScore;
          bVal = b.overallScore;
          break;
        case 'rating':
          aVal = a.averageRating;
          bVal = b.averageRating;
          break;
        case 'completion':
          aVal = a.completionRate;
          bVal = b.completionRate;
          break;
        case 'response':
          aVal = a.responseTime;
          bVal = b.responseTime;
          // For response time, lower is better
          return sortOrder === 'asc' ? bVal - aVal : aVal - bVal;
        default:
          aVal = a.overallScore;
          bVal = b.overallScore;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Tier', 'Score', 'Rating', 'Completion %', 'On-Time %', 'Response (min)', 'Issue %', 'Trend'];
    const rows = filteredAndSortedLandscapers.map(ls => [
      ls.landscaperName,
      ls.email,
      ls.tier,
      ls.overallScore,
      ls.averageRating.toFixed(1),
      ls.completionRate,
      ls.onTimeRate,
      ls.responseTime,
      ls.flaggedRate,
      ls.trend
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-emerald-500/20 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-emerald-500/10 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-emerald-500/10 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-emerald-300 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Analytics
          </h2>
          <p className="text-sm text-slate-400">View landscaper performance metrics (read-only)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPerformanceData}
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-black/60 border border-emerald-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Total Landscapers</span>
          </div>
          <div className="text-2xl font-bold text-white">{platformStats.totalLandscapers}</div>
        </div>
        <div className="bg-black/60 border border-emerald-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Avg Score</span>
          </div>
          <div className="text-2xl font-bold text-white">{platformStats.avgScore}</div>
        </div>
        <div className="bg-black/60 border border-emerald-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-slate-400">Avg Rating</span>
          </div>
          <div className="text-2xl font-bold text-white">{platformStats.avgRating}</div>
        </div>
        <div className="bg-black/60 border border-emerald-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Avg Completion</span>
          </div>
          <div className="text-2xl font-bold text-white">{platformStats.avgCompletionRate}%</div>
        </div>
        <div className="bg-black/60 border border-emerald-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Improving</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{platformStats.improvingCount}</div>
        </div>
        <div className="bg-black/60 border border-emerald-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight className="h-4 w-4 text-red-400" />
            <span className="text-xs text-slate-400">Declining</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{platformStats.decliningCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-black/60 border border-emerald-500/25 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-black/40 border-emerald-500/30 text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="bg-black/40 border border-emerald-500/30 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Tiers</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="elite">Elite</option>
            </select>
          </div>
        </div>
      </div>

      {/* Landscaper Table */}
      <div className="bg-black/60 border border-emerald-500/25 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-emerald-500/20">
                <th className="text-left p-4 text-sm font-medium text-slate-400">Landscaper</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Tier</th>
                <th 
                  className="text-center p-4 text-sm font-medium text-slate-400 cursor-pointer hover:text-emerald-400"
                  onClick={() => handleSort('score')}
                >
                  Score {sortBy === 'score' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className="text-center p-4 text-sm font-medium text-slate-400 cursor-pointer hover:text-emerald-400"
                  onClick={() => handleSort('rating')}
                >
                  Rating {sortBy === 'rating' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className="text-center p-4 text-sm font-medium text-slate-400 cursor-pointer hover:text-emerald-400"
                  onClick={() => handleSort('completion')}
                >
                  Completion {sortBy === 'completion' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className="text-center p-4 text-sm font-medium text-slate-400">On-Time</th>
                <th 
                  className="text-center p-4 text-sm font-medium text-slate-400 cursor-pointer hover:text-emerald-400"
                  onClick={() => handleSort('response')}
                >
                  Response {sortBy === 'response' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-center p-4 text-sm font-medium text-slate-400">Issues</th>
                <th className="text-center p-4 text-sm font-medium text-slate-400">Trend</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedLandscapers.map((ls) => (
                <tr 
                  key={ls.landscaperId} 
                  className="border-b border-emerald-500/10 hover:bg-emerald-500/5 transition-colors"
                >
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-white">{ls.landscaperName}</div>
                      <div className="text-xs text-slate-500">{ls.email}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      ls.tier === 'elite' ? 'bg-amber-500/20 text-amber-400' :
                      ls.tier === 'pro' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {ls.tier}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-lg font-bold ${getScoreBgColor(ls.overallScore)} ${getScoreColor(ls.overallScore)}`}>
                      {ls.overallScore}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 text-amber-400" />
                      <span className="text-white">{ls.averageRating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={ls.completionRate >= 95 ? 'text-emerald-400' : ls.completionRate >= 80 ? 'text-yellow-400' : 'text-red-400'}>
                      {ls.completionRate}%
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={ls.onTimeRate >= 90 ? 'text-emerald-400' : ls.onTimeRate >= 80 ? 'text-yellow-400' : 'text-red-400'}>
                      {ls.onTimeRate}%
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={ls.responseTime <= 30 ? 'text-emerald-400' : ls.responseTime <= 60 ? 'text-yellow-400' : 'text-red-400'}>
                      {ls.responseTime}m
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={ls.flaggedRate <= 2 ? 'text-emerald-400' : ls.flaggedRate <= 5 ? 'text-yellow-400' : 'text-red-400'}>
                      {ls.flaggedRate}%
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center">
                      <TrendIcon trend={ls.trend} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedLandscapers.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            No landscapers found matching your criteria.
          </div>
        )}
      </div>

      {/* Footer Note */}
      <p className="text-xs text-slate-500 text-center">
        Performance data is for internal review only. Metrics do not automatically trigger actions or affect landscaper accounts.
      </p>
    </div>
  );
}

export { PerformanceAnalyticsDashboard };
