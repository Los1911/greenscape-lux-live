import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings, Bell, Mail, Smartphone, Users, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  // High-value activities
  quoteRequests: {
    browser: boolean;
    email: boolean;
    inApp: boolean;
    threshold?: number;
  };
  hotLeads: {
    browser: boolean;
    email: boolean;
    inApp: boolean;
  };
  salesMilestones: {
    browser: boolean;
    email: boolean;
    inApp: boolean;
    milestones: string[];
  };
  // General settings
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: 'immediate' | 'batched' | 'daily';
  channels: {
    browser: boolean;
    email: boolean;
    sms: boolean;
  };
}

const defaultPreferences: NotificationPreferences = {
  quoteRequests: {
    browser: true,
    email: true,
    inApp: true,
    threshold: 1000
  },
  hotLeads: {
    browser: true,
    email: true,
    inApp: true
  },
  salesMilestones: {
    browser: true,
    email: true,
    inApp: true,
    milestones: ['$10000', '$25000', '$50000']
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  frequency: 'immediate',
  channels: {
    browser: true,
    email: true,
    sms: false
  }
};

export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setPreferences({ ...defaultPreferences, ...data.preferences });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          preferences,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        toast({
          title: "Preferences Saved",
          description: "Your notification preferences have been updated."
        });
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (path: string[], value: any) => {
    setPreferences(prev => {
      const updated = { ...prev };
      let current = updated;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i] as keyof typeof current] as any;
      }
      
      current[path[path.length - 1] as keyof typeof current] = value;
      return updated;
    });
  };

  const testNotification = async (type: string) => {
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'test',
          title: `Test ${type} Notification`,
          body: `This is a test notification for ${type} alerts`,
          priority: 'normal'
        }
      });

      toast({
        title: "Test Sent",
        description: `Test ${type} notification has been sent.`
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to send test notification.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading preferences...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quote Requests */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-green-600" />
              <h3 className="font-medium">Quote Requests</h3>
              <Badge variant="secondary">High Priority</Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="quote-browser"
                  checked={preferences.quoteRequests.browser}
                  onCheckedChange={(checked) => 
                    updatePreference(['quoteRequests', 'browser'], checked)
                  }
                />
                <Label htmlFor="quote-browser" className="flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  Browser
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="quote-email"
                  checked={preferences.quoteRequests.email}
                  onCheckedChange={(checked) => 
                    updatePreference(['quoteRequests', 'email'], checked)
                  }
                />
                <Label htmlFor="quote-email" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="quote-inapp"
                  checked={preferences.quoteRequests.inApp}
                  onCheckedChange={(checked) => 
                    updatePreference(['quoteRequests', 'inApp'], checked)
                  }
                />
                <Label htmlFor="quote-inapp" className="flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  In-App
                </Label>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => testNotification('Quote Request')}
            >
              Test Quote Alert
            </Button>
          </div>

          <Separator />

          {/* Hot Leads */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <h3 className="font-medium">Hot Leads</h3>
              <Badge variant="secondary">Urgent</Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="lead-browser"
                  checked={preferences.hotLeads.browser}
                  onCheckedChange={(checked) => 
                    updatePreference(['hotLeads', 'browser'], checked)
                  }
                />
                <Label htmlFor="lead-browser" className="flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  Browser
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="lead-email"
                  checked={preferences.hotLeads.email}
                  onCheckedChange={(checked) => 
                    updatePreference(['hotLeads', 'email'], checked)
                  }
                />
                <Label htmlFor="lead-email" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="lead-inapp"
                  checked={preferences.hotLeads.inApp}
                  onCheckedChange={(checked) => 
                    updatePreference(['hotLeads', 'inApp'], checked)
                  }
                />
                <Label htmlFor="lead-inapp" className="flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  In-App
                </Label>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => testNotification('Hot Lead')}
            >
              Test Lead Alert
            </Button>
          </div>

          <Separator />

          {/* Sales Milestones */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-blue-600" />
              <h3 className="font-medium">Sales Milestones</h3>
              <Badge variant="outline">Achievement</Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="milestone-browser"
                  checked={preferences.salesMilestones.browser}
                  onCheckedChange={(checked) => 
                    updatePreference(['salesMilestones', 'browser'], checked)
                  }
                />
                <Label htmlFor="milestone-browser" className="flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  Browser
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="milestone-email"
                  checked={preferences.salesMilestones.email}
                  onCheckedChange={(checked) => 
                    updatePreference(['salesMilestones', 'email'], checked)
                  }
                />
                <Label htmlFor="milestone-email" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="milestone-inapp"
                  checked={preferences.salesMilestones.inApp}
                  onCheckedChange={(checked) => 
                    updatePreference(['salesMilestones', 'inApp'], checked)
                  }
                />
                <Label htmlFor="milestone-inapp" className="flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  In-App
                </Label>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => testNotification('Sales Milestone')}
            >
              Test Milestone Alert
            </Button>
          </div>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={savePreferences} disabled={saving}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};