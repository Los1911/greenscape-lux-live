// src/router/RoleRouter.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * RoleRouter — redirects authenticated users to their role-specific dashboard.
 *
 * FIX (2026-03-01): Use `roleResolved` from AuthContext so we never redirect
 * before the authoritative role resolution completes.  The previous 1.5 s
 * timeout was firing before the async DB queries finished, sending admins
 * to /client-dashboard.
 *
 * Timeout fallback now:
 *   1. Checks sessionStorage for a cached role (written by AuthContext on
 *      every successful resolution).
 *   2. Routes to the cached role's dashboard if available.
 *   3. Only defaults to /client-dashboard when there is no cached role at all.
 *   4. Timeout increased from 1.5 s → 4 s to cover cold-start DB latency.
 */
const RoleRouter: React.FC = () => {
  const { user, role, loading, roleResolved } = useAuth();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  const [waitingForRole, setWaitingForRole] = useState(false);
  const roleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (roleTimeoutRef.current) {
        clearTimeout(roleTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // WAIT: Don't do anything while auth is still loading
    if (loading) return;

    // PREVENT LOOPS: If we already redirected, stop here
    if (hasRedirected.current) return;

    // CASE 1: No user logged in → go to login
    if (!user) {
      hasRedirected.current = true;
      navigate('/portal-login', { replace: true });
      return;
    }

    // CASE 2: Role has been authoritatively resolved → redirect immediately
    if (roleResolved && role) {
      // Clear any pending timeout — we have a definitive answer
      if (roleTimeoutRef.current) {
        clearTimeout(roleTimeoutRef.current);
        roleTimeoutRef.current = null;
      }

      hasRedirected.current = true;

      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'landscaper') {
        navigate('/landscaper-dashboard', { replace: true });
      } else {
        navigate('/client-dashboard', { replace: true });
      }
      return;
    }

    // CASE 3: User exists but role not resolved yet → wait with safety timeout
    if (!roleResolved) {
      if (!waitingForRole) {
        setWaitingForRole(true);

        // 4-second safety timeout (up from 1.5 s) — only fires if role
        // resolution is truly stuck.  Uses cached role from sessionStorage
        // so admins are never mis-routed to the client dashboard.
        roleTimeoutRef.current = setTimeout(() => {
          if (!hasRedirected.current) {
            let fallbackRoute = '/client-dashboard';

            try {
              const cachedRole = sessionStorage.getItem('user_role');
              if (cachedRole === 'admin') {
                fallbackRoute = '/admin';
              } else if (cachedRole === 'landscaper') {
                fallbackRoute = '/landscaper-dashboard';
              }
            } catch {
              // sessionStorage unavailable — keep default
            }

            console.warn(
              `[RoleRouter] Role resolution timeout — falling back to ${fallbackRoute}`
            );
            hasRedirected.current = true;
            navigate(fallbackRoute, { replace: true });
          }
        }, 4000);
      }
      return;
    }
  }, [user, role, loading, roleResolved, navigate, waitingForRole]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-emerald-400 mt-4 text-lg">Loading...</p>
        {waitingForRole && (
          <p className="text-emerald-400/60 mt-2 text-sm">Determining your dashboard...</p>
        )}
      </div>
    </div>
  );
};

export default RoleRouter;
