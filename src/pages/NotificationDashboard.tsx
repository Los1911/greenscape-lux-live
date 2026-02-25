import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Bell, Activity, History, Settings, Zap, Shield, Wifi } from 'lucide-react';
import { NotificationChannelStatus } from '@/components/notifications/NotificationChannelStatus';
import { NotificationMetrics } from '@/components/notifications/NotificationMetrics';
import { NotificationHistory } from '@/components/notifications/NotificationHistory';
import { NotificationTester } from '@/components/notifications/NotificationTester';
import { LiveNotificationSystem } from '@/components/notifications/LiveNotificationSystem';
import { EmailPreferences } from '@/components/notifications/EmailPreferences';
// TODO: Re-enable WebSocketProvider after production deployment
// import { WebSocketProvider } from '@/components/tracking/WebSocketManager';

export const NotificationDashboard: React.FC = () => {
  return (
    // TODO: Re-enable WebSocketProvider wrapper after production deployment
    // <WebSocketProvider>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Notification Dashboard
            </h1>
            <p className="text-gray-600">Real-time monitoring and management of all notification channels</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-gray-600">
              <Wifi className="w-3 h-3 mr-1" />
              Live Monitoring Paused
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Feed
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Testing
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Push Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            <LiveNotificationSystem />
          </TabsContent>
          <TabsContent value="channels">
            <NotificationChannelStatus />
          </TabsContent>
          <TabsContent value="metrics">
            <NotificationMetrics />
          </TabsContent>
          <TabsContent value="history">
            <NotificationHistory />
          </TabsContent>
          <TabsContent value="testing">
            <NotificationTester />
          </TabsContent>
          <TabsContent value="preferences">
            <EmailPreferences />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    // </WebSocketProvider>
  );
};

export default NotificationDashboard;
