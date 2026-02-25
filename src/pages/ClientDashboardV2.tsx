import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, CreditCard, User, RefreshCw } from 'lucide-react';
import UnifiedDashboardHeader from '@/components/shared/UnifiedDashboardHeader';
import { useMobile } from '@/hooks/use-mobile';
import JobRequestsPanel from './client-dashboard/JobRequestsPanel';
import PaymentHistoryPanel from './client-dashboard/PaymentHistoryPanel';
import ProfilePanel from './client-dashboard/ProfilePanel';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingGuard } from '@/components/onboarding/OnboardingGuard';

const log = (msg: string, data?: any) => {
  console.log(`[CLIENT_DASHBOARD] ${msg}`, data ?? '');
};

interface ClientProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

// -----------------------------
// Inner dashboard content
// -----------------------------
const ClientDashboardContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useMobile();
  const { user, role, loading: authLoading } = useAuth();

  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Realtime is now handled by each child component via useRealtimePatch ──
  // No more refreshTrigger prop drilling from this level.

  // Role guard (runs only on mount / auth change)
  useEffect(() => {
    if (authLoading) return;

    log('Role check', { role, hasUser: !!user });

    if (!user) {
      navigate('/portal-login', { replace: true });
      return;
    }

    if (role === 'landscaper') {
      navigate('/landscaper-dashboard', { replace: true });
      return;
    }

    if (role === 'admin') {
      navigate('/admin-dashboard', { replace: true });
      return;
    }
  }, [authLoading, user, role, navigate]);

  // Load client profile
  useEffect(() => {
    if (authLoading) return;

    const loadClientData = async () => {
      setIsLoading(true);
      const userEmail = user?.email || '';

      if (!user) {
        setClientProfile({
          id: 'temp',
          full_name: 'Guest',
          email: null,
          phone: null,
          address: null,
        });
        setIsLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, first_name, last_name, email, phone, address')
          .eq('id', user.id)
          .maybeSingle();

        const fullName =
          profile?.full_name ||
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
          userEmail.split('@')[0] ||
          'Client';

        setClientProfile({
          id: profile?.id || user.id,
          full_name: fullName,
          email: profile?.email || userEmail,
          phone: profile?.phone || null,
          address: profile?.address || null,
        });
      } catch {
        setClientProfile({
          id: user.id,
          full_name: userEmail.split('@')[0] || 'Client',
          email: userEmail,
          phone: null,
          address: null,
        });
      }

      setIsLoading(false);
    };

    loadClientData();
  }, [authLoading, user]);

  // Tabs: Jobs (My Services) is now the primary view
  const tabs = [
    { id: 'jobs', label: 'My Services', icon: Briefcase, path: '/client-dashboard/jobs' },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: '/client-dashboard/payments' },
    { id: 'profile', label: 'Profile', icon: User, path: '/client-dashboard/profile' },
  ];

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/payments')) return 'payments';
    if (path.includes('/profile')) return 'profile';
    return 'jobs';
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-black via-[#020b06] to-black text-white overflow-y-auto overscroll-contain">
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <UnifiedDashboardHeader
          type="client"
          userName={clientProfile?.full_name || 'Client'}
          variant="modern"
        />
      </div>


      <div className="border-b border-emerald-500/20 sticky top-0 bg-black/80 backdrop-blur-sm z-40">
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = getCurrentTab() === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-gray-400 hover:text-emerald-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className={isMobile ? 'hidden sm:inline' : ''}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full max-w-screen-xl mx-auto">
        <Routes>
          <Route index element={<JobRequestsPanel />} />
          <Route path="jobs" element={<JobRequestsPanel />} />
          <Route path="payments" element={<PaymentHistoryPanel />} />
          <Route path="profile" element={<ProfilePanel />} />
        </Routes>
      </div>


    </div>
  );
};

// -----------------------------
// Outer wrapper with HARD STOP
// -----------------------------
export const ClientDashboardV2: React.FC = () => {
  const navigate = useNavigate();
  const hasRedirectedRef = useRef(false);

  const handleOnboardingComplete = useCallback(() => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;

    log('Onboarding complete - navigating to dashboard');
    navigate('/client-dashboard', { replace: true });
  }, [navigate]);

  return (
    <OnboardingGuard onComplete={handleOnboardingComplete}>
      <ClientDashboardContent />
    </OnboardingGuard>
  );
};

export default ClientDashboardV2;
