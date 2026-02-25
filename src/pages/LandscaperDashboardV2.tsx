import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useSupabaseClient } from '@/lib/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import SiteChrome from '@/components/SiteChrome';
import { signOutAndRedirect } from '@/lib/logout';
import { useToast } from '@/hooks/use-toast';
import { useRealtimePatch } from '@/hooks/useRealtimePatch';

import OverviewPanel from './landscaper-dashboard/OverviewPanel';
import JobsPanel from './landscaper-dashboard/JobsPanel';
import EarningsPanel from './landscaper-dashboard/EarningsPanel';
import ProfilePanel from './landscaper-dashboard/ProfilePanel';


const log = (msg: string, data?: any) => {
  console.log(`[LANDSCAPER_DASHBOARD] ${msg}`, data !== undefined ? data : '');
};

type LandscaperProfile = {
  id?: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  approved?: boolean;
  available?: boolean;
  insurance_file?: string | null;
  license_file?: string | null;
  stripe_connect_id?: string | null;
};

// Event for notifying components to refresh Stripe status
export const STRIPE_STATUS_REFRESH_EVENT = 'stripe-connect-status-refresh';

export default function LandscaperDashboardV2() {
  const supabase = useSupabaseClient();
  const { user: authUser, session: authSession, loading: authLoading, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [profile, setProfile] = useState<LandscaperProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);

  // ── Supabase Realtime: patch landscaper profile on changes ──
  // Each child panel (OverviewPanel, JobsPanel, EarningsPanel) owns its own
  // realtime subscription for jobs/payments. This level only watches the
  // landscaper profile row for approval/availability/stripe changes.
  const landscaperSubs = useMemo(() => {
    if (!authUser?.id) return [];
    return [
      { table: 'landscapers', event: 'UPDATE' as const, filter: `user_id=eq.${authUser.id}` },
    ];
  }, [authUser?.id]);

  useRealtimePatch({
    channelName: `landscaper-profile-${authUser?.id || 'anon'}`,
    subscriptions: landscaperSubs,
    enabled: !!authUser?.id && !authLoading,
    onEvent: (_eventType, table, newRow) => {
      if (table === 'landscapers' && newRow.user_id === authUser?.id) {
        log('Realtime profile patch:', newRow);
        // Merge updated fields into profile without remounting
        setProfile(prev => prev ? { ...prev, ...newRow } : prev);
        if (typeof newRow.available === 'boolean') {
          setIsAvailable(newRow.available);
        }
      }
    },
  });



  // Handle Stripe return URL parameters
  const handleStripeReturn = useCallback(async () => {
    const stripeReturn = searchParams.get('stripe_return');
    const accountId = searchParams.get('account_id');
    
    if (!stripeReturn) return;
    
    log('Stripe return detected:', { stripeReturn, accountId });
    
    // Clear URL params immediately to prevent re-triggering
    setSearchParams({}, { replace: true });
    
    if (stripeReturn === 'success') {
      // Show initial toast
      toast({
        title: 'Stripe Connect Setup',
        description: 'Verifying your account status...',
      });
      
      // If we have an account ID, update the database first
      if (accountId && authUser?.id) {
        try {
          const { error } = await supabase
            .from('landscapers')
            .update({ stripe_connect_id: accountId })
            .eq('user_id', authUser.id);
          
          if (error) {
            log('Error updating stripe_connect_id:', error.message);
          } else {
            log('Successfully saved stripe_connect_id:', accountId);
          }
        } catch (err) {
          log('Error saving stripe account:', err);
        }
      }

      // Now verify the account status with Stripe API
      try {
        log('Calling verify-stripe-connect-status...');
        const { data, error: fnError } = await supabase.functions.invoke('verify-stripe-connect-status', {
          body: { 
            userId: authUser?.id,
            accountId: accountId 
          }
        });

        log('Verification response:', { data, fnError });

        if (data?.success) {
          const statusMessage = data.payoutsEnabled && data.chargesEnabled
            ? 'Your Stripe account is fully verified and ready to receive payments!'
            : data.detailsSubmitted
              ? 'Your information has been submitted. Stripe is reviewing your account.'
              : 'Please complete the remaining steps to activate your account.';
          
          toast({
            title: data.payoutsEnabled ? 'Account Verified!' : 'Verification In Progress',
            description: statusMessage,
            variant: data.payoutsEnabled ? 'default' : 'default',
          });
        }
      } catch (verifyErr) {
        log('Verification error:', verifyErr);
        toast({
          title: 'Stripe Setup',
          description: 'Your account is being set up. Please check back shortly.',
        });
      }
      
      // Dispatch event to notify other components to refresh
      window.dispatchEvent(new CustomEvent(STRIPE_STATUS_REFRESH_EVENT));
      
    } else if (stripeReturn === 'refresh') {
      // User needs to restart onboarding
      toast({
        title: 'Stripe Setup Incomplete',
        description: 'Please complete your Stripe account setup to receive payments.',
        variant: 'destructive',
      });
    }
  }, [searchParams, setSearchParams, toast, authUser?.id, supabase]);


  // Check for Stripe return on mount and when search params change
  useEffect(() => {
    handleStripeReturn();
  }, [handleStripeReturn]);

  // Role guard: redirect if user is not a landscaper
  useEffect(() => {
    if (authLoading) return;
    
    log('Role check', { role, hasUser: !!authUser });
    
    if (!authUser) {
      log('No user - redirecting to login');
      navigate('/portal-login', { replace: true });
      return;
    }
    
    // Redirect wrong roles to their correct dashboard
    if (role === 'client') {
      log('Client on landscaper dashboard - redirecting');
      navigate('/client-dashboard', { replace: true });
      return;
    }
    if (role === 'admin') {
      log('Admin on landscaper dashboard - redirecting');
      navigate('/admin-dashboard', { replace: true });
      return;
    }
  }, [authLoading, authUser, role, navigate]);


  useEffect(() => {
    if (authLoading) return;
    if (!authSession) {
      log('No session - waiting for auth...');
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      log('Starting profile load…');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        log('Session verification failed:', sessionError?.message);
        setProfile({
          user_id: authUser?.id,
          first_name: authUser?.email?.split('@')[0] || 'Landscaper',
          last_name: '',
          email: authUser?.email || '',
          approved: false,
          available: false,
        });
        setIsLoading(false);
        return;
      }

      const userId = session.user.id;
      const userEmail = session.user.email || '';

      try {
        const { data, error } = await supabase
          .from("landscapers")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          log('Error loading profile:', error.message);
        }

        if (data) {
          log('Profile loaded:', data);
          setProfile(data);
          setIsAvailable(data.available ?? false);
        } else {
          log('No profile found - using fallback');
          setProfile({
            user_id: userId,
            first_name: userEmail.split('@')[0] || 'New',
            last_name: 'Landscaper',
            email: userEmail,
            approved: false,
            available: false,
          });
        }
      } catch (err) {
        log('Unexpected error:', err);
        setProfile({
          user_id: userId,
          first_name: userEmail.split('@')[0] || 'Landscaper',
          last_name: '',
          email: userEmail,
          approved: false,
          available: false,
        });
      }
      setIsLoading(false);
    };

    loadProfile();
  }, [supabase, authUser, authSession, authLoading]);

  const handleTabClick = (path: string) => navigate(path);

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
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session?.user) {
        setIsAvailable(!newStatus);
        return;
      }
      const { error } = await supabase
        .from('landscapers')
        .update({ available: newStatus })
        .eq('user_id', session.user.id);
      if (error) setIsAvailable(!newStatus);
    } catch {
      setIsAvailable(!newStatus);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black flex items-center justify-center">
        <div className="text-emerald-300">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <SiteChrome>
      {/* Removed pb-20 - no bottom nav on mobile anymore */}
      <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black text-white w-full overflow-x-hidden overflow-y-auto overscroll-contain">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DashboardHeader
            profile={profile}
            profileLoading={isLoading}
            isAvailable={isAvailable}
            onToggleAvailability={handleToggleAvailability}
            onLogout={() => signOutAndRedirect(supabase, '/')}
          />
          <DashboardTabs currentTab={getCurrentTab()} onTabClick={handleTabClick} />
          <Routes>
            <Route path="overview" element={<OverviewPanel profile={profile} isAvailable={isAvailable} />} />
            <Route path="jobs" element={<JobsPanel />} />
            <Route path="earnings" element={<EarningsPanel />} />
            <Route path="profile" element={<ProfilePanel />} />
            <Route path="" element={<OverviewPanel profile={profile} isAvailable={isAvailable} />} />
          </Routes>
        </div>
      </div>
      {/* Mobile bottom nav removed for premium scroll-safe Lux experience */}
    </SiteChrome>
  );

}

