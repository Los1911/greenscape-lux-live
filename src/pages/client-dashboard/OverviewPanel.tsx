import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveDashboardStats } from '@/components/client/LiveDashboardStats';
import { PaymentSummaryCard } from '@/components/client/PaymentSummaryCard';
import { UnifiedProfileTracker } from '@/components/client/UnifiedProfileTracker';
import { ProfileStatusCard } from '@/components/client/ProfileStatusCard';
import { RecentJobsCard } from '@/components/client/RecentJobsCard';
import { NotificationSystem } from '@/components/client/NotificationSystem';

export const OverviewPanel: React.FC = () => {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleRequestService = () => {
    navigate('/get-quote-enhanced');
  };

  const handleManagePayments = () => {
    navigate('/client-dashboard/payments');
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Live Stats */}
      <div className="w-full">
        <LiveDashboardStats />
      </div>

      {/* Top Row - 4 Cards with responsive grid */}
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Payment Summary */}
          <div className="w-full">
            <PaymentSummaryCard />
          </div>
          
          {/* My Profile */}
          <div className="w-full">
            <UnifiedProfileTracker
              onEditProfile={() => setShowProfileModal(true)}
              onAddAddress={() => setShowAddressModal(true)}
              onAddPayment={() => setShowPaymentModal(true)}
            />
          </div>
          
          {/* Quick Actions */}
          <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl p-4 sm:p-6 w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Quick Actions</h3>
            <div className="flex flex-col space-y-3 sm:space-y-4">
              <button 
                onClick={handleRequestService} 
                className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40 transition-all duration-200 text-sm sm:text-base"
              >
                Request Service
              </button>
              <button 
                onClick={handleManagePayments} 
                className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-400/40 transition-all duration-200 text-sm sm:text-base"
              >
                Manage Payments
              </button>
            </div>
          </div>
          
          {/* Profile Status */}
          <div className="w-full">
            <ProfileStatusCard />
          </div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="w-full">
        <RecentJobsCard />
      </div>

      {/* Notifications */}
      <div className="w-full">
        <NotificationSystem />
      </div>
    </div>
  );
};

export default OverviewPanel;