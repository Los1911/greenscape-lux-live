import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings, Save, Loader2, Globe, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';

interface GeneralSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeneralSettingsModal: React.FC<GeneralSettingsModalProps> = ({ isOpen, onClose }) => {
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('America/New_York');
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
        .select('language, timezone')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[PREFERENCES] Load error:', error);
        return;
      }

      if (data) {
        setLanguage(data.language || 'en');
        setTimezone(data.timezone || 'America/New_York');
        console.log('[PREFERENCES] Loaded general settings:', data);
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
          language,
          timezone,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[PREFERENCES] Save error:', error);
        return;
      }

      console.log('[PREFERENCES] Saved general settings:', { language, timezone });
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
        className="flex-1 bg-emerald-500 hover:bg-emerald-600"
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
      title="General Settings"
      subtitle="Customize your experience"
      icon={<Settings className="w-5 h-5" />}
      footer={renderFooter()}
      height="auto"
    >
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
          <p className="text-gray-400 mt-4">Loading preferences...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Language Setting */}
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Globe className="w-5 h-5 text-emerald-400" />
              <Label htmlFor="language" className="text-white font-medium">Language</Label>
            </div>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="en">English</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
              <option value="pt">Português (Portuguese)</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              This affects the language of the app interface.
            </p>
          </div>

          {/* Timezone Setting */}
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <Label htmlFor="timezone" className="text-white font-medium">Timezone</Label>
            </div>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/Anchorage">Alaska Time (AKT)</option>
              <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Used for scheduling and displaying appointment times.
            </p>
          </div>
        </div>
      )}
    </MobileBottomSheet>
  );
};
