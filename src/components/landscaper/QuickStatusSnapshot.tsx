/**
 * QuickStatusSnapshot Component
 * Always-visible compact summary row showing key metrics at a glance
 * This component is never collapsible and provides immediate status awareness
 */

import React from 'react';
import { 
  DollarSign, 
  Briefcase, 
  CheckCircle, 
  Wifi, 
  WifiOff,
  TrendingUp
} from 'lucide-react';

interface QuickStatusSnapshotProps {
  totalEarnings: number;
  activeJobs: number;
  completedJobs: number;
  isAvailable: boolean;
  weeklyEarnings?: number;
  loading?: boolean;
}

export function QuickStatusSnapshot({
  totalEarnings,
  activeJobs,
  completedJobs,
  isAvailable,
  weeklyEarnings = 0,
  loading = false,
}: QuickStatusSnapshotProps) {
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900/60 backdrop-blur border border-emerald-500/30 rounded-2xl p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl" />
              <div className="flex-1">
                <div className="h-3 bg-emerald-500/20 rounded w-16 mb-2" />
                <div className="h-5 bg-emerald-500/20 rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Earnings',
      value: `$${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      subValue: weeklyEarnings > 0 ? `+$${weeklyEarnings.toLocaleString()} this week` : undefined,
      icon: DollarSign,
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      valueColor: 'text-emerald-400',
    },
    {
      label: 'Active Jobs',
      value: activeJobs.toString(),
      subValue: activeJobs > 0 ? 'In progress' : 'None active',
      icon: Briefcase,
      iconBg: activeJobs > 0 ? 'bg-yellow-500/20' : 'bg-slate-500/20',
      iconColor: activeJobs > 0 ? 'text-yellow-400' : 'text-slate-400',
      valueColor: activeJobs > 0 ? 'text-yellow-400' : 'text-slate-400',
    },
    {
      label: 'Completed',
      value: completedJobs.toString(),
      subValue: 'Total jobs',
      icon: CheckCircle,
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      valueColor: 'text-blue-400',
    },
    {
      label: 'Status',
      value: isAvailable ? 'Available' : 'Offline',
      subValue: isAvailable ? 'Accepting jobs' : 'Not accepting',
      icon: isAvailable ? Wifi : WifiOff,
      iconBg: isAvailable ? 'bg-green-500/20' : 'bg-slate-500/20',
      iconColor: isAvailable ? 'text-green-400' : 'text-slate-400',
      valueColor: isAvailable ? 'text-green-400' : 'text-slate-400',
    },
  ];

  return (
    <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900/60 backdrop-blur border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg shadow-emerald-900/20">
      {/* Section Label */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-emerald-500/20">
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium text-emerald-300/80">Quick Status</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 p-2 sm:p-3 rounded-xl bg-black/30 hover:bg-black/40 transition-colors"
          >
            <div className={`p-2.5 rounded-xl ${stat.iconBg} flex-shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-emerald-300/60 truncate">{stat.label}</p>
              <p className={`text-lg sm:text-xl font-bold ${stat.valueColor} truncate`}>
                {stat.value}
              </p>
              {stat.subValue && (
                <p className="text-[10px] sm:text-xs text-emerald-300/50 truncate mt-0.5">
                  {stat.subValue}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuickStatusSnapshot;
