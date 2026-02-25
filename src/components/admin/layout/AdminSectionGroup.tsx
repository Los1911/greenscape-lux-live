import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react';

interface AdminSectionGroupProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  description?: string;
  children: React.ReactNode;
  /**
   * Default expanded state - if not provided, uses responsive defaults
   */
  defaultExpanded?: boolean;
  /**
   * When true, group cannot be collapsed
   */
  nonCollapsible?: boolean;
  /**
   * Badge count to show in header
   */
  badgeCount?: number;
  badgeColor?: 'emerald' | 'yellow' | 'red' | 'blue';
  /**
   * Additional class names
   */
  className?: string;
}

// Session storage key prefix for groups
const GROUP_STORAGE_KEY_PREFIX = 'admin_group_';

/**
 * AdminSectionGroup - Groups related admin sections with visual separation
 * 
 * Groups:
 * - Operations: Jobs, Photos, Remediation, Matching, Routes
 * - Growth & Quality: Tiers, Badges, Goals, Performance
 * - Coverage & Expansion: Service Areas, Geofences, Waitlist
 * - System & Control: Approvals, Environment, System
 * 
 * Features:
 * - Optional collapse at group level
 * - Session persistence for collapse state
 * - Visual separation between groups
 * - Responsive behavior
 */
export function AdminSectionGroup({
  id,
  title,
  icon: Icon,
  description,
  children,
  defaultExpanded,
  nonCollapsible = false,
  badgeCount,
  badgeColor = 'emerald',
  className = '',
}: AdminSectionGroupProps) {
  
  const getInitialState = useCallback((): boolean => {
    if (nonCollapsible) return true;
    
    // Check session storage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`${GROUP_STORAGE_KEY_PREFIX}${id}`);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    
    // Use provided default or always expanded for groups
    if (typeof defaultExpanded === 'boolean') {
      return defaultExpanded;
    }
    
    return true; // Groups default to expanded
  }, [id, nonCollapsible, defaultExpanded]);

  const [isExpanded, setIsExpanded] = useState(getInitialState);

  // Persist state
  useEffect(() => {
    if (nonCollapsible) return;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`${GROUP_STORAGE_KEY_PREFIX}${id}`, String(isExpanded));
    }
  }, [id, isExpanded, nonCollapsible]);

  const handleToggle = () => {
    if (nonCollapsible) return;
    setIsExpanded(prev => !prev);
  };

  const badgeColorClasses = {
    emerald: 'bg-emerald-500/30 text-emerald-300',
    yellow: 'bg-yellow-500/30 text-yellow-300',
    red: 'bg-red-500/30 text-red-300',
    blue: 'bg-blue-500/30 text-blue-300',
  };

  const contentId = `admin-group-${id}`;

  return (
    <div className={`space-y-4 ${className}`} data-group-id={id}>
      {/* Group Header */}
      <div 
        className={`
          flex items-center gap-3 pb-2 border-b border-emerald-500/20
          ${!nonCollapsible ? 'cursor-pointer' : ''}
        `}
        onClick={!nonCollapsible ? handleToggle : undefined}
        role={!nonCollapsible ? 'button' : undefined}
        tabIndex={!nonCollapsible ? 0 : undefined}
        onKeyDown={!nonCollapsible ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        } : undefined}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        {/* Collapse indicator */}
        {!nonCollapsible && (
          <span className="text-emerald-500/60">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </span>
        )}
        
        {/* Icon */}
        {Icon && (
          <Icon className="w-5 h-5 text-emerald-500" />
        )}
        
        {/* Title and description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-emerald-400 uppercase tracking-wide">
              {title}
            </h2>
            {typeof badgeCount === 'number' && badgeCount > 0 && (
              <span className={`
                px-2 py-0.5 text-xs font-medium rounded-full
                ${badgeColorClasses[badgeColor]}
              `}>
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-emerald-300/50 mt-0.5">
              {description}
            </p>
          )}
        </div>
        
        {/* Collapsed summary */}
        {!isExpanded && (
          <span className="text-sm text-emerald-300/40">
            {React.Children.count(children)} sections
          </span>
        )}
      </div>

      {/* Group Content */}
      <div
        id={contentId}
        className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${isExpanded ? 'max-h-[50000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
        aria-hidden={!isExpanded}
      >
        <div className="grid grid-cols-1 gap-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AdminSectionGroup;
