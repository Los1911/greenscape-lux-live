/**
 * Performance Calculator Utility
 * Calculates landscaper performance metrics from job and messaging data
 */

import {
  PerformanceAnalytics,
  PerformanceMetric,
  RawPerformanceStats,
  TrendDirection,
  ComparisonStatus,
  TREND_THRESHOLDS,
  PERCENTILE_THRESHOLDS
} from '@/types/performance';

/**
 * Calculate trend direction based on percentage change
 */
export function calculateTrend(current: number, previous: number): TrendDirection {
  if (previous === 0) return 'stable';
  
  const percentChange = ((current - previous) / previous) * 100;
  
  if (percentChange > TREND_THRESHOLDS.improving) return 'improving';
  if (percentChange < TREND_THRESHOLDS.declining) return 'declining';
  return 'stable';
}

/**
 * Calculate trend for metrics where lower is better (like response time)
 */
export function calculateInverseTrend(current: number, previous: number): TrendDirection {
  if (previous === 0) return 'stable';
  
  const percentChange = ((previous - current) / previous) * 100;
  
  if (percentChange > TREND_THRESHOLDS.improving) return 'improving';
  if (percentChange < TREND_THRESHOLDS.declining) return 'declining';
  return 'stable';
}

/**
 * Calculate comparison status against platform average
 */
export function calculateComparisonStatus(
  value: number,
  platformAverage: number,
  isLowerBetter: boolean = false
): ComparisonStatus {
  if (platformAverage === 0) return 'average';
  
  const ratio = value / platformAverage;
  
  if (isLowerBetter) {
    if (ratio <= 0.5) return 'top_performer';
    if (ratio <= 0.8) return 'above_average';
    if (ratio <= 1.2) return 'average';
    return 'below_average';
  } else {
    if (ratio >= 1.2) return 'top_performer';
    if (ratio >= 1.05) return 'above_average';
    if (ratio >= 0.95) return 'average';
    return 'below_average';
  }
}

/**
 * Format time in minutes to human-readable string
 */
export function formatResponseTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Get comparison message for a metric
 */
export function getComparisonMessage(status: ComparisonStatus, metricName: string): string {
  switch (status) {
    case 'top_performer':
      return `You're in the top 10% for ${metricName}!`;
    case 'above_average':
      return `You're above platform average`;
    case 'average':
      return `You're at platform average`;
    case 'below_average':
      return `Room for improvement`;
    default:
      return '';
  }
}

/**
 * Get trend percentage change
 */
