import React from 'react';
import { Star, Award, Crown } from 'lucide-react';
import { LandscaperTier, TIER_REQUIREMENTS } from '@/types/job';

interface TierBadgeProps {
  tier: LandscaperTier;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
}

const tierConfig: Record<LandscaperTier, {
  icon: React.ReactNode;
  label: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  iconClass: string;
}> = {
  starter: {
    icon: <Star />,
    label: 'Starter',
    bgClass: 'bg-slate-800/60',
    borderClass: 'border-slate-600',
    textClass: 'text-slate-300',
    iconClass: 'text-slate-400'
  },
  pro: {
    icon: <Award />,
    label: 'Pro',
    bgClass: 'bg-emerald-900/40',
    borderClass: 'border-emerald-500/50',
    textClass: 'text-emerald-300',
    iconClass: 'text-emerald-400'
  },
  elite: {
    icon: <Crown />,
    label: 'Elite',
    bgClass: 'bg-amber-900/40',
    borderClass: 'border-amber-500/50',
    textClass: 'text-amber-300',
    iconClass: 'text-amber-400'
  }
};

const sizeConfig = {
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
    icon: 'h-3 w-3',
    gap: 'gap-1'
  },
  md: {
    padding: 'px-3 py-1',
    text: 'text-sm',
    icon: 'h-4 w-4',
    gap: 'gap-1.5'
  },
  lg: {
    padding: 'px-4 py-2',
    text: 'text-base',
    icon: 'h-5 w-5',
    gap: 'gap-2'
  }
};

export function TierBadge({ 
  tier, 
  size = 'md', 
  showDescription = false,
  className = '' 
}: TierBadgeProps) {
  const config = tierConfig[tier];
  const sizeStyles = sizeConfig[size];
  const requirements = TIER_REQUIREMENTS[tier];

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div 
        className={`
          inline-flex items-center ${sizeStyles.gap} ${sizeStyles.padding}
          rounded-full border ${config.bgClass} ${config.borderClass}
        `}
      >
        <span className={`${config.iconClass} ${sizeStyles.icon}`}>
          {React.cloneElement(config.icon as React.ReactElement, { 
            className: sizeStyles.icon 
          })}
        </span>
        <span className={`font-medium ${config.textClass} ${sizeStyles.text}`}>
          {config.label}
        </span>
      </div>
      
      {showDescription && (
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          {requirements.description}
        </p>
      )}
    </div>
  );
}

export default TierBadge;
export { tierConfig, sizeConfig };
