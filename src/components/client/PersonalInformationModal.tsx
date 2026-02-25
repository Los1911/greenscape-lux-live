import React, { useState, useEffect, useCallback } from 'react';
import { User, Loader2, CheckCircle, Edit2, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EnhancedProfileEditForm } from './EnhancedProfileEditForm';
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';
import { Button } from '@/components/ui/button';

interface PersonalInformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
  /** If true, modal will auto-close after save and call callback. If false (default), shows collapsed success state */
  autoCloseOnSave?: boolean;
}

type ModalState = 'editing' | 'saving' | 'success';

interface SavedProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

const log = (msg: string, data?: any) => {
  console.log(`[PROFILE_MODAL] ${msg}`, data !== undefined ? data : '');
};

export const PersonalInformationModal: React.FC<PersonalInformationModalProps> = ({ 
  isOpen, 
  onClose,
  onProfileUpdated,
  autoCloseOnSave = false
}) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<ModalState>('editing');
  const [savedProfile, setSavedProfile] = useState<SavedProfileData | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProfileData();
      // Reset to editing state when modal opens
      setModalState('editing');
    }
  }, [isOpen]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, address, city, state, zip')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfileData({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || ''
      });
    } catch (error) {
      log('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async (savedData: any) => {
    log('Profile saved successfully', savedData);
    
    // Store saved data for display
    setSavedProfile(savedData);
    
    // Set success state
    setModalState('success');
    
    // If autoCloseOnSave is enabled:
    // 1. Close the modal immediately
    // 2. Call the callback to notify parent
    // NO DELAYS - the Guard will handle the transition
    if (autoCloseOnSave) {
      log('Auto-close enabled - closing modal and calling callback');
      onClose();
      // Call callback immediately - the database write is already complete
      // The Guard will re-fetch from database to confirm
      onProfileUpdated?.();
    }
  }, [onProfileUpdated, onClose, autoCloseOnSave]);

  const handleEditAgain = () => {
    // Reload profile data to get fresh state
    loadProfileData();
    setModalState('editing');
  };

  const handleClose = () => {
    onClose();
  };

  const handleDone = () => {
    onClose();
    // If not auto-close, call the callback when user clicks Done
    if (!autoCloseOnSave) {
      onProfileUpdated?.();
    }
  };

  // Format full name
  const formatFullName = useCallback(() => {
    if (!savedProfile) return '';
    return [savedProfile.firstName, savedProfile.lastName].filter(Boolean).join(' ');
  }, [savedProfile]);

  // Format address
  const formatAddress = useCallback(() => {
    if (!savedProfile) return '';
    const parts = [savedProfile.address];
    const cityStateParts = [savedProfile.city, savedProfile.state].filter(Boolean).join(', ');
    if (cityStateParts) parts.push(cityStateParts);
    if (savedProfile.zip) parts.push(savedProfile.zip);
    return parts.join('\n');
  }, [savedProfile]);

  // Render success/collapsed state
  const renderSuccessState = () => (
    <div className="space-y-4">
      {/* Success confirmation banner */}
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-emerald-300 font-medium mb-1">Profile Updated</h4>
          <p className="text-sm text-emerald-200/70">
            Your personal information has been saved successfully.
          </p>
        </div>
      </div>

      {/* Saved profile display */}
      <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl space-y-4">
        {/* Name */}
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">Full Name</p>
            <p className="text-white font-medium">{formatFullName()}</p>
          </div>
        </div>

        {/* Phone */}
        {savedProfile?.phone && (
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-1">Phone</p>
              <p className="text-white">{savedProfile.phone}</p>
            </div>
          </div>
        )}

        {/* Address */}
        {savedProfile?.address && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-1">Service Address</p>
              <p className="text-white whitespace-pre-line">{formatAddress()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress indicator hint */}
      <div className="flex items-center gap-2 text-sm text-gray-400 justify-center">
        <CheckCircle className="w-4 h-4 text-emerald-400" />
        <span>Profile progress updated</span>
      </div>
    </div>
  );

  // Dynamic footer based on state
  const renderFooter = () => {
    if (modalState === 'success') {
      return (
        <div className="flex gap-3">
          <Button 
            onClick={handleEditAgain}
            variant="secondary"
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Again
          </Button>
          <Button 
            onClick={handleDone}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Done
          </Button>
        </div>
      );
    }
    return null; // Form has its own buttons
  };

  // Dynamic title/subtitle based on state
  const getTitle = () => {
    if (modalState === 'success') return 'Profile Updated';
    return 'Personal Information';
  };

  const getSubtitle = () => {
    if (modalState === 'success') return 'Your changes have been saved';
    return 'Update your profile details';
  };

  const getIcon = () => {
    if (modalState === 'success') {
      return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    }
    return <User className="w-5 h-5" />;
  };

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      subtitle={getSubtitle()}
      icon={getIcon()}
      footer={renderFooter()}
      height="full"
    >
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
          <p className="text-gray-400 mt-4">Loading profile...</p>
        </div>
      ) : modalState === 'success' ? (
        renderSuccessState()
      ) : (
        <EnhancedProfileEditForm
          initialData={profileData || {}}
          onSave={handleSave}
          onCancel={handleClose}
        />
      )}
    </MobileBottomSheet>
  );
};
