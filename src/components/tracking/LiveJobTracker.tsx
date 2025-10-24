import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWebSocket } from './WebSocketManager';
import { Job as CanonicalJob } from '@/types/job';

// Extended Job type for live tracking with additional runtime fields
interface TrackedJob extends Pick<CanonicalJob, 'id' | 'service_name' | 'service_address' | 'status'> {
  landscaper: string;
  client: string;
  location: { lat: number; lng: number };
  estimatedArrival?: string;
  startTime?: string;
  completionTime?: string;
}

interface LiveJobTrackerProps {
  jobs: TrackedJob[];
  onJobUpdate?: (job: TrackedJob) => void;
}

export const LiveJobTracker: React.FC<LiveJobTrackerProps> = ({ jobs, onJobUpdate }) => {
  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>(jobs);
  const { isConnected, subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('job_status_update', (data) => {
      setTrackedJobs(prev => prev.map(job => 
        job.id === data.jobId 
          ? { 
              ...job, 
              status: data.status,
              location: data.location,
              ...(data.status === 'arrived' && { estimatedArrival: data.timestamp }),
              ...(data.status === 'in_progress' && { startTime: data.timestamp }),
              ...(data.status === 'completed' && { completionTime: data.timestamp })
            }
          : job
      ));
    });

    return unsubscribe;
  }, [subscribe]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-500';
      case 'en_route': return 'bg-yellow-500';
      case 'arrived': return 'bg-orange-500';
      case 'in_progress': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return 'Assigned';
      case 'en_route': return 'En Route';
      case 'arrived': return 'Arrived';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const calculateETA = (job: TrackedJob) => {
    if (job.status === 'arrived' || job.status === 'in_progress' || job.status === 'completed') {
      return null;
    }
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + Math.floor(Math.random() * 30) + 10);
    return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Live Job Tracking</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {trackedJobs.map((job) => (
          <div key={job.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-white">{job.service_name}</h4>
              <Badge className={`${getStatusColor(job.status)} text-white`}>
                {getStatusText(job.status)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Landscaper</p>
                <p className="text-white">{job.landscaper}</p>
              </div>
              <div>
                <p className="text-gray-400">Client</p>
                <p className="text-white">{job.client}</p>
              </div>
              <div>
                <p className="text-gray-400">Address</p>
                <p className="text-white text-xs">{job.service_address}</p>
              </div>
              <div>
                <p className="text-gray-400">
                  {job.status === 'completed' ? 'Completed' : 'ETA'}
                </p>
                <p className="text-white">
                  {job.completionTime 
                    ? new Date(job.completionTime).toLocaleTimeString()
                    : calculateETA(job) || 'On Site'
                  }
                </p>
              </div>
            </div>

            {job.status === 'in_progress' && job.startTime && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    Started: {new Date(job.startTime).toLocaleTimeString()}
                  </span>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      View Live Location
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Contact
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