function DashboardHeader({ profile, profileLoading, isAvailable, onToggleAvailability, onLogout }: {
  profile: LandscaperProfile | null; profileLoading: boolean; isAvailable: boolean;
  onToggleAvailability: () => void; onLogout: () => void;
}) {
  const displayName = profile?.first_name ?? 'Landscaper';
  const displayLastName = profile?.last_name ?? '';
  const displayEmail = profile?.email ?? '';

  return (
    <header className="dashboard-header py-4 sm:py-6 lg:py-8" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))' }}>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-300 truncate">
            {displayName} {displayLastName}
          </h1>
          {displayEmail && (
            <p className="text-xs sm:text-sm text-emerald-300/70 truncate max-w-[200px] sm:max-w-none">
              {displayEmail}
            </p>
          )}
          {profileLoading && <p className="text-xs text-emerald-300/50">Loading profile...</p>}
        </div>
        <div className="flex flex-row gap-2 sm:gap-3 flex-shrink-0">
          <button onClick={onToggleAvailability}
            className={`px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition whitespace-nowrap ${
              isAvailable ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50' : 'bg-black/60 text-emerald-200 border border-emerald-500/25'
            }`}>{isAvailable ? 'Available' : 'Unavailable'}</button>
          <button onClick={onLogout} className="px-3 py-2 rounded-xl bg-red-500/90 text-white hover:bg-red-500 transition text-xs sm:text-sm whitespace-nowrap">Logout</button>
        </div>
      </div>
    </header>
  );
}

