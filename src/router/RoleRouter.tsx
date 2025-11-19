// src/router/RoleRouter.tsx
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const RoleRouter: React.FC = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

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

    // CASE 2: User exists but role not loaded yet → wait
    if (!role) return;

    // CASE 3: User + Role loaded → redirect to correct dashboard
    hasRedirected.current = true;

    if (role === 'client') {
      navigate('/client-dashboard', { replace: true });
    } else if (role === 'landscaper') {
      navigate('/landscaper-dashboard', { replace: true });
    } else if (role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      // Unknown role → back to login
      navigate('/portal-login', { replace: true });
    }
  }, [user, role, loading, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-emerald-400 mt-4 text-lg">Loading...</p>
      </div>
    </div>
  );
};

export default RoleRouter;
