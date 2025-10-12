import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PerformanceIssue {
  id: string;
  type: 'slow_query' | 'missing_index' | 'high_cpu' | 'connection_pool' | 'deadlock';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  table_name?: string;
  query?: string;
  recommendation: string;
  impact_score: number;
}

export default function PerformanceAuditDashboard() {
  const [issues, setIssues] = useState<PerformanceIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [stats, setStats] = useState({
    total_issues: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  useEffect(() => {
    runPerformanceAudit();
  }, []);

  const runPerformanceAudit = async () => {
    setLoading(true);
    try {
      // Simulate comprehensive performance audit
      const mockIssues: PerformanceIssue[] = [
        {
          id: '1',
          type: 'slow_query',
          severity: 'critical',
          description: 'Jobs table full scan on status column',
          table_name: 'jobs',
          query: 'SELECT * FROM jobs WHERE status = ?',
          recommendation: 'Add composite index on (status, created_at)',
          impact_score: 95
        },
        {
          id: '2',
          type: 'missing_index',
          severity: 'high',
          description: 'Missing index on communications.job_id',
          table_name: 'communications',
          recommendation: 'CREATE INDEX idx_communications_job_id ON communications(job_id)',
          impact_score: 85
        },
        {
          id: '3',
          type: 'connection_pool',
          severity: 'medium',
          description: 'Connection pool utilization at 78%',
          recommendation: 'Increase max connections or optimize query patterns',
          impact_score: 65
        }
      ];

      setIssues(mockIssues);
      setStats({
        total_issues: mockIssues.length,
        critical: mockIssues.filter(i => i.severity === 'critical').length,
        high: mockIssues.filter(i => i.severity === 'high').length,
        medium: mockIssues.filter(i => i.severity === 'medium').length,
        low: mockIssues.filter(i => i.severity === 'low').length
      });
    } catch (error) {
      console.error('Audit failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimizeDatabase = async () => {
    setOptimizing(true);
    try {
      // Run optimization queries
      const optimizations = [
        'ANALYZE;',
        'VACUUM ANALYZE;',
        'REINDEX DATABASE;'
      ];

      for (const query of optimizations) {
        await supabase.rpc('execute_sql', { query });
      }

      await runPerformanceAudit();
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Database Performance Audit</h2>
        <div className="space-x-2">
          <Button onClick={runPerformanceAudit} disabled={loading}>
            {loading ? 'Scanning...' : 'Run Audit'}
          </Button>
          <Button onClick={optimizeDatabase} disabled={optimizing} variant="outline">
            {optimizing ? 'Optimizing...' : 'Auto-Optimize'}
          </Button>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total_issues}</div>
            <div className="text-sm text-muted-foreground">Total Issues</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <div className="text-sm text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
            <div className="text-sm text-muted-foreground">High</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
            <div className="text-sm text-muted-foreground">Medium</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.low}</div>
            <div className="text-sm text-muted-foreground">Low</div>
          </CardContent>
        </Card>
      </div>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {issues.map((issue) => (
              <div key={issue.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={getSeverityColor(issue.severity) as any}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{issue.type.replace('_', ' ').toUpperCase()}</Badge>
                        {issue.table_name && (
                          <Badge variant="secondary">{issue.table_name}</Badge>
                        )}
                      </div>
                      <h4 className="font-medium mb-1">{issue.description}</h4>
                      {issue.query && (
                        <code className="text-sm bg-muted p-2 rounded block mb-2">
                          {issue.query}
                        </code>
                      )}
                      <p className="text-sm text-muted-foreground">
                        <strong>Recommendation:</strong> {issue.recommendation}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium">
                      Impact: {issue.impact_score}/100
                    </div>
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}