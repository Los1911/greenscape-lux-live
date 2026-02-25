import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ClientOnboardingRedirectProps {
  children: React.ReactNode;
}

/**
 * ClientOnboardingRedirect - DEPRECATED
 * 
 * This component is no longer needed because OnboardingGuard is now the sole authority
 * for onboarding completion. The Guard wraps ClientDashboardV2 and handles all
 * onboarding logic directly.
 * 
 * This component is kept for backward compatibility but simply passes through children.
 * All onboarding checks happen in OnboardingGuard.
 * 
 * If you need to protect a client route from being accessed during onboarding,
 * the route should redirect to /client-dashboard where OnboardingGuard will
 * show the onboarding screen if needed.
 */
export const ClientOnboardingRedirect: React.FC<ClientOnboardingRedirectProps> = ({ children }) => {
  const { loading } = useAuth();

  // Show loading state while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#020b06] to-black">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-emerald-400/70 text-sm mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  // Pass through - OnboardingGuard handles onboarding checks
  return <>{children}</>;
};

export default ClientOnboardingRedirect;
