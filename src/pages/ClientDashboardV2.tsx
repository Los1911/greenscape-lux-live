import React from 'react';

import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home, Briefcase, CreditCard, User } from 'lucide-react';
import UnifiedDashboardHeader from '@/components/shared/UnifiedDashboardHeader';
import { useMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import OverviewPanel from './client-dashboard/OverviewPanel';
import JobRequestsPanel from './client-dashboard/JobRequestsPanel';
import PaymentHistoryPanel from './client-dashboard/PaymentHistoryPanel';
import ProfilePanel from './client-dashboard/ProfilePanel';

export const ClientDashboardV2: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useMobile();


  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home, path: '/client-dashboard/overview' },
    { id: 'jobs', label: 'Job Requests', icon: Briefcase, path: '/client-dashboard/jobs' },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: '/client-dashboard/payments' },
    { id: 'profile', label: 'Profile', icon: User, path: '/client-dashboard/profile' },
  ];

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/jobs')) return 'jobs';
    if (path.includes('/payments')) return 'payments';
    if (path.includes('/profile')) return 'profile';
    return 'overview';
  };

  const currentTab = getCurrentTab();

  const handleTabChange = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      navigate(tab.path);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black text-white">
      {/* Header */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <UnifiedDashboardHeader type="client" userName="Client" variant="modern" />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-emerald-500/20 sticky top-0 bg-black/80 backdrop-blur-sm z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-0 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                      : 'border-transparent text-gray-400 hover:text-emerald-400 hover:border-emerald-500/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className={isMobile ? 'hidden sm:inline' : ''}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto min-h-[calc(100vh-200px)]">

        <Routes>
          <Route path="/" element={<OverviewPanel />} />
          <Route path="/overview" element={<OverviewPanel />} />
          <Route path="/jobs" element={<JobRequestsPanel />} />
          <Route path="/payments" element={<PaymentHistoryPanel />} />
          <Route path="/profile" element={<ProfilePanel />} />
        </Routes>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userRole="client" />
    </div>
  );
};

export default ClientDashboardV2;