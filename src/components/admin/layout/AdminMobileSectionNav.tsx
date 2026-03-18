import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SectionOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface AdminMobileSectionNavProps {
  sections: SectionOption[];
  activeSection: string;
  onSectionChange: (id: string) => void;
}

/**
 * Mobile-only section navigator.
 * Renders as a dropdown on mobile (<lg), hidden on desktop (lg+).
 * Scrolls to the selected section's data-section-id.
 */
export function AdminMobileSectionNav({
  sections,
  activeSection,
  onSectionChange,
}: AdminMobileSectionNavProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const active = sections.find((s) => s.id === activeSection) || sections[0];
  const ActiveIcon = active?.icon;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (id: string) => {
    setOpen(false);
    onSectionChange(id);

    // Scroll to section
    requestAnimationFrame(() => {
      const el =
        document.querySelector(`[data-section-id="${id}"]`) ||
        document.querySelector(`[data-group-id="${id}"]`) ||
        document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  return (
    <div ref={containerRef} className="relative lg:hidden">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-emerald-500/20 bg-black/50 backdrop-blur text-left transition-colors hover:border-emerald-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {ActiveIcon && <ActiveIcon className="w-4 h-4 text-emerald-400 shrink-0" />}
          <span className="text-sm font-medium text-emerald-300 truncate">
            {active?.label || 'Select Section'}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-emerald-500/60 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-emerald-500/20 bg-[#0B0F14] backdrop-blur-lg shadow-xl max-h-64 overflow-y-auto">

            {sections.map((section) => {
              const SIcon = section.icon;
              const isActive = section.id === activeSection;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSelect(section.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 font-medium'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <SIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminMobileSectionNav;
