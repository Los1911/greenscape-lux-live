import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Database, HardDrive, Cpu } from 'lucide-react';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: number;
  threshold: number;
  unit: string;
  description: string;
}

export const DatabaseHealthIndicators: React.FC = () => {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);

  useEffect(() => {
    // Mock health data - in real app would fetch from database
    setMetrics([
      {
        name: 'CPU Usage',
        status: 'healthy',
        value: 45,
        threshold: 80,
        unit: '%',
        description: 'Database server CPU utilization'
      },
      {
        name: 'Memory Usage',
        status: 'warning',
        value: 72,
        threshold: 85,
        unit: '%',
        description: 'RAM usage by database processes'
      },
      {
        name: 'Disk Usage',
        status: 'healthy',
        value: 35,
        threshold: 90,
        unit: '%',
        description: 'Storage space utilization'
      },
      {
        name: 'Connection Pool',
        status: 'healthy',
        value: 45,
        threshold: 80,
        unit: '%',
        description: 'Active connections vs pool size'
      },
      {
        name: 'Query Performance',
        status: 'warning',
        value: 1250,
        threshold: 1000,
        unit: 'ms',
        description: 'Average query execution time'
      },
      {
        name: 'Cache Hit Rate',
        status: 'healthy',
        value: 96,
        threshold: 95,
        unit: '%',
        description: 'Database cache effectiveness'
      }
    ]);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default">Healthy</Badge>;
      case 'warning':
        return <Badge variant="secondary">Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const overallHealth = metrics.filter(m => m.status === 'healthy').length / metrics.length * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Database Health Indicators</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Overall Health:</span>
          <Badge variant={overallHealth > 80 ? 'default' : overallHealth > 60 ? 'secondary' : 'destructive'}>
            {overallHealth.toFixed(0)}%
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall System Health</span>
              <span>{overallHealth.toFixed(1)}%</span>
            </div>
            <Progress value={overallHealth} />
            <p className="text-xs text-muted-foreground">
              {metrics.filter(m => m.status === 'healthy').length} of {metrics.length} metrics are healthy
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(metric.status)}
                  <CardTitle className="text-sm">{metric.name}</CardTitle>
                </div>
                {getStatusBadge(metric.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {metric.value}{metric.unit}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Threshold: {metric.threshold}{metric.unit}
                  </span>
                </div>
                
                {metric.unit === '%' && (
                  <Progress 
                    value={metric.value} 
                    className={
                      metric.status === 'critical' ? 'bg-red-100' :
                      metric.status === 'warning' ? 'bg-yellow-100' : 
                      'bg-green-100'
                    }
                  />
                )}
                
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Health Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-500">
                {metrics.filter(m => m.status === 'healthy').length}
              </div>
              <p className="text-sm text-muted-foreground">Healthy</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">
                {metrics.filter(m => m.status === 'warning').length}
              </div>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">
                {metrics.filter(m => m.status === 'critical').length}
              </div>
              <p className="text-sm text-muted-foreground">Critical</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};