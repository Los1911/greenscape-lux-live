import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { isUUID } from '@/lib/isUUID';
import { useToast } from '@/components/SharedUI/Toast';

type JobRow = {
  id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | string;
  earnings: number | null;
  created_at: string | null;
  completed_at: string | null;
  customer_name: string | null;
  client_email: string | null;
  landscaper_id: string | null;
  assigned_email: string | null;
};

type Props = {
  className?: string;
  onChanged?: () => void;
};

export default function LandscaperUpcomingJobs({ className, onChanged }: Props) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [mine, setMine] = useState<JobRow[]>([]);
  const [nearby, setNearby] = useState<JobRow[]>([]);
  const [landscaperId, setLandscaperId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loadingJobs, setLoadingJobs] = useState<Record<string, boolean>>({});
  const { showToast } = useToast();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data: userData, error: uErr } = await supabase.auth.getUser();
        if (uErr || !userData.user) throw new Error('Not authenticated');

        const { data: lRows, error: lErr } = await supabase
          .from('v_landscapers')
          .select('id')
          .eq('user_id', userData.user.id)
          .limit(1)
          .maybeSingle();

        if (lErr) throw lErr;
        if (!lRows?.id) throw new Error('No landscaper profile found');
        if (!mounted) return;

        setLandscaperId(lRows.id);
        setEmail(userData.user.email);

        // Fetch my assigned jobs
        const { data: myJobs, error: myErr } = await supabase
          .from('jobs')
          .select('id, status, earnings, created_at, completed_at, customer_name, client_email, landscaper_id, assigned_email')
          .or(`landscaper_id.eq.${lRows.id},assigned_email.eq.${userData.user.email}`)
          .in('status', ['scheduled', 'in_progress'])
          .order('created_at', { ascending: true });

        if (myErr) throw myErr;

        // Fetch nearby unassigned jobs
        const { data: nearbyJobs, error: nearbyErr } = await supabase
          .from('jobs')
          .select('id, status, earnings, created_at, completed_at, customer_name, client_email, landscaper_id, assigned_email')
          .is('landscaper_id', null)
          .eq('status', 'scheduled')
          .order('created_at', { ascending: true })
          .limit(10);

        if (nearbyErr) throw nearbyErr;

        if (!mounted) return;
        setMine(myJobs ?? []);
        setNearby(nearbyJobs ?? []);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message ?? 'Failed to load jobs.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const setJobLoading = (jobId: string, loading: boolean) => {
    setLoadingJobs(prev => ({ ...prev, [jobId]: loading }));
  };

  const handleStart = async (job: JobRow) => {
    if (!job?.id || !isUUID(job.id)) {
      showToast('Invalid job id', 'error');
      console.error('[StartJob] invalid', job);
      return;
    }

    setJobLoading(job.id, true);
    try {
      const { error } = await supabase.from('jobs')
        .update({ status: 'in_progress' })
        .eq('id', job.id);

      if (error) {
        showToast('Could not start job', 'error');
        console.error('[StartJob] fail', error);
        return;
      }

      showToast('Job started', 'success');
      onChanged?.();
      
      // Update local state
      setMine(prev => prev.map(j => j.id === job.id ? { ...j, status: 'in_progress' } : j));
    } finally {
      setJobLoading(job.id, false);
    }
  };

  const handleRequest = async (job: JobRow) => {
    if (!job?.id || !isUUID(job.id)) {
      showToast('Invalid job id', 'error');
      return;
    }

    setJobLoading(job.id, true);
    try {
      const { error } = await supabase.from('jobs')
        .update({ landscaper_id: landscaperId, assigned_email: email })
        .eq('id', job.id)
        .is('landscaper_id', null);

      if (error) {
        showToast('Could not request job', 'error');
        return;
      }

      showToast('Job added to your queue', 'success');
      onChanged?.();
      
      // Move from nearby to mine
      setNearby(prev => prev.filter(j => j.id !== job.id));
      setMine(prev => [...prev, { ...job, landscaper_id: landscaperId, assigned_email: email }]);
    } finally {
      setJobLoading(job.id, false);
    }
  };

  return (
    <div className={`rounded-2xl border border-emerald-900/30 bg-[#0F1513] shadow-[0_0_40px_rgba(52,211,153,0.08)] ${className ?? ''}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-900/20">
        <h3 className="text-emerald-300 font-semibold tracking-wide">Upcoming Jobs</h3>
        {loading ? <span className="text-xs text-emerald-200/60">Loading…</span> : null}
      </div>

      {err && (
        <div className="px-5 py-3 text-sm text-rose-300 bg-rose-900/20 border-t border-rose-800/40">
          {err}
        </div>
      )}

      {mine.length === 0 && !loading && (
        <div className="px-5 py-4">
          <div className="text-xs text-zinc-400">No assigned jobs right now.</div>
          {nearby.length > 0 && (
            <>
              <div className="mt-2 text-xs text-emerald-400/90">Available near you</div>
              <div className="mt-3 space-y-2">
                 {nearby.map((job) => {
                   const label = job.customer_name ?? 'Client';
                   const when = job.completed_at ?? job.created_at;
                   return (
                   <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-emerald-900/10 border border-emerald-900/20">
                     <div className="flex-1 min-w-0">
                       <div className="text-sm text-emerald-100 font-medium truncate">{label}</div>
                       <div className="text-xs text-emerald-300/60">
                         {when ? new Date(when).toLocaleDateString() : 'TBD'} • ${Number(job.earnings ?? 0).toFixed(2)}
                       </div>
                     </div>
                     <button
                       disabled={loadingJobs[job.id]}
                       onClick={() => handleRequest(job)}
                       className="ml-3 px-3 py-1 rounded text-xs font-medium bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 transition disabled:opacity-50"
                     >
                       {loadingJobs[job.id] ? 'Requesting...' : 'Request'}
                     </button>
                   </div>
                   );
                 })}
              </div>
            </>
          )}
        </div>
      )}

      {mine.length > 0 && (
        <ul className="divide-y divide-emerald-900/20">
           {mine.map((job) => {
             const label = job.customer_name ?? 'Client';
             const when = job.completed_at ?? job.created_at;
             const isLoading = loadingJobs[job.id];

             return (
               <li key={job.id} className="px-5 py-4 grid grid-cols-12 gap-4">
                 <div className="col-span-6 md:col-span-5">
                   <div className="text-emerald-100 font-medium">{label}</div>
                   <div className="text-xs text-emerald-300/60">
                     {when ? new Date(when).toLocaleDateString() : 'TBD'} • ${Number(job.earnings ?? 0).toFixed(2)}
                   </div>
                 </div>
                  <div className="col-span-3 md:col-span-3">
                    <div className="text-xs text-emerald-300/60">When</div>
                    <div className="text-emerald-100">
                      {when ? new Date(when).toLocaleString() : 'TBD'}
                    </div>
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <div className="text-xs text-emerald-300/60">Price</div>
                    <div className="text-emerald-100">${Number(job.earnings ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="col-span-12 md:col-span-2 flex items-center gap-2">
                    <button
                      disabled={isLoading}
                      onClick={() => handleStart(job)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 transition disabled:opacity-50"
                    >
                      {isLoading ? 'Starting...' : job.status === 'scheduled' ? 'Start' : job.status === 'in_progress' ? 'Resume' : 'View'}
                    </button>
                  </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}