// Security provider component for React app
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SecurityMiddleware } from '../middleware/securityMiddleware';
import { validateEnvironment } from '../utils/securityHardening';

interface SecurityContextType {
  middleware: SecurityMiddleware;
  isSecure: boolean;
  warnings: string[];
  enforceCSP: () => void;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

interface SecurityProviderProps {
  children: React.ReactNode;
  enableRateLimit?: boolean;
  enableCSP?: boolean;
}

export function SecurityProvider({ 
  children, 
  enableRateLimit = true, 
  enableCSP = true 
}: SecurityProviderProps) {
  const [middleware] = useState(() => new SecurityMiddleware({
    enableRateLimit,
    enableCSP,
    enableXSSProtection: true
  }));
  
  const [securityStatus, setSecurityStatus] = useState({
    isSecure: true,
    warnings: [] as string[]
  });

  useEffect(() => {
    // Validate environment security
    const status = validateEnvironment();
    setSecurityStatus(status);

    // Log security warnings in development
    if (status.warnings.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn('Security warnings:', status.warnings);
    }
  }, []);

  const enforceCSP = () => {
    // Client-side CSP enforcement for additional security
    if (typeof document !== 'undefined') {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; connect-src 'self' https://mwvcbedvnimabfwubazz.supabase.co https://api.stripe.com https://maps.googleapis.com;";
      document.head.appendChild(meta);
    }
  };

  const contextValue: SecurityContextType = {
    middleware,
    isSecure: securityStatus.isSecure,
    warnings: securityStatus.warnings,
    enforceCSP
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}

// Hook for secure API requests
export function useSecureAPI() {
  const { middleware } = useSecurity();
  
  return {
    secureRequest: middleware.createSecureFetch(),
    checkRateLimit: (id: string, type: 'auth' | 'api' | 'upload' = 'api') => 
      middleware.checkRateLimit(id, type),
    validateData: (data: any) => middleware.validateRequest(data)
  };
}