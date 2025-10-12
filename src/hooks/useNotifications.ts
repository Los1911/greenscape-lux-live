import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface NotificationHook {
  sendNotification: (params: SendNotificationParams) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  isSupported: boolean;
}

export interface SendNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'job' | 'payment' | 'system' | 'message';
  email?: boolean;
  push?: boolean;
}

export function useNotifications(): NotificationHook {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const sendNotification = async (params: SendNotificationParams): Promise<void> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: params,
      });

      if (error) throw error;

      // If push notification is requested and permission is granted, show browser notification
      if (params.push && isSupported && Notification.permission === 'granted') {
        new Notification(params.title, {
          body: params.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `notification-${Date.now()}`,
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  };

  return {
    sendNotification,
    requestPermission,
    isSupported,
  };
}