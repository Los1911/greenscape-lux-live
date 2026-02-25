import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Database, TrendingUp, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { QueryPerformanceChart } from './QueryPerformanceChart';
import { ConnectionPoolStatus } from './ConnectionPoolStatus';
import { SlowQueryAnalyzer } from './SlowQueryAnalyzer';
import { IndexUsageStats } from './IndexUsageStats';
import { DatabaseHealthIndicators } from './DatabaseHealthIndicators';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface DatabaseMetrics {
  connectionCount: number;
  activeQueries: number;
  avgQueryTime: number;
  cacheHitRate: number;
  slowQueries: number;
  indexEfficiency: number;
  diskUsage: number;
  memoryUsage: number;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export const DatabaseMonitoringDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<DatabaseMetrics>({
    connectionCount: 0,
    activeQueries: 0,
    avgQueryTime: 0,
    cacheHitRate: 0,
    slowQueries: 0,
    indexEfficiency: 0,
    diskUsage: 0,
    memoryUsage: 0
  });
  
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = async () => {
    try {
      const { data: dbStats } = await supabase.rpc('get_database_stats');
      const { data: queryStats } = await supabase.rpc('get_query_performance_stats');
      
      if (dbStats && queryStats) {
        setMetrics({
          connectionCount: dbStats.connection_count || 0,
          activeQueries: dbStats.active_queries || 0,
          avgQueryTime: queryStats.avg_execution_time || 0,
          cacheHitRate: dbStats.cache_hit_rate || 0,
          slowQueries: queryStats.slow_query_count || 0,
          indexEfficiency: dbStats.index_hit_rate || 0,
          diskUsage: dbStats.disk_usage_percent || 0,
          memoryUsage: dbStats.memory_usage_percent || 0
        });
        
        checkPerformanceAlerts(dbStats, queryStats);
      }
    } catch (error) {
      console.error('Error fetching database metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPerformanceAlerts = (dbStats: any, queryStats: any) => {
    const newAlerts: PerformanceAlert[] = [];
    
    if (queryStats?.avg_execution_time > 1000) {
      newAlerts.push({
        id: `slow-query-${Date.now()}`,
        type: 'warning',
        message: `Average query time is ${queryStats.avg_execution_time}ms (threshold: 1000ms)`,
        timestamp: new Date(),
        resolved: false
      });
    }
    
    if (dbStats?.connection_count > 80) {
      newAlerts.push({
        id: `high-connections-${Date.now()}`,
        type: 'error',
        message: `High connection count: ${dbStats.connection_count}/100`,
        timestamp: new Date(),
        resolved: false
      });
    }
    
    if (dbStats?.cache_hit_rate < 0.95) {
      newAlerts.push({
        id: `low-cache-${Date.now()}`,
        type: 'warning',
        message: `Low cache hit rate: ${(dbStats.cache_hit_rate * 100).toFixed(1)}%`,
        timestamp: new Date(),
        resolved: false
      });
    }
    
    setAlerts(prev => [...prev.filter(a => a.resolved), ...newAlerts]);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    
    fetchMetrics();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchMetrics, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authLoading, user, autoRefresh]);

  const getHealthStatus = () => {
    if (metrics.avgQueryTime > 1000 || metrics.connectionCount > 80) return 'error';
    if (metrics.cacheHitRate < 0.95 || metrics.slowQueries > 10) return 'warning';
    return 'healthy';
  };

  const healthStatus = getHealthStatus();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (

    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Database Monitoring</h2>
          <p className="text-muted-foreground">Real-time performance metrics and health indicators</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={healthStatus === 'healthy' ? 'default' : healthStatus === 'warning' ? 'secondary' : 'destructive'}>
            {healthStatus === 'healthy' ? <CheckCircle className="w-4 h-4 mr-1" /> : 
             healthStatus === 'warning' ? <AlertTriangle className="w-4 h-4 mr-1" /> : 
             <XCircle className="w-4 h-4 mr-1" />}
            {healthStatus.toUpperCase()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </Button>
          <Button size="sm" onClick={fetchMetrics} disabled={isLoading}>
            Refresh Now
          </Button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map(alert => (
            <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.connectionCount}/100</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.connectionCount / 100) * 100).toFixed(1)}% capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Query Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgQueryTime}ms</div>
            <p className="text-xs text-muted-foreground">
              {metrics.avgQueryTime > 1000 ? 'Above threshold' : 'Within limits'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.cacheHitRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.cacheHitRate > 0.95 ? 'Excellent' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slow Queries</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.slowQueries}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="queries">Slow Queries</TabsTrigger>
          <TabsTrigger value="indexes">Index Usage</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <QueryPerformanceChart />
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <ConnectionPoolStatus />
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <SlowQueryAnalyzer />
        </TabsContent>

        <TabsContent value="indexes" className="space-y-4">
          <IndexUsageStats />
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <DatabaseHealthIndicators />
        </TabsContent>
      </Tabs>
    </div>
  );
};