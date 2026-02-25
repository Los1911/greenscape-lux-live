import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EnvironmentSyncService, SyncStatus } from '@/services/EnvironmentSyncService';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

export function EnvironmentSyncDashboard() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; missing: string[] }>({ valid: true, missing: [] });
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const syncService = EnvironmentSyncService.getInstance();

  useEffect(() => {
    loadSyncStatus();
    validateEnvironment();
  }, []);

  const loadSyncStatus = async () => {
    const status = await syncService.getSyncStatus();
    setSyncStatus(status);
    if (status.length > 0) {
      setLastSyncTime(status[0].lastSync);
    }
  };

  const validateEnvironment = async () => {
    const result = await syncService.validateEnvironmentVariables();
    setValidation(result);
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const result = await syncService.syncToAllPlatforms();
      setSyncStatus(result.results);
      setLastSyncTime(new Date().toISOString());
      await validateEnvironment();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: 'default',
      error: 'destructive',
      pending: 'secondary'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Environment Variable Sync</h2>
        <Button onClick={handleSyncAll} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync All Platforms'}
        </Button>
      </div>

      {!validation.valid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Missing environment variables: {validation.missing.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {lastSyncTime && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Last sync: {new Date(lastSyncTime).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {syncStatus.map((platform) => (
          <Card key={platform.platform}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {platform.platform}
              </CardTitle>
              {getStatusIcon(platform.status)}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getStatusBadge(platform.status)}
                <p className="text-xs text-muted-foreground">
                  {platform.message || 'No message'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Variables: {platform.variables.length}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
