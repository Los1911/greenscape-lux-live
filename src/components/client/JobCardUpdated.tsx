// src/components/client/JobCardUpdated.tsx

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, DollarSign } from 'lucide-react';
import { Job } from '@/types/job';

interface JobCardProps {
  job: Job;
  onJobUpdate: () => void;
  onJobClick: (job: Job) => void;
}

export function JobCard({ job, onJobUpdate, onJobClick }: JobCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-gray-900/30 text-gray-400 border-gray-500/30';

      case 'assigned':
        return 'bg-blue-900/30 text-blue-400 border-blue-500/30';

      case 'active':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30';

      case 'completed_pending_review':
        return 'bg-purple-900/30 text-purple-400 border-purple-500/30';

      case 'completed':
        return 'bg-green-900/30 text-green-400 border-green-500/30';

      case 'cancelled':
        return 'bg-red-900/30 text-red-400 border-red-500/30';

      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date TBD';

    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card
      className="bg-black/40 backdrop-blur border border-green-500/20 rounded-xl p-4 hover:border-green-500/40 transition-all cursor-pointer"
      onClick={() => onJobClick(job)}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-green-300">
          {job.service_name}
        </h3>

        <Badge className={`${getStatusColor(job.status)} border`}>
          {job.status}
        </Badge>
      </div>

      <div className="space-y-2 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-green-400" />
          <span>{formatDate(job.preferred_date)}</span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-400" />
          <span className="truncate">{job.service_address}</span>
        </div>

        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-green-400" />
          <span>{job.customer_name}</span>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" />
          <span>${job.price}</span>
        </div>
      </div>
    </Card>
  );
}
