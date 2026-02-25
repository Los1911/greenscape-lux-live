import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PaymentAlert {
  id: number;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  action?: string;
}

interface PaymentAlertsSystemProps {
  alerts: PaymentAlert[] | null | undefined;
  onDismiss: (id: number) => void;
}

export const PaymentAlertsSystem: React.FC<PaymentAlertsSystemProps> = ({ 
  alerts, 
  onDismiss 
}) => {
  // Safe alerts array
  const safeAlerts = alerts || [];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'error': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const getAlertBadgeColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: Date | string | undefined) => {
    if (!timestamp) return 'Unknown time';
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(date.getTime())) return 'Unknown time';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  if (safeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {safeAlerts.map((alert) => (
        <Alert key={alert.id} variant={getAlertVariant(alert.type || 'info') as any}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {getAlertIcon(alert.type || 'info')}
              <div className="flex-1">
                <AlertDescription className="mb-2">
                  {alert.message || 'No message'}
                </AlertDescription>
                <div className="flex items-center gap-2">
                  <Badge className={getAlertBadgeColor(alert.type || 'info')}>
                    {(alert.type || 'info').toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(alert.timestamp)}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(alert.id)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
};
