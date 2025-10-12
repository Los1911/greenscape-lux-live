import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Bell, AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react';

interface NotificationRule {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: string;
  threshold: number;
  enabled: boolean;
  recipients: string[];
  escalationMinutes: number;
}

interface PaymentAlert {
  id: string;
  type: 'failed_payment' | 'webhook_failure' | 'system_down' | 'high_refund_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  escalated: boolean;
}

export function PaymentNotificationSystem() {
  const [alerts, setAlerts] = useState<PaymentAlert[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([
    {
      id: '1',
      name: 'Failed Payments Threshold',
      severity: 'high',
      condition: 'failed_payments_count > threshold',
      threshold: 5,
      enabled: true,
      recipients: ['admin.1@greenscapelux.com'],
      escalationMinutes: 30
    },
    {
      id: '2', 
      name: 'Webhook Failures',
      severity: 'critical',
      condition: 'webhook_failures > threshold',
      threshold: 3,
      enabled: true,
      recipients: ['admin.1@greenscapelux.com', 'tech@greenscapelux.com'],
      escalationMinutes: 15
    }
  ]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Simulate real-time alerts
    const interval = setInterval(() => {
      checkForAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkForAlerts = async () => {
    // In real implementation, this would check actual metrics
    const mockAlerts: PaymentAlert[] = [
      {
        id: Date.now().toString(),
        type: 'failed_payment',
        severity: 'high',
        message: '7 failed payments in the last hour',
        timestamp: new Date(),
        acknowledged: false,
        escalated: false
      }
    ];

    setAlerts(prev => [...prev, ...mockAlerts]);
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Notifications</h2>
        <Button 
          variant="outline" 
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Active Alerts ({alerts.filter(a => !a.acknowledged).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.filter(a => !a.acknowledged).map(alert => (
              <Alert key={alert.id} className="border-l-4 border-l-red-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-gray-500">
                        {alert.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  </div>
                </div>
              </Alert>
            ))}
            {alerts.filter(a => !a.acknowledged).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No active alerts</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Rules Settings */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{rule.name}</h4>
                    <p className="text-sm text-gray-500">{rule.condition}</p>
                    <p className="text-sm text-gray-500">
                      Threshold: {rule.threshold} | Escalation: {rule.escalationMinutes}min
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(rule.severity)}>
                      {rule.severity}
                    </Badge>
                    <Badge variant={rule.enabled ? "default" : "secondary"}>
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}