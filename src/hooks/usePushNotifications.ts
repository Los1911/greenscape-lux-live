import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface NotificationPreferences {
  systemFailures: boolean;
  highFailureRates: boolean;
  channelDowntime: boolean;
  performanceAlerts: boolean;
  testNotifications: boolean;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    systemFailures: true,
    highFailureRates: true,
    channelDowntime: true,
    performanceAlerts: false,
    testNotifications: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Load preferences from localStorage
    const savedPrefs = localStorage.getItem('notification-preferences');
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (error) {
        console.error('Failed to parse notification preferences:', error);
      }
    }

    // Check for existing subscription
    checkExistingSubscription();
  }, []);

  const checkExistingSubscription = async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
    } catch (error) {
      console.error('Failed to check existing subscription:', error);
    }
  };

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    setIsLoading(true);
    try {
      const permission = await requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Generate VAPID key (in production, this should come from your server)
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLuxazjqAKUrjqHrtfVJbNBhqoYVpZwMgLxqSGVaIaOfbrSgMaZHzs';
      
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      setSubscription(pushSubscription);

      // Save subscription to database
      const subscriptionData: PushSubscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('auth')!))),
        },
      };

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        subscriptionData.userId = user.id;
      }

      await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user?.id,
          endpoint: subscriptionData.endpoint,
          p256dh_key: subscriptionData.keys.p256dh,
          auth_key: subscriptionData.keys.auth,
          preferences: preferences,
        });

      return pushSubscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, requestPermission, preferences]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    setIsLoading(true);
    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Remove from database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  const updatePreferences = useCallback(async (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('notification-preferences', JSON.stringify(newPreferences));

    // Update in database if subscribed
    if (subscription) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('push_subscriptions')
          .update({ preferences: newPreferences })
          .eq('user_id', user.id);
      }
    }
  }, [subscription]);

  const sendTestNotification = useCallback(async () => {
    if (!subscription) {
      throw new Error('No active subscription');
    }

    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'test',
          title: 'Test Notification',
          body: 'This is a test notification from the dashboard',
          priority: 'normal',
          alertType: 'test',
        },
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }, [subscription]);

  return {
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
    isSubscribed: !!subscription,
  };
};