export function getTrendPercentage(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Calculate all performance metrics from raw stats
 */
export function calculatePerformanceMetrics(
  stats: RawPerformanceStats,
  previousStats?: Partial<RawPerformanceStats>
): PerformanceAnalytics['metrics'] {
  // Response Time Metric
  const responseTimeValue = stats.avgResponseMinutes || 0;
  const prevResponseTime = previousStats?.avgResponseMinutes || responseTimeValue;
  const responseTimeTrend = calculateInverseTrend(responseTimeValue, prevResponseTime);
  const responseTimeComparison = calculateComparisonStatus(
    responseTimeValue,
    stats.platformAvgResponseMinutes || 30,
    true
  );

  const responseTime: PerformanceMetric = {
    id: 'responseTime',
    label: 'Response Time',
    value: responseTimeValue,
    displayValue: formatResponseTime(responseTimeValue),
    unit: 'minutes',
    trend: responseTimeTrend,
    trendPercentage: getTrendPercentage(prevResponseTime, responseTimeValue), // Inverted for "lower is better"
    previousValue: prevResponseTime,
    platformAverage: stats.platformAvgResponseMinutes,
    comparisonStatus: responseTimeComparison,
    description: 'Average time to respond to job requests',
    helpText: 'Faster responses help you get more jobs'
  };

  // Completion Rate Metric
  const completionRateValue = stats.totalJobsAccepted > 0
    ? Math.round((stats.totalJobsCompleted / stats.totalJobsAccepted) * 100)
    : 100;
  const prevCompletionRate = previousStats?.totalJobsAccepted && previousStats?.totalJobsCompleted
    ? Math.round((previousStats.totalJobsCompleted / previousStats.totalJobsAccepted) * 100)
    : completionRateValue;
  const completionRateTrend = calculateTrend(completionRateValue, prevCompletionRate);
  const completionRateComparison = calculateComparisonStatus(
    completionRateValue,
    stats.platformAvgCompletionRate || 95
  );

  const completionRate: PerformanceMetric = {
    id: 'completionRate',
    label: 'Completion Rate',
    value: completionRateValue,
    displayValue: `${completionRateValue}%`,
    unit: '%',
    trend: completionRateTrend,
    trendPercentage: getTrendPercentage(completionRateValue, prevCompletionRate),
    previousValue: prevCompletionRate,
    platformAverage: stats.platformAvgCompletionRate,
    comparisonStatus: completionRateComparison,
    description: 'Percentage of accepted jobs completed',
    helpText: 'Complete jobs you accept to maintain a high rate'
  };

  // On-Time Rate Metric
  const onTimeRateValue = stats.totalArrivals > 0
    ? Math.round((stats.onTimeArrivals / stats.totalArrivals) * 100)
    : 100;
  const prevOnTimeRate = previousStats?.totalArrivals && previousStats?.onTimeArrivals
    ? Math.round((previousStats.onTimeArrivals / previousStats.totalArrivals) * 100)
    : onTimeRateValue;
  const onTimeRateTrend = calculateTrend(onTimeRateValue, prevOnTimeRate);
  const onTimeRateComparison = calculateComparisonStatus(
    onTimeRateValue,
    stats.platformAvgOnTimeRate || 90
  );

  const onTimeRate: PerformanceMetric = {
    id: 'onTimeRate',
    label: 'On-Time Arrival',
    value: onTimeRateValue,
    displayValue: `${onTimeRateValue}%`,
    unit: '%',
    trend: onTimeRateTrend,
    trendPercentage: getTrendPercentage(onTimeRateValue, prevOnTimeRate),
    previousValue: prevOnTimeRate,
    platformAverage: stats.platformAvgOnTimeRate,
    comparisonStatus: onTimeRateComparison,
    description: 'Percentage of jobs with on-time arrival',
    helpText: 'Arrive on time to build customer trust'
  };

  // Average Rating Metric
  const avgRatingValue = stats.averageRating || 0;
  const prevAvgRating = previousStats?.averageRating || stats.previousPeriodRating || avgRatingValue;
  const avgRatingTrend = calculateTrend(avgRatingValue, prevAvgRating);
  const avgRatingComparison = calculateComparisonStatus(
    avgRatingValue,
    stats.platformAvgRating || 4.5
  );

  const averageRating: PerformanceMetric = {
    id: 'averageRating',
    label: 'Customer Rating',
    value: avgRatingValue,
    displayValue: avgRatingValue.toFixed(1),
    unit: 'stars',
    trend: avgRatingTrend,
    trendPercentage: getTrendPercentage(avgRatingValue, prevAvgRating),
    previousValue: prevAvgRating,
    platformAverage: stats.platformAvgRating,
    comparisonStatus: avgRatingComparison,
    description: 'Average rating from customer reviews',
    helpText: 'Great service leads to great reviews'
  };

  // Flagged Rate Metric
  const flaggedRateValue = stats.totalJobsCompleted > 0
    ? Math.round((stats.flaggedJobs / stats.totalJobsCompleted) * 100)
    : 0;
  const prevFlaggedRate = previousStats?.totalJobsCompleted && previousStats?.flaggedJobs !== undefined
    ? Math.round((previousStats.flaggedJobs / previousStats.totalJobsCompleted) * 100)
    : flaggedRateValue;
  const flaggedRateTrend = calculateInverseTrend(flaggedRateValue, prevFlaggedRate);
  const flaggedRateComparison = calculateComparisonStatus(
    flaggedRateValue,
    stats.platformAvgFlaggedRate || 2,
    true
  );

  const flaggedRate: PerformanceMetric = {
    id: 'flaggedRate',
    label: 'Issue Rate',
    value: flaggedRateValue,
    displayValue: `${flaggedRateValue}%`,
    unit: '%',
    trend: flaggedRateTrend,
    trendPercentage: getTrendPercentage(prevFlaggedRate, flaggedRateValue), // Inverted
    previousValue: prevFlaggedRate,
    platformAverage: stats.platformAvgFlaggedRate,
    comparisonStatus: flaggedRateComparison,
    description: 'Percentage of jobs with reported issues',
    helpText: 'Lower is better - aim for zero issues'
  };

  return {
    responseTime,
    completionRate,
    onTimeRate,
    averageRating,
    flaggedRate
  };
}

/**
 * Calculate overall performance score (0-100)
 */
export function calculateOverallScore(metrics: PerformanceAnalytics['metrics']): number {
  const weights = {
    responseTime: 0.15,
    completionRate: 0.25,
    onTimeRate: 0.20,
    averageRating: 0.30,
    flaggedRate: 0.10
  };

  // Normalize each metric to 0-100 scale
  const normalizedResponseTime = Math.max(0, 100 - (metrics.responseTime.value / 60) * 100); // 60 min = 0 score
  const normalizedCompletionRate = metrics.completionRate.value;
  const normalizedOnTimeRate = metrics.onTimeRate.value;
  const normalizedRating = (metrics.averageRating.value / 5) * 100;
  const normalizedFlaggedRate = Math.max(0, 100 - metrics.flaggedRate.value * 10); // 10% flagged = 0 score

  const score = 
    normalizedResponseTime * weights.responseTime +
    normalizedCompletionRate * weights.completionRate +
    normalizedOnTimeRate * weights.onTimeRate +
    normalizedRating * weights.averageRating +
    normalizedFlaggedRate * weights.flaggedRate;

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Determine overall trend from individual metric trends
 */
export function calculateOverallTrend(metrics: PerformanceAnalytics['metrics']): TrendDirection {
  const trends = Object.values(metrics).map(m => m.trend);
  const improvingCount = trends.filter(t => t === 'improving').length;
  const decliningCount = trends.filter(t => t === 'declining').length;

  if (improvingCount >= 3) return 'improving';
  if (decliningCount >= 3) return 'declining';
  return 'stable';
}

/**
 * Get motivational message based on performance
 */
export function getMotivationalMessage(metrics: PerformanceAnalytics['metrics']): string {
  const messages: string[] = [];

  // Check for excellent metrics
  if (metrics.averageRating.value >= 4.8) {
    messages.push("Your ratings are outstanding! Customers love your work.");
  }
  if (metrics.completionRate.value >= 98) {
    messages.push("Amazing completion rate! You're incredibly reliable.");
  }
  if (metrics.onTimeRate.value >= 95) {
    messages.push("Your punctuality is top-notch!");
  }
  if (metrics.responseTime.value <= 15) {
    messages.push("Lightning-fast responses! Keep it up.");
  }
  if (metrics.flaggedRate.value === 0) {
    messages.push("Zero issues reported - excellent quality work!");
  }

  // Check for improvements
  if (metrics.averageRating.trend === 'improving') {
    messages.push("Your ratings are trending up - great progress!");
  }
  if (metrics.completionRate.trend === 'improving') {
    messages.push("Your completion rate is improving nicely.");
  }

  // Encouraging messages for areas to improve
  if (messages.length === 0) {
    if (metrics.responseTime.value > 30) {
      messages.push("Faster responses can help you win more jobs.");
    } else if (metrics.averageRating.value < 4.5) {
      messages.push("Focus on quality to boost your ratings.");
    } else {
      messages.push("You're doing well! Keep up the great work.");
    }
  }

  return messages[0] || "Keep up the great work!";
}
