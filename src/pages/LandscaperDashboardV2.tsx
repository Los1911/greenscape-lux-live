import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseClient } from '@/lib/ConfigContext';
import SiteChrome from '@/components/SiteChrome';
import { signOutAndRedirect } from '@/lib/logout';
import { fetchLandscaperProfile } from '@/lib/landscaperProfile';
import { WebSocketProvider } from '@/components/tracking/WebSocketManager';
import MobileBottomNavLandscaper from '@/components/mobile/MobileBottomNavLandscaper';
import { ConnectAccountStatus } from '@/components/landscaper/ConnectAccountStatus';
import OverviewPanel from './landscaper-dashboard/OverviewPanel';
import JobsPanel from './landscaper-dashboard/JobsPanel';
import EarningsPanel from './landscaper-dashboard/EarningsPanel';
import ProfilePanel from './landscaper-dashboard/ProfilePanel';


type LandscaperProfile = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  approved?: boolean;
  insurance_file?: string | null;
  license_file?: string | null;
}

export default function LandscaperDashboardV2() {
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<LandscaperProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const profileData = await fetchLandscaperProfile(user.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, [supabase]);

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/jobs')) return 'jobs';
    if (path.includes('/earnings')) return 'earnings';
    if (path.includes('/profile')) return 'profile';
    return 'overview';
  };

  const handleToggleAvailability = async () => {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase
          .from('landscaper_profiles')
          .update({ available: newStatus })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      setIsAvailable(!newStatus);
    }
  };

  return (
    <WebSocketProvider>
      <SiteChrome>
        <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black text-white pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto">
            <header className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  {profileLoading ? (
                    <div className="text-xl sm:text-2xl font-bold text-emerald-300">Loading...</div>
                  ) : profile ? (
                    <div className="space-y-1">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-300">
                        {profile.first_name ?? ''} {profile.last_name ?? ''}
                      </h1>
                      <p className="text-xs sm:text-sm text-emerald-300/70 break-all">
                        {profile.email ?? ''}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-300">
                        Landscaper Dashboard
                      </h1>
                      <p className="text-xs sm:text-sm text-emerald-300/70">
                        Profile not found
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-row gap-3">
                  <button 
                    onClick={handleToggleAvailability}
                    className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-all duration-200 text-sm ${
                      isAvailable 
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 hover:bg-emerald-500/30 shadow-lg shadow-emerald-500/25'
                        : 'bg-black/60 text-emerald-200 border border-emerald-500/25 hover:bg-black/80'
                    }`}>
                    {isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                  <button
                    onClick={() => signOutAndRedirect(supabase, "/")}
                    className="px-3 sm:px-4 py-2 rounded-xl bg-red-500/90 text-white hover:bg-red-500 shadow-lg hover:shadow-red-500/25 transition-all duration-200 text-sm"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </header>

            <div className="px-4 sm:px-6 lg:px-8 mb-6">
              <div className="bg-black/40 backdrop-blur rounded-2xl p-1 border border-emerald-500/25">
                <div className="hidden sm:grid sm:grid-cols-4 gap-1">
                  {[
                    { key: 'overview', label: 'Overview', path: '/landscaper-dashboard/overview' },
                    { key: 'jobs', label: 'Jobs', path: '/landscaper-dashboard/jobs' },
                    { key: 'earnings', label: 'Earnings', path: '/landscaper-dashboard/earnings' },
                    { key: 'profile', label: 'Profile', path: '/landscaper-dashboard/profile' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => handleTabClick(tab.path)}
                      className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm lg:text-base relative ${
                        getCurrentTab() === tab.key
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-500/30'
                          : 'text-emerald-300/70 hover:text-emerald-200 hover:bg-black/20'
                      }`}
                    >
                      {tab.label}
                      {getCurrentTab() === tab.key && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-emerald-400 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="sm:hidden flex overflow-x-auto gap-1 pb-1">
                  {[
                    { key: 'overview', label: 'Overview', path: '/landscaper-dashboard/overview' },
                    { key: 'jobs', label: 'Jobs', path: '/landscaper-dashboard/jobs' },
                    { key: 'earnings', label: 'Earnings', path: '/landscaper-dashboard/earnings' },
                    { key: 'profile', label: 'Profile', path: '/landscaper-dashboard/profile' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => handleTabClick(tab.path)}
                      className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm whitespace-nowrap ${
                        getCurrentTab() === tab.key
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 shadow-lg shadow-emerald-500/25'
                          : 'text-emerald-300/70 hover:text-emerald-200 hover:bg-black/20'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Routes>
              <Route path="overview" element={<OverviewPanel profile={profile} isAvailable={isAvailable} />} />
              <Route path="jobs" element={<JobsPanel />} />
              <Route path="earnings" element={<EarningsPanel />} />
              <Route path="profile" element={<ProfilePanel />} />
              <Route path="" element={<OverviewPanel profile={profile} isAvailable={isAvailable} />} />
            </Routes>
          </div>
        </div>
        
        <MobileBottomNavLandscaper />
      </SiteChrome>
    </WebSocketProvider>
  );
}
