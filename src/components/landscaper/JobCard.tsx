import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock } from "lucide-react";
import { JobMessageButton } from './JobMessageButton';
interface JobCardProps {
  job: {
    id: string;
    customer_name: string;
    customer_email: string;
    location: string;
    service_type: string;
    preferred_date: string;
    notes?: string;
    status: string;
    created_at: string;
  };
  onAccept: (jobId: string) => void;
  onDecline: (jobId: string) => void;
  loading: boolean;
}

export function JobCard({ job, onAccept, onDecline, loading }: JobCardProps) {
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{job.customer_name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
          </div>
          <Badge className={getStatusColor(job.status)}>
            {job.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>{formatDate(job.preferred_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-500" />
            <span>{job.service_type}</span>
          </div>
        </div>

        {job?.notes && (
          <div className="text-sm text-gray-600">
            <strong>Notes:</strong> {job.notes}
          </div>
        )}
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
            className="flex-1"
          >
            Decline
          </Button>
        </div>

        {/* Message Client Button */}
        <div className="pt-2">
          <JobMessageButton
            jobId={job.id}
            jobTitle={`${job.service_type} - ${job.customer_name}`}
            clientName={job.customer_name}
            variant="outline"
            size="sm"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}