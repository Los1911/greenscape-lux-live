import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// TODO: Re-enable WebSocket after production deployment
// import { useWebSocket } from '@/components/tracking/WebSocketManager';
import { Wifi, WifiOff, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface NotificationEvent {
  id: string;
  type: 'delivery' | 'failure' | 'retry' | 'status_change';
  channel: 'slack' | 'email' | 'sms';
  message: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  metadata?: any;
}

interface ChannelStatus {
  channel: string;
  status: 'online' | 'offline' | 'degraded';
  lastActivity: string;
  successRate: number;
  avgDeliveryTime: number;
}

export const LiveNotificationSystem: React.FC = () => {
  // TODO: Re-enable WebSocket after production deployment
  // const { isConnected, connectionStatus, subscribe } = useWebSocket();
  const isConnected = false;
  const connectionStatus = 'disconnected';
  
  const [recentEvents] = useState<NotificationEvent[]>([]);
  const [channelStatuses] = useState<ChannelStatus[]>([
    { channel: 'slack', status: 'online', lastActivity: new Date().toISOString(), successRate: 98.5, avgDeliveryTime: 1.2 },
    { channel: 'email', status: 'online', lastActivity: new Date().toISOString(), successRate: 99.1, avgDeliveryTime: 2.8 },
    { channel: 'sms', status: 'degraded', lastActivity: new Date().toISOString(), successRate: 94.2, avgDeliveryTime: 5.1 }
  ]);

  // TODO: Re-enable WebSocket subscriptions after production deployment
  // useEffect(() => {
  //   const unsubscribeEvents = subscribe('notification_event', (data) => { ... });
  //   const unsubscribeStatus = subscribe('channel_status', (data) => { ... });
  //   return () => { unsubscribeEvents(); unsubscribeStatus(); };
  // }, [subscribe]);

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'online':
      case 'success':
        return 'default';
      case 'degraded':
      case 'pending':
        return 'secondary';
      case 'offline':
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm sm:text-base">
            <div className="flex items-center gap-2 flex-shrink-0">
              {getConnectionStatusIcon()}
              <span className="whitespace-nowrap">Real-time Connection Status</span>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'} className="w-fit">
              {connectionStatus} (WebSocket disabled)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground break-words">
            WebSocket connections are currently disabled for preview stability.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Live Channel Status</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {channelStatuses.map((channel) => (
              <div key={channel.channel} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium capitalize">{channel.channel}</h3>
                  <Badge variant={getStatusBadgeVariant(channel.status)}>{channel.status}</Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Success Rate: {channel.successRate}%</div>
                  <div>Avg Delivery: {channel.avgDeliveryTime}s</div>
                  <div>Last Activity: {new Date(channel.lastActivity).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Live Event Stream</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <p className="text-muted-foreground text-center py-8">
              Real-time events disabled. Enable WebSocket for live updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
