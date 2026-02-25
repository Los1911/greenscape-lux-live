// components/SharedUI/ProTopBar.tsx
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { signOutAndRedirect } from "@/lib/logout";
import { supabase } from "@/lib/supabase";
import { getDashboardRoute } from "@/utils/navigationHelpers";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="currentColor" d="M15.5 5 9 11.5 15.5 18l1.5-1.5-5-5 5-5z"/>
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="currentColor" d="M10 17v2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5v2H5v10h5zm9.59-5-3.3 3.29L17 16l5-5-5-5-1.71 1.71L19.59 10H11v2z"/>
    </svg>
  );
}

export default function ProTopBar() {
  const { user, role } = useAuth(); // Use AuthContext instead of direct supabase call
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const email = user?.email || null; // Get email from AuthContext
  const isAuthenticated = !!user;

  const handleBack = () => {
    if (typeof window !== "undefined") {
      // For authenticated users, always go to their dashboard
      // Never go to public pages like '/' or '/professionals'
      if (isAuthenticated) {
        const dashboardPath = getDashboardRoute(role);
        window.location.assign(dashboardPath);
        return;
      }
      
      // For unauthenticated users, use the original logic
      const currentPath = window.location.pathname;
      const backPath = currentPath.includes('/professionals') ? '/professionals' : '/';
      window.location.assign(backPath);
    }
  };

  const handleLogout = async () => {
    await signOutAndRedirect(supabase, '/portal-login');
  };

  // Get profile path based on role
  const getProfilePath = () => {
    switch (role) {
      case 'landscaper':
        return '/landscaper-profile';
      case 'admin':
        return '/admin-dashboard';
      case 'client':
        return '/profile';
      default:
        return '/profile';
    }
  };

  return (
    <div className="sticky top-0 z-40 mx-auto mt-2 mb-3 w-[min(100%,56rem)] px-3">
      <div className="flex items-center justify-between rounded-full border border-emerald-600/30 bg-emerald-900/20 backdrop-blur px-2 py-1.5">
        <button
          aria-label="Go back"
          onClick={handleBack}
          className="p-2 rounded-full bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-600/30 hover:shadow-[0_0_10px_rgba(16,185,129,0.6)] text-emerald-400"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <BackIcon />
        </button>

        <button
          className="max-w-[60%] sm:max-w-[70%] truncate text-emerald-200/90 text-sm text-center"
          title={email || ""}
          onClick={() => (typeof window !== "undefined") && window.location.assign(getProfilePath())}
        >
          {email || "Professional"}
        </button>

        <button
          aria-label="Log out"
          onClick={handleLogout}
          className="p-2 rounded-full bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-600/30 hover:shadow-[0_0_10px_rgba(16,185,129,0.6)] text-emerald-400"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <LogoutIcon />
        </button>
      </div>
    </div>
  );
}
