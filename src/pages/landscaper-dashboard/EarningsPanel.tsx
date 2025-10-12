import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/lib/ConfigContext';
import PayoutDashboard from '@/components/landscaper/PayoutDashboard';
import EarningsGraph from '@/components/landscaper/EarningsGraph';


function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl ring-1 ring-emerald-500/20 shadow-[0_0_25px_-10px_rgba(52,211,153,0.25)] p-4 sm:p-6 lg:p-8">
      {children}
    </section>
  );
}

export default function EarningsPanel() {
  const supabase = useSupabaseClient();
  const [earnings, setEarnings] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadEarningsData();
  }, [supabase]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .eq('landscaper_id', user.id)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false });

        if (jobsError) throw jobsError;

        const earningsData = jobsData?.map(job => ({
          id: job.id,
          jobId: job.id,
          jobTitle: job.service_type || 'Service',
          amount: job.price || job.amount || 0,
          status: job.payout_status || 'pending_payout',
          completedDate: job.completed_at || job.updated_at,
          client: job.customer_name || 'Client',
          payoutDate: job.payout_date
        })) ?? [];

        const { data: payoutsData, error: payoutsError } = await supabase
          .from('payouts')
          .select('*')
          .eq('landscaper_id', user.id)
          .order('created_at', { ascending: false });

        if (payoutsError) throw payoutsError;

        setEarnings(earningsData);
        setPayouts(payoutsData ?? []);
      }
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEarnings = earnings?.filter(earning => {
    if (!earning?.completedDate) return false;
    const earningDate = new Date(earning.completedDate);
    const now = new Date();
    
    switch (timeFilter) {
      case 'week':
        return (now.getTime() - earningDate.getTime()) <= (7 * 24 * 60 * 60 * 1000);
      case 'month':
        return (now.getTime() - earningDate.getTime()) <= (30 * 24 * 60 * 60 * 1000);
      case 'year':
        return (now.getTime() - earningDate.getTime()) <= (365 * 24 * 60 * 60 * 1000);
      default:
        return true;
    }
  }) ?? [];

  const totalEarnings = filteredEarnings?.reduce((sum, earning) => sum + (earning?.amount ?? 0), 0) ?? 0;
  const pendingPayouts = earnings?.filter(e => e?.status === 'pending_payout')?.reduce((sum, earning) => sum + (earning?.amount ?? 0), 0) ?? 0;
  const completedJobs = filteredEarnings?.length ?? 0;

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Panel>
          <div className="text-emerald-300/70 text-center py-8">Loading earnings...</div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <Panel>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-emerald-300">Earnings & Payouts</h2>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'week', label: 'Week' },
                { key: 'month', label: 'Month' },
                { key: 'year', label: 'Year' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setTimeFilter(filter.key as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    timeFilter === filter.key
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                      : 'bg-black/40 text-emerald-300/70 border border-emerald-500/25 hover:bg-black/60'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-6 bg-black/40 border border-emerald-500/25 rounded-xl">
              <div className="text-3xl font-bold text-emerald-400">${totalEarnings?.toFixed(2) ?? '0.00'}</div>
              <div className="text-sm text-emerald-300/70 mt-2">Total Earnings</div>
            </div>
            <div className="text-center p-6 bg-black/40 border border-emerald-500/25 rounded-xl">
              <div className="text-3xl font-bold text-yellow-400">${pendingPayouts?.toFixed(2) ?? '0.00'}</div>
              <div className="text-sm text-emerald-300/70 mt-2">Pending Payouts</div>
            </div>
            <div className="text-center p-6 bg-black/40 border border-emerald-500/25 rounded-xl">
              <div className="text-3xl font-bold text-blue-400">{completedJobs}</div>
              <div className="text-sm text-emerald-300/70 mt-2">Completed Jobs</div>
            </div>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-emerald-300">Recent Earnings</h3>
          {filteredEarnings?.length === 0 ? (
            <div className="text-center py-12 text-emerald-300/70">
              <p>No earnings found for the selected time period.</p>
              <p className="text-sm text-emerald-300/50 mt-2">Complete jobs to start earning</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEarnings?.slice(0, 10)?.map((earning) => (
                <div key={earning?.id} className="bg-black/40 border border-emerald-500/25 rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-emerald-300 text-base">{earning?.jobTitle ?? 'Service'}</h4>
                      <p className="text-sm text-emerald-300/70 mt-1">Client: {earning?.client ?? 'Unknown'}</p>
                      <p className="text-xs text-emerald-300/60 mt-1">
                        Completed: {earning?.completedDate ? new Date(earning.completedDate).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-emerald-400">${earning?.amount?.toFixed(2) ?? '0.00'}</div>
                      <div className={`text-sm font-medium mt-1 ${
                        earning?.status === 'paid_out' ? 'text-emerald-400' :
                        earning?.status === 'pending_payout' ? 'text-yellow-400' : 'text-blue-400'
                      }`}>
                        {earning?.status === 'paid_out' ? 'Paid Out' :
                         earning?.status === 'pending_payout' ? 'Pending' : 'Completed'}
                      </div>
                    </div>
                  </div>
                </div>
              )) ?? []}
            </div>
          )}
        </div>
      </Panel>

      {payouts?.length > 0 && (
        <Panel>
          <PayoutDashboard />
        </Panel>
      )}
    </div>
  );
}
