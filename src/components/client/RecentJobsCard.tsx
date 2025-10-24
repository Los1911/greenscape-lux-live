import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, DollarSign, Clock } from 'lucide-react';
import { useJobUpdates } from '@/hooks/useRealTimeData';
import { useAuth } from '@/contexts/AuthContext';

export function RecentJobsCard() {
  const { user } = useAuth();
  const { data: jobs, loading, error } = useJobUpdates(user?.id || '', 'client');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-900/50 text-green-300 border-green-500/50';
      case 'in_progress': return 'bg-blue-900/50 text-blue-300 border-blue-500/50';
      case 'accepted': return 'bg-yellow-900/50 text-yellow-300 border-yellow-500/50';
      case 'pending': return 'bg-gray-900/50 text-gray-300 border-gray-500/50';
      default: return 'bg-gray-900/50 text-gray-300 border-gray-500/50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-400" />
            Recent Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="p-3 bg-gray-800/50 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !jobs.length) {
    return (
      <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-400" />
            Recent Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-sm text-gray-400 mb-4">
              {error ? 'Failed to load jobs' : 'No jobs found'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-400" />
          Recent Jobs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {jobs.slice(0, 5).map((job: any) => (
            <div key={job.id} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-white truncate">
                  {job.service_name || job.service_type || 'Service Request'}
                </h4>
                <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                  {job.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{job.service_address || job.property_address || 'N/A'}</span>
                </div>
                
                {job.price && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span>${job.price}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(job.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}