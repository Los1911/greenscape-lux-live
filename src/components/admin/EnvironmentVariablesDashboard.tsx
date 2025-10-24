import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Shield, Key, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import { EnvironmentVariableManager } from '@/services/EnvironmentVariableManager';

interface EnvStatus {
  environment: string;
  keys: {
    publishable: { status: string; lastValidated?: string };
    secret: { status: string; lastValidated?: string };
    webhook: { status: string; lastValidated?: string };
  };
  lastSync?: string;
}

export function EnvironmentVariablesDashboard() {
  const [envStatuses, setEnvStatuses] = useState<EnvStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [rotating, setRotating] = useState<string | null>(null);
  const envManager = EnvironmentVariableManager.getInstance();

  useEffect(() => {
    loadEnvironmentStatuses();
  }, []);

  const loadEnvironmentStatuses = async () => {
    setLoading(true);
    try {
      const environments = ['development', 'staging', 'production'];
      const statuses = await Promise.all(
        environments.map(async (env) => {
          const status = await envManager.getEnvironmentStatus(env);
          return {
            environment: env,
            keys: status?.keys || {
              publishable: { status: 'unknown' },
              secret: { status: 'unknown' },
              webhook: { status: 'unknown' }
            },
            lastSync: status?.lastSync
          };
        })
      );
      setEnvStatuses(statuses);
    } catch (error) {
      console.error('Failed to load environment statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (source: string, target: string) => {
    setSyncing(true);
    try {
      const success = await envManager.syncEnvironmentVariables(source, target);
      if (success) {
        await loadEnvironmentStatuses();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleRotation = async (environment: string) => {
    setRotating(environment);
    try {
      const success = await envManager.rotateStripeKeys(environment);
      if (success) {
        await loadEnvironmentStatuses();
      }
    } catch (error) {
      console.error('Rotation failed:', error);
    } finally {
      setRotating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-500';
      case 'invalid': return 'bg-red-500';
      case 'expired': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle className="h-4 w-4" />;
      case 'invalid': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading environment statuses...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Environment Variables Management
          </CardTitle>
          <CardDescription>
            Manage and sync Stripe API keys across development, staging, and production environments
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sync">Environment Sync</TabsTrigger>
          <TabsTrigger value="rotation">Key Rotation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {envStatuses.map((env) => (
              <Card key={env.environment}>
                <CardHeader>
                  <CardTitle className="capitalize flex items-center justify-between">
                    {env.environment}
                    <Badge variant={env.environment === 'production' ? 'destructive' : 'secondary'}>
                      {env.environment === 'production' ? 'LIVE' : 'TEST'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(env.keys).map(([keyType, keyInfo]) => (
                    <div key={keyType} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{keyType.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(keyInfo.status)}
                        <Badge className={getStatusColor(keyInfo.status)}>
                          {keyInfo.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {env.lastSync && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Last sync: {new Date(env.lastSync).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Alert>
            <RotateCcw className="h-4 w-4" />
            <AlertDescription>
              Sync environment variables between environments. Always test in staging before production.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Development → Staging</CardTitle>
                <CardDescription>Sync test keys to staging environment</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleSync('development', 'staging')}
                  disabled={syncing}
                  className="w-full"
                >
                  {syncing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                  Sync to Staging
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Staging → Production</CardTitle>
                <CardDescription>Deploy validated keys to production</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleSync('staging', 'production')}
                  disabled={syncing}
                  variant="destructive"
                  className="w-full"
                >
                  {syncing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                  Deploy to Production
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rotation" className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Rotate API keys for security. This will generate new keys and update all environments.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-3">
            {envStatuses.map((env) => (
              <Card key={env.environment}>
                <CardHeader>
                  <CardTitle className="capitalize">{env.environment}</CardTitle>
                  <CardDescription>Rotate all Stripe keys for this environment</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleRotation(env.environment)}
                    disabled={rotating === env.environment}
                    variant={env.environment === 'production' ? 'destructive' : 'default'}
                    className="w-full"
                  >
                    {rotating === env.environment ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Key className="h-4 w-4 mr-2" />
                    )}
                    Rotate Keys
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={loadEnvironmentStatuses} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>
    </div>
  );
}