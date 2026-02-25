/**
 * BadgeIcon Component
 * Renders the appropriate icon for a badge with styling
 */

import React from 'react';
import {
  Trophy,
  Star,
  Award,
  Medal,
  Crown,
  Gem,
  Sparkles,
  ThumbsUp,
  Clock,
  Zap,
  ShieldCheck,
  Flame,
  Rocket,
  LucideIcon
} from 'lucide-react';

interface BadgeIconProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  earned?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  trophy: Trophy,
  star: Star,
  award: Award,
  medal: Medal,
  crown: Crown,
  gem: Gem,
  sparkles: Sparkles,
  'thumbs-up': ThumbsUp,
  clock: Clock,
  zap: Zap,
  'shield-check': ShieldCheck,
  flame: Flame,
  rocket: Rocket
};

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

export function BadgeIcon({ icon, size = 'md', className = '', earned = true }: BadgeIconProps) {
  const IconComponent = iconMap[icon] || Award;
  
  return (
    <IconComponent 
      className={`${sizeClasses[size]} ${earned ? '' : 'opacity-40'} ${className}`}
    />
  );
}

export default BadgeIcon;
