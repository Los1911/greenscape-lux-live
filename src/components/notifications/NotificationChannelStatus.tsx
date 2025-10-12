import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useWebSocket } from '@/components/tracking/WebSocketManager';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  MessageSquare, 
  Mail, 
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
interface ChannelStats {
  status: 'healthy' | 'degraded' | 'down';
  successRate: number;
  lastSent: Date;
  avgDeliveryTime: number;
  totalSent: number;
  failures: number;
}

interface Props {
  channelStats?: {
    slack: ChannelStats;
    email: ChannelStats;
    sms: ChannelStats;
  };
}

export function NotificationChannelStatus({ channelStats }: Props) {
  const { isConnected, connectionStatus, subscribe } = useWebSocket();
  const [realTimeStats, setRealTimeStats] = useState(channelStats);
  const [connectionIndicator, setConnectionIndicator] = useState(false);

  // Subscribe to real-time channel updates
  useEffect(() => {
    const unsubscribe = subscribe('channel_stats_update', (data: any) => {
      setRealTimeStats(prev => ({
        ...prev,
        [data.channel]: { ...prev?.[data.channel as keyof typeof prev], ...data.stats }
      }));
      
      // Flash connection indicator
      setConnectionIndicator(true);
      setTimeout(() => setConnectionIndicator(false), 300);
    });

    return unsubscribe;
  }, [subscribe]);

  const currentStats = realTimeStats || {
    slack: { status: 'healthy', successRate: 98.5, lastSent: new Date(), avgDeliveryTime: 1.2, totalSent: 1250, failures: 18 },
    email: { status: 'healthy', successRate: 99.1, lastSent: new Date(), avgDeliveryTime: 2.8, totalSent: 892, failures: 8 },
    sms: { status: 'degraded', successRate: 94.2, lastSent: new Date(), avgDeliveryTime: 5.1, totalSent: 156, failures: 9 }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'down':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const channels = [
    {
      name: 'Slack',
      icon: <MessageSquare className="h-6 w-6" />,
      stats: currentStats.slack,
      description: 'Real-time team notifications'
    },
    {
      name: 'Email',
      icon: <Mail className="h-6 w-6" />,
      stats: currentStats.email,
      description: 'SMTP fallback notifications'
    },
    {
      name: 'SMS',
      icon: <Smartphone className="h-6 w-6" />,
      stats: currentStats.sms,
      description: 'Critical alert notifications'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Real-time Connection Status */}
      <Card className={`transition-all duration-300 ${connectionIndicator ? 'ring-2 ring-blue-500' : ''}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            Real-time Status
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {connectionStatus}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Channel Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {channels.map((channel) => (
          <Card key={channel.name} className="transition-all duration-300 hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {channel.icon}
                  <CardTitle className="text-lg">{channel.name}</CardTitle>
                </div>
                {getStatusIcon(channel.stats.status)}
              </div>
              <p className="text-sm text-gray-600">{channel.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge className={getStatusColor(channel.stats.status)}>
                  {channel.stats.status.charAt(0).toUpperCase() + channel.stats.status.slice(1)}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="text-sm font-bold text-green-600">
                    {channel.stats.successRate}%
                  </span>
                </div>
                <Progress value={channel.stats.successRate} className="h-2" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Delivery</span>
                <span className="text-sm text-gray-600">
                  {channel.stats.avgDeliveryTime}s
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Sent</span>
                <span className="text-sm text-gray-600">
                  {channel.stats.lastSent.toLocaleTimeString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="font-bold text-green-600">{channel.stats.totalSent}</div>
                  <div className="text-green-600">Sent</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded">
                  <div className="font-bold text-red-600">{channel.stats.failures}</div>
                  <div className="text-red-600">Failed</div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Test
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}