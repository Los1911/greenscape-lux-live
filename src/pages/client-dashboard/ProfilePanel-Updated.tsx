import React, { useState } from 'react';
import { UnifiedProfileTracker } from '@/components/client/UnifiedProfileTracker';
import { ProfileStatusCard } from '@/components/client/ProfileStatusCard';
import { User, MapPin, Phone, Mail, Settings, Shield } from 'lucide-react';

export const ProfilePanel: React.FC = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Profile Management</h1>
        <p className="text-gray-400 mt-1">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UnifiedProfileTracker onEditProfile={() => setShowProfileModal(true)} onAddAddress={() => setShowAddressModal(true)} onAddPayment={() => setShowPaymentModal(true)} />
        <ProfileStatusCard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400"><User className="h-5 w-5" /></div>
              <h3 className="text-xl font-semibold text-white">Personal Information</h3>
            </div>
            <button onClick={() => setShowProfileModal(true)} className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-medium">Edit</button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3"><User className="h-4 w-4 text-gray-400" /><div><p className="text-sm text-gray-400">Full Name</p><p className="text-white">John Doe</p></div></div>
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-gray-400" /><div><p className="text-sm text-gray-400">Email</p><p className="text-white">john.doe@example.com</p></div></div>
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-gray-400" /><div><p className="text-sm text-gray-400">Phone</p><p className="text-white">+1 (555) 123-4567</p></div></div>
          </div>
        </div>

        <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400"><MapPin className="h-5 w-5" /></div>
              <h3 className="text-xl font-semibold text-white">Service Address</h3>
            </div>
            <button onClick={() => setShowAddressModal(true)} className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-medium">Edit</button>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3"><MapPin className="h-4 w-4 text-gray-400 mt-1" /><div><p className="text-sm text-gray-400">Primary Address</p><p className="text-white">123 Main Street</p><p className="text-white">Anytown, ST 12345</p></div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePanel;