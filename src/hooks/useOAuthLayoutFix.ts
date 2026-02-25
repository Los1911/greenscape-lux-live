/**
 * useOAuthLayoutFix
 * 
 * Custom hook to handle layout recalculation after OAuth redirect.
 * 
 * PROBLEM:
 * When returning from an external OAuth flow (e.g., Google Sign-In), iOS Safari
 * may not properly recalculate the viewport height, causing auth cards to appear
 * misaligned or pushed upward.
 * 
 * SOLUTION:
 * This hook forces a layout reflow on component mount and handles viewport
 * height changes that occur when the iOS Safari address bar shows/hides.
 * 
 * USAGE:
 * ```tsx
 * import { useOAuthLayoutFix } from '@/hooks/useOAuthLayoutFix';
 * 
 * function AuthComponent() {
 *   const { layoutReady, viewportHeight } = useOAuthLayoutFix();
 *   
 *   return (
 *     <div style={{ opacity: layoutReady ? 1 : 0.99 }}>
 *       {// Auth content}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useLayoutEffect, useCallback } from 'react';

interface UseOAuthLayoutFixOptions {
  /** Delay before forcing reflow (ms). Default: 50 */
  reflowDelay?: number;
  /** Whether to set CSS custom property for viewport height. Default: true */
  setCssVariable?: boolean;
  /** CSS variable name for viewport height. Default: '--vh' */
  cssVariableName?: string;
}

interface UseOAuthLayoutFixReturn {
  /** Whether the layout has been recalculated and is ready */
  layoutReady: boolean;
  /** Current viewport height in pixels */
  viewportHeight: number;
  /** Force a manual layout recalculation */
  forceReflow: () => void;
}

export function useOAuthLayoutFix(
  options: UseOAuthLayoutFixOptions = {}
): UseOAuthLayoutFixReturn {
  const {
    reflowDelay = 50,
    setCssVariable = true,
    cssVariableName = '--vh'
  } = options;

  const [layoutReady, setLayoutReady] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );

  // Force layout recalculation
  const forceReflow = useCallback(() => {
    if (typeof document === 'undefined') return;

    // Temporarily hide body to force browser to recalculate layout
    document.body.style.display = 'none';
    // Force synchronous reflow by reading offsetHeight
    void document.body.offsetHeight;
    document.body.style.display = '';
    
    // Update viewport height
    if (typeof window !== 'undefined') {
      setViewportHeight(window.innerHeight);
    }
    
    setLayoutReady(true);
  }, []);

  // Update CSS custom property for viewport height
  const updateViewportHeight = useCallback(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const vh = window.innerHeight * 0.01;
    setViewportHeight(window.innerHeight);

    if (setCssVariable) {
      document.documentElement.style.setProperty(cssVariableName, `${vh}px`);
    }
  }, [setCssVariable, cssVariableName]);

  // Force reflow on mount (handles OAuth redirect scenario)
  useLayoutEffect(() => {
    const timer = setTimeout(forceReflow, reflowDelay);
    return () => clearTimeout(timer);
  }, [forceReflow, reflowDelay]);

  // Handle viewport resize and orientation changes
  useEffect(() => {
    updateViewportHeight();

    const handleResize = () => {
      updateViewportHeight();
    };

    const handleOrientationChange = () => {
      // Delay to allow browser to complete orientation change
      setTimeout(updateViewportHeight, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Also listen for visual viewport changes (iOS Safari specific)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, [updateViewportHeight]);

  return {
    layoutReady,
    viewportHeight,
    forceReflow
  };
}

export default useOAuthLayoutFix;
