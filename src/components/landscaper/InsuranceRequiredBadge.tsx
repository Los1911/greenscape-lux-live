import React from 'react';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INSURANCE_REQUIRED_TOOLTIP } from '@/lib/insuranceRequirements';

interface InsuranceRequiredBadgeProps {
  variant?: 'badge' | 'icon' | 'banner';
  className?: string;
  showTooltip?: boolean;
}

/**
 * Badge/icon to indicate a job requires insurance verification
 */
export function InsuranceRequiredBadge({ 
  variant = 'badge', 
  className = '',
  showTooltip = true 
}: InsuranceRequiredBadgeProps) {
  const content = (
    <>
      {variant === 'badge' && (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30 ${className}`}>
          <Shield className="w-3.5 h-3.5" />
          Insurance Required
        </span>
      )}
      {variant === 'icon' && (
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 ${className}`}>
          <Lock className="w-3.5 h-3.5" />
        </span>
      )}
    </>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-gray-900 border-amber-500/30 text-amber-200">
          <p className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {INSURANCE_REQUIRED_TOOLTIP}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface InsuranceRequiredBannerProps {
  className?: string;
  onUploadClick?: () => void;
}

/**
 * Banner shown when a landscaper tries to view/accept insurance-required jobs without verification
 */
export function InsuranceRequiredBanner({ className = '', onUploadClick }: InsuranceRequiredBannerProps) {
  return (
    <div className={`p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-amber-300 font-semibold mb-1">Insurance Verification Required</h4>
          <p className="text-amber-200/70 text-sm mb-3">
            Some premium jobs (Tree & Property Care) require verified insurance. 
            Upload your insurance documents to unlock these high-value opportunities.
          </p>
          {onUploadClick && (
            <button
              onClick={onUploadClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm transition-all"
            >
              <Shield className="w-4 h-4" />
              Upload Insurance Documents
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface LockedJobOverlayProps {
  className?: string;
}

/**
 * Overlay for job cards that are locked due to insurance requirements
 */
export function LockedJobOverlay({ className = '' }: LockedJobOverlayProps) {
  return (
    <div className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center z-10 ${className}`}>
      <div className="text-center p-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-amber-300 font-medium text-sm">Insurance Required</p>
        <p className="text-amber-200/60 text-xs mt-1">Verify insurance to unlock</p>
      </div>
    </div>
  );
}

interface InsuranceStatusIndicatorProps {
  isVerified: boolean;
  className?: string;
}

/**
 * Small indicator showing landscaper's insurance status
 */
export function InsuranceStatusIndicator({ isVerified, className = '' }: InsuranceStatusIndicatorProps) {
  if (isVerified) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/20 text-green-300 text-xs font-medium ${className}`}>
        <Shield className="w-3 h-3" />
        Insured
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-500/20 text-gray-400 text-xs font-medium ${className}`}>
      <AlertTriangle className="w-3 h-3" />
      Not Verified
    </span>
  );
}
