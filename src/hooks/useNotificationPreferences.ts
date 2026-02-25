import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface NotificationPreferences {
  email_enabled: boolean;
  in_app_enabled: boolean;
  sound_enabled: boolean;
  job_notifications: boolean;
  payment_notifications: boolean;
  quote_notifications: boolean;
  marketing_emails: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email_enabled: true,
  in_app_enabled: true,
  sound_enabled: true,
  job_notifications: true,
  payment_notifications: true,
  quote_notifications: true,
  marketing_emails: false
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      if (!error && data?.preferences) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...data.preferences });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user) return;

    setSaving(true);
    try {
      const updated = { ...preferences, ...newPreferences };
      
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          preferences: updated,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        setPreferences(updated);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    preferences,
    loading,
    saving,
    savePreferences
  };
}
