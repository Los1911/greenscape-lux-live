import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/lib/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { waitForSupabaseSession } from '@/lib/supabaseHydration';
import PayoutDashboard from '@/components/landscaper/PayoutDashboard';
import EarningsGoalCard from '@/components/earnings/EarningsGoalCard';
import { RefreshCw } from 'lucide-react';

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl ring-1 ring-emerald-500/20 shadow-[0_0_25px_-10px_rgba(52,211,153,0.25)] p-4 sm:p-6 lg:p-8">
      {children}
    </section>
  );
}

export default function EarningsPanel() {
  const supabase = useSupabaseClient();
  const { user, loading: authLoading } = useAuth();
  const [earnings, setEarnings] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');
  const [periodEarnings, setPeriodEarnings] = useState({ weekly: 0, monthly: 0 });

  useEffect(() => {
    if (authLoading) return;
    loadEarningsData();
  }, [supabase, authLoading, user]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      await waitForSupabaseSession();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.id) {
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('*')
          .eq('landscaper_id', authUser.id)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false });

        const earningsData = jobsData?.map(job => ({
          id: job.id, jobId: job.id, jobTitle: job.service_type || 'Service',
          amount: job.price || 0, status: job.payout_status || 'pending_payout',
          completedDate: job.completed_at || job.updated_at, client: job.customer_name || 'Client'
        })) ?? [];

        // Calculate weekly and monthly earnings
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        weekStart.setHours(0, 0, 0, 0);
        
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const weeklyTotal = earningsData
          .filter(e => e.completedDate && new Date(e.completedDate) >= weekStart)
          .reduce((sum, e) => sum + (e.amount || 0), 0);

        const monthlyTotal = earningsData
          .filter(e => e.completedDate && new Date(e.completedDate) >= monthStart)
          .reduce((sum, e) => sum + (e.amount || 0), 0);

        setPeriodEarnings({ weekly: weeklyTotal, monthly: monthlyTotal });

        const { data: payoutsData } = await supabase
          .from('payouts')
          .select('*')
          .eq('landscaper_id', authUser.id)
          .order('created_at', { ascending: false });

        setEarnings(earningsData);
        setPayouts(payoutsData ?? []);
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEarnings = earnings?.filter(earning => {
    if (!earning?.completedDate) return false;
    const earningDate = new Date(earning.completedDate);
    const now = new Date();
    const days = timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 365;
    return (now.getTime() - earningDate.getTime()) <= (days * 24 * 60 * 60 * 1000);
  }) ?? [];

  const totalEarnings = filteredEarnings.reduce((sum, e) => sum + (e?.amount ?? 0), 0);
  const pendingPayouts = earnings?.filter(e => e?.status === 'pending_payout').reduce((sum, e) => sum + (e?.amount ?? 0), 0) ?? 0;

  // Auth loading guard
  if (authLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Panel><div className="text-emerald-300/70 text-center py-8">Loading earnings...</div></Panel>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Earnings Goal Card - Prominent placement at top */}
      <EarningsGoalCard 
        currentEarnings={totalEarnings}
        periodEarnings={periodEarnings}
      />

      <Panel>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <h2 className="text-xl font-bold text-emerald-300">Earnings & Payouts</h2>
            <div className="flex gap-2">
              {['week', 'month', 'year'].map((key) => (
                <button key={key} onClick={() => setTimeFilter(key as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${timeFilter === key ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50' : 'bg-black/40 text-emerald-300/70 border border-emerald-500/25'}`}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-6 bg-black/40 border border-emerald-500/25 rounded-xl">
              <div className="text-3xl font-bold text-emerald-400">${totalEarnings.toFixed(2)}</div>
              <div className="text-sm text-emerald-300/70 mt-2">Total Earnings</div>
            </div>
            <div className="text-center p-6 bg-black/40 border border-emerald-500/25 rounded-xl">
              <div className="text-3xl font-bold text-yellow-400">${pendingPayouts.toFixed(2)}</div>
              <div className="text-sm text-emerald-300/70 mt-2">Pending Payouts</div>
            </div>
            <div className="text-center p-6 bg-black/40 border border-emerald-500/25 rounded-xl">
              <div className="text-3xl font-bold text-blue-400">{filteredEarnings.length}</div>
              <div className="text-sm text-emerald-300/70 mt-2">Completed Jobs</div>
            </div>
          </div>
        </div>
      </Panel>

      <Panel>
        <h3 className="text-lg font-semibold text-emerald-300 mb-4">Recent Earnings</h3>
        {filteredEarnings.length === 0 ? (
          <div className="text-center py-12 text-emerald-300/70">No earnings found.</div>
        ) : (
          <div className="space-y-3">
            {filteredEarnings.slice(0, 10).map((earning) => (
              <div key={earning.id} className="bg-black/40 border border-emerald-500/25 rounded-xl p-5 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-emerald-300">{earning.jobTitle}</h4>
                  <p className="text-sm text-emerald-300/70">Client: {earning.client}</p>
                  <p className="text-xs text-emerald-300/60">{earning.completedDate ? new Date(earning.completedDate).toLocaleDateString() : 'Unknown'}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-emerald-400">${earning.amount?.toFixed(2)}</div>
                  <div className={`text-sm ${earning.status === 'paid_out' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    {earning.status === 'paid_out' ? 'Paid' : 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {payouts.length > 0 && <Panel><PayoutDashboard /></Panel>}
    </div>
  );
}

