import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** Footer content - will be sticky at bottom */
  footer?: React.ReactNode;
  /** Additional class for the content area */
  contentClassName?: string;
  /** Whether to show the default close button in header */
  showCloseButton?: boolean;
  /** Custom header content (replaces default title/subtitle) */
  customHeader?: React.ReactNode;
  /** Height of the sheet - 'full' | 'auto' | 'half' */
  height?: 'full' | 'auto' | 'half';
}

/**
 * MobileBottomSheet - A mobile-optimized bottom sheet component
 * 
 * Features:
 * - Slides up from bottom on mobile
 * - Locks background scroll when open
 * - Internal content scrolls independently
 * - Sticky header with visible Close (X) button
 * - Sticky footer (no bottom nav padding - bottom nav removed)
 * - Falls back to centered modal on desktop
 */
export function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  contentClassName = '',
  showCloseButton = true,
  customHeader,
  height = 'full',
}: MobileBottomSheetProps) {
  const { isMobile } = useMobile();
  const contentRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;
      const scrollY = window.scrollY;

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = originalWidth;
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  // Height classes for mobile
  const getHeightClass = () => {
    if (!isMobile) return 'max-h-[90vh]';
    switch (height) {
      case 'full':
        return 'h-[calc(100vh-env(safe-area-inset-top))]';
      case 'half':
        return 'max-h-[50vh]';
      case 'auto':
      default:
        return 'max-h-[85vh]';
    }
  };

  // Mobile bottom sheet
  if (isMobile) {
    return (
      <div 
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        <div
          ref={sheetRef}
          className={`fixed bottom-0 left-0 right-0 ${getHeightClass()} bg-gradient-to-b from-gray-900 to-black border-t border-emerald-500/30 rounded-t-3xl shadow-2xl shadow-emerald-500/20 flex flex-col animate-in slide-in-from-bottom duration-300`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle indicator */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-emerald-500/40 rounded-full" />
          </div>

          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-900/95 px-4 pb-4 border-b border-emerald-500/20">
            {customHeader || (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {icon && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 id="sheet-title" className="text-lg font-bold text-white truncate">
                      {title}
                    </h2>
                    {subtitle && (
                      <p className="text-sm text-gray-400 truncate">{subtitle}</p>
                    )}
                  </div>
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2.5 rounded-xl bg-gray-800/80 hover:bg-emerald-600/30 text-gray-400 hover:text-emerald-400 transition-all duration-200 border border-emerald-500/20 flex-shrink-0 ml-3"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Scrollable Content Area - No bottom nav padding needed */}
          <div
            ref={contentRef}
            className={`flex-1 overflow-y-auto overscroll-contain px-4 py-4 ${contentClassName}`}
            style={{
              // Safe area padding only - no bottom nav to account for
              paddingBottom: footer ? '1rem' : 'calc(1rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            {children}
          </div>

          {/* Sticky Footer - No bottom nav padding needed */}
          {footer && (
            <div 
              className="sticky bottom-0 bg-gradient-to-t from-gray-900 via-gray-900 to-gray-900/95 px-4 pt-3 border-t border-emerald-500/20"
              style={{
                // Safe area padding only - no bottom nav to account for
                paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop modal
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
    >
      <div
        ref={sheetRef}
        className={`relative w-full max-w-2xl ${getHeightClass()} bg-gradient-to-b from-gray-900 to-black border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/20 flex flex-col animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-gray-900 to-gray-900/95 px-6 py-5 border-b border-emerald-500/20 rounded-t-2xl">
          {customHeader || (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {icon && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                    {icon}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 id="sheet-title" className="text-xl font-bold text-white">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-sm text-gray-400">{subtitle}</p>
                  )}
                </div>
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-xl bg-gray-800/80 hover:bg-emerald-600/30 text-gray-400 hover:text-emerald-400 transition-all duration-200 border border-emerald-500/20 flex-shrink-0 ml-4"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div
          ref={contentRef}
          className={`flex-1 overflow-y-auto px-6 py-5 ${contentClassName}`}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="sticky bottom-0 bg-gradient-to-t from-gray-900 to-gray-900/95 px-6 py-4 border-t border-emerald-500/20 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileBottomSheet;
