import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/lib/ConfigContext';
import { LiveJobTracker } from '@/components/tracking/LiveJobTracker';
import { useNavigate } from 'react-router-dom';

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl ring-1 ring-emerald-500/20 shadow-[0_0_25px_-10px_rgba(52,211,153,0.25)] p-4 sm:p-6 lg:p-8">
      {children}
    </section>
  );
}

export default function JobsPanel() {
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'available' | 'assigned' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    loadJobs();
  }, [supabase]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { data: jobsData, error } = await supabase
          .from('jobs')
          .select('*')
          .or(`landscaper_id.eq.${user.id},status.eq.available`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setJobs(jobsData ?? []);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs?.filter(job => {
    if (filter === 'all') return true;
    return job?.status === filter;
  }) ?? [];

  const handleJobAction = async (jobId: string, action: 'accept' | 'decline' | 'complete') => {
    try {
      setActionLoading(jobId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      let updateData: any = {};
      
      if (action === 'accept') {
        updateData = { 
          status: 'assigned', 
          landscaper_id: user.id,
          accepted_at: new Date().toISOString()
        };
      } else if (action === 'decline') {
        updateData = { 
          status: 'available',
          landscaper_id: null
        };
      } else if (action === 'complete') {
        updateData = { 
          status: 'completed',
          completed_at: new Date().toISOString()
        };
      }

      const { error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', jobId);

      if (error) throw error;

      await loadJobs();
    } catch (error) {
      console.error(`Error performing ${action} on job:`, error);
      alert(`Failed to ${action} job. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Panel>
          <div className="text-emerald-300/70 text-center py-8">Loading jobs...</div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <Panel>
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-emerald-300">Job Management</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Jobs' },
              { key: 'available', label: 'Available' },
              { key: 'assigned', label: 'Assigned' },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'completed', label: 'Completed' }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filter === filterOption.key
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                    : 'bg-black/40 text-emerald-300/70 border border-emerald-500/25 hover:bg-black/60'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-emerald-300">
            {filter === 'all' ? 'All Jobs' : `${filter.charAt(0).toUpperCase() + filter.slice(1).replace('_', ' ')} Jobs`} 
            ({filteredJobs?.length ?? 0})
          </h3>
          
          {filteredJobs?.length === 0 ? (
            <div className="text-center py-12 text-emerald-300/70">
              <p>No jobs found for the selected filter.</p>
              <p className="text-sm text-emerald-300/50 mt-2">Check back later for new opportunities</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs?.map((job) => (
                <div key={job?.id} className="bg-black/40 border border-emerald-500/25 rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <h4 className="text-lg font-semibold text-emerald-300">{job?.service_type ?? 'Service Request'}</h4>
                      <p className="text-sm text-emerald-300/70">{job?.service_address ?? job?.property_address ?? 'No address'}</p>
                      <p className="text-sm text-emerald-300/60">{job?.description ?? job?.notes ?? 'No description'}</p>
                      <div className="flex flex-wrap gap-4 text-sm pt-2">
                        <span className="text-emerald-400 font-semibold">${job?.price?.toFixed(2) ?? job?.amount?.toFixed(2) ?? '0.00'}</span>
                        <span className={`px-2 py-1 rounded-lg font-medium ${
                          job?.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                          job?.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                          job?.status === 'assigned' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {job?.status?.replace('_', ' ') ?? 'pending'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0">
                      {job?.status === 'available' && (
                        <>
                          <button
                            onClick={() => handleJobAction(job.id, 'accept')}
                            disabled={actionLoading === job.id}
                            className="px-4 py-2 bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 rounded-xl hover:bg-emerald-500/30 transition-all duration-200 text-sm font-medium disabled:opacity-50"
                          >
                            {actionLoading === job.id ? 'Processing...' : 'Accept'}
                          </button>
                        </>
                      )}
                      {(job?.status === 'assigned' || job?.status === 'in_progress') && (
                        <button
                          onClick={() => handleJobAction(job.id, 'complete')}
                          disabled={actionLoading === job.id}
                          className="px-4 py-2 bg-blue-500/20 text-blue-200 border border-blue-500/50 rounded-xl hover:bg-blue-500/30 transition-all duration-200 text-sm font-medium disabled:opacity-50"
                        >
                          {actionLoading === job.id ? 'Processing...' : 'Mark Complete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )) ?? []}
            </div>
          )}
        </div>
      </Panel>

      {filteredJobs?.length > 0 && (
        <Panel>
          <LiveJobTracker jobs={filteredJobs?.slice(0, 5) ?? []} />
        </Panel>
      )}
    </div>
  );
}
