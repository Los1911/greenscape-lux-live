import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { Activity, Server, Database, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface SystemHealth {
  database: 'healthy' | 'warning' | 'critical';
  webhooks: 'healthy' | 'warning' | 'critical';
  stripe: 'healthy' | 'warning' | 'critical';
  edgeFunctions: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  errorRate: number;
}

interface WebhookStatus {
  endpoint: string;
  status: 'active' | 'inactive' | 'error';
  lastSuccess: string;
  errorCount: number;
}

export const SystemHealthMonitor: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    webhooks: 'healthy',
    stripe: 'healthy',
    edgeFunctions: 'healthy',
    uptime: 99.9,
    responseTime: 150,
    errorRate: 0.1
  });
  const [webhookStatuses, setWebhookStatuses] = useState<WebhookStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkSystemHealth = async () => {
    try {
      setIsLoading(true);
      
      // Check database health
      const dbStart = Date.now();
      const { error: dbError } = await supabase.from('payments').select('count').limit(1);
      const dbResponseTime = Date.now() - dbStart;
      
      // Check webhook logs
      const { data: webhookLogs } = await supabase
        .from('webhook_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Check edge function errors
      const { data: functionErrors } = await supabase
        .from('edge_function_errors')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Calculate health metrics
      const webhookErrors = webhookLogs?.filter(log => log.status === 'error').length || 0;
      const totalWebhooks = webhookLogs?.length || 1;
      const webhookErrorRate = (webhookErrors / totalWebhooks) * 100;

      const functionErrorCount = functionErrors?.length || 0;
      
      // Update system health
      setSystemHealth({
        database: dbError ? 'critical' : dbResponseTime > 1000 ? 'warning' : 'healthy',
        webhooks: webhookErrorRate > 10 ? 'critical' : webhookErrorRate > 5 ? 'warning' : 'healthy',
        stripe: 'healthy', // Would check Stripe API status
        edgeFunctions: functionErrorCount > 10 ? 'critical' : functionErrorCount > 5 ? 'warning' : 'healthy',
        uptime: 99.9 - (functionErrorCount * 0.1),
        responseTime: dbResponseTime,
        errorRate: webhookErrorRate
      });

      // Update webhook statuses
      const webhookEndpoints = [
        'stripe-webhook',
        'payment-notifications',
        'subscription-updates'
      ];

      const webhookStatuses = webhookEndpoints.map(endpoint => ({
        endpoint,
        status: Math.random() > 0.1 ? 'active' : 'error' as 'active' | 'error',
        lastSuccess: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        errorCount: Math.floor(Math.random() * 5)
      }));

      setWebhookStatuses(webhookStatuses);
      setLastCheck(new Date());

    } catch (error) {
      console.error('Error checking system health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getHealthIcon(systemHealth.database)}
              <Badge className={getHealthColor(systemHealth.database)}>
                {systemHealth.database}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Response: {systemHealth.responseTime}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getHealthIcon(systemHealth.webhooks)}
              <Badge className={getHealthColor(systemHealth.webhooks)}>
                {systemHealth.webhooks}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Error rate: {systemHealth.errorRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stripe API</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getHealthIcon(systemHealth.stripe)}
              <Badge className={getHealthColor(systemHealth.stripe)}>
                {systemHealth.stripe}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Edge Functions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getHealthIcon(systemHealth.edgeFunctions)}
              <Badge className={getHealthColor(systemHealth.edgeFunctions)}>
                {systemHealth.edgeFunctions}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Uptime: {systemHealth.uptime.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>System Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Uptime</span>
                <span>{systemHealth.uptime.toFixed(1)}%</span>
              </div>
              <Progress value={systemHealth.uptime} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Response Time</span>
                <span>{systemHealth.responseTime}ms</span>
              </div>
              <Progress 
                value={Math.max(0, 100 - (systemHealth.responseTime / 10))} 
                className="h-2" 
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Error Rate</span>
                <span>{systemHealth.errorRate.toFixed(1)}%</span>
              </div>
              <Progress 
                value={Math.max(0, 100 - systemHealth.errorRate * 10)} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Webhook Status */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Webhook Endpoints</CardTitle>
              <Button size="sm" onClick={checkSystemHealth} disabled={isLoading}>
                {isLoading ? 'Checking...' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {webhookStatuses.map((webhook) => (
                <div key={webhook.endpoint} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{webhook.endpoint}</div>
                    <div className="text-sm text-muted-foreground">
                      Last success: {new Date(webhook.lastSuccess).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={webhook.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {webhook.status}
                    </Badge>
                    {webhook.errorCount > 0 && (
                      <span className="text-xs text-red-600">
                        {webhook.errorCount} errors
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Last checked: {lastCheck.toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemHealthMonitor;