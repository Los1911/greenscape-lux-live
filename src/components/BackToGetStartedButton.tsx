import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardRoute, isPublicRoute } from '@/utils/navigationHelpers';

interface BackToGetStartedButtonProps {
  className?: string;
  fallbackPath?: string;
}

export default function BackToGetStartedButton({ 
  className = '', 
  fallbackPath = '/get-started' 
}: BackToGetStartedButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useAuth();
  
  const isAuthenticated = !!user;

  const handleBack = () => {
    // For authenticated users, never go to public routes like /get-started
    if (isAuthenticated) {
      // If fallbackPath is a public route, go to dashboard instead
      if (fallbackPath && isPublicRoute(fallbackPath)) {
        navigate(getDashboardRoute(role));
      } else if (fallbackPath) {
        navigate(fallbackPath);
      } else {
        navigate(getDashboardRoute(role));
      }
      return;
    }
    
    // For unauthenticated users, use the fallback path
    if (fallbackPath) {
      navigate(fallbackPath);
    } else {
      navigate('/get-started');
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-full 
        bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 
        hover:from-emerald-500 hover:via-emerald-400 hover:to-emerald-500 
        text-white font-semibold transition-all duration-300 
        shadow-[0_0_20px_rgba(16,185,129,0.4)] 
        hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] 
        transform hover:scale-105 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );
}
