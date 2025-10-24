import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Check, X, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { StandardizedButton } from '@/components/ui/standardized-button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

export const NotificationSystem: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false); // Changed to false to skip loading state

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't set loading to false here, just continue with default notification
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  const dismissNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case 'error': return <X className="h-5 w-5 text-red-400" />;
      default: return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-emerald-500/25';
      case 'warning': return 'border-yellow-500/25';
      case 'error': return 'border-red-500/25';
      default: return 'border-blue-500/25';
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
            <div className="h-3 bg-gray-800 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show default welcome notification for demo
  const defaultNotification = {
    id: 'welcome',
    title: 'Welcome to your dashboard!',
    message: 'Your account has been successfully set up.',
    type: 'success' as const,
    read: false,
    created_at: '9/1/2025'
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-white flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-3 rounded-lg border border-emerald-500/25 bg-gray-800/50">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-white text-sm">{defaultNotification.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{defaultNotification.message}</p>
                  <div className="text-xs text-gray-500 mt-2">{defaultNotification.created_at}</div>
                </div>
                <button className="text-gray-400 hover:text-white h-6 w-6 p-0 ml-2">
                  <X className="h-3 w-3" />
                </button>
              </div>
              <StandardizedButton
                variant="ghost"
                size="sm"
                className="mt-2 text-xs h-auto py-1 px-2"
                onClick={() => markAsRead(defaultNotification.id)}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark as Read
              </StandardizedButton>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};