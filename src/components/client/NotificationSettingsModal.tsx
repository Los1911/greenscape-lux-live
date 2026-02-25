import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Save, Loader2, Mail, Smartphone, MessageSquare, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ isOpen, onClose }) => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('[PREFERENCES] No authenticated user');
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('email_notifications, push_notifications, sms_notifications, marketing_emails')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[PREFERENCES] Load error:', error);
        return;
      }

      if (data) {
        setEmailNotifications(data.email_notifications ?? true);
        setPushNotifications(data.push_notifications ?? true);
        setSmsNotifications(data.sms_notifications ?? false);
        setMarketingEmails(data.marketing_emails ?? true);
        console.log('[PREFERENCES] Loaded notification settings:', data);
      }
    } catch (err) {
      console.error('[PREFERENCES] Load exception:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('[PREFERENCES] No authenticated user');
        return;
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email_notifications: emailNotifications,
          push_notifications: pushNotifications,
          sms_notifications: smsNotifications,
          marketing_emails: marketingEmails,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[PREFERENCES] Save error:', error);
        return;
      }

      console.log('[PREFERENCES] Saved notification settings:', { 
        emailNotifications, 
        pushNotifications,
        smsNotifications,
        marketingEmails
      });
      onClose();
    } catch (err) {
      console.error('[PREFERENCES] Save exception:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  const renderFooter = () => (
    <div className="flex gap-3">
      <Button 
        variant="outline" 
        onClick={handleClose} 
        disabled={saving}
        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
      >
        Cancel
      </Button>
      <Button 
        onClick={handleSave} 
        disabled={saving} 
        className="flex-1 bg-blue-500 hover:bg-blue-600"
      >
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Notification Settings"
      subtitle="Manage how you receive updates"
      icon={<Bell className="w-5 h-5" />}
      footer={renderFooter()}
      height="auto"
    >
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
          <p className="text-gray-400 mt-4">Loading preferences...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Service Notifications Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Service Notifications
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <div>
                    <Label htmlFor="email-notif" className="text-white font-medium">Email Notifications</Label>
                    <p className="text-xs text-gray-400">Job updates, quotes, and confirmations</p>
                  </div>
                </div>
                <Switch 
                  id="email-notif" 
                  checked={emailNotifications} 
                  onCheckedChange={setEmailNotifications} 
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <div>
                    <Label htmlFor="push-notif" className="text-white font-medium">Push Notifications</Label>
                    <p className="text-xs text-gray-400">Real-time alerts on your device</p>
                  </div>
                </div>
                <Switch 
                  id="push-notif" 
                  checked={pushNotifications} 
                  onCheckedChange={setPushNotifications} 
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  <div>
                    <Label htmlFor="sms-notif" className="text-white font-medium">SMS Notifications</Label>
                    <p className="text-xs text-gray-400">Text messages for urgent updates</p>
                  </div>
                </div>
                <Switch 
                  id="sms-notif" 
                  checked={smsNotifications} 
                  onCheckedChange={setSmsNotifications} 
                />
              </div>
            </div>
          </div>

          {/* Marketing Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Marketing & Promotions
            </h4>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-yellow-400" />
                <div>
                  <Label htmlFor="marketing-emails" className="text-white font-medium">Marketing Emails</Label>
                  <p className="text-xs text-gray-400">Seasonal offers and promotions</p>
                </div>
              </div>
              <Switch 
                id="marketing-emails" 
                checked={marketingEmails} 
                onCheckedChange={setMarketingEmails} 
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            You can change these preferences at any time.
          </p>
        </div>
      )}
    </MobileBottomSheet>
  );
};
