import React from 'react';
import { Bell, Mail, Volume2, Briefcase, DollarSign, FileText, ShoppingBag } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { notificationSound } from '@/utils/notificationSound';
import { toast } from 'sonner';

export function NotificationPreferencesPanel() {
  const { preferences, loading, saving, savePreferences } = useNotificationPreferences();

  const handleToggle = async (key: keyof typeof preferences) => {
    try {
      await savePreferences({ [key]: !preferences[key] });
      
      // Update sound manager if sound preference changed
      if (key === 'sound_enabled') {
        if (!preferences.sound_enabled) {
          notificationSound.enable();
          notificationSound.playNotificationSound('success');
        } else {
          notificationSound.disable();
        }
      }
      
      toast.success('Preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-6 w-6 text-emerald-600" />
        <h2 className="text-xl font-bold">Notification Preferences</h2>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div>
          <h3 className="font-semibold mb-4 text-gray-700">General</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gray-600" />
                <div>
                  <Label htmlFor="in_app_enabled" className="font-medium">In-App Notifications</Label>
                  <p className="text-sm text-gray-500">Show notifications in the app</p>
                </div>
              </div>
              <Switch
                id="in_app_enabled"
                checked={preferences.in_app_enabled}
                onCheckedChange={() => handleToggle('in_app_enabled')}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-600" />
                <div>
                  <Label htmlFor="email_enabled" className="font-medium">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
              </div>
              <Switch
                id="email_enabled"
                checked={preferences.email_enabled}
                onCheckedChange={() => handleToggle('email_enabled')}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-gray-600" />
                <div>
                  <Label htmlFor="sound_enabled" className="font-medium">Sound Alerts</Label>
                  <p className="text-sm text-gray-500">Play sound for new notifications</p>
                </div>
              </div>
              <Switch
                id="sound_enabled"
                checked={preferences.sound_enabled}
                onCheckedChange={() => handleToggle('sound_enabled')}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h3 className="font-semibold mb-4 text-gray-700">Notification Types</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <div>
                  <Label htmlFor="job_notifications" className="font-medium">Job Updates</Label>
                  <p className="text-sm text-gray-500">New jobs, assignments, and status changes</p>
                </div>
              </div>
              <Switch
                id="job_notifications"
                checked={preferences.job_notifications}
                onCheckedChange={() => handleToggle('job_notifications')}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <Label htmlFor="quote_notifications" className="font-medium">Quote Requests</Label>
                  <p className="text-sm text-gray-500">New quotes and quote responses</p>
                </div>
              </div>
              <Switch
                id="quote_notifications"
                checked={preferences.quote_notifications}
                onCheckedChange={() => handleToggle('quote_notifications')}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <Label htmlFor="payment_notifications" className="font-medium">Payment Alerts</Label>
                  <p className="text-sm text-gray-500">Payments, payouts, and billing updates</p>
                </div>
              </div>
              <Switch
                id="payment_notifications"
                checked={preferences.payment_notifications}
                onCheckedChange={() => handleToggle('payment_notifications')}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-orange-600" />
                <div>
                  <Label htmlFor="marketing_emails" className="font-medium">Marketing Emails</Label>
                  <p className="text-sm text-gray-500">Tips, promotions, and newsletters</p>
                </div>
              </div>
              <Switch
                id="marketing_emails"
                checked={preferences.marketing_emails}
                onCheckedChange={() => handleToggle('marketing_emails')}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {saving && (
          <div className="text-center text-sm text-gray-500">
            Saving preferences...
          </div>
        )}
      </div>
    </Card>
  );
}
