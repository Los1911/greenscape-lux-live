import React from 'react';
import { cn } from '@/lib/utils';

interface MessageNotificationBadgeProps {
  count: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showZero?: boolean;
  maxCount?: number;
}

export function MessageNotificationBadge({
  count,
  className = '',
  size = 'md',
  showZero = false,
  maxCount = 99,
}: MessageNotificationBadgeProps) {
  if (count === 0 && !showZero) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const sizeClasses = {
    sm: 'min-w-[16px] h-4 text-[10px] px-1',
    md: 'min-w-[20px] h-5 text-xs px-1.5',
    lg: 'min-w-[24px] h-6 text-sm px-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold',
        'bg-red-500 text-white',
        'animate-in fade-in zoom-in duration-200',
        sizeClasses[size],
        className
      )}
    >
      {displayCount}
    </span>
  );
}

// Dot indicator for subtle unread notification
export function MessageNotificationDot({
  visible,
  className = '',
  size = 'md',
  pulse = true,
}: {
  visible: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}) {
  if (!visible) return null;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <span
      className={cn(
        'inline-block rounded-full bg-red-500',
        pulse && 'animate-pulse',
        sizeClasses[size],
        className
      )}
    />
  );
}

export default MessageNotificationBadge;
