import React, { useState } from 'react';
import { ChevronDown, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface AdminCompactFiltersProps {
  filters: FilterConfig[];
  /**
   * When true, shows a clear all button
   */
  showClearAll?: boolean;
  onClearAll?: () => void;
  /**
   * Additional class names
   */
  className?: string;
}

/**
 * AdminCompactFilters - Responsive filter controls
 * 
 * Features:
 * - Dropdown filters on mobile
 * - Compact filter pills on desktop
 * - Never wraps into multiple lines
 * - Clear all functionality
 * - Accessible
 */
export function AdminCompactFilters({
  filters,
  showClearAll = true,
  onClearAll,
  className = '',
}: AdminCompactFiltersProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const hasActiveFilters = filters.some(f => f.value !== '' && f.value !== 'all');

  const handleClearAll = () => {
    onClearAll?.();
    setMobileMenuOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Mobile: Single dropdown trigger */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full justify-between border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="px-1.5 py-0.5 text-xs bg-emerald-500/30 rounded-full">
                {filters.filter(f => f.value !== '' && f.value !== 'all').length}
              </span>
            )}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
        </Button>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-black/95 backdrop-blur border border-emerald-500/30 rounded-xl z-50 space-y-4">
            {filters.map((filter) => (
              <div key={filter.id} className="space-y-2">
                <label className="text-sm font-medium text-emerald-300/70">
                  {filter.label}
                </label>
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {filter.options.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            
            {showClearAll && hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Desktop: Inline filter pills */}
      <div className="hidden lg:flex items-center gap-2 flex-nowrap overflow-x-auto pb-1">
        {filters.map((filter) => (
          <div key={filter.id} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === filter.id ? null : filter.id)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                border transition-all
                ${filter.value && filter.value !== 'all'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-black/40 border-emerald-500/20 text-emerald-300/70 hover:border-emerald-500/40'
                }
              `}
            >
              <span className="whitespace-nowrap">{filter.label}</span>
              {filter.value && filter.value !== 'all' && (
                <span className="font-medium text-emerald-200">
                  : {filter.options.find(o => o.value === filter.value)?.label || filter.value}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === filter.id ? 'rotate-180' : ''}`} />
            </button>

            {/* Desktop dropdown */}
            {openDropdown === filter.id && (
              <div className="absolute top-full left-0 mt-1 min-w-[180px] bg-black/95 backdrop-blur border border-emerald-500/30 rounded-lg z-50 py-1 shadow-xl">
                {filter.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      filter.onChange(option.value);
                      setOpenDropdown(null);
                    }}
                    className={`
                      w-full text-left px-3 py-2 text-sm transition-colors
                      ${filter.value === option.value
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'text-emerald-300/70 hover:bg-emerald-500/10 hover:text-emerald-300'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Clear all button */}
        {showClearAll && hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="flex-shrink-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Click outside to close */}
      {(mobileMenuOpen || openDropdown) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setMobileMenuOpen(false);
            setOpenDropdown(null);
          }}
        />
      )}
    </div>
  );
}

export default AdminCompactFilters;
