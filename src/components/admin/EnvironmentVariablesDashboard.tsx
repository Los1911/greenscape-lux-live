import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AutomatedEnvSyncService, SyncAlert } from '@/services/AutomatedEnvSyncService';
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function EnvironmentVariablesDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [alerts, setAlerts] = useState<SyncAlert[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    synced: number;
    errors: string[];
  } | null>(null);
  const [syncService] = useState(() => new AutomatedEnvSyncService());

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    loadAlerts();
    syncService.startAutomatedSync();
    return () => {
      syncService.stopAutomatedSync();
    };
  }, [authLoading, user, syncService]);

  const loadAlerts = async () => {
    const activeAlerts = await syncService.getActiveAlerts();
    setAlerts(activeAlerts || []);
    setLastCheck(new Date());
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const result = await syncService.syncAllVariables();
      setSyncResult(result);
      await loadAlerts();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleHealthCheck = async () => {
    const newAlerts = await syncService.performHealthCheck();
    setAlerts(newAlerts || []);
    setLastCheck(new Date());
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'missing':
        return <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
      case 'outdated':
        return <Clock className="w-5 h-5 text-yellow-500 shrink-0" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500 shrink-0" />;
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-gray-500">
          Please sign in to manage environment variables.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">

      {/* Header — stacked on mobile, row on sm+ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
            Environment Variables
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Last check: {lastCheck.toLocaleTimeString()}
          </p>
        </div>

        {/* Buttons — full-width stacked on mobile, inline on sm+ */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 sm:shrink-0">
          <Button
            variant="outline"
            onClick={handleHealthCheck}
            className="w-full sm:w-auto h-10"
          >
            <RefreshCw className="w-4 h-4 mr-2 shrink-0" />
            Check Status
          </Button>
          <Button
            onClick={handleSyncAll}
            disabled={syncing}
            className="w-full sm:w-auto h-10"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 shrink-0 ${syncing ? 'animate-spin' : ''}`}
            />
            {syncing ? 'Syncing...' : 'Sync All'}
          </Button>
        </div>
      </div>

      {/* Sync result alert */}
      {syncResult && (
        <Alert variant={syncResult.success ? 'default' : 'destructive'}>
          {syncResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>
            {syncResult.success
              ? 'Sync Completed'
              : 'Sync Completed with Errors'}
          </AlertTitle>
          <AlertDescription>
            {syncResult.success ? (
              `Synced ${syncResult.synced} variables.`
            ) : (
              <>
                <p>Synced {syncResult.synced} variables.</p>
                <ul className="mt-2 list-disc list-inside">
                  {syncResult.errors.map((e, i) => (
                    <li key={i} className="text-sm break-words">
                      {e}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts list */}
      <div className="grid gap-3 sm:gap-4">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-sm sm:text-base">
                  All environment variables are properly configured
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={
                alert.type === 'missing' || alert.type === 'error'
                  ? 'destructive'
                  : 'default'
              }
            >
              {getAlertIcon(alert.type)}
              <AlertTitle className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                <Badge variant="outline" className="w-fit">
                  {alert.platform}
                </Badge>
                <span className="truncate">{alert.variable}</span>
              </AlertTitle>
              <AlertDescription>
                <span className="break-words">{alert.message}</span>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </AlertDescription>
            </Alert>
          ))
        )}
      </div>

      {/* Platform Status — grid-cols-1 on mobile, 3 on md+ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Platform Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            {['DeployPad', 'Vercel', 'GitHub Actions'].map((platform) => (
              <div
                key={platform}
                className="flex items-center justify-between p-3 sm:p-4 border rounded-lg min-w-0"
              >
                <span className="font-medium text-sm sm:text-base truncate mr-2">
                  {platform}
                </span>
                <Badge variant="outline" className="shrink-0">
                  {alerts.some(
                    (a) =>
                      a.platform?.toLowerCase() === platform.toLowerCase()
                  )
                    ? 'Issues'
                    : 'OK'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
