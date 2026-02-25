import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, User, Phone } from 'lucide-react';

interface JobStatus {
  id: string;
  title: string;
  landscaper: string;
  client: string;
  clientPhone: string;
  status: 'assigned' | 'en_route' | 'arrived' | 'active' | 'completed';

  location: { lat: number; lng: number };
  address: string;
  estimatedArrival?: Date;
  actualArrival?: Date;
  startTime?: Date;
  completionTime?: Date;
  progress: number;
  lastUpdate: Date;
}

interface JobTrackerProps {
  jobId: string;
  onStatusUpdate?: (status: JobStatus) => void;
}

export const JobTracker: React.FC<JobTrackerProps> = ({ jobId, onStatusUpdate }) => {
  const [jobStatus, setJobStatus] = useState<JobStatus>({
    id: jobId,
    title: 'Lawn Maintenance - Oak Street',
    landscaper: 'Mike Johnson',
    client: 'Sarah Wilson',
    clientPhone: '+1 (555) 123-4567',
    status: 'assigned',
    location: { lat: 35.2271, lng: -80.8431 },
    address: '123 Oak Street, Charlotte, NC 28202',
    progress: 0,
    lastUpdate: new Date()
  });

  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking && jobStatus.status !== 'completed') {
      interval = setInterval(() => {
        setJobStatus(prev => {
          const now = new Date();
          let newStatus = prev.status;
          let newProgress = prev.progress;
          
          // Simulate status progression
          if (prev.status === 'assigned' && Math.random() > 0.7) {
            newStatus = 'en_route';
          } else if (prev.status === 'en_route' && Math.random() > 0.8) {
            newStatus = 'arrived';
          } else if (prev.status === 'arrived' && Math.random() > 0.6) {
            newStatus = 'active';
            newProgress = 10;
          } else if (prev.status === 'active') {
            newProgress = Math.min(100, prev.progress + Math.floor(Math.random() * 15) + 5);
            if (newProgress >= 100) {
              newStatus = 'completed';
            }

          }

          const updated = {
            ...prev,
            status: newStatus,
            progress: newProgress,
            lastUpdate: now,
            ...(newStatus === 'arrived' && !prev.actualArrival && { actualArrival: now }),
            ...(newStatus === 'active' && !prev.startTime && { startTime: now }),
            ...(newStatus === 'completed' && !prev.completionTime && { completionTime: now })
          };

          if (onStatusUpdate) {
            onStatusUpdate(updated);
          }

          return updated;
        });
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, jobStatus.status, onStatusUpdate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-500';
      case 'en_route': return 'bg-yellow-500';
      case 'arrived': return 'bg-orange-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return 'Job Assigned';
      case 'en_route': return 'Landscaper En Route';
      case 'arrived': return 'Landscaper Arrived';
      case 'active': return 'Work in Progress';
      case 'completed': return 'Job Completed';
      default: return status;
    }
  };

  const calculateETA = () => {
    if (jobStatus.status === 'arrived' || jobStatus.status === 'active' || jobStatus.status === 'completed') {
      return null;
    }
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + 25);
    return eta;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h3 className="text-xl sm:text-2xl font-semibold text-green-300">Job Status Tracker</h3>
        <Button
          onClick={() => setIsTracking(!isTracking)}
          variant={isTracking ? "destructive" : "default"}
          className={`w-full sm:w-auto ${isTracking ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
        >
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </Button>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Job Info */}
        <div className="bg-black/40 border border-green-500/25 rounded-lg p-4 sm:p-6">
          <h4 className="font-semibold text-green-300 mb-3 text-base sm:text-lg">{jobStatus.title}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <User className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-green-200/70">Landscaper</p>
                <p className="text-green-200 font-medium">{jobStatus.landscaper}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Phone className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-green-200/70">Client</p>
                <p className="text-green-200 font-medium">{jobStatus.client}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-black/40 border border-green-500/25 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4">
            <Badge className={`${getStatusColor(jobStatus.status)} text-white px-3 py-1`}>
              {getStatusText(jobStatus.status)}
            </Badge>
            <span className="text-xs text-green-200/70">
              Last updated: {formatTime(jobStatus.lastUpdate)}
            </span>
          </div>

          {/* Progress Bar for Active Jobs */}
          {jobStatus.status === 'active' && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-green-200/70">Progress</span>
                <span className="text-green-200 font-medium">{jobStatus.progress}%</span>
              </div>
              <div className="w-full bg-black/60 border border-green-500/25 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${jobStatus.progress}%` }}
                ></div>
              </div>
            </div>
          )}


          {/* Location & ETA */}
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-green-200 text-sm">{jobStatus.address}</p>
              {calculateETA() && (
                <div className="flex items-center space-x-1 mt-1">
                  <Clock className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-200/70">
                    ETA: {formatTime(calculateETA()!)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-black/40 border border-green-500/25 rounded-lg p-4 sm:p-6">
          <h5 className="font-semibold text-green-300 mb-3">Timeline</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-200/70">Job Assigned</span>
              <span className="text-green-200 font-medium">9:00 AM</span>
            </div>
            {jobStatus.actualArrival && (
              <div className="flex justify-between">
                <span className="text-green-200/70">Landscaper Arrived</span>
                <span className="text-green-200 font-medium">{formatTime(jobStatus.actualArrival)}</span>
              </div>
            )}
            {jobStatus.startTime && (
              <div className="flex justify-between">
                <span className="text-green-200/70">Work Started</span>
                <span className="text-green-200 font-medium">{formatTime(jobStatus.startTime)}</span>
              </div>
            )}
            {jobStatus.completionTime && (
              <div className="flex justify-between">
                <span className="text-green-200/70">Work Completed</span>
                <span className="text-green-200 font-medium">{formatTime(jobStatus.completionTime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-green-500/50 text-green-200 hover:bg-green-500/20"
            onClick={() => console.log('View live location')}
          >
            View Live Location
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-green-500/50 text-green-200 hover:bg-green-500/20"
            onClick={() => console.log('Contact landscaper')}
          >
            Contact Landscaper
          </Button>
          {jobStatus.status === 'completed' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 border-green-500/50 text-green-200 hover:bg-green-500/20"
              onClick={() => console.log('View photos')}
            >
              View Photos
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};