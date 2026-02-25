/**
 * BadgeCard Component
 * Displays a single badge with progress or earned status
 */

import React from 'react';
import { BadgeWithProgress, BADGE_CATEGORIES } from '@/types/job';
import { BadgeIcon } from './BadgeIcon';
import { getBadgeColor, getEarnedBadgeColor } from '@/utils/badgeEvaluator';
import { Check, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface BadgeCardProps {
  badge: BadgeWithProgress;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  onClick?: () => void;
}

export function BadgeCard({ badge, size = 'md', showProgress = true, onClick }: BadgeCardProps) {
  const colors = badge.earned ? getEarnedBadgeColor(badge.category) : getBadgeColor(badge.category);
  const categoryInfo = BADGE_CATEGORIES[badge.category];
  
  const sizeStyles = {
    sm: {
      container: 'p-2',
      icon: 'sm' as const,
      title: 'text-xs',
      desc: 'text-[10px]'
    },
    md: {
      container: 'p-3',
      icon: 'md' as const,
      title: 'text-sm',
      desc: 'text-xs'
    },
    lg: {
      container: 'p-4',
      icon: 'lg' as const,
      title: 'text-base',
      desc: 'text-sm'
    }
  };
  
  const styles = sizeStyles[size];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={onClick}
            className={`
              relative rounded-xl border-2 transition-all duration-200
              ${colors.bg} ${colors.border}
              ${badge.earned ? `shadow-lg ${colors.glow}` : 'opacity-75'}
              ${onClick ? 'cursor-pointer hover:scale-105' : ''}
              ${styles.container}
            `}
          >
            {/* Earned checkmark */}
            {badge.earned && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            
            {/* Lock icon for unearned */}
            {!badge.earned && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
                <Lock className="w-3 h-3 text-white" />
              </div>
            )}

            <div className="flex flex-col items-center text-center gap-2">
              {/* Badge Icon */}
              <div className={`${colors.text}`}>
                <BadgeIcon icon={badge.icon} size={styles.icon} earned={badge.earned} />
              </div>

              {/* Badge Name */}
              <h4 className={`font-semibold ${colors.text} ${styles.title} leading-tight`}>
                {badge.name}
              </h4>

              {/* Progress bar for unearned badges */}
              {showProgress && !badge.earned && badge.progress !== undefined && (
                <div className="w-full mt-1">
                  <Progress value={badge.progress} className="h-1.5" />
                  <p className={`${styles.desc} text-gray-500 mt-1`}>
                    {badge.progressText}
                  </p>
                </div>
              )}

              {/* Earned date */}
              {badge.earned && badge.earned_at && (
                <p className={`${styles.desc} text-gray-500`}>
                  Earned {new Date(badge.earned_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{badge.name}</p>
            <p className="text-sm text-gray-600">{badge.description}</p>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${categoryInfo.bgColor} ${categoryInfo.color}`}>
              {categoryInfo.label}
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact badge display for profile cards
 */
export function BadgeIconOnly({ badge }: { badge: BadgeWithProgress }) {
  const colors = badge.earned ? getEarnedBadgeColor(badge.category) : getBadgeColor(badge.category);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              ${colors.bg} ${colors.border} border
              ${badge.earned ? 'shadow-md' : 'opacity-50'}
            `}
          >
            <BadgeIcon icon={badge.icon} size="sm" earned={badge.earned} className={colors.text} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-medium">{badge.name}</p>
          <p className="text-xs text-gray-500">{badge.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default BadgeCard;
