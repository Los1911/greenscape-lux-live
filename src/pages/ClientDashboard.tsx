import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UnifiedDashboardHeader from '@/components/shared/UnifiedDashboardHeader';
import { LiveDashboardStats } from '@/components/client/LiveDashboardStats';
import { PaymentMethodManager } from '@/components/client/PaymentMethodManager';
import { PaymentSummaryCard } from '@/components/client/PaymentSummaryCard';
import { RecentJobsCard } from '@/components/client/RecentJobsCard';
import { NotificationSystem } from '@/components/client/NotificationSystem';
import { UnifiedProfileTracker } from '@/components/client/UnifiedProfileTracker';
import { ProfileStatusCard } from '@/components/client/ProfileStatusCard';
import { JobsOverviewSection } from '@/components/client/JobsOverviewSection';
import { useMobile } from '@/hooks/use-mobile';

export const ClientDashboard: React.FC = () => {
  const isMobile = useMobile();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleRequestService = () => {
    navigate('/get-quote-enhanced');
  };

  const handleScheduleService = () => {
    navigate('/get-quote-enhanced');
  };

  const handleContactSupport = () => {
    window.open('mailto:support@greenscapelux.com', '_blank');
  };

  const handleManagePayments = () => {
    setShowPaymentModal(true);
  };

  const handleViewInvoices = () => {
    navigate('/billing-history');
  };

  const handleAccountSettings = () => {
    setShowProfileModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-16 space-y-8 sm:space-y-12 lg:space-y-16">
        {/* Header with proper mobile spacing */}
        <div className="w-full mb-6 sm:mb-8 lg:mb-12">
          <UnifiedDashboardHeader type="client" userName="Client" variant="modern" />
        </div>

        {/* Live Stats */}
        <div className="w-full mb-6 sm:mb-8 lg:mb-12">
          <LiveDashboardStats />
        </div>

        {/* Top Row - 4 Cards with responsive grid and proper spacing */}
        <div className="w-full mb-8 sm:mb-12 lg:mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
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
            
            {/* Quick Actions with proper button spacing */}
            <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl p-4 sm:p-6 lg:p-8 w-full">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Quick Actions</h3>
              <div className="flex flex-col space-y-3 sm:space-y-4">
                <button 
                  onClick={handleRequestService} 
                  className="w-full px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40 transition-all duration-200 text-xs sm:text-sm lg:text-base min-h-[40px] sm:min-h-[44px] lg:min-h-[48px]"
                >
                  Request Service
                </button>
                <button 
                  onClick={handleManagePayments} 
                  className="w-full px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-400/40 transition-all duration-200 text-xs sm:text-sm lg:text-base min-h-[40px] sm:min-h-[44px] lg:min-h-[48px]"
                >
                  Manage Payments
                </button>
            </div>
            
            {/* Profile Status */}
            <div className="w-full">
              <ProfileStatusCard />
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="w-full mb-6 sm:mb-8 lg:mb-12">
          <RecentJobsCard />
        </div>

        {/* Notifications */}
        <div className="w-full mb-6 sm:mb-8 lg:mb-12">
          <NotificationSystem />
        </div>
        
        {/* Jobs Overview */}
        <div className="w-full mb-6 sm:mb-8 lg:mb-12">
          <JobsOverviewSection />
        </div>
      </div>

      {/* Payment Modal with proper mobile spacing */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-black flex-shrink-0">Payment Methods</h3>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 flex items-center justify-center transition-colors duration-200 self-end sm:self-auto flex-shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="text-black">
              <PaymentMethodManager 
                open={true}
                onOpenChange={setShowPaymentModal}
                onSuccess={() => {
                  // Payment method added successfully - modal will close automatically
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;