// src/router/RoleRouter.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const RoleRouter: React.FC = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  const [waitingForRole, setWaitingForRole] = useState(false);
  const roleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // CASE 2: User exists but role not loaded yet → wait with timeout
    if (!role) {
      if (!waitingForRole) {
        setWaitingForRole(true);
        // 1.5-second timeout for fast recovery
        roleTimeoutRef.current = setTimeout(() => {
          if (!hasRedirected.current) {
            console.warn('[RoleRouter] Role timeout - defaulting to client dashboard');
            hasRedirected.current = true;
            navigate('/client-dashboard', { replace: true });
          }
        }, 1500);
      }
      return;
    }

    // Clear timeout since role loaded
    if (roleTimeoutRef.current) {
      clearTimeout(roleTimeoutRef.current);
      roleTimeoutRef.current = null;
    }

    // CASE 3: User + Role loaded → redirect to correct dashboard
    hasRedirected.current = true;

    if (role === 'client') {
      navigate('/client-dashboard', { replace: true });
    } else if (role === 'landscaper') {
      navigate('/landscaper-dashboard', { replace: true });
    } else if (role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/client-dashboard', { replace: true });
    }
  }, [user, role, loading, navigate, waitingForRole]);

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
