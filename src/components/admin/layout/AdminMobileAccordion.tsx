import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const STORAGE_PREFIX = 'admin_accordion_';

interface AdminMobileAccordionProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  /** Badge count shown in header */
  badgeCount?: number;
  badgeVariant?: 'default' | 'warning' | 'danger';
  /** If true, section starts expanded on mobile (overrides defaultCollapsedMobile) */
  forceExpandWhenNonZero?: boolean;
  /** Collapsed by default on mobile (<lg). Desktop always starts expanded. */
  defaultCollapsedMobile?: boolean;
  /** Subtitle / description under heading */
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function AdminMobileAccordion({
  id,
  title,
  icon: Icon,
  badgeCount,
  badgeVariant = 'default',
  forceExpandWhenNonZero = false,
  defaultCollapsedMobile = false,
  subtitle,
  children,
  className = '',
}: AdminMobileAccordionProps) {
  const getInitial = useCallback((): boolean => {
    // Check session storage first
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`${STORAGE_PREFIX}${id}`);
      if (stored !== null) return stored === 'true';
    }

    // If forceExpandWhenNonZero and there are items, expand
    if (forceExpandWhenNonZero && typeof badgeCount === 'number' && badgeCount > 0) {
      return true;
    }

    // On mobile, respect defaultCollapsedMobile
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && defaultCollapsedMobile) {
      return false;
    }

    return true;
  }, [id, badgeCount, forceExpandWhenNonZero, defaultCollapsedMobile]);

  const [expanded, setExpanded] = useState(getInitial);

  // Re-evaluate when badgeCount changes (for attention section)
  useEffect(() => {
    if (forceExpandWhenNonZero && typeof badgeCount === 'number' && badgeCount > 0) {
      setExpanded(true);
    }
  }, [badgeCount, forceExpandWhenNonZero]);

  // Persist
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`${STORAGE_PREFIX}${id}`, String(expanded));
    }
  }, [id, expanded]);

  const badgeColorMap = {
    default: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  const contentId = `accordion-content-${id}`;

  return (
    <section
      className={`w-full min-w-0 ${className}`}
      data-section-id={id}
      data-group-id={id}
    >
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-2.5 py-3 px-1 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-lg"
        aria-expanded={expanded}
        aria-controls={contentId}
      >
        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-emerald-500/60 transition-transform duration-200 shrink-0 ${
            expanded ? '' : '-rotate-90'
          }`}
        />

        {/* Icon */}
        {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />}

        {/* Title + subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-bold text-emerald-400 uppercase tracking-wide truncate">
              {title}
            </h2>
            {typeof badgeCount === 'number' && badgeCount > 0 && (
              <span
                className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border shrink-0 ${badgeColorMap[badgeVariant]}`}
              >
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-emerald-300/40 mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Collapsed summary */}
        {!expanded && (
          <span className="text-xs text-emerald-300/30 shrink-0 hidden sm:inline">
            Tap to expand
          </span>
        )}
      </button>

      {/* Content */}
      <div
        id={contentId}
        className={`transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-[100000px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'
        }`}

        aria-hidden={!expanded}
      >
        <div className="pt-2 pb-4 space-y-4">{children}</div>
      </div>
    </section>
  );
}

export default AdminMobileAccordion;
