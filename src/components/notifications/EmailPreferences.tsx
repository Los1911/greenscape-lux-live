import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Settings, TestTube, AlertTriangle, TrendingDown, Wifi, Activity } from 'lucide-react';
import { usePushNotifications, NotificationPreferences } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';

export const EmailPreferences: React.FC = () => {
  const {
    isSupported,
    permission,
    subscription,
    preferences,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification,
    isSubscribed,
  } = usePushNotifications();

  const { toast } = useToast();

  const handlePermissionRequest = async () => {
    try {
      const result = await requestPermission();
      if (result === 'granted') {
        toast({
          title: 'Permission Granted',
          description: 'You can now receive push notifications.',
        });
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Push notifications are disabled.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to request notification permission.',
        variant: 'destructive',
      });
    }
  };

  const handleSubscribe = async () => {
    try {
      await subscribe();
      toast({
        title: 'Subscribed',
        description: 'You will now receive push notifications.',
      });
    } catch (error) {
      toast({
        title: 'Subscription Failed',
        description: 'Failed to enable push notifications.',
        variant: 'destructive',
      });
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribe();
      toast({
        title: 'Unsubscribed',
        description: 'Push notifications have been disabled.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to disable push notifications.',
        variant: 'destructive',
      });
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    updatePreferences(newPreferences);
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      toast({
        title: 'Test Sent',
        description: 'Check your notifications for the test alert.',
      });
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: 'Failed to send test notification.',
        variant: 'destructive',
      });
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default" className="bg-green-500"><Bell className="w-3 h-3 mr-1" />Granted</Badge>;
      case 'denied':
        return <Badge variant="destructive"><BellOff className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge variant="secondary"><Settings className="w-3 h-3 mr-1" />Not Set</Badge>;
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Push Notifications
            </div>
            {getPermissionBadge()}
          </CardTitle>
          <CardDescription>
            Configure browser push notifications for critical alerts when you're not viewing the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {permission === 'default' && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 mb-3">
                Enable push notifications to receive critical alerts even when the dashboard is not open.
              </p>
              <Button onClick={handlePermissionRequest} disabled={isLoading}>
                <Bell className="w-4 h-4 mr-2" />
                Enable Notifications
              </Button>
            </div>
          )}

          {permission === 'denied' && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                Push notifications are blocked. Please enable them in your browser settings to receive alerts.
              </p>
            </div>
          )}

          {permission === 'granted' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="font-medium text-green-800">
                    {isSubscribed ? 'Active Subscription' : 'Ready to Subscribe'}
                  </p>
                  <p className="text-sm text-green-600">
                    {isSubscribed 
                      ? 'You will receive push notifications for selected alert types.'
                      : 'Click subscribe to start receiving notifications.'
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  {!isSubscribed ? (
                    <Button onClick={handleSubscribe} disabled={isLoading}>
                      <Bell className="w-4 h-4 mr-2" />
                      Subscribe
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={handleTestNotification}
                        disabled={isLoading}
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        Test
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleUnsubscribe}
                        disabled={isLoading}
                      >
                        <BellOff className="w-4 h-4 mr-2" />
                        Unsubscribe
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isSubscribed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Alert Preferences
            </CardTitle>
            <CardDescription>
              Choose which types of alerts you want to receive as push notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium">System Failures</p>
                    <p className="text-sm text-gray-600">Critical system errors and outages</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.systemFailures}
                  onCheckedChange={(checked) => handlePreferenceChange('systemFailures', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-medium">High Failure Rates</p>
                    <p className="text-sm text-gray-600">When delivery success rates drop significantly</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.highFailureRates}
                  onCheckedChange={(checked) => handlePreferenceChange('highFailureRates', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Wifi className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Channel Downtime</p>
                    <p className="text-sm text-gray-600">When notification channels go offline</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.channelDowntime}
                  onCheckedChange={(checked) => handlePreferenceChange('channelDowntime', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Performance Alerts</p>
                    <p className="text-sm text-gray-600">Slow response times and performance issues</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.performanceAlerts}
                  onCheckedChange={(checked) => handlePreferenceChange('performanceAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <TestTube className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Test Notifications</p>
                    <p className="text-sm text-gray-600">Allow manual test notifications</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.testNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange('testNotifications', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};