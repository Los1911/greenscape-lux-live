import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Check, X, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { waitForSupabaseSession } from '@/lib/supabaseHydration';

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
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      await waitForSupabaseSession();

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('[NOTIFICATIONS] Error fetching:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    // Handle the default welcome notification locally (not in database)
    if (notificationId === 'welcome') {
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === 'welcome' ? { ...notif, read: true } : notif
        )
      );
      return;
    }

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
    if (notificationId === 'welcome') {
      setDismissed(true);
      return;
    }
    
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
      case 'success': return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-400" />;
      case 'error': return <X className="h-4 w-4 text-red-400" />;
      default: return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl">
        <CardContent className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
            <div className="h-3 bg-slate-800 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default welcome notification
  const defaultNotification: Notification = {
    id: 'welcome',
    title: 'Account ready',
    message: 'Your dashboard is set up and ready to use.',
    type: 'success',
    read: false,
    created_at: new Date().toISOString()
  };

  const displayNotifications = notifications.length > 0 
    ? notifications 
    : (dismissed ? [] : [defaultNotification]);

  // Empty state
  if (displayNotifications.length === 0) {
    return (
      <Card className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
              <Bell className="h-4 w-4 text-slate-500" />
            </div>
            <span className="font-medium">Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">No new notifications</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Bell className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="font-medium">Notifications</span>
          </div>
          {displayNotifications.some(n => !n.read) && (
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 space-y-2">
        {displayNotifications.slice(0, 3).map((notification) => (
          <div 
            key={notification.id}
            className={`p-3 rounded-lg border transition-colors ${
              notification.read 
                ? 'bg-slate-900/40 border-slate-800' 
                : 'bg-slate-800/50 border-emerald-500/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className={`text-sm font-medium truncate ${
                      notification.read ? 'text-slate-400' : 'text-white'
                    }`}>
                      {notification.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                  <button 
                    onClick={() => dismissNotification(notification.id)}
                    className="text-slate-600 hover:text-slate-400 transition-colors p-1 shrink-0"
                    aria-label="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  >
                    <Check className="h-3 w-3" />
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
