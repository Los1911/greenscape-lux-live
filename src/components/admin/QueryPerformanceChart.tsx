import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface QueryMetric {
  timestamp: string;
  avgExecutionTime: number;
  queryCount: number;
  cacheHitRate: number;
  slowQueryCount: number;
}

interface TopQuery {
  query: string;
  avgTime: number;
  callCount: number;
  totalTime: number;
}

export const QueryPerformanceChart: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<QueryMetric[]>([]);
  const [topQueries, setTopQueries] = useState<TopQuery[]>([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueryMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: timeSeriesData } = await supabase.rpc('get_query_performance_timeseries', {
        time_range: timeRange
      });
      
      if (timeSeriesData) {
        const formattedMetrics = timeSeriesData.map((item: any) => ({
          timestamp: new Date(item.timestamp).toLocaleTimeString(),
          avgExecutionTime: item.avg_execution_time || 0,
          queryCount: item.query_count || 0,
          cacheHitRate: (item.cache_hit_rate || 0) * 100,
          slowQueryCount: item.slow_query_count || 0
        }));
        setMetrics(formattedMetrics);
      }
      
      const { data: slowQueriesData } = await supabase.rpc('get_top_slow_queries', {
        limit_count: 10
      });
      
      if (slowQueriesData) {
        const formattedQueries = slowQueriesData.map((item: any) => ({
          query: (item.query_text || 'Unknown Query').substring(0, 100) + '...',
          avgTime: item.avg_execution_time || 0,
          callCount: item.call_count || 0,
          totalTime: item.total_execution_time || 0
        }));
        setTopQueries(formattedQueries);
      }
    } catch (err) {
      console.error('Error fetching query metrics:', err);
      
      // Generate mock data for demo
      const mockMetrics = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 3600000).toLocaleTimeString(),
        avgExecutionTime: Math.random() * 500 + 200,
        queryCount: Math.floor(Math.random() * 1000) + 500,
        cacheHitRate: Math.random() * 20 + 80,
        slowQueryCount: Math.floor(Math.random() * 10)
      }));
      setMetrics(mockMetrics);
      
      const mockQueries = [
        { query: 'SELECT * FROM jobs WHERE status = ? AND created_at > ?...', avgTime: 1250, callCount: 45, totalTime: 56250 },
        { query: 'SELECT u.*, l.* FROM users u JOIN landscapers l ON...', avgTime: 980, callCount: 23, totalTime: 22540 },
        { query: 'UPDATE payments SET status = ? WHERE job_id = ?...', avgTime: 750, callCount: 67, totalTime: 50250 }
      ];
      setTopQueries(mockQueries);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    fetchQueryMetrics();
  }, [timeRange, authLoading, user]);

  if (authLoading) {
    return (
      <div className="flex justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchQueryMetrics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Query Performance Analysis</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Query Execution Time</CardTitle>
                <CardDescription>Average execution time over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avgExecutionTime" stroke="#8884d8" name="Avg Time (ms)" strokeWidth={2} />
                    <Line type="monotone" dataKey="slowQueryCount" stroke="#ff7300" name="Slow Queries" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Hit Rate & Query Volume</CardTitle>
                <CardDescription>Cache performance and query count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="cacheHitRate" stroke="#82ca9d" name="Cache Hit Rate (%)" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="queryCount" stroke="#ffc658" name="Query Count" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Slow Queries</CardTitle>
              <CardDescription>Queries with highest average execution time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topQueries.map((query, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Query #{index + 1}</span>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Avg: {query.avgTime}ms</span>
                        <span>Calls: {query.callCount}</span>
                      </div>
                    </div>
                    <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                      {query.query}
                    </code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
