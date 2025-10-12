import React, { useState } from 'react';
import { UnifiedProfileTracker } from '@/components/client/UnifiedProfileTracker';
import { ProfileStatusCard } from '@/components/client/ProfileStatusCard';
import { User, MapPin, Phone, Mail, Settings, Shield } from 'lucide-react';

export const ProfilePanel: React.FC = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleEditProfile = () => {
    setShowProfileModal(true);
  };

  const handleAddAddress = () => {
    setShowAddressModal(true);
  };

  const handleManagePayments = () => {
    setShowPaymentModal(true);
  };

  const handleAccountSettings = () => {
    console.log('Account settings clicked');
  };

  const handlePrivacySettings = () => {
    console.log('Privacy settings clicked');
  };

  const handleNotificationSettings = () => {
    console.log('Notification settings clicked');
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Profile Management</h1>
        <p className="text-gray-400 mt-1">Manage your account information and preferences</p>
      </div>

      {/* Profile Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Tracker */}
        <div className="w-full">
          <UnifiedProfileTracker
            onEditProfile={handleEditProfile}
            onAddAddress={handleAddAddress}
            onAddPayment={handleManagePayments}
          />
        </div>
        
        {/* Profile Status */}
        <div className="w-full">
          <ProfileStatusCard />
        </div>
      </div>

      {/* Profile Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <User className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">Personal Information</h3>
            </div>
            <button
              onClick={handleEditProfile}
              className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-medium"
            >
              Edit
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Full Name</p>
                <p className="text-white">John Doe</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white">john.doe@example.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Phone</p>
                <p className="text-white">+1 (555) 123-4567</p>
              </div>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-black/60 backdrop-blur border border-blue-500/25 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">Service Address</h3>
            </div>
            <button
              onClick={handleAddAddress}
              className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium"
            >
              Edit
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-400">Primary Address</p>
                <p className="text-white">123 Main Street</p>
                <p className="text-white">Anytown, ST 12345</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-black/60 backdrop-blur border border-purple-500/25 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
            <Settings className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-semibold text-white">Account Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={handleAccountSettings}
            className="p-4 rounded-xl bg-black/40 hover:bg-black/60 border border-gray-500/25 hover:border-gray-400/40 transition-all duration-200 text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-5 w-5 text-gray-400" />
              <span className="text-white font-medium">General</span>
            </div>
            <p className="text-gray-400 text-sm">Account preferences and settings</p>
          </button>

          <button
            onClick={handleNotificationSettings}
            className="p-4 rounded-xl bg-black/40 hover:bg-black/60 border border-gray-500/25 hover:border-gray-400/40 transition-all duration-200 text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <Mail className="h-5 w-5 text-gray-400" />
              <span className="text-white font-medium">Notifications</span>
            </div>
            <p className="text-gray-400 text-sm">Email and push notification preferences</p>
          </button>

          <button
            onClick={handlePrivacySettings}
            className="p-4 rounded-xl bg-black/40 hover:bg-black/60 border border-gray-500/25 hover:border-gray-400/40 transition-all duration-200 text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-5 w-5 text-gray-400" />
              <span className="text-white font-medium">Privacy</span>
            </div>
            <p className="text-gray-400 text-sm">Privacy and security settings</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePanel;