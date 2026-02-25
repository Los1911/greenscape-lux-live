import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Trash2, ChevronDown, ArrowUpDown } from 'lucide-react';
import { Job } from '@/types/job';

type SortField = 'created_at' | 'price' | 'status';
type SortOrder = 'asc' | 'desc';

export default function AdminJobManager() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, service_name, service_type, service_address, status, customer_name, preferred_date, created_at, price')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED — lifecycle now uses edge function
  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      let action: string | null = null;

      if (newStatus === 'completed') {
        action = 'admin_approve';
      }

      if (!action) return;

      const { data, error } = await supabase.functions.invoke('job-execution', {
        body: { action, jobId }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to update job');

      fetchJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedJobs = jobs
    .filter(job => statusFilter === 'all' || job.status === statusFilter)
    .sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          return 0;
      }

      return sortOrder === 'asc'
        ? (aVal > bVal ? 1 : -1)
        : (aVal < bVal ? 1 : -1);
    });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      assigned: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      active: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      completed: 'bg-green-500/20 text-green-300 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/30'
    };

    return styles[status as keyof typeof styles] ||
      'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  if (loading) {
    return (
      <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl p-6">
        <div className="animate-pulse text-green-300">Loading jobs...</div>
      </Card>
    );
  }

  return (
    <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl ring-1 ring-green-500/20 shadow-[0_0_25px_-10px_rgba(34,197,94,0.25)]">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-green-300">Job Management</h2>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black/40 border border-green-500/40 rounded-lg px-4 py-2 text-green-300 appearance-none pr-8"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-green-400 pointer-events-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-green-500/20">
                <th className="text-left py-3 px-4 text-green-300 font-semibold">Date</th>
                <th className="text-left py-3 px-4 text-green-300 font-semibold">Client</th>
                <th className="text-left py-3 px-4 text-green-300 font-semibold">Service</th>
                <th className="text-left py-3 px-4 text-green-300 font-semibold">Price</th>
                <th className="text-left py-3 px-4 text-green-300 font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-green-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedJobs.map((job) => (
                <tr key={job.id} className="border-b border-gray-700/30 hover:bg-green-500/5">
                  <td className="py-3 px-4 text-sm text-gray-300">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300">{job.customer_name}</td>
                  <td className="py-3 px-4 text-sm text-gray-300">{job.service_name}</td>
                  <td className="py-3 px-4 text-sm text-green-300 font-semibold">${job.price}</td>
                  <td className="py-3 px-4">
                    <Badge className={`text-xs ${getStatusBadge(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStatusChange(job.id, 'completed')}
                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-1"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteJob(job.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAndSortedJobs.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No jobs found matching the current filter.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}