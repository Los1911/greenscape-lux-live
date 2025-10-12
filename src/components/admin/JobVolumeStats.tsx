import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface JobVolumeStatsProps {
  stats: {
    completed: number;
    pending: number;
    inProgress: number;
    issues: number;
  };
}

export default function JobVolumeStats({ stats }: JobVolumeStatsProps) {
  const statItems = [
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      label: 'Issues',
      value: stats.issues,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    }
  ];

  return (
    <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl ring-1 ring-green-500/20 shadow-[0_0_45px_-20px_rgba(34,197,94,0.35)] p-6 hover:shadow-[0_0_60px_-15px_rgba(34,197,94,0.5)] transition-all duration-300 group">
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
      
      <div className="relative">
        <h3 className="text-xl font-semibold text-white mb-6">Job Volume Stats</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`${item.bgColor} ${item.borderColor} border rounded-xl p-4 hover:scale-105 transition-transform duration-200`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-6 w-6 ${item.color}`} />
                  <div>
                    <div className={`text-2xl font-bold ${item.color}`}>
                      {item.value}
                    </div>
                    <div className="text-sm text-gray-400">{item.label}</div>
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