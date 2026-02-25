import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { getUserRoles } from '@/hooks/useRole';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Job } from '@/types/job';

const NewRequests: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acceptingJob, setAcceptingJob] = useState<string | null>(null);
  const [landscaperProfile, setLandscaperProfile] = useState<any>(null);

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const fetchPendingJobs = async () => {
    console.log('[NEW REQUESTS] Starting data load...');
    try {
      setLoading(true);
      
      // Also load landscaper profile for job acceptance
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: landscaper } = await supabase
          .from('landscapers')
          .select('id, email, first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle();
        setLandscaperProfile(landscaper);
      }
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`id, customer_name, service_address, service_type, preferred_date, price, selected_services, notes, status`)
        .eq('status', 'pending')
        .is('landscaper_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[NEW REQUESTS]', error);
        setLoadError('Data could not be loaded in this preview, but you are still signed in.');
      } else {
        console.log('[NEW REQUESTS] Jobs loaded:', data?.length || 0);
        setJobs(data || []);
        setLoadError(null);
      }
    } catch (err: any) {
      console.error('[NEW REQUESTS]', err);
      setLoadError('Data could not be loaded in this preview, but you are still signed in.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (jobId: string) => {
    try {
      setAcceptingJob(jobId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { role } = await getUserRoles();
      if (role !== 'landscaper') throw new Error('Only landscapers can accept jobs');

      // Build update payload with ALL required fields - never conditionally omit any
      // These 4 fields are REQUIRED for RLS to pass:
      const updatePayload: Record<string, any> = {
        status: 'assigned',
        is_available: false,
        assigned_to: user.id,
        landscaper_id: landscaperProfile?.id || user.id, // Use landscaperProfile.id if available
        updated_at: new Date().toISOString()
      };

      // Optional fields
      if (landscaperProfile?.email) {
        updatePayload.landscaper_email = landscaperProfile.email;
      }

      // CRITICAL: Explicitly remove any non-existent fields that could cause PGRST204 errors
      // These columns do NOT exist in the jobs table schema:
      delete updatePayload.accepted_at;
      delete updatePayload.acceptance_date;
      delete updatePayload.accepted_by;

      // Log the final payload actually sent to Supabase for verification
      console.log('[NewRequests] Accept Job - Final Update Payload:', {
        jobId,
        updatePayload,
        authUserId: user.id,
        landscaperProfileId: landscaperProfile?.id,
        fieldsIncluded: Object.keys(updatePayload),
      });

      const { data, error } = await supabase
        .from('jobs')
        .update(updatePayload)
        .eq('id', jobId)
        .select();

      // Log the Supabase response for debugging
      console.log('[NewRequests] Accept Job - Supabase Response:', {
        success: !error,
        data,
        error,
        jobId,
      });

      if (error) throw error;

      try {
        await supabase.functions.invoke('job-acceptance-notification', { body: { jobId, landscaperId: user.id } });
      } catch (notificationError) {
        console.warn('[NEW REQUESTS] Notification failed:', notificationError);
      }

      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (err: any) {
      console.error('[NEW REQUESTS] Accept error:', err);
      setError(err?.message || 'Failed to accept job');
    } finally {
      setAcceptingJob(null);
    }
  };

  if (loadError) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md text-center space-y-4">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-green-400">Requests Unavailable</h2>
            <p className="text-green-200/70">{loadError}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-green-500/20 text-green-200 border border-green-500/50 rounded-xl hover:bg-green-500/30">Refresh</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-400" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-black text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-12 text-green-400 animate-pulse">New Job Requests</h1>

          {error && (
            <Alert className="mb-6 bg-red-900/20 border-red-500">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          {(jobs || []).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No new job requests available</p>
              <Button onClick={fetchPendingJobs} className="mt-4 bg-green-500 hover:bg-green-600 text-black">Refresh</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(jobs || []).map((job) => (
                <Card key={job?.id || Math.random()} className="bg-black/80 border-2 border-green-500/30 hover:border-green-400 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-green-400 text-xl font-bold">{job?.service_type || 'General Service'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div><p className="text-gray-400 text-sm font-medium mb-1">Customer:</p><p className="text-white">{job?.customer_name || 'Unknown'}</p></div>
                    <div><p className="text-gray-400 text-sm font-medium mb-1">Address:</p><p className="text-white">{job?.service_address || 'TBA'}</p></div>
                    <div><p className="text-gray-400 text-sm font-medium mb-1">Preferred Date:</p><p className="text-white">{job?.preferred_date ? new Date(job.preferred_date).toLocaleDateString() : 'TBA'}</p></div>
                    {job?.selected_services && job.selected_services.length > 0 && (
                      <div><p className="text-gray-400 text-sm font-medium mb-1">Services:</p><p className="text-white text-sm">{job.selected_services.join(', ')}</p></div>
                    )}
                    <div><p className="text-gray-400 text-sm font-medium mb-1">Price:</p><p className="text-green-400 font-bold text-lg">${job?.price || 0}</p></div>
                    {job?.notes && <div><p className="text-gray-400 text-sm font-medium mb-1">Notes:</p><p className="text-white text-sm">{job.notes}</p></div>}
                    <Button onClick={() => job?.id && handleAcceptJob(job.id)} disabled={acceptingJob === job?.id} className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 rounded-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                      {acceptingJob === job?.id ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Accepting...</>) : 'Accept Job'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default NewRequests;
