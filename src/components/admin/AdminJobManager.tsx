import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Check, Trash2, ChevronDown, ArrowUpDown } from 'lucide-react';
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

  const handleStatusChange = async (jobId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId);
      
      if (error) throw error;
      fetchJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
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
      let aVal, bVal;
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
      return sortOrder === 'asc' ? 
        (aVal > bVal ? 1 : -1) : 
        (aVal < bVal ? 1 : -1);
    });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      accepted: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      in_progress: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      completed: 'bg-green-500/20 text-green-300 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-green-300">Job Management</h2>
          
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black/40 border border-green-500/40 rounded-lg px-4 py-2 text-green-300 
                       focus:border-green-400 focus:ring-1 focus:ring-green-400 appearance-none pr-8"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-green-400 pointer-events-none" />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-green-500/20">
                <th className="text-left py-3 px-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('created_at')}
                    className="text-green-300 hover:text-green-200 p-0 h-auto font-semibold"
                  >
                    Date <ArrowUpDown className="w-3 h-3 ml-1" />
                  </Button>
                </th>
                <th className="text-left py-3 px-4 text-green-300 font-semibold">Client</th>
                <th className="text-left py-3 px-4 text-green-300 font-semibold">Landscaper</th>
                <th className="text-left py-3 px-4 text-green-300 font-semibold">Service</th>
                <th className="text-left py-3 px-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('price')}
                    className="text-green-300 hover:text-green-200 p-0 h-auto font-semibold"
                  >
                    Price <ArrowUpDown className="w-3 h-3 ml-1" />
                  </Button>
                </th>
                <th className="text-left py-3 px-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('status')}
                    className="text-green-300 hover:text-green-200 p-0 h-auto font-semibold"
                  >
                    Status <ArrowUpDown className="w-3 h-3 ml-1" />
                  </Button>
                </th>
                <th className="text-left py-3 px-4 text-green-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedJobs.map((job) => (
                <tr key={job.id} className="border-b border-gray-700/30 hover:bg-green-500/5 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-300">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300">{job.customer_name}</td>
                  <td className="py-3 px-4 text-sm text-gray-300">N/A</td>

                  <td className="py-3 px-4 text-sm text-gray-300">{job.service_name}</td>
                  <td className="py-3 px-4 text-sm text-green-300 font-semibold">${job.price}</td>
                  <td className="py-3 px-4">
                    <Badge className={`text-xs ${getStatusBadge(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {filteredAndSortedJobs.map((job) => (
            <Card key={job.id} className="bg-black/40 border border-gray-700/50 p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="text-sm font-medium text-green-300">{job.service_name}</div>
                <Badge className={`text-xs ${getStatusBadge(job.status)}`}>
                  {job.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="space-y-2 text-sm text-gray-300">
                <div>Client: {job.customer_name}</div>
                <div>Address: {job.service_address || 'N/A'}</div>
                <div>Price: <span className="text-green-300 font-semibold">${job.price}</span></div>
              </div>
              <div className="flex gap-2 mt-3">

                <Button
                  size="sm"
                  onClick={() => handleStatusChange(job.id, 'completed')}
                  className="bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/40"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteJob(job.id)}
                  className="border-red-500/40 text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredAndSortedJobs.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No jobs found matching the current filter.
          </div>
        )}
      </div>
    </Card>
  );
}