import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  className?: string;
  fallbackPath?: string;
}

// Universal fallback route for the entire app
const UNIVERSAL_FALLBACK = '/';

// Context-aware fallback routes based on current page
const CONTEXT_FALLBACKS: Record<string, string> = {
  '/client/profile': '/client-dashboard',
  '/client/jobs': '/client-dashboard',
  '/client/payment-history': '/client-dashboard',
  '/landscaper/profile': '/landscaper-dashboard',
  '/landscaper-profile': '/landscaper-dashboard',
  '/landscaper/jobs': '/landscaper-dashboard',
  '/landscaper-jobs': '/landscaper-dashboard',
  '/landscaper/earnings': '/landscaper-dashboard',
  '/admin/profile': '/admin-dashboard',
  '/admin/notifications': '/admin-dashboard',
  '/thank-you': '/get-quote',
  '/reset-password': '/portal-login',
  '/forgot-password': '/portal-login',
};

export default function BackButton({ className = '', fallbackPath }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Priority 1: Use explicit fallbackPath if provided
    if (fallbackPath) {
      navigate(fallbackPath);
      return;
    }

    // Priority 2: Use browser history if available
    // Check if we have meaningful history (length > 2 means user navigated within app)
    // iOS Safari and modern browsers support this reliably
    const hasHistory = window.history.length > 2;
    
    if (hasHistory) {
      // Use browser back - this follows the user's actual navigation path
      navigate(-1);
      return;
    }

    // Priority 3: Use context-aware fallback based on current page
    const currentPath = location.pathname;
    const contextFallback = CONTEXT_FALLBACKS[currentPath];
    
    if (contextFallback) {
      navigate(contextFallback);
      return;
    }

    // Priority 4: Universal fallback to home page
    navigate(UNIVERSAL_FALLBACK);
  };

  return (
    <Button
      onClick={handleBack}
      variant="ghost"
      size="sm"
      className={`
        flex items-center gap-2 text-emerald-400 hover:text-emerald-300 
        hover:bg-emerald-500/10 border border-emerald-500/30 
        hover:border-emerald-400/50 transition-all duration-300
        backdrop-blur-sm bg-gray-900/20 shadow-lg shadow-emerald-500/10
        hover:shadow-emerald-400/20 ${className}
      `}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="font-medium">Back</span>
    </Button>
  );
}
