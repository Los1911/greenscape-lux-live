import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';

interface LandscaperOverviewProps {
  overview: {
    total: number;
    verified: number;
    pending: number;
    suspended: number;
  };
}

export default function LandscaperOverview({ overview }: LandscaperOverviewProps) {
  const overviewItems = [
    {
      label: 'Total Landscapers',
      value: overview.total,
      icon: Users,
      color: 'text-white',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/20'
    },
    {
      label: 'Verified',
      value: overview.verified,
      icon: UserCheck,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      label: 'Pending Verification',
      value: overview.pending,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    },
    {
      label: 'Suspended',
      value: overview.suspended,
      icon: UserX,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    }
  ];

  return (
    <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl ring-1 ring-green-500/20 shadow-[0_0_45px_-20px_rgba(34,197,94,0.35)] p-4 sm:p-6 hover:shadow-[0_0_60px_-15px_rgba(34,197,94,0.5)] transition-all duration-300 group overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
      
      <div className="relative">
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Landscaper Overview</h3>
        
        {/* Mobile: single column | sm+: 2-column grid
            No fixed widths – no clipping on any viewport */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {overviewItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`${item.bgColor} ${item.borderColor} border rounded-xl p-3 sm:p-4 hover:scale-105 transition-transform duration-200 min-w-0 overflow-hidden`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 shrink-0 ${item.color}`} />
                  <div className="min-w-0">
                    <div className={`text-xl sm:text-2xl font-bold ${item.color}`}>
                      {item.value}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400 truncate">{item.label}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
