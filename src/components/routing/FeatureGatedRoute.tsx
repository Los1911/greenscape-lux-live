/**
 * Feature Gated Route Component
 * 
 * Wraps routes that should only be accessible when a feature flag is enabled.
 * When disabled, redirects to a fallback route (default: /admin-dashboard).
 * 
 * SAFETY:
 * - Never crashes if flag is missing
 * - Never renders partial UI
 * - Always provides clear redirect
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { isFeatureEnabled, FeatureFlags } from '@/lib/featureFlags';

interface FeatureGatedRouteProps {
  /** The feature flag to check */
  featureFlag: keyof FeatureFlags;
  
  /** The component to render when feature is enabled */
  children: React.ReactNode;
  
  /** Where to redirect when feature is disabled (default: /admin-dashboard) */
  fallbackPath?: string;
  
  /** Whether to show 404 instead of redirect (default: false) */
  show404?: boolean;
}

export const FeatureGatedRoute: React.FC<FeatureGatedRouteProps> = ({
  featureFlag,
  children,
  fallbackPath = '/admin-dashboard',
  show404 = false,
}) => {
  // Check if feature is enabled
  const isEnabled = isFeatureEnabled(featureFlag);
  
  // Log access attempts for debugging
  if (!isEnabled) {
    console.log(`[FeatureGatedRoute] Access denied - ${featureFlag} is disabled`);
  }
  
  // If feature is disabled, redirect or show 404
  if (!isEnabled) {
    if (show404) {
      // Navigate to 404 page
      return <Navigate to="/404" replace />;
    }
    // Redirect to fallback (usually admin dashboard)
    return <Navigate to={fallbackPath} replace />;
  }
  
  // Feature is enabled - render children
  return <>{children}</>;
};

/**
 * Higher-order component version for class components or complex cases
 */
export const withFeatureGate = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  featureFlag: keyof FeatureFlags,
  fallbackPath: string = '/admin-dashboard'
): React.FC<P> => {
  const FeatureGatedComponent: React.FC<P> = (props) => {
    const isEnabled = isFeatureEnabled(featureFlag);
    
    if (!isEnabled) {
      return <Navigate to={fallbackPath} replace />;
    }
    
    return <WrappedComponent {...props} />;
  };
  
  FeatureGatedComponent.displayName = `FeatureGated(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return FeatureGatedComponent;
};

export default FeatureGatedRoute;
