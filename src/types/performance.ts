/**
 * Performance Analytics Types
 * For landscaper job performance tracking and insights
 */

/**
 * Trend direction for metrics
 */
export type TrendDirection = 'improving' | 'stable' | 'declining';

/**
 * Platform comparison status
 */
export type ComparisonStatus = 'above_average' | 'average' | 'below_average' | 'top_performer';

/**
 * Individual performance metric
 */
export interface PerformanceMetric {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  unit?: string;
  trend: TrendDirection;
  trendPercentage?: number;
  previousValue?: number;
  platformAverage?: number;
  comparisonStatus?: ComparisonStatus;
  percentile?: number; // e.g., 85 means top 15%
  description: string;
  helpText?: string;
}

/**
 * Complete performance analytics data
 */
export interface PerformanceAnalytics {
  landscaperId: string;
  calculatedAt: string;
  periodDays: number;
  metrics: {
    responseTime: PerformanceMetric;
    completionRate: PerformanceMetric;
    onTimeRate: PerformanceMetric;
    averageRating: PerformanceMetric;
    flaggedRate: PerformanceMetric;
  };
  overallScore?: number;
  overallTrend?: TrendDirection;
}

/**
 * Raw stats from database for calculation
 */
export interface RawPerformanceStats {
  // Job counts
  totalJobsAccepted: number;
  totalJobsCompleted: number;
  totalJobsInPeriod: number;
  
  // Response metrics
  avgResponseMinutes: number;
  responseCount: number;
  
  // On-time metrics
  onTimeArrivals: number;
  totalArrivals: number;
  
  // Rating metrics
  averageRating: number;
  totalReviews: number;
  previousPeriodRating?: number;
  
  // Flagged metrics
  flaggedJobs: number;
  
  // Platform averages for comparison
  platformAvgResponseMinutes?: number;
  platformAvgCompletionRate?: number;
  platformAvgOnTimeRate?: number;
  platformAvgRating?: number;
  platformAvgFlaggedRate?: number;
}

/**
 * Trend calculation period
 */
export interface TrendPeriod {
  current: {
    start: Date;
    end: Date;
  };
  previous: {
    start: Date;
    end: Date;
  };
}

/**
 * Performance summary for admin view
 */
export interface LandscaperPerformanceSummary {
  landscaperId: string;
  landscaperName: string;
  email: string;
  tier: string;
  responseTime: number;
  completionRate: number;
  onTimeRate: number;
  averageRating: number;
  flaggedRate: number;
  overallScore: number;
  trend: TrendDirection;
}

/**
 * Metric thresholds for trend calculation
 */
export const TREND_THRESHOLDS = {
  improving: 5, // > 5% improvement
  declining: -5, // < -5% decline
  // Between -5% and 5% is "stable"
};

/**
 * Platform percentile thresholds
 */
export const PERCENTILE_THRESHOLDS = {
  topPerformer: 90, // Top 10%
  aboveAverage: 60, // Top 40%
  average: 40, // Middle 20%
  // Below 40% is below average
};

/**
 * Metric display configuration
 */
export const METRIC_CONFIG: Record<string, {
  icon: string;
  goodDirection: 'high' | 'low';
  warningThreshold?: number;
  excellentThreshold?: number;
  format: 'percentage' | 'rating' | 'time' | 'number';
}> = {
  responseTime: {
    icon: 'clock',
    goodDirection: 'low',
    warningThreshold: 60, // minutes
    excellentThreshold: 15,
    format: 'time'
  },
  completionRate: {
    icon: 'check-circle',
    goodDirection: 'high',
    warningThreshold: 80,
    excellentThreshold: 95,
    format: 'percentage'
  },
  onTimeRate: {
    icon: 'timer',
    goodDirection: 'high',
    warningThreshold: 85,
    excellentThreshold: 95,
    format: 'percentage'
  },
  averageRating: {
    icon: 'star',
    goodDirection: 'high',
    warningThreshold: 4.0,
    excellentThreshold: 4.8,
    format: 'rating'
  },
  flaggedRate: {
    icon: 'alert-triangle',
    goodDirection: 'low',
    warningThreshold: 5,
    excellentThreshold: 1,
    format: 'percentage'
  }
};
