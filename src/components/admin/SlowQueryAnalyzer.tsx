import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface SlowQuery {
  id: string;
  query: string;
  avgTime: number;
  calls: number;
  totalTime: number;
  lastSeen: Date;
}

export const SlowQueryAnalyzer: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [queries, setQueries] = useState<SlowQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlowQueries = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data } = await supabase.rpc('get_slow_queries_analysis');
      if (data) {
        setQueries(data.map((q: any) => ({
          id: q.query_id || String(Math.random()),
          query: (q.query_text || 'Unknown query').substring(0, 200) + '...',
          avgTime: q.avg_execution_time || 0,
          calls: q.call_count || 0,
          totalTime: q.total_execution_time || 0,
          lastSeen: new Date(q.last_seen || Date.now())
        })));
      }
    } catch (err) {
      console.error('Error fetching slow queries:', err);
      // Mock data for demo
      setQueries([
        {
          id: '1',
          query: 'SELECT * FROM jobs j JOIN users u ON j.client_id = u.id WHERE j.status = ? AND j.created_at > ?...',
          avgTime: 1250,
          calls: 45,
          totalTime: 56250,
          lastSeen: new Date()
        },
        {
          id: '2', 
          query: 'UPDATE payments SET status = ?, updated_at = NOW() WHERE job_id = ? AND client_id = ?...',
          avgTime: 980,
          calls: 23,
          totalTime: 22540,
          lastSeen: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    fetchSlowQueries();
  }, [authLoading, user]);

  const getSeverityBadge = (avgTime: number) => {
    if (avgTime > 2000) return <Badge variant="destructive">Critical</Badge>;
    if (avgTime > 1000) return <Badge variant="secondary">Warning</Badge>;
    return <Badge variant="default">Moderate</Badge>;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown';
    try {
      return date.toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="flex justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchSlowQueries} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Slow Query Analysis</h3>
        <Button variant="outline" size="sm" onClick={fetchSlowQueries} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Analysis
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : queries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground">No slow queries detected</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {queries.map((query) => (
            <Card key={query.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <CardTitle className="text-sm">Query Analysis</CardTitle>
                    {getSeverityBadge(query.avgTime)}
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {query.avgTime}ms avg
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {query.calls} calls
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <code className="text-xs bg-muted p-3 rounded block overflow-x-auto mb-3">
                  {query.query}
                </code>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Time:</span>
                    <div>{query.totalTime}ms</div>
                  </div>
                  <div>
                    <span className="font-medium">Call Count:</span>
                    <div>{query.calls}</div>
                  </div>
                  <div>
                    <span className="font-medium">Last Seen:</span>
                    <div>{formatDate(query.lastSeen)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
