import React, { useState, useCallback } from 'react';
import { ProfileStatusCard } from '@/components/client/ProfileStatusCard';
import { GeneralSettingsModal } from '@/components/client/GeneralSettingsModal';
import { NotificationSettingsModal } from '@/components/client/NotificationSettingsModal';
import { PrivacySettingsModal } from '@/components/client/PrivacySettingsModal';
import { PersonalInformationModal } from '@/components/client/PersonalInformationModal';
import { ServiceAddressModal } from '@/components/client/ServiceAddressModal';
import { TemplateManager } from '@/components/messaging/TemplateManager';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';
import { useClientProfile } from '@/hooks/useClientProfile';
import { User, MapPin, Phone, Mail, Settings, Shield, Bell, Zap, MessageSquare, Loader2, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ProfilePanel: React.FC = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  const { profile, loading: profileLoading, refresh: refreshProfile, hasProfileData, hasAddressData } = useClientProfile();

  const {
    templates,
    customTemplates,
    systemTemplates,
    canAddMore,
    customTemplateCount,
    createTemplate,
    updateTemplate,
    deleteTemplate
  } = useMessageTemplates();

  const handleEditProfile = () => setShowProfileModal(true);
  const handleAddAddress = () => setShowAddressModal(true);
  const handleAccountSettings = () => setShowGeneralSettings(true);
  const handlePrivacySettings = () => setShowPrivacySettings(true);
  const handleNotificationSettings = () => setShowNotificationSettings(true);

  const handleProfileUpdated = useCallback(() => {
    refreshProfile();
  }, [refreshProfile]);

  const handleAddressUpdated = useCallback(() => {
    refreshProfile();
  }, [refreshProfile]);

  const isPlaceholder = (value: string | undefined | null): boolean => {
    return !value || !value.trim();
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-xl sm:text-2xl font-semibold text-white">Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Completion - single instance */}
      <section aria-label="Profile Completion">
        <ProfileStatusCard />
      </section>

      {/* Profile Information Cards */}
      <section aria-label="Profile Information" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Personal Information */}
        <div className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <User className="h-4 w-4 text-emerald-400" />
              </div>
              <h3 className="text-base font-medium text-white">Personal Info</h3>
            </div>
            <button
              onClick={handleEditProfile}
              className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors border-0 outline-none focus:outline-none rounded"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                border: 'none',
                background: 'transparent'
              }}
            >
              Edit
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {profileLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Name</p>
                  <p className={`text-sm truncate ${isPlaceholder(profile?.fullName) ? 'text-amber-400/70' : 'text-white'}`}>
                    {hasProfileData ? profile?.fullName : 'Add your name'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm text-white truncate">
                    {profile?.email || <span className="text-slate-500">No email</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className={`text-sm ${isPlaceholder(profile?.phone) ? 'text-amber-400/70' : 'text-white'}`}>
                    {profile?.phone || 'Add phone'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Address Information */}
        <div className="bg-black/60 backdrop-blur border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-blue-400" />
              </div>
              <h3 className="text-base font-medium text-white">Service Address</h3>
            </div>
            <button
              onClick={handleAddAddress}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors border-0 outline-none focus:outline-none rounded"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                border: 'none',
                background: 'transparent'
              }}
            >
              {hasAddressData ? 'Edit' : 'Add'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {profileLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Primary Address</p>
                {hasAddressData ? (
                  <div className="text-sm text-white">
                    <p className="truncate">{profile?.address}</p>
                    <p className="text-slate-400 truncate">
                      {[profile?.city, profile?.state, profile?.zip].filter(Boolean).join(', ')}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-amber-400/70">Add your service address</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>



      {/* Quick Reply Templates */}
      <section aria-label="Quick Reply Templates">
        <div className="bg-black/60 backdrop-blur border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <h3 className="text-base font-medium text-white">Quick Replies</h3>
            </div>
            <Badge variant="outline" className="border-amber-500/20 text-amber-300 text-xs">
              {customTemplateCount} custom
            </Badge>
          </div>
          
          <p className="text-sm text-slate-500 mb-4">
            Create templates for faster communication with landscapers.
          </p>

          <button
            onClick={() => setShowTemplateManager(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-amber-500/30 text-white text-sm font-medium transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            Manage Templates
          </button>

          {customTemplates.length > 0 && (
            <div className="mt-4 pt-4 border-t border-amber-500/10">
              <div className="flex flex-wrap gap-2">
                {customTemplates.slice(0, 4).map((template) => (
                  <Badge 
                    key={template.id} 
                    variant="outline" 
                    className="border-slate-700 text-slate-300 text-xs"
                  >
                    {template.name}
                  </Badge>
                ))}
                {customTemplates.length > 4 && (
                  <Badge 
                    variant="outline" 
                    className="border-slate-700 text-slate-500 text-xs"
                  >
                    +{customTemplates.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Account Settings */}
      <section aria-label="Account Settings">
        <div className="bg-black/60 backdrop-blur border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <Settings className="h-4 w-4 text-slate-400" />
            </div>
            <h3 className="text-base font-medium text-white">Settings</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handleAccountSettings}
              className="p-4 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Settings className="h-4 w-4 text-slate-500 group-hover:text-slate-400 transition-colors" />
                <span className="text-sm text-white font-medium">General</span>
              </div>
              <p className="text-xs text-slate-500">Account preferences</p>
            </button>

            <button
              onClick={handleNotificationSettings}
              className="p-4 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Bell className="h-4 w-4 text-slate-500 group-hover:text-slate-400 transition-colors" />
                <span className="text-sm text-white font-medium">Notifications</span>
              </div>
              <p className="text-xs text-slate-500">Email and push alerts</p>
            </button>

            <button
              onClick={handlePrivacySettings}
              className="p-4 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Shield className="h-4 w-4 text-slate-500 group-hover:text-slate-400 transition-colors" />
                <span className="text-sm text-white font-medium">Privacy</span>
              </div>
              <p className="text-xs text-slate-500">Security settings</p>
            </button>
          </div>
        </div>
      </section>

      {/* Bottom spacing */}
      <div className="h-4" aria-hidden="true" />

      {/* Modals */}
      <GeneralSettingsModal 
        isOpen={showGeneralSettings} 
        onClose={() => setShowGeneralSettings(false)} 
      />
      <NotificationSettingsModal 
        isOpen={showNotificationSettings} 
        onClose={() => setShowNotificationSettings(false)} 
      />
      <PrivacySettingsModal 
        isOpen={showPrivacySettings} 
        onClose={() => setShowPrivacySettings(false)} 
      />
      <PersonalInformationModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)}
        onProfileUpdated={handleProfileUpdated}
      />
      <ServiceAddressModal 
        isOpen={showAddressModal} 
        onClose={() => setShowAddressModal(false)}
        onAddressUpdated={handleAddressUpdated}
      />
      <TemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        templates={templates}
        customTemplates={customTemplates}
        systemTemplates={systemTemplates}
        canAddMore={canAddMore}
        customTemplateCount={customTemplateCount}
        onCreateTemplate={createTemplate}
        onUpdateTemplate={updateTemplate}
        onDeleteTemplate={deleteTemplate}
      />
    </div>
  );
};

export default ProfilePanel;
