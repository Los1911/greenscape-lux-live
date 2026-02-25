import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  valueColor?: string;
  borderColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  onClick?: () => void;
}

/**
 * AdminStatCard - Standardized stat card with consistent sizing
 * 
 * Features:
 * - Equal height across all cards in a row
 * - Consistent padding and margins
 * - Optional trend indicator
 * - Optional click handler for drill-down
 * - Responsive text sizing
 */
export function AdminStatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-emerald-400',
  valueColor = 'text-emerald-300',
  borderColor = 'border-emerald-500/25',
  trend,
  subtitle,
  onClick,
}: AdminStatCardProps) {
  const isClickable = !!onClick;
  
  return (
    <Card 
      className={`
        bg-black/60 backdrop-blur ${borderColor}
        h-full min-h-[120px]
        flex flex-col
        ${isClickable ? 'cursor-pointer hover:bg-emerald-500/5 hover:border-emerald-500/40 transition-all duration-200' : ''}
      `}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
        <CardTitle className="text-xs sm:text-sm font-medium text-white truncate pr-2">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 flex-shrink-0 ${iconColor}`} />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <div className={`text-xl sm:text-2xl font-bold ${valueColor} truncate`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        
        {/* Trend indicator */}
        {trend && (
          <div className={`text-xs mt-1 flex items-center gap-1 ${
            trend.isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-emerald-300/50">vs last period</span>
          </div>
        )}
        
        {/* Subtitle */}
        {subtitle && (
          <div className="text-xs text-emerald-300/60 mt-1 truncate">
            {subtitle}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AdminStatCard;
