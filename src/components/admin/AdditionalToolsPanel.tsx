import React, { useState } from 'react';
import { Plus, AlertTriangle, UserPlus, RefreshCw, Calendar, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CreateJobModal from './CreateJobModal';

interface RecentSignup {
  id: number;
  name: string;
  email: string;
  type: 'client' | 'landscaper';
  date: string;
}

interface FlaggedJob {
  id: number;
  service: string;
  client: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
}

interface Props {
  recentSignups: RecentSignup[];
  flaggedJobs: FlaggedJob[];
}

export default function AdditionalToolsPanel({ recentSignups, flaggedJobs }: Props) {
  const [showJobModal, setShowJobModal] = useState(false);
  const [activePanel, setActivePanel] = useState<'signups' | 'flagged'>('signups');

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      medium: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      high: 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  return (
    <>
      {/* New Job Button - Top Right */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-300">Additional Tools</h2>
        <Button
          onClick={() => setShowJobModal(true)}
          className="group relative overflow-hidden rounded-full bg-gradient-to-r from-green-600/20 to-green-500/20 
                   hover:from-green-600/30 hover:to-green-500/30 border border-green-500/40 text-green-300 
                   px-6 py-3 text-sm font-medium transition-all duration-300 
                   hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-105
                   sm:w-auto w-full"
        >
          <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          <span className="relative z-10">+ New Job</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Creation & Filters */}
        <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl ring-1 ring-green-500/20 shadow-[0_0_25px_-10px_rgba(34,197,94,0.25)]">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-green-300">Quick Actions</h3>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <select className="text-xs bg-black/40 border border-gray-600 rounded-lg px-2 py-1.5 text-green-300">
                  <option>All Dates</option>
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                </select>
                <select className="text-xs bg-black/40 border border-gray-600 rounded-lg px-2 py-1.5 text-green-300">
                  <option>All Cities</option>
                  <option>Charlotte</option>
                  <option>Raleigh</option>
                  <option>Durham</option>
                </select>
                <select className="text-xs bg-black/40 border border-gray-600 rounded-lg px-2 py-1.5 text-green-300">
                  <option>All Status</option>
                  <option>Pending</option>
                  <option>Active</option>
                  <option>Complete</option>
                </select>
              </div>

              <div className="border-t border-gray-700 pt-3">
                <div className="text-sm text-gray-400 mb-2">Platform Stats</div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Rebooking Rate:</span>
                  <span className="text-green-300 font-semibold">78%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Avg. Client Retention:</span>
                  <span className="text-blue-300 font-semibold">6.2 months</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Signups & Flagged Jobs */}
        <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl ring-1 ring-green-500/20 shadow-[0_0_25px_-10px_rgba(34,197,94,0.25)]">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-green-300">Activity Monitor</h3>
              </div>
              <div className="flex gap-1">
                <Button 
                  onClick={() => setActivePanel('signups')}
                  className={`px-2 py-1 text-xs rounded-lg ${
                    activePanel === 'signups' 
                      ? 'bg-green-600/30 text-green-300' 
                      : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                  }`}
                >
                  Signups
                </Button>
                <Button 
                  onClick={() => setActivePanel('flagged')}
                  className={`px-2 py-1 text-xs rounded-lg ${
                    activePanel === 'flagged' 
                      ? 'bg-red-600/30 text-red-300' 
                      : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                  }`}
                >
                  Flagged
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activePanel === 'signups' ? (
                recentSignups.map(signup => (
                  <div key={signup.id} className="rounded-xl bg-black/40 border border-gray-700/50 p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-medium text-green-300">{signup.name}</div>
                      <Badge className={`text-xs ${
                        signup.type === 'client' 
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      }`}>
                        {signup.type}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400">{signup.email}</div>
                    <div className="text-xs text-gray-500">{signup.date}</div>
                  </div>
                ))
              ) : (
                flaggedJobs.map(job => (
                  <div key={job.id} className="rounded-xl bg-black/40 border border-gray-700/50 p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-medium text-red-300">{job.service}</div>
                      <Badge className={`text-xs ${getSeverityBadge(job.severity)}`}>
                        {job.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400">Client: {job.client}</div>
                    <div className="text-xs text-gray-500">Issue: {job.issue}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Job Creation Modal */}
      <CreateJobModal 
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
      />
    </>
  );
}