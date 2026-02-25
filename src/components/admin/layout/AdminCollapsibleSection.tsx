import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface AdminCollapsibleSectionProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  /**
   * Summary stats to show in header (visible when collapsed)
   */
  summaryStats?: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
  /**
   * Badge count to show next to title
   */
  badgeCount?: number;
  badgeColor?: 'emerald' | 'yellow' | 'red' | 'blue';
  /**
   * When true, section cannot be collapsed
   */
  nonCollapsible?: boolean;
  /**
   * Default state - if not provided, uses responsive defaults
   */
  defaultExpanded?: boolean;
  /**
   * Additional class names for the container
   */
  className?: string;
  /**
   * Header action button (always visible)
   */
  headerAction?: React.ReactNode;
}

// Session storage key prefix
const STORAGE_KEY_PREFIX = 'admin_section_';

/**
 * AdminCollapsibleSection - Collapsible section with session persistence
 * 
 * Features:
 * - Persists collapse state per session
 * - Default expanded on desktop, collapsed on mobile
 * - Summary stats visible when collapsed
 * - Badge count for notifications
 * - Keyboard accessible
 * - Smooth animations
 */
export function AdminCollapsibleSection({
  id,
  title,
  icon: Icon,
  children,
  summaryStats,
  badgeCount,
  badgeColor = 'emerald',
  nonCollapsible = false,
  defaultExpanded,
  className = '',
  headerAction,
}: AdminCollapsibleSectionProps) {
  
  // Get initial state from session storage or responsive default
  const getInitialState = useCallback((): boolean => {
    if (nonCollapsible) return true;
    
    // Check session storage first
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    
    // Use provided default or responsive default
    if (typeof defaultExpanded === 'boolean') {
      return defaultExpanded;
    }
    
    // Responsive default: expanded on desktop (>= 1024px), collapsed on mobile/tablet
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    
    return true; // SSR fallback
  }, [id, nonCollapsible, defaultExpanded]);

  const [isExpanded, setIsExpanded] = useState(getInitialState);

  // Persist state to session storage
  useEffect(() => {
    if (nonCollapsible) return;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, String(isExpanded));
    }
  }, [id, isExpanded, nonCollapsible]);

  const handleToggle = () => {
    if (nonCollapsible) return;
    setIsExpanded(prev => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (nonCollapsible) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  const badgeColorClasses = {
    emerald: 'bg-emerald-500/30 text-emerald-300',
    yellow: 'bg-yellow-500/30 text-yellow-300',
    red: 'bg-red-500/30 text-red-300',
    blue: 'bg-blue-500/30 text-blue-300',
  };

  const contentId = `admin-section-${id}`;

  return (
    <div 
      className={`
        bg-black/60 backdrop-blur border border-emerald-500/25 rounded-xl
        overflow-hidden transition-all duration-200
        ${className}
      `}
      data-section-id={id}
    >
      {/* Header */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={nonCollapsible}
        className={`
          w-full flex items-center justify-between
          px-4 py-3 sm:px-5 sm:py-4
          ${nonCollapsible ? 'cursor-default' : 'cursor-pointer hover:bg-emerald-500/5'}
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset
        `}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        {/* Left side: Icon, Title, Badge */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Expand/Collapse indicator */}
          {!nonCollapsible && (
            <span className="text-emerald-400 flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
          
          {/* Section icon */}
          {Icon && (
            <Icon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          )}
          
          {/* Title */}
          <h3 className="text-base sm:text-lg font-semibold text-emerald-300 truncate">
            {title}
          </h3>
          
          {/* Badge count */}
          {typeof badgeCount === 'number' && badgeCount > 0 && (
            <span className={`
              px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0
              ${badgeColorClasses[badgeColor]}
            `}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
          
          {/* Summary stats (visible when collapsed) */}
          {!isExpanded && summaryStats && summaryStats.length > 0 && (
            <div className="hidden sm:flex items-center gap-4 ml-4 text-sm">
              {summaryStats.slice(0, 3).map((stat, index) => (
                <span key={index} className="flex items-center gap-1.5">
                  <span className="text-emerald-300/50">{stat.label}:</span>
                  <span className={stat.color || 'text-emerald-300'}>
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Right side: Header action */}
        {headerAction && (
          <div 
            className="flex-shrink-0 ml-3"
            onClick={(e) => e.stopPropagation()}
          >
            {headerAction}
          </div>
        )}
      </button>

      {/* Content */}
      <div
        id={contentId}
        className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
        aria-hidden={!isExpanded}
      >
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-emerald-500/10">
          <div className="pt-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminCollapsibleSection;
