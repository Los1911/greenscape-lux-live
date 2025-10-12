import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/lib/ConfigContext';
import { LiveLandscaperStats } from '@/components/landscaper/LiveLandscaperStats';
import { LiveJobTracker } from '@/components/tracking/LiveJobTracker';
import { LiveNotificationSystem } from '@/components/notifications/LiveNotificationSystem';
import { StripeConnectOnboardingCard } from '@/components/landscaper/StripeConnectOnboardingCard';

type LandscaperProfile = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  approved?: boolean;
  insurance_file?: string | null;
  license_file?: string | null;
}

interface OverviewPanelProps {
  profile: LandscaperProfile | null;
  isAvailable: boolean;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl ring-1 ring-emerald-500/20 shadow-[0_0_25px_-10px_rgba(52,211,153,0.25)] p-4 sm:p-6 lg:p-8 ${className}`}>
      {children}
    </section>
  );
}

export default function OverviewPanel({ profile, isAvailable }: OverviewPanelProps) {
  const supabase = useSupabaseClient();
  const [landscaperId, setLandscaperId] = useState<string>('');
  const [stats, setStats] = useState({
    totalEarnings: 0,
    completedJobs: 0,
    activeJobs: 0,
    pendingPayouts: 0
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          setLandscaperId(user.id);
          
          const { data: jobsData } = await supabase
            .from('jobs')
            .select('*')
            .eq('landscaper_id', user.id)
            .order('created_at', { ascending: false });

          const completed = jobsData?.filter(job => job.status === 'completed')?.length ?? 0;
          const active = jobsData?.filter(job => ['assigned', 'in_progress'].includes(job.status))?.length ?? 0;
          const totalEarnings = jobsData?.filter(job => job.status === 'completed')?.reduce((sum, job) => sum + (job.amount ?? 0), 0) ?? 0;

          const { data: payoutsData } = await supabase
            .from('payouts')
            .select('amount')
            .eq('landscaper_id', user.id)
            .eq('status', 'pending');
          
          const pendingPayouts = payoutsData?.reduce((sum, payout) => sum + (payout.amount ?? 0), 0) ?? 0;

          setStats({
            totalEarnings,
            completedJobs: completed,
            activeJobs: active,
            pendingPayouts
          });

          setRecentJobs(jobsData?.slice(0, 5) ?? []);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [supabase, profile]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {landscaperId && profile?.email && (
        <StripeConnectOnboardingCard
          landscaperId={landscaperId}
          email={profile.email}
          businessName={`${profile.first_name} ${profile.last_name} Landscaping`}
        />
      )}

      <Panel>
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-emerald-300">Dashboard Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-black/40 border border-emerald-500/25 rounded-xl">
              <div className="text-3xl font-bold text-emerald-400">${stats.totalEarnings.toFixed(2)}</div>
              <div className="text-sm text-emerald-300/70 mt-2">Total Earnings</div>
            </div>
            <div className="text-center p-4 bg-black/40 border border-emerald-500/25 rounded-xl">
              <div className="text-3xl font-bold text-emerald-400">{stats.completedJobs}</div>
              <div className="text-sm text-emerald-300/70 mt-2">Completed Jobs</div>
            </div>
            <div className="text-center p-4 bg-black/40 border border-emerald-500/25 rounded-xl">
              <div className="text-3xl font-bold text-yellow-400">{stats.activeJobs}</div>
              <div className="text-sm text-emerald-300/70 mt-2">Active Jobs</div>
            </div>
            <div className="text-center p-4 bg-black/40 border border-emerald-500/25 rounded-xl">
              <div className="text-3xl font-bold text-blue-400">${stats.pendingPayouts.toFixed(2)}</div>
              <div className="text-sm text-emerald-300/70 mt-2">Pending Payouts</div>
            </div>
          </div>
          
          <div className="p-5 rounded-xl bg-black/40 border border-emerald-500/25">
            <div className="flex items-center justify-between">
              <span className="text-emerald-300 font-medium">Current Status:</span>
              <span className={`font-semibold ${isAvailable ? 'text-emerald-400' : 'text-gray-400'}`}>
                {isAvailable ? '🟢 Available for Jobs' : '🔴 Not Available'}
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel>
          {loading ? (
            <div className="text-emerald-300/70 text-center py-8">Loading jobs...</div>
          ) : recentJobs.length > 0 ? (
            <LiveJobTracker jobs={recentJobs} />
          ) : (
            <div className="text-center py-8">
              <p className="text-emerald-300/70">No recent jobs found</p>
              <p className="text-sm text-emerald-300/50 mt-2">Jobs will appear here once assigned</p>
            </div>
          )}
        </Panel>
        <Panel>
          <LiveNotificationSystem clientId={profile?.email ?? 'landscaper'} />
        </Panel>
      </div>

      <Panel>
        <LiveLandscaperStats />
      </Panel>
    </div>
  );
}
