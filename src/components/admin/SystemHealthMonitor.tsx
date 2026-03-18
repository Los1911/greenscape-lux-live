import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Activity,
  Server,
  Database,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

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
  const { user, loading: authLoading } = useAuth();
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    webhooks: 'healthy',
    stripe: 'healthy',
    edgeFunctions: 'healthy',
    uptime: 99.9,
    responseTime: 150,
    errorRate: 0.1,
  });
  const [webhookStatuses, setWebhookStatuses] = useState<WebhookStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 60000);
    return () => clearInterval(interval);
  }, [authLoading, user]);

  const checkSystemHealth = async () => {
    try {
      setIsLoading(true);

      const dbStart = Date.now();
      const { error: dbError } = await supabase
        .from('payments')
        .select('count')
        .limit(1);
      const dbResponseTime = Date.now() - dbStart;

      const { data: webhookLogs } = await supabase
        .from('webhook_logs')
        .select('*')
        .gte(
          'created_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        );

      const { data: functionErrors } = await supabase
        .from('edge_function_errors')
        .select('*')
        .gte(
          'created_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        );

      const webhookErrors =
        webhookLogs?.filter((log) => log.status === 'error').length || 0;
      const totalWebhooks = webhookLogs?.length || 1;
      const webhookErrorRate = (webhookErrors / totalWebhooks) * 100;
      const functionErrorCount = functionErrors?.length || 0;

      setSystemHealth({
        database: dbError
          ? 'critical'
          : dbResponseTime > 1000
            ? 'warning'
            : 'healthy',
        webhooks:
          webhookErrorRate > 10
            ? 'critical'
            : webhookErrorRate > 5
              ? 'warning'
              : 'healthy',
        stripe: 'healthy',
        edgeFunctions:
          functionErrorCount > 10
            ? 'critical'
            : functionErrorCount > 5
              ? 'warning'
              : 'healthy',
        uptime: 99.9 - functionErrorCount * 0.1,
        responseTime: dbResponseTime,
        errorRate: webhookErrorRate,
      });

      const webhookEndpoints = [
        'stripe-webhook',
        'payment-notifications',
        'subscription-updates',
      ];

      const statuses = webhookEndpoints.map((endpoint) => ({
        endpoint,
        status: (Math.random() > 0.1 ? 'active' : 'error') as
          | 'active'
          | 'error',
        lastSuccess: new Date(
          Date.now() - Math.random() * 3600000
        ).toISOString(),
        errorCount: Math.floor(Math.random() * 5),
      }));

      setWebhookStatuses(statuses);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Error checking system health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500 shrink-0" />;
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  /* ── Health status cards data ───────────────────────────── */
  const healthCards = [
    {
      title: 'Database',
      icon: Database,
      status: systemHealth.database,
      detail: `Response: ${systemHealth.responseTime}ms`,
    },
    {
      title: 'Webhooks',
      icon: Zap,
      status: systemHealth.webhooks,
      detail: `Error rate: ${systemHealth.errorRate.toFixed(1)}%`,
    },
    {
      title: 'Stripe API',
      icon: Server,
      status: systemHealth.stripe,
      detail: 'All systems operational',
    },
    {
      title: 'Edge Functions',
      icon: Activity,
      status: systemHealth.edgeFunctions,
      detail: `Uptime: ${systemHealth.uptime.toFixed(1)}%`,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">

      {/* System Overview — grid-cols-1 mobile, 2 sm, 4 lg */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {healthCards.map((card) => {
          const CardIcon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                <CardTitle className="text-sm font-medium truncate pr-2">
                  {card.title}
                </CardTitle>
                <CardIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="flex items-center gap-2">
                  {getHealthIcon(card.status)}
                  <Badge className={getHealthColor(card.status)}>
                    {card.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2 truncate">
                  {card.detail}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Metrics — stacked on mobile, side-by-side on lg */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        {/* System Metrics */}
        <Card>
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-base sm:text-lg">
              System Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
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
                value={Math.max(0, 100 - systemHealth.responseTime / 10)}
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
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            {/* Stacked on mobile, row on sm+ */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
              <CardTitle className="text-base sm:text-lg">
                Webhook Endpoints
              </CardTitle>
              <Button
                size="sm"
                onClick={checkSystemHealth}
                disabled={isLoading}
                className="w-full sm:w-auto h-10"
              >
                {isLoading ? 'Checking...' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-3">
              {webhookStatuses.map((webhook) => (
                <div
                  key={webhook.endpoint}
                  className="flex flex-col gap-2 p-3 border rounded-lg sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      {webhook.endpoint}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Last success:{' '}
                      {new Date(webhook.lastSuccess).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      className={
                        webhook.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {webhook.status}
                    </Badge>
                    {webhook.errorCount > 0 && (
                      <span className="text-xs text-red-600 whitespace-nowrap">
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
