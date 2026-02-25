import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { Shield, Key, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';

interface RotationLog {
  id: string;
  event_type: string;
  old_key_hint: string;
  new_key_hint: string;
  reason: string;
  environment: string;
  timestamp: string;
}

interface CompromiseAlert {
  id: string;
  alert_type: string;
  severity: string;
  details: any;
  resolved: boolean;
  created_at: string;
}

export default function StripeKeyRotationDashboard() {
  const [rotationLogs, setRotationLogs] = useState<RotationLog[]>([]);
  const [compromiseAlerts, setCompromiseAlerts] = useState<CompromiseAlert[]>([]);
  const [isRotating, setIsRotating] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    loadRotationLogs();
    loadCompromiseAlerts();
    startMonitoring();
  }, []);

  const loadRotationLogs = async () => {
    const { data } = await supabase
      .from('stripe_key_rotation_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);
    
    if (data) setRotationLogs(data);
  };

  const loadCompromiseAlerts = async () => {
    const { data } = await supabase
      .from('stripe_compromise_alerts')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false });
    
    if (data) setCompromiseAlerts(data);
  };

  const startMonitoring = () => {
    const interval = setInterval(async () => {
      await checkForCompromise();
      setLastCheck(new Date());
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  };

  const checkForCompromise = async () => {
    try {
      const { data } = await supabase.functions.invoke('stripe-key-rotation-manager', {
        body: { action: 'check_compromise' }
      });

      if (data?.compromise_detected) {
        // Log new alerts
        for (const indicator of data.indicators) {
          await supabase.from('stripe_compromise_alerts').insert({
            alert_type: indicator.type,
            severity: indicator.severity,
            details: indicator
          });
        }
        
        loadCompromiseAlerts();

        // Auto-rotate if critical
        if (data.indicators.some((i: any) => i.severity === 'critical')) {
          await rotateKeys('Automated: Critical compromise detected');
        }
      }
    } catch (error) {
      console.error('Error checking for compromise:', error);
    }
  };

  const rotateKeys = async (reason: string) => {
    setIsRotating(true);
    try {
      const { data } = await supabase.functions.invoke('stripe-key-rotation-manager', {
        body: { 
          action: 'rotate_keys',
          reason,
          environment: 'production'
        }
      });

      if (data?.success) {
        loadRotationLogs();
        alert('Keys rotated successfully! Please update your environment variables.');
      }
    } catch (error) {
      console.error('Key rotation failed:', error);
      alert('Key rotation failed. Please check logs.');
    } finally {
      setIsRotating(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    await supabase
      .from('stripe_compromise_alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', alertId);
    
    loadCompromiseAlerts();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stripe Key Security</h2>
          <p className="text-muted-foreground">Monitor and manage API key security</p>
        </div>
        <Button 
          onClick={() => rotateKeys('Manual rotation')}
          disabled={isRotating}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          {isRotating ? 'Rotating...' : 'Rotate Keys'}
        </Button>
      </div>

      {/* Security Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {compromiseAlerts.length === 0 ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Secure</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">
                    {compromiseAlerts.length} Alert{compromiseAlerts.length !== 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Rotation</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {rotationLogs[0] ? (
                new Date(rotationLogs[0].timestamp).toLocaleDateString()
              ) : (
                'Never'
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Check</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {lastCheck ? lastCheck.toLocaleTimeString() : 'Starting...'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {compromiseAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Security Alerts
            </CardTitle>
            <CardDescription>
              Active security alerts requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {compromiseAlerts.map((alert) => (
              <Alert key={alert.id}>
                <AlertDescription className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityColor(alert.severity) as any}>
                      {alert.severity}
                    </Badge>
                    <span>{alert.alert_type.replace('_', ' ')}</span>
                    {alert.details?.count && (
                      <span className="text-sm text-muted-foreground">
                        ({alert.details.count} incidents)
                      </span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    Resolve
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rotation History */}
      <Card>
        <CardHeader>
          <CardTitle>Rotation History</CardTitle>
          <CardDescription>Recent key rotation events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rotationLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{log.reason}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()} • {log.environment}
                  </div>
                </div>
                <Badge variant={log.event_type === 'rotation' ? 'default' : 'destructive'}>
                  {log.event_type}
                </Badge>
              </div>
            ))}
            {rotationLogs.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No rotation history available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}