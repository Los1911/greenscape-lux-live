import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AppLayout from '@/components/AppLayout';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Job } from '@/types/job';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle2 className="w-4 h-4" />;
    case 'cancelled': return <XCircle className="w-4 h-4" />;
    case 'in_progress':
    case 'assigned': return <AlertCircle className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-900/30 text-green-400 border-green-500/30';
    case 'cancelled': return 'bg-red-900/30 text-red-400 border-red-500/30';
    case 'in_progress':
    case 'assigned': return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30';
    default: return 'bg-blue-900/30 text-blue-400 border-blue-500/30';
  }
};

// Get human-readable status text for clients
const getStatusText = (status: string) => {
  switch (status) {
    case 'available':
    case 'pending': return 'PENDING ACCEPTANCE';
    case 'assigned': return 'LANDSCAPER ASSIGNED';
    case 'in_progress': return 'IN PROGRESS';
    case 'completed': return 'COMPLETED';
    case 'cancelled': return 'CANCELLED';
    default: return status.replace('_', ' ').toUpperCase();
  }
};


export default function ClientHistory() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobHistory();
  }, []);

  const fetchJobHistory = async () => {
    console.log('[CLIENT HISTORY] Starting data load...');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('[CLIENT HISTORY] User error:', userError);
        setLoadError('Data could not be loaded in this preview, but you are still signed in.');
        setLoading(false);
        return;
      }
      if (!user?.id) {
        console.log('[CLIENT HISTORY] No user found');
        setLoading(false);
        return;
      }

      const userEmail = user.email || '';
      console.log('[CLIENT HISTORY] Fetching jobs for user:', user.id, 'email:', userEmail);

      // Query jobs where ANY of the following match the logged-in client:
      // - client_id = auth.user.id
      // - user_id = auth.user.id
      // - client_email = auth.user.email
      let orConditions = `user_id.eq.${user.id},client_id.eq.${user.id}`;
      if (userEmail) {
        orConditions += `,client_email.eq.${userEmail}`;
      }

      console.log('[CLIENT HISTORY] Query OR conditions:', orConditions);

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .or(orConditions)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[CLIENT HISTORY]', error);
        setLoadError('Data could not be loaded in this preview, but you are still signed in.');
      } else {
        console.log('[CLIENT HISTORY] Jobs loaded:', data?.length || 0);
        setJobs(data || []);
        setLoadError(null);
      }
    } catch (error) {
      console.error('[CLIENT HISTORY]', error);
      setLoadError('Data could not be loaded in this preview, but you are still signed in.');
    } finally {
      setLoading(false);
    }
  };

  if (loadError) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black flex items-center justify-center p-4">
          <div className="max-w-md text-center space-y-4">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-green-400">History Unavailable</h2>
            <p className="text-green-200/70">{loadError}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-green-500/20 text-green-200 border border-green-500/50 rounded-xl hover:bg-green-500/30">Refresh</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AnimatedBackground />
      <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black p-4 lg:p-8 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate('/client-dashboard')} className="text-green-400 hover:text-green-300">
              <ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard
            </Button>
          </div>

          <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl ring-1 ring-green-500/20 shadow-[0_0_25px_-10px_rgba(34,197,94,0.25)]">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-6 h-6 text-green-400" />
                <h1 className="text-2xl font-semibold text-green-300">Service History</h1>
              </div>

              {loading ? (
                <div className="text-center py-8"><div className="text-gray-400">Loading your service history...</div></div>
              ) : (jobs || []).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">No history available yet.</div>
                  <p className="text-sm text-gray-500">Your completed and past services will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(jobs || []).map(job => (
                    <div key={job?.id || Math.random()} className="rounded-xl bg-black/40 border border-gray-700/50 p-4 hover:bg-black/60 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-medium text-white mb-1">{job?.service_name || job?.service_type || 'Landscaping Service'}</h3>
                          <p className="text-sm text-gray-400">
                            {job?.created_at ? new Date(job.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date unknown'}
                          </p>
                        </div>
                        <Badge className={`text-xs px-3 py-1 rounded-full flex items-center gap-2 ${getStatusColor(job?.status || 'pending')}`}>
                          {getStatusIcon(job?.status || 'pending')}
                          {getStatusText(job?.status || 'pending')}
                        </Badge>
                      </div>
                      {job?.service_type && <p className="text-sm text-gray-300 mb-2">Type: {job.service_type}</p>}
                      {job?.service_address && <p className="text-sm text-gray-400 mb-2">📍 {job.service_address}</p>}
                      {job?.landscaper_email && (job?.status === 'assigned' || job?.status === 'accepted' || job?.status === 'in_progress' || job?.status === 'completed') && (
                        <p className="text-sm text-blue-400 mb-2">👤 Landscaper: {job.landscaper_email}</p>
                      )}
                      {job?.price != null && <div className="text-green-400 font-semibold">${(job.price || 0).toFixed(2)}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
