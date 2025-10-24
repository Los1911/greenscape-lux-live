import React, { useState, useEffect } from 'react';
import { SetupWizard } from './SetupWizard';
import { EnvironmentValidator, APIKeyValidation } from '@/utils/environmentValidator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Settings } from 'lucide-react';
import { environmentGuard } from '@/lib/environmentGuard';

interface EnvironmentGateProps {
  children: React.ReactNode;
  forceSetup?: boolean;
}

export const EnvironmentGate: React.FC<EnvironmentGateProps> = ({ 
  children, 
  forceSetup = false 
}) => {
  const [validation, setValidation] = useState<APIKeyValidation | null>(null);
  const [showSetup, setShowSetup] = useState(forceSetup);
  const [bypassSetup, setBypassSetup] = useState(false);

  // Detect production environment - deploypad.app IS production
  const isProduction = typeof window !== 'undefined' && 
    (window.location.hostname !== 'localhost' && 
     !window.location.hostname.includes('127.0.0.1'));

  // Determine if current route is admin
  const isAdminRoute = typeof window !== 'undefined' && 
    window.location.pathname.includes('/admin');

  useEffect(() => {
    // Use route-aware environment validation
    environmentGuard.initializeForRoute(window.location.pathname)
      .then((guardValidation) => {
        // Convert to legacy format for compatibility
        const result = EnvironmentValidator.validateAll();
        setValidation(result);
        
        // Only show setup for admin routes with critical issues
        if (isAdminRoute && !guardValidation.allValid && !bypassSetup) {
          const hasSupabaseIssues = guardValidation.errors.some(error => 
            error.includes('Supabase URL') || error.includes('Supabase Anon Key')
          );
          
          if (hasSupabaseIssues && !isProduction) {
            setShowSetup(true);
          }
        } else {
          // For non-admin routes, never show setup wizard
          setShowSetup(false);
          setBypassSetup(true);
        }
      })
      .catch((error) => {
        console.warn('EnvironmentGate: Validation failed but continuing:', error);
        // Even on error, don't block non-admin routes
        if (!isAdminRoute) {
          setBypassSetup(true);
          setShowSetup(false);
        }
      });
  }, [bypassSetup, forceSetup, isProduction, isAdminRoute]);

  const handleSetupComplete = () => {
    setShowSetup(false);
    setValidation(EnvironmentValidator.validateAll());
  };

  const handleBypassSetup = () => {
    setBypassSetup(true);
    setShowSetup(false);
  };

  // Only show setup wizard for admin routes in development with critical issues
  if (showSetup && !isProduction && isAdminRoute) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  // Always render children - no blocking for client/landscaper routes
  return (
    <div>
      {children}
    </div>
  );
};