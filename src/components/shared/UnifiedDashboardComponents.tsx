import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, Mail, Phone, Building2, Shield, CheckCircle2, 
  DollarSign, TrendingUp, Calendar, MapPin, Star
} from 'lucide-react';

// Unified Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'green' | 'blue' | 'yellow';
}

export function UnifiedStatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  variant = 'default' 
}: StatsCardProps) {
  const variants = {
    default: 'bg-black/60 border-gray-500/25',
    green: 'bg-black/60 border-green-500/25 ring-green-500/20',
    blue: 'bg-black/60 border-blue-500/25 ring-blue-500/20',
    yellow: 'bg-black/60 border-yellow-500/25 ring-yellow-500/20'
  };

  return (
    <Card className={`${variants[variant]} backdrop-blur rounded-2xl ring-1 shadow-lg`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
        <div className="text-green-400">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-400 mb-2">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            <TrendingUp className={`w-3 h-3 mr-1 ${trend.isPositive ? '' : 'rotate-180'}`} />
            {trend.isPositive ? '+' : ''}{trend.value}% from last period
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Unified Quick Action Card
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function UnifiedQuickAction({ 
  title, 
  description, 
  icon, 
  onClick, 
  disabled = false,
  variant = 'primary'
}: QuickActionProps) {
  const baseClasses = "p-4 rounded-xl border transition-all duration-200 cursor-pointer";
  const variants = {
    primary: `${baseClasses} bg-gradient-to-r from-green-600 to-green-700 border-green-500 hover:from-green-500 hover:to-green-600 shadow-[0_0_20px_rgba(34,197,94,0.3)]`,
    secondary: `${baseClasses} bg-black/40 border-gray-500/25 hover:bg-black/60 hover:border-green-500/50`
  };

  return (
    <div 
      className={`${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-center gap-3">
        <div className="text-white">{icon}</div>
        <div>
          <h3 className="font-semibold text-white text-sm">{title}</h3>
          <p className="text-xs text-gray-300">{description}</p>
        </div>
      </div>
    </div>
  );
}

// Unified Activity Feed Item
interface ActivityItemProps {
  title: string;
  description: string;
  timestamp: string;
  type: 'success' | 'warning' | 'info' | 'error';
  icon?: React.ReactNode;
}

export function UnifiedActivityItem({ 
  title, 
  description, 
  timestamp, 
  type, 
  icon 
}: ActivityItemProps) {
  const typeStyles = {
    success: 'bg-green-900/20 border-l-green-500',
    warning: 'bg-yellow-900/20 border-l-yellow-500',
    info: 'bg-blue-900/20 border-l-blue-500',
    error: 'bg-red-900/20 border-l-red-500'
  };

  return (
    <div className={`p-3 rounded-lg border-l-4 ${typeStyles[type]}`}>
      <div className="flex items-start gap-3">
        {icon && <div className="text-white mt-0.5">{icon}</div>}
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white">{title}</h4>
          <p className="text-xs text-gray-400 mt-1">{description}</p>
          <p className="text-xs text-gray-500 mt-2">{timestamp}</p>
        </div>
      </div>
    </div>
  );
}

// Unified Progress Card
interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  unit?: string;
  showPercentage?: boolean;
}

export function UnifiedProgressCard({ 
  title, 
  current, 
  total, 
  unit = '', 
  showPercentage = true 
}: ProgressCardProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-white">
              {current}{unit} / {total}{unit}
            </span>
            {showPercentage && (
              <span className="text-sm text-green-400">{Math.round(percentage)}%</span>
            )}
          </div>
          <Progress value={percentage} className="h-2 bg-gray-800" />
        </div>
      </CardContent>
    </Card>
  );
}