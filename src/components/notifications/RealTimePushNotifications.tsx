import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Zap, TrendingUp, DollarSign, AlertTriangle, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface HighValueActivity {
  id: string;
  type: 'quote_request' | 'hot_lead' | 'sales_milestone' | 'high_value_lead';
  title: string;
  description: string;
  priority: 'high' | 'urgent' | 'critical';
  value?: number;
  leadId?: string;
  timestamp: string;
  metadata?: any;
}

interface PushNotificationProps {
  userRole?: 'admin' | 'sales' | 'manager';
  enableBrowser?: boolean;
  enableEmail?: boolean;
  enableInApp?: boolean;
}

export const RealTimePushNotifications: React.FC<PushNotificationProps> = ({
  userRole = 'admin',
  enableBrowser = true,
  enableEmail = true,
  enableInApp = true
}) => {
  const [activities, setActivities] = useState<HighValueActivity[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && enableBrowser) {
      checkNotificationPermission();
      subscribeToActivities();
    }
  }, [user, enableBrowser]);

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      if (Notification.permission === 'granted') {
        setIsSubscribed(true);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setIsSubscribed(true);
        toast({
          title: "Notifications Enabled",
          description: "You'll receive real-time alerts for high-value activities."
        });
      }
    }
  };

  const subscribeToActivities = () => {
    if (!user) return;

    // Subscribe to high-value lead activities
    const subscription = supabase
      .channel('high_value_activities')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'quote_requests'
      }, (payload) => {
        const activity: HighValueActivity = {
          id: payload.new.id,
          type: 'quote_request',
          title: 'New Quote Request',
          description: `Quote request for ${payload.new.service_type}`,
          priority: 'high',
          value: payload.new.estimated_value,
          timestamp: new Date().toISOString(),
          metadata: payload.new
        };
        
        handleNewActivity(activity);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'leads',
        filter: 'status=eq.hot'
      }, (payload) => {
        const activity: HighValueActivity = {
          id: payload.new.id,
          type: 'hot_lead',
          title: 'Lead Status: HOT',
          description: `${payload.new.name} is now a hot lead`,
          priority: 'urgent',
          leadId: payload.new.id,
          timestamp: new Date().toISOString(),
          metadata: payload.new
        };
        
        handleNewActivity(activity);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleNewActivity = async (activity: HighValueActivity) => {
    setActivities(prev => [activity, ...prev.slice(0, 19)]);

    // Browser notification
    if (enableBrowser && isSubscribed && permission === 'granted') {
      showBrowserNotification(activity);
    }

    // Email notification
    if (enableEmail) {
      await sendEmailAlert(activity);
    }

    // In-app toast
    if (enableInApp) {
      showInAppNotification(activity);
    }
  };

  const showBrowserNotification = (activity: HighValueActivity) => {
    const icon = getActivityIcon(activity.type);
    
    new Notification(activity.title, {
      body: activity.description,
      icon: '/favicon.ico',
      tag: activity.id,
      requireInteraction: activity.priority === 'critical'
    });
  };

  const sendEmailAlert = async (activity: HighValueActivity) => {
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'high_value_activity',
          activity,
          userRole,
          recipients: ['sales@greenscapelux.com']
        }
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  };

  const showInAppNotification = (activity: HighValueActivity) => {
    const priorityColors = {
      high: 'default',
      urgent: 'secondary',
      critical: 'destructive'
    } as const;

    toast({
      title: activity.title,
      description: activity.description,
      variant: priorityColors[activity.priority] === 'destructive' ? 'destructive' : 'default'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quote_request':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'hot_lead':
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case 'sales_milestone':
        return <Zap className="h-4 w-4 text-blue-600" />;
      case 'high_value_lead':
        return <Users className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'default',
      urgent: 'secondary', 
      critical: 'destructive'
    } as const;
    
    return <Badge variant={variants[priority as keyof typeof variants]}>{priority.toUpperCase()}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Real-Time Notifications
          </CardTitle>
          {!isSubscribed && enableBrowser && (
            <Button onClick={requestNotificationPermission} size="sm">
              Enable Notifications
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Notification Status */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${enableBrowser && isSubscribed ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div>Browser</div>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${enableEmail ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div>Email</div>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${enableInApp ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div>In-App</div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent high-value activities</p>
                <p className="text-sm">Notifications will appear here in real-time</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{activity.title}</h4>
                      {getPriorityBadge(activity.priority)}
                    </div>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    {activity.value && (
                      <p className="text-sm font-medium text-green-600 mt-1">
                        Value: ${activity.value.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};