function DashboardTabs({ currentTab, onTabClick }: { currentTab: string; onTabClick: (path: string) => void }) {
  const tabs = [
    { key: 'overview', label: 'Overview', path: '/landscaper-dashboard/overview' },
    { key: 'jobs', label: 'Jobs', path: '/landscaper-dashboard/jobs' },
    { key: 'earnings', label: 'Earnings', path: '/landscaper-dashboard/earnings' },
    { key: 'profile', label: 'Profile', path: '/landscaper-dashboard/profile' },
  ];
  return (
    <div className="mb-4 sm:mb-6">

      <div className="bg-black/40 rounded-xl sm:rounded-2xl p-1 border border-emerald-500/25">
        {/* Desktop: 4-column grid */}
        <div className="hidden sm:grid sm:grid-cols-4 gap-1">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => onTabClick(tab.path)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition ${
                currentTab === tab.key ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50' : 'text-emerald-300/70 hover:text-emerald-200 hover:bg-black/20'
              }`}>{tab.label}</button>
          ))}
        </div>
        {/* Mobile: 4-column grid with equal width, smaller text/padding */}
        <div className="sm:hidden grid grid-cols-4 gap-0.5">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => onTabClick(tab.path)}
              className={`px-1 py-2.5 rounded-lg text-xs font-medium transition text-center ${
                currentTab === tab.key 
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50' 
                  : 'text-emerald-300/70 hover:text-emerald-200 hover:bg-black/20'
              }`}>{tab.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
