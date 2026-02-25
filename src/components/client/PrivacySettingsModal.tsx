import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Save, AlertTriangle, Loader2, Eye, Share2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({ isOpen, onClose }) => {
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [dataSharing, setDataSharing] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
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
        .select('profile_visibility, data_sharing, two_factor_enabled')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[PREFERENCES] Load error:', error);
        return;
      }

      if (data) {
        setProfileVisibility(data.profile_visibility || 'public');
        setDataSharing(data.data_sharing ?? false);
        setTwoFactorEnabled(data.two_factor_enabled ?? false);
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
      
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          profile_visibility: profileVisibility,
          data_sharing: dataSharing,
          two_factor_enabled: twoFactorEnabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (!error) onClose();
    } catch (err) {
      console.error('[PREFERENCES] Save exception:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  const renderFooter = () => (
    <div className="flex gap-3">
      <Button variant="outline" onClick={handleClose} disabled={saving} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600">
        Cancel
      </Button>
      <Button onClick={handleSave} disabled={saving} className="flex-1 bg-purple-500 hover:bg-purple-600">
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Privacy & Security"
      subtitle="Control your data and security"
      icon={<Shield className="w-5 h-5" />}
      footer={renderFooter()}
      height="auto"
    >
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
          <p className="text-gray-400 mt-4">Loading preferences...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-purple-400" />
              <div>
                <Label htmlFor="profile-visible" className="text-white font-medium">Profile Visibility</Label>
                <p className="text-xs text-gray-400">Show your profile to landscapers</p>
              </div>
            </div>
            <Switch id="profile-visible" checked={profileVisibility === 'public'} onCheckedChange={(checked) => setProfileVisibility(checked ? 'public' : 'private')} />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3">
              <Share2 className="w-5 h-5 text-blue-400" />
              <div>
                <Label htmlFor="share-data" className="text-white font-medium">Share Usage Data</Label>
                <p className="text-xs text-gray-400">Help improve our service</p>
              </div>
            </div>
            <Switch id="share-data" checked={dataSharing} onCheckedChange={setDataSharing} />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-emerald-400" />
              <div>
                <Label htmlFor="2fa" className="text-white font-medium">Two-Factor Authentication</Label>
                <p className="text-xs text-gray-400">Add extra security</p>
              </div>
            </div>
            <Switch id="2fa" checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
          </div>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-200">Changing privacy settings may affect how landscapers can find and contact you.</p>
            </div>
          </div>
        </div>
      )}
    </MobileBottomSheet>
  );
};
