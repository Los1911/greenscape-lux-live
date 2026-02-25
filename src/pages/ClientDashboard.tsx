import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, CreditCard, Sparkles } from 'lucide-react';
import UnifiedDashboardHeader from '@/components/shared/UnifiedDashboardHeader';
import { LiveDashboardStats } from '@/components/client/LiveDashboardStats';
import { PaymentMethodManager } from '@/components/client/PaymentMethodManager';
import { PaymentSummaryCard } from '@/components/client/PaymentSummaryCard';
import { RecentJobsCard } from '@/components/client/RecentJobsCard';
import { NotificationSystem } from '@/components/client/NotificationSystem';
import { ProfileStatusCard } from '@/components/client/ProfileStatusCard';
import { JobsOverviewSection } from '@/components/client/JobsOverviewSection';
import { LiveJobTrackingCard } from '@/components/client/LiveJobTrackingCard';
import { SuggestedNextStepCard } from '@/components/client/SuggestedNextStepCard';
import { ClientEmptyState } from '@/components/client/ClientEmptyState';
import { useDashboardData } from '@/hooks/useDashboardData';
// V1 Payment Flow: Import ApprovedQuotesSection
import { ApprovedQuotesSection } from '@/components/client/ApprovedQuotesSection';

export const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { stats, loading: dataLoading } = useDashboardData('client');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-emerald-400 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-emerald-400 mt-4">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Navigate to client quote form for authenticated clients
  const handleRequestService = () => navigate('/client-quote');
  const handleManagePayments = () => navigate('/client-dashboard/payments');

  // Determine if this is a first-time user (no jobs yet)
  const isFirstTimeUser = !dataLoading && stats.totalJobs === 0;

  // Get user's display name
  const getUserDisplayName = () => {
    if (user.user_metadata?.name) return user.user_metadata.name.split(' ')[0];
    if (user.user_metadata?.full_name) return user.user_metadata.full_name.split(' ')[0];
    if (user.email) return user.email.split('@')[0];
    return 'there';
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-black via-[#020b06] to-black text-white">
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <UnifiedDashboardHeader type="client" userName="Client" variant="modern" />
        
        {/* Show empty state for first-time users */}
        {isFirstTimeUser ? (
          <ClientEmptyState userName={getUserDisplayName()} />
        ) : (
          <>
            {/* V1 PAYMENT FLOW: Approved Quotes Section - Shows Pay Now buttons */}
            <section aria-label="Approved Quotes">
              <ApprovedQuotesSection />
            </section>

            {/* Quick Actions - Primary CTA at top */}
            <section aria-label="Quick Actions">
              <div className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-medium text-white">Quick Actions</h3>
                </div>
                
                <div className="space-y-3">
                  <button 
                    onClick={handleRequestService} 
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/30 transition-all duration-200 group"
                  >
                    <span>Request Service</span>
                    <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </button>
                  
                  <button 
                    onClick={handleManagePayments} 
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-800 text-white font-medium transition-all duration-200 group"
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                      Manage Payments
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>
              </div>
            </section>

            {/* Stats Row */}
            <section aria-label="Dashboard Statistics">
              <LiveDashboardStats />
            </section>

            {/* Payment Summary */}
            <section aria-label="Payment Overview">
              <PaymentSummaryCard variant="default" showManageButton={false} />
            </section>

            {/* Recent Jobs */}
            <section aria-label="Recent Jobs">
              <RecentJobsCard />
            </section>

            {/* Suggested Next Step - only shows when no active jobs */}
            <SuggestedNextStepCard activeJobs={stats?.activeJobs ?? 0} />

            {/* Live Job Tracking */}
            <section aria-label="Live Job Tracking">
              <LiveJobTrackingCard />
            </section>

            {/* Informational Cards */}
            <section aria-label="Account Information" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ProfileStatusCard />
              <NotificationSystem />
            </section>

            {/* Jobs Overview */}
            <section aria-label="Jobs Overview">
              <JobsOverviewSection />
            </section>
          </>
        )}

        {/* Bottom spacing */}
        <div className="h-4" aria-hidden="true" />
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-black">Payment Methods</h3>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-black">
              <PaymentMethodManager open={true} onOpenChange={setShowPaymentModal} onSuccess={() => {}} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
