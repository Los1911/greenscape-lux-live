import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, AlertTriangle } from "lucide-react";
import { JobMessageButton } from './JobMessageButton';
import RemediationPanel from './RemediationPanel';
import { Job } from '@/types/job';

interface JobCardProps {
  job: {
    id: string;
    customer_name: string;
    customer_email?: string;
    location?: string;
    service_address?: string;
    service_type: string;
    service_name?: string;
    preferred_date: string;
    notes?: string;
    status: string;
    created_at: string;
    price?: number;
    flagged_at?: string;
    flagged_reason?: string;
    remediation_deadline?: string;
    remediation_status?: string;
    weather_extension_hours?: number;
    landscaper_id?: string;
  };
  onAccept: (jobId: string) => void;
  onDecline: (jobId: string) => void;
  loading: boolean;
  onUpdate?: () => void;
}

export function JobCard({ job, onAccept, onDecline, loading, onUpdate }: JobCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'available': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-amber-100 text-amber-800';

      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'flagged_review': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'flagged_review') return 'Remediation Required';
    return status;
  };

  const isFlagged = job.status === 'flagged_review';
  const location = job.location || job.service_address || 'Location TBD';

  // If job is flagged, show the remediation panel
  if (isFlagged) {
    return (
      <RemediationPanel 
        job={job as Job} 
        onUpdate={onUpdate}
      />
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-white">{job.customer_name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          </div>
          <Badge className={getStatusColor(job.status)}>
            {getStatusLabel(job.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>{formatDate(job.preferred_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>{job.service_type || job.service_name}</span>
          </div>
        </div>

        {job?.notes && (
          <div className="text-sm text-slate-400">
            <strong className="text-slate-300">Notes:</strong> {job.notes}
          </div>
        )}

        {/* Accept/Decline buttons for available jobs */}
        {(job.status === 'pending' || job.status === 'available') && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onAccept(job.id)}
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Accept Job
            </Button>
            <Button
              onClick={() => onDecline(job.id)}
              disabled={loading}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300"
            >
              Decline
            </Button>
          </div>
        )}
        {/* Message Client Button - for assigned/active/completed jobs */}
        {(job.status === 'assigned' || job.status === 'active' || job.status === 'completed') && (

          <div className="pt-2">
            <JobMessageButton
              jobId={job.id}
              jobTitle={`${job.service_type || job.service_name} - ${job.customer_name}`}
              jobStatus={job.status}
              clientName={job.customer_name}
              variant="outline"
              size="sm"
              className="w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
