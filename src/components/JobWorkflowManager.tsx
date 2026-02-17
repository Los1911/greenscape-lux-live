import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, MapPin, DollarSign } from 'lucide-react';
import { Job } from '@/types/job';

const JobWorkflowManager: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('jobs')
        .select(
          'id, service_name, service_type, service_address, status, landscaper_id, created_at, price, customer_name, preferred_date'
        )
        .eq('landscaper_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status })
        .eq('id', jobId);

      if (error) throw error;

      fetchJobs();

      if (status === 'completed') {
        navigate(`/job-complete/${jobId}`);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'active':
        return 'bg-orange-500';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading jobs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Job Management</h2>
        <Button onClick={() => navigate('/new-requests')}>
          View New Requests
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {job.service_name}
                </CardTitle>
                <Badge className={`${getStatusColor(job.status)} text-white`}>
                  {job.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm">
                {job.service_type}
              </p>

              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-1" />
                {job.service_address}
              </div>

              <div className="flex items-center text-sm font-medium">
                <DollarSign className="w-4 h-4 mr-1" />
                ${job.price}
              </div>

              <div className="flex gap-2 mt-4">

                {/* Client accepted → now scheduled */}
                {job.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => updateJobStatus(job.id, 'scheduled')}
                    className="flex-1"
                  >
                    Accept
                  </Button>
                )}

                {/* Scheduled → Start Work */}
                {job.status === 'scheduled' && (
                  <Button
                    size="sm"
                    onClick={() => updateJobStatus(job.id, 'active')}
                    className="flex-1"
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Start Work
                  </Button>
                )}

                {/* Active → Complete */}
                {job.status === 'active' && (
                  <Button
                    size="sm"
                    onClick={() => updateJobStatus(job.id, 'completed')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete
                  </Button>
                )}

              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No jobs found</p>
          <Button onClick={() => navigate('/new-requests')}>
            Browse Available Jobs
          </Button>
        </div>
      )}
    </div>
  );
};

export default JobWorkflowManager;
