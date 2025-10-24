import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedProfileEditForm } from './EnhancedProfileEditForm';
import { EmailPreferences } from '@/components/notifications/EmailPreferences';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/utils/notificationService';
import { User, Settings, Bell } from 'lucide-react';

interface UnifiedProfileManagerProps {
  profile: any;
  onProfileUpdate?: () => void;
}

export function UnifiedProfileManager({ profile, onProfileUpdate }: UnifiedProfileManagerProps) {
  const { user } = useAuth();
  const [currentProfile, setCurrentProfile] = useState(profile);

  const handleProfileSave = async (updatedData: any) => {
    setCurrentProfile({ ...currentProfile, ...updatedData });
    
    // Send profile update notification
    if (user) {
      await NotificationService.sendNotification({
        type: 'profile_updated',
        userId: user.id,
        data: {
          name: updatedData.firstName || 'User'
        }
      });
    }
    
    onProfileUpdate?.();
  };

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-black/60 border border-green-500/25">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="preferences" className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-6">
        <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-300">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Manage your personal information and service preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedProfileEditForm
              initialData={currentProfile}
              onSave={handleProfileSave}
              showCancel={false}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="preferences" className="mt-6">
        <EmailPreferences />
      </TabsContent>

      <TabsContent value="settings" className="mt-6">
        <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-300">
              <Settings className="w-5 h-5" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Manage your account preferences and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <h4 className="font-medium text-green-300 mb-2">Email Notification System</h4>
              <p className="text-sm text-gray-400">
                Automated emails are sent for profile updates, job assignments, completions, and appointment reminders.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}