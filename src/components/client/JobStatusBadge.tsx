import React from 'react';
import { deriveClientStage, CLIENT_STAGE_LABELS, type ClientStage } from '@/constants/jobStatus';
import { 
  Clock,
  DollarSign, 
  User, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Send,
  XCircle,
  RotateCcw
} from 'lucide-react';

interface JobStatusBadgeProps {
  status: string;
  price?: number | null;
  variant?: 'default' | 'compact';
  showPrice?: boolean;
}

// Status → visual config, covering ALL 14 canonical statuses + legacy 'in_progress'
const STATUS_CONFIG: Record<string, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
}> = {
  pending: {
    label: 'Under Review',
    description: 'Our team is reviewing your request',
    color: 'text-amber-300',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
    icon: Clock
  },
  quoted: {
    label: 'Under Review',
    description: 'Our team is reviewing your request',
    color: 'text-amber-300',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
    icon: Clock
  },
  available: {
    label: 'Scheduled',
    description: 'Your service is being scheduled',
    color: 'text-blue-300',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/30',
    icon: Clock
  },
  priced: {
    label: 'Estimate Ready',
    description: 'Your estimate is ready - awaiting service provider',
    color: 'text-blue-300',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/30',
    icon: DollarSign
  },
  assigned: {
    label: 'In Progress',
    description: 'A service provider has been assigned',
    color: 'text-purple-300',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/30',
    icon: User
  },
  // Note: 'accepted' removed — 'assigned' at line 64 already covers this status

  scheduled: {
    label: 'Scheduled',
    description: 'Your service is scheduled',
    color: 'text-blue-300',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/30',
    icon: Clock
  },
  active: {
    label: 'In Progress',
    description: 'Work is currently being performed',
    color: 'text-yellow-300',
    bgColor: 'bg-yellow-500/15',
    borderColor: 'border-yellow-500/30',
    icon: Play
  },
  in_progress: {
    label: 'In Progress',
    description: 'Work is currently being performed',
    color: 'text-yellow-300',
    bgColor: 'bg-yellow-500/15',
    borderColor: 'border-yellow-500/30',
    icon: Play
  },
  pending_review: {
    label: 'In Progress',
    description: 'Work is being reviewed',
    color: 'text-yellow-300',
    bgColor: 'bg-yellow-500/15',
    borderColor: 'border-yellow-500/30',
    icon: Eye
  },
  completed_pending_review: {
    label: 'In Progress',
    description: 'Work completed, under final review',
    color: 'text-yellow-300',
    bgColor: 'bg-yellow-500/15',
    borderColor: 'border-yellow-500/30',
    icon: Eye
  },
  completed: {
    label: 'Completed',
    description: 'Service has been completed',
    color: 'text-emerald-300',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30',
    icon: CheckCircle
  },
  flagged_review: {
    label: 'Under Review',
    description: 'An issue is being addressed',
    color: 'text-amber-300',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
    icon: AlertCircle
  },
  blocked: {
    label: 'Under Review',
    description: 'Service is temporarily on hold',
    color: 'text-amber-300',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
    icon: AlertCircle
  },
  cancelled: {
    label: 'Cancelled',
    description: 'This service has been cancelled',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/15',
    borderColor: 'border-slate-500/30',
    icon: XCircle
  },
  rescheduled: {
    label: 'Scheduled',
    description: 'Service has been rescheduled',
    color: 'text-blue-300',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/30',
    icon: RotateCcw
  },
};

const DEFAULT_CONFIG = {
  label: 'Processing',
  description: 'Status is being determined',
  color: 'text-slate-300',
  bgColor: 'bg-slate-500/15',
  borderColor: 'border-slate-500/30',
  icon: Send
};

export default function JobStatusBadge({ status, price, variant = 'default', showPrice = true }: JobStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || DEFAULT_CONFIG;
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.color} ${config.borderColor}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  }

  return (
    <div className={`rounded-xl border p-3 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${config.color}`} />
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
          {showPrice && price != null && price > 0 && deriveClientStage(status) !== 'under_review' && (
            <span className="text-emerald-400 font-semibold text-sm">
              ${price.toFixed(0)}
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-1 ml-6">{config.description}</p>
    </div>
  );

