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
  const [syncResult, setSyncResult] = useState<{ success: boolean; synced: number; errors: string[] } | null>(null);
  const [syncService] = useState(() => new AutomatedEnvSyncService());

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    loadAlerts();
    syncService.startAutomatedSync();
    return () => { syncService.stopAutomatedSync(); };
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
      case 'missing': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'outdated': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><RefreshCw className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    return <Card><CardContent className="pt-6 text-center text-gray-500">Please sign in to manage environment variables.</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Environment Variables</h2>
          <p className="text-sm text-muted-foreground mt-1">Last check: {lastCheck.toLocaleTimeString()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleHealthCheck}><RefreshCw className="w-4 h-4 mr-2" />Check Status</Button>
          <Button onClick={handleSyncAll} disabled={syncing}><RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />{syncing ? 'Syncing...' : 'Sync All'}</Button>
        </div>
      </div>

      {syncResult && (
        <Alert variant={syncResult.success ? 'default' : 'destructive'}>
          {syncResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <AlertTitle>{syncResult.success ? 'Sync Completed' : 'Sync Completed with Errors'}</AlertTitle>
          <AlertDescription>{syncResult.success ? `Synced ${syncResult.synced} variables.` : <><p>Synced {syncResult.synced} variables.</p><ul className="mt-2 list-disc list-inside">{syncResult.errors.map((e, i) => <li key={i} className="text-sm">{e}</li>)}</ul></>}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {alerts.length === 0 ? (
          <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-green-600"><CheckCircle2 className="w-5 h-5" /><span>All environment variables are properly configured</span></div></CardContent></Card>
        ) : (
          alerts.map((alert) => (
            <Alert key={alert.id} variant={alert.type === 'missing' || alert.type === 'error' ? 'destructive' : 'default'}>
              {getAlertIcon(alert.type)}
              <AlertTitle className="flex items-center gap-2"><Badge variant="outline">{alert.platform}</Badge><span>{alert.variable}</span></AlertTitle>
              <AlertDescription>{alert.message}<p className="text-xs mt-1 opacity-70">{new Date(alert.timestamp).toLocaleString()}</p></AlertDescription>
            </Alert>
          ))
        )}
      </div>

      <Card><CardHeader><CardTitle>Platform Status</CardTitle></CardHeader><CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {['DeployPad', 'Vercel', 'GitHub Actions'].map((platform) => (
            <div key={platform} className="flex items-center justify-between p-4 border rounded-lg">
              <span className="font-medium">{platform}</span>
              <Badge variant="outline">{alerts.some(a => a.platform?.toLowerCase() === platform.toLowerCase()) ? 'Issues' : 'OK'}</Badge>
            </div>
          ))}
        </div>
      </CardContent></Card>
    </div>
  );
}
