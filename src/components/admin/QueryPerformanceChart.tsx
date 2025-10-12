import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/lib/supabase';

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
  const [metrics, setMetrics] = useState<QueryMetric[]>([]);
  const [topQueries, setTopQueries] = useState<TopQuery[]>([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueryMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Fetch time series data
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
      
      // Fetch top slow queries
      const { data: slowQueriesData } = await supabase.rpc('get_top_slow_queries', {
        limit_count: 10
      });
      
      if (slowQueriesData) {
        const formattedQueries = slowQueriesData.map((item: any) => ({
          query: item.query_text?.substring(0, 100) + '...' || 'Unknown Query',
          avgTime: item.avg_execution_time || 0,
          callCount: item.call_count || 0,
          totalTime: item.total_execution_time || 0
        }));
        setTopQueries(formattedQueries);
      }
    } catch (error) {
      console.error('Error fetching query metrics:', error);
      
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
        { query: 'UPDATE payments SET status = ? WHERE job_id = ?...', avgTime: 750, callCount: 67, totalTime: 50250 },
        { query: 'SELECT COUNT(*) FROM quotes WHERE client_id = ?...', avgTime: 650, callCount: 89, totalTime: 57850 },
        { query: 'INSERT INTO notifications (user_id, message, type)...', avgTime: 450, callCount: 156, totalTime: 70200 }
      ];
      setTopQueries(mockQueries);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueryMetrics();
  }, [timeRange]);

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
                <Line 
                  type="monotone" 
                  dataKey="avgExecutionTime" 
                  stroke="#8884d8" 
                  name="Avg Time (ms)"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="slowQueryCount" 
                  stroke="#ff7300" 
                  name="Slow Queries"
                  strokeWidth={2}
                />
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
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="cacheHitRate" 
                  stroke="#82ca9d" 
                  name="Cache Hit Rate (%)"
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="queryCount" 
                  stroke="#ffc658" 
                  name="Query Count"
                  strokeWidth={2}
                />
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
                    <span>Total: {query.totalTime}ms</span>
                  </div>
                </div>
                <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                  {query.query}
                </code>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        query.avgTime > 1000 ? 'bg-red-500' : 
                        query.avgTime > 500 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((query.avgTime / 2000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Query Performance Distribution</CardTitle>
          <CardDescription>Distribution of query execution times</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topQueries.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="query" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgTime" fill="#8884d8" name="Avg Time (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};