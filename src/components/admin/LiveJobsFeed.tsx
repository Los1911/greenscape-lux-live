import React, { useState } from 'react';
import { Briefcase, Eye, Calendar, MapPin, Clock, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CreateJobModal from './CreateJobModal';
import { Job } from '@/types/job';

interface Props {
  jobs: Job[];
  onJobsUpdate?: () => void;
}


export default function LiveJobsFeed({ jobs, onJobsUpdate }: Props) {


export default function LiveJobsFeed({ jobs, onJobsUpdate }: Props) {
  const [sortBy, setSortBy] = useState<'newest' | 'status' | 'price'>('newest');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      scheduled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'in-progress': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      completed: 'bg-green-500/20 text-green-300 border-green-500/30'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'newest') return b.id - a.id;
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    if (sortBy === 'price') return (b.price || 0) - (a.price || 0);
    return 0;
  });

  return (
    <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl ring-1 ring-green-500/20 shadow-[0_0_25px_-10px_rgba(34,197,94,0.25)] hover:shadow-[0_0_35px_-5px_rgba(34,197,94,0.35)] transition-all duration-300">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-green-300">Live Jobs Feed</h2>
          </div>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-black/40 border border-gray-600 rounded-lg px-2 py-1 text-green-300"
          >
            <option value="newest">Newest First</option>
            <option value="status">By Status</option>
            <option value="price">By Price</option>
          </select>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sortedJobs.slice(0, 6).map(job => (
            <div key={job.id} className="rounded-xl bg-black/40 border border-gray-700/50 p-3 hover:bg-black/60 hover:border-green-500/30 transition-all duration-200 hover:shadow-[0_0_10px_rgba(34,197,94,0.2)]">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm font-medium text-green-300">{job.service_name || 'Lawn Care'}</div>
                <Badge className={`text-xs ${getStatusBadge(job.status)}`}>
                  {job.status.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                <MapPin className="w-3 h-3" />
                <span>{job.location || 'Charlotte, NC'}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                <Clock className="w-3 h-3" />
                <span>{job.date || 'Aug 12 @ 10am'}</span>
              </div>
              <div className="text-xs text-gray-400">Client: {job.client_email?.split('@')[0] || 'Client'}</div>
              <div className="text-xs text-gray-400">
                Landscaper: {job.landscaper_email?.split('@')[0] || 'Unassigned'}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="rounded-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-sm hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Job
          </Button>
          <Button className="rounded-full bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 text-green-300 text-sm hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <Eye className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>
      </div>
      
      <CreateJobModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onJobCreated={() => {
          if (onJobsUpdate) onJobsUpdate();
        }}
      />
    </Card>
  );
}
