import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';

interface CollapsibleDashboardCardProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  /**
   * Force default open on mobile as well (overrides responsive behavior)
   */
  forceDefaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  /**
   * When true, the wrapper has no background/border styling.
   * Use this when the child component already has its own card styling.
   */
  transparent?: boolean;
  /**
   * Optional summary content to show in the header when collapsed.
   * Useful for showing key metrics without expanding the full card.
   */
  collapsedSummary?: React.ReactNode;
  /**
   * When true, the card cannot be collapsed (for critical action cards).
   * Examples: Join Waitlist, Save actions, Error states
   */
  nonCollapsible?: boolean;
  /**
   * Optional badge/status indicator to show in the header
   */
  headerBadge?: React.ReactNode;
  /**
   * Optional action button to show in the header (always visible)
   */
  headerAction?: React.ReactNode;
  /**
   * Test ID for automated testing
   */
  testId?: string;
}

/**
 * CollapsibleDashboardCard - A reusable wrapper for dashboard cards
 * 
 * Behavior:
 * - Default COLLAPSED on mobile (< 768px) unless forceDefaultOpen is true
 * - Default EXPANDED on desktop (>= 768px)
 * - Smooth animation on toggle
 * - Keyboard accessible
 * - Optional collapsed summary for quick glance info
 * - Can be made non-collapsible for critical action cards
 * 
 * Usage:
 * - Informational cards: collapsible (default)
 * - Critical action cards: nonCollapsible={true}
 */
export function CollapsibleDashboardCard({
  title,
  icon,
  defaultOpen,
  forceDefaultOpen = false,
  children,
  className = '',
  transparent = false,
  collapsedSummary,
  nonCollapsible = false,
  headerBadge,
  headerAction,
  testId,
}: CollapsibleDashboardCardProps) {
  const { isMobile } = useMobile();
  
  // Determine initial state based on screen size if defaultOpen not specified
  const getInitialState = useCallback(() => {
    // Non-collapsible cards are always open
    if (nonCollapsible) {
      return true;
    }
    if (forceDefaultOpen) {
      return true;
    }
    if (typeof defaultOpen === 'boolean') {
      return defaultOpen;
    }
    // Default: collapsed on mobile, expanded on desktop
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true; // SSR fallback
  }, [defaultOpen, forceDefaultOpen, nonCollapsible]);

  const [isOpen, setIsOpen] = useState(getInitialState);
  const [hasUserToggled, setHasUserToggled] = useState(false);

  // Update state when nonCollapsible changes
  useEffect(() => {
    if (nonCollapsible) {
      setIsOpen(true);
    }
  }, [nonCollapsible]);

  // Handle responsive behavior only if user hasn't manually toggled
  useEffect(() => {
    if (typeof defaultOpen === 'boolean' || forceDefaultOpen || nonCollapsible || hasUserToggled) return;

    const handleResize = () => {
      // Auto-adjust based on screen size only if user hasn't interacted
      if (!hasUserToggled) {
        setIsOpen(window.innerWidth >= 768);
      }
    };

    // Debounce resize handler
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [defaultOpen, forceDefaultOpen, nonCollapsible, hasUserToggled]);

  const handleToggle = () => {
    if (nonCollapsible) return;
    setHasUserToggled(true);
    setIsOpen((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (nonCollapsible) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  const containerClasses = transparent
    ? `overflow-hidden ${className}`
    : `bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl overflow-hidden ${className}`;

  const headerClasses = transparent
    ? `w-full flex items-center justify-between p-4 ${nonCollapsible ? '' : 'cursor-pointer hover:bg-emerald-500/5'} transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl mb-2`
    : `w-full flex items-center justify-between p-4 sm:p-6 ${nonCollapsible ? '' : 'cursor-pointer hover:bg-emerald-500/5'} transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset`;

  const contentId = `collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={containerClasses} data-testid={testId}>
      {/* Header - Always visible */}
      {nonCollapsible ? (
        // Non-collapsible: render as div, not button
        <div className={headerClasses}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              {icon && (
                <span className="text-emerald-400 flex-shrink-0">
                  {icon}
                </span>
              )}
              <h3 className="text-lg sm:text-xl font-bold text-emerald-300 text-left">
                {title}
              </h3>
              {headerBadge && (
                <span className="flex-shrink-0">{headerBadge}</span>
              )}
            </div>
          </div>
          {headerAction && (
            <div className="flex-shrink-0 ml-3">{headerAction}</div>
          )}
        </div>
      ) : (
        // Collapsible: render as button for accessibility
        <button
          type="button"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={headerClasses}
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              {icon && (
                <span className="text-emerald-400 flex-shrink-0">
                  {icon}
                </span>
              )}
              <h3 className="text-lg sm:text-xl font-bold text-emerald-300 text-left">
                {title}
              </h3>
              {headerBadge && (
                <span className="flex-shrink-0">{headerBadge}</span>
              )}
            </div>
            
            {/* Collapsed Summary - Shows when collapsed and summary provided */}
            {!isOpen && collapsedSummary && (
              <div className="mt-2 text-sm text-emerald-300/70 text-left pl-0 sm:pl-8">
                {collapsedSummary}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {headerAction && (
              <div onClick={(e) => e.stopPropagation()}>{headerAction}</div>
            )}
            <ChevronDown
              className={`w-5 h-5 text-emerald-400 transition-transform duration-300 ${
                isOpen ? 'rotate-180' : 'rotate-0'
              }`}
              aria-hidden="true"
            />
          </div>
        </button>
      )}

      {/* Content - Collapsible or always visible */}
      <div
        id={contentId}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!isOpen}
      >
        <div className={transparent ? '' : 'px-4 sm:px-6 pb-4 sm:pb-6'}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default CollapsibleDashboardCard;
