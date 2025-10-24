import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWebSocket } from '@/components/tracking/WebSocketManager';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
interface MetricsData {
  channelPerformance: Array<{
    channel: string;
    sent: number;
    delivered: number;
    failed: number;
    avgDeliveryTime: number;
  }>;
  hourlyTrends: Array<{
    hour: string;
    sent: number;
    success: number;
    failed: number;
  }>;
  failureReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
}

export function NotificationMetrics() {
  const { isConnected, subscribe } = useWebSocket();
  const [metricsData, setMetricsData] = useState<MetricsData>({
    channelPerformance: [
      { channel: 'Slack', sent: 1250, delivered: 1232, failed: 18, avgDeliveryTime: 1.2 },
      { channel: 'Email', sent: 892, delivered: 884, failed: 8, avgDeliveryTime: 2.8 },
      { channel: 'SMS', sent: 156, delivered: 147, failed: 9, avgDeliveryTime: 5.1 }
    ],
    hourlyTrends: [
      { hour: '12:00', sent: 45, success: 43, failed: 2 },
      { hour: '13:00', sent: 52, success: 51, failed: 1 },
      { hour: '14:00', sent: 38, success: 37, failed: 1 },
      { hour: '15:00', sent: 61, success: 58, failed: 3 },
      { hour: '16:00', sent: 73, success: 70, failed: 3 },
      { hour: '17:00', sent: 89, success: 85, failed: 4 },
      { hour: '18:00', sent: 67, success: 65, failed: 2 }
    ],
    failureReasons: [
      { reason: 'Network Timeout', count: 15, percentage: 45 },
      { reason: 'Invalid Recipient', count: 8, percentage: 24 },
      { reason: 'Rate Limit', count: 6, percentage: 18 },
      { reason: 'Service Unavailable', count: 4, percentage: 13 }
    ]
  });

  const [liveMetrics, setLiveMetrics] = useState({
    totalSent: 2298,
    totalDelivered: 2263,
    totalFailed: 35,
    avgDeliveryTime: 2.4,
    uptime: 99.2
  });

  // Subscribe to real-time metrics updates
  useEffect(() => {
    const unsubscribeMetrics = subscribe('metrics_update', (data: Partial<MetricsData>) => {
      setMetricsData(prev => ({ ...prev, ...data }));
    });

    const unsubscribeLive = subscribe('live_metrics', (data: any) => {
      setLiveMetrics(prev => ({ ...prev, ...data }));
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeLive();
    };
  }, [subscribe]);

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Live Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{liveMetrics.totalSent}</div>
            <div className="text-sm text-gray-600">Total Sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{liveMetrics.totalDelivered}</div>
            <div className="text-sm text-gray-600">Delivered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{liveMetrics.totalFailed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{liveMetrics.avgDeliveryTime}s</div>
            <div className="text-sm text-gray-600">Avg Delivery</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{liveMetrics.uptime}%</div>
            <div className="text-sm text-gray-600">Uptime</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Channel Performance
              {isConnected && <Badge variant="outline" className="text-xs">Live</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metricsData.channelPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="delivered" fill="#10B981" name="Delivered" />
                <Bar dataKey="failed" fill="#EF4444" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Failure Analysis Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Failure Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metricsData.failureReasons}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ reason, percentage }) => `${reason}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {metricsData.failureReasons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Hourly Delivery Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metricsData.hourlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="success" stroke="#10B981" strokeWidth={2} name="Success" />
              <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={2} name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Channel Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Channel Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metricsData.channelPerformance.map((channel) => (
              <div key={channel.channel} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{channel.channel}</h3>
                  <Badge variant="outline">
                    {((channel.delivered / channel.sent) * 100).toFixed(1)}% success
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Sent</div>
                    <div className="font-bold">{channel.sent}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Delivered</div>
                    <div className="font-bold text-green-600">{channel.delivered}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Failed</div>
                    <div className="font-bold text-red-600">{channel.failed}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Avg Time</div>
                    <div className="font-bold">{channel.avgDeliveryTime}s</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}