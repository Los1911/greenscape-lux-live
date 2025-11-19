import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@/lib/ConfigContext';
import SiteChrome from '@/components/SiteChrome';

// FIX ✔️ LiveDashboardStats is a NAMED export
import { LiveDashboardStats } from '@/components/client/LiveDashboardStats';

import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';

export default function ClientDashboardV2() {
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = useSupabaseClient();

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/activity')) return 'activity';
    if (path.includes('/profile')) return 'profile';
    return 'overview';
  };

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  return (
    <SiteChrome>
      <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black text-white pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <header className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-300">
              Client Dashboard
            </h1>
          </header>

          {/* Tabs */}
          <div className="px-4 sm:px-6 lg:px-8 mb-6">
            <div className="bg-black/40 backdrop-blur rounded-2xl p-1 border border-emerald-500/25 flex gap-1">
              {[
                { key: 'overview', label: 'Overview', path: '/client-dashboard/overview' },
                { key: 'activity', label: 'Activity', path: '/client-dashboard/activity' },
                { key: 'profile', label: 'Profile', path: '/client-dashboard/profile' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.path)}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm lg:text-base ${
                    getCurrentTab() === tab.key
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50'
                      : 'text-emerald-300/70 hover:text-emerald-200 hover:bg-black/20'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Routes */}
          <Routes>
            <Route path="overview" element={<LiveDashboardStats />} />
            <Route path="activity" element={<div className="text-white p-6">Activity coming soon</div>} />
            <Route path="profile" element={<div className="text-white p-6">Profile editor coming soon</div>} />

            {/* Default */}
            <Route path="" element={<LiveDashboardStats />} />
          </Routes>

        </div>
      </div>

      <MobileBottomNav />
    </SiteChrome>
  );
}