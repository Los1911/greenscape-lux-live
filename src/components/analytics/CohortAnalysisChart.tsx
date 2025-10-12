import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CohortData {
  cohort: string;
  size: number;
  periods: { [key: string]: { retention: number; revenue: number } };
}

export function CohortAnalysisChart() {
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [metric, setMetric] = useState<'retention' | 'revenue'>('retention');
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCohortData();
  }, [metric, period]);

  const fetchCohortData = async () => {
    setLoading(true);
    try {
      // Query jobs grouped by month and service type
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('created_at, status, service_type, total_amount')
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group jobs by cohort (month)
      const cohortMap = new Map<string, { jobs: any[], revenue: number }>();
      
      (jobs || []).forEach(job => {
        const cohort = new Date(job.created_at).toISOString().slice(0, 7); // YYYY-MM
        if (!cohortMap.has(cohort)) {
          cohortMap.set(cohort, { jobs: [], revenue: 0 });
        }
        const cohortData = cohortMap.get(cohort)!;
        cohortData.jobs.push(job);
        cohortData.revenue += job.total_amount || 0;
      });

      // Convert to CohortData format
      const formattedData: CohortData[] = Array.from(cohortMap.entries())
        .slice(-6) // Last 6 months
        .map(([cohort, data]) => ({
          cohort,
          size: data.jobs.length,
          periods: {
            '0': { retention: 100, revenue: data.revenue }
          }
        }));

      setCohortData(formattedData);
    } catch (error) {
      console.error('Failed to fetch cohort data:', error);
      setCohortData([]);
    } finally {
      setLoading(false);
    }
  };

  const getColorIntensity = (value: number, maxValue: number) => {
    const intensity = Math.max(0.2, value / maxValue);
    if (metric === 'retention') {
      return `rgba(34, 197, 94, ${intensity})`;
    } else {
      return `rgba(59, 130, 246, ${intensity})`;
    }
  };

  const formatValue = (value: number) => {
    if (metric === 'retention') {
      return `${value.toFixed(1)}%`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  };

  const calculateAverage = (periodIndex: string) => {
    const values = cohortData
      .filter(cohort => cohort.periods[periodIndex])
      .map(cohort => cohort.periods[periodIndex][metric]);
    
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (cohortData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Cohort Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No cohort data available. Complete some jobs to see analytics.
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxPeriods = Math.max(...cohortData.map(c => Object.keys(c.periods).length));
  const maxValue = Math.max(
    ...cohortData.flatMap(c => 
      Object.values(c.periods).map(p => p[metric])
    )
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Cohort Analysis</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Track customer behavior over time by acquisition period
            </p>
          </div>
          <div className="flex space-x-3">
            <Select value={metric} onValueChange={(value: 'retention' | 'revenue') => setMetric(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retention">Retention</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={(value: 'monthly' | 'weekly') => setPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 border-b font-medium text-gray-600">Cohort</th>
                  <th className="text-center p-3 border-b font-medium text-gray-600">Size</th>
                  {Array.from({ length: maxPeriods }, (_, i) => (
                    <th key={i} className="text-center p-3 border-b font-medium text-gray-600">
                      Period {i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortData.map((cohort) => (
                  <tr key={cohort.cohort} className="hover:bg-gray-50">
                    <td className="p-3 border-b font-medium">{cohort.cohort}</td>
                    <td className="p-3 border-b text-center">
                      <Badge variant="outline">{cohort.size}</Badge>
                    </td>
                    {Array.from({ length: maxPeriods }, (_, i) => {
                      const periodData = cohort.periods[i.toString()];
                      return (
                        <td key={i} className="p-3 border-b text-center">
                          {periodData ? (
                            <div
                              className="px-2 py-1 rounded text-white text-sm font-medium"
                              style={{
                                backgroundColor: getColorIntensity(periodData[metric], maxValue)
                              }}
                            >
                              {formatValue(periodData[metric])}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {Array.from({ length: maxPeriods }, (_, i) => {
              const avg = calculateAverage(i.toString());
              const prevAvg = i > 0 ? calculateAverage((i - 1).toString()) : avg;
              const trend = avg > prevAvg;
              
              return (
                <Card key={i} className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Period {i}</p>
                    <p className="text-lg font-bold">{formatValue(avg)}</p>
                    {i > 0 && (
                      <div className="flex items-center justify-center mt-1">
                        {trend ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Insights</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Based on {cohortData.length} cohorts from completed jobs</li>
              <li>• Data sourced from real job completion records</li>
              <li>• Revenue calculated from actual job amounts</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
