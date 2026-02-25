import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimePatch, patchArray } from '@/hooks/useRealtimePatch';
import { LiveLandscaperStats } from '@/components/landscaper/LiveLandscaperStats';
import { StripeConnectOnboardingCard } from '@/components/landscaper/StripeConnectOnboardingCard';
import { LiveGPSTracker } from '@/components/tracking/LiveGPSTracker';
import { BadgesSection } from '@/components/landscaper/BadgesSection';
import { PerformanceInsightsCard } from '@/components/landscaper/PerformanceInsightsCard';
import { PerformancePraiseCard } from '@/components/landscaper/PerformancePraiseCard';
import { TierEligibilityCard } from '@/components/landscaper/TierEligibilityCard';
import EarningsGoalCard from '@/components/earnings/EarningsGoalCard';
import { CollapsibleDashboardCard } from '@/components/shared/CollapsibleDashboardCard';
import { QuickStatusSnapshot } from '@/components/landscaper/QuickStatusSnapshot';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToStripeStatusUpdates, StripeConnectStatus } from '@/services/StripeConnectStatusService';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Award, 
  Activity,
  Sparkles,
  Star
} from 'lucide-react';

interface OverviewPanelProps {
  profile: any;
  isAvailable: boolean;
}


export default function OverviewPanel({ profile, isAvailable }: OverviewPanelProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [landscaperId, setLandscaperId] = useState<string>('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasEarningsGoal, setHasEarningsGoal] = useState<boolean | null>(null);
  
  // Performance summary for collapsed state
  const [performanceSummary, setPerformanceSummary] = useState<{
    overallScore: number;
    trend: 'improving' | 'stable' | 'declining';
    message: string;
  } | null>(null);

  // Badges summary for collapsed state
  const [badgesSummary, setBadgesSummary] = useState<{
    earned: number;
    total: number;
    featuredBadges: string[];
  } | null>(null);

  // ── Realtime: patch jobs array in-place ──
  const jobsSubs = useMemo(() => {
    if (!landscaperId) return [];
    return [
      { table: 'jobs', event: '*' as const, filter: `landscaper_id=eq.${landscaperId}` },
    ];
  }, [landscaperId]);

  const jobsPatcher = useMemo(() => patchArray(setJobs), []);

  useRealtimePatch({
    channelName: `overview-jobs-${landscaperId || 'none'}`,
    subscriptions: jobsSubs,
    enabled: !!landscaperId,
    onEvent: (eventType, table, newRow, oldRow) => {
      if (table === 'jobs') {
        jobsPatcher(eventType, newRow, oldRow);
      }
    },
  });

  // ── Derived stats: recompute whenever jobs array changes ──
  const stats = useMemo(() => {
    const completedJobs = jobs.filter(j => j.status === 'completed');
    const completed = completedJobs.length;
    const active = jobs.filter(j => ['assigned', 'active'].includes(j.status)).length;

    const earnings = completedJobs.reduce((sum: number, j: any) => sum + (j.price || 0), 0);
    return { totalEarnings: earnings, completedJobs: completed, activeJobs: active, pendingPayouts: 0 };
  }, [jobs]);
  const activeJobId = useMemo(() => {
    const activeJob = jobs.find(j => j.status === 'active');
    return activeJob?.id || null;
  }, [jobs]);


  const periodEarnings = useMemo(() => {
    const completedJobs = jobs.filter(j => j.status === 'completed');
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekly = completedJobs
      .filter(j => j.completed_at && new Date(j.completed_at) >= weekStart)
      .reduce((sum: number, j: any) => sum + (j.price || 0), 0);
    const monthly = completedJobs
      .filter(j => j.completed_at && new Date(j.completed_at) >= monthStart)
      .reduce((sum: number, j: any) => sum + (j.price || 0), 0);

    return { weekly, monthly };
  }, [jobs]);


  useEffect(() => {
    // Wait for auth to be ready
    if (authLoading) return;
    
    const loadData = async () => {
      try {
        if (!user?.id) {
          setLoading(false);
          return;
        }

        const { data: landscaper } = await supabase
          .from('landscapers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (landscaper?.id) {
          setLandscaperId(landscaper.id);

          const { data: jobsData } = await supabase
            .from('jobs')
            .select('*')
            .eq('landscaper_id', landscaper.id);

          // Set jobs array — stats are derived via useMemo above
          setJobs(jobsData || []);

          // Check if user has an earnings goal set
          const { data: goalData } = await supabase
            .from('earnings_goals')
            .select('id')
            .eq('landscaper_id', user.id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          
          setHasEarningsGoal(!!goalData);

          // Load badges summary for collapsed state
          await loadBadgesSummary(landscaper.id);
          
          // Load performance summary for collapsed state
          const completedCount = (jobsData || []).filter((j: any) => j.status === 'completed').length;
          await loadPerformanceSummary(landscaper.id, completedCount);
        }
      } catch (error) {
        console.error('[OverviewPanel] Error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [authLoading, user]);


  // Load badges summary for collapsed state
  const loadBadgesSummary = async (lsId: string) => {
    try {
      const { data: allBadges } = await supabase
        .from('badges')
        .select('id, name')
        .eq('is_active', true);

      const { data: earnedBadges } = await supabase
        .from('landscaper_badges')
        .select('badge_id')
        .eq('landscaper_id', lsId)
        .is('revoked_at', null);

      const earnedIds = new Set((earnedBadges || []).map(b => b.badge_id));
      const total = allBadges?.length || 0;
      const earned = earnedIds.size;

      // Get names of first 3 earned badges as featured
      const featuredBadges = (allBadges || [])
        .filter(b => earnedIds.has(b.id))
        .slice(0, 3)
        .map(b => b.name);

      setBadgesSummary({ earned, total, featuredBadges });
    } catch (error) {
      console.error('[OverviewPanel] Error loading badges summary:', error);
    }
  };

  // Load performance summary for collapsed state
  const loadPerformanceSummary = async (lsId: string, completedCount: number) => {
    try {
      const { data: landscaper } = await supabase
        .from('landscapers')
        .select('average_rating')
        .eq('id', lsId)
        .single();

      const rating = landscaper?.average_rating || 0;
      
      // Calculate a simple overall score based on available data
      const ratingScore = rating > 0 ? (rating / 5) * 40 : 20;
      const completionScore = Math.min(completedCount * 2, 40);
      const overallScore = Math.round(ratingScore + completionScore + 20);

      // Determine trend based on recent activity
      const trend: 'improving' | 'stable' | 'declining' = 
        completedCount > 10 ? 'improving' : 
        completedCount > 0 ? 'stable' : 'stable';

      // Generate motivational message
      let message = '';
      if (overallScore >= 80) {
        message = 'Excellent performance! Keep up the great work.';
      } else if (overallScore >= 60) {
        message = 'Good progress! A few more jobs will boost your score.';
      } else {
        message = 'Complete more jobs to improve your performance score.';
      }

      setPerformanceSummary({ overallScore, trend, message });
    } catch (error) {
      console.error('[OverviewPanel] Error loading performance summary:', error);
    }
  };

  // Subscribe to realtime Stripe Connect status updates from webhook
  useEffect(() => {
    if (!landscaperId) return;

    const unsubscribe = subscribeToStripeStatusUpdates(
      supabase,
      landscaperId,
      (status: StripeConnectStatus) => {
        console.log('[OverviewPanel] Stripe status updated via webhook:', status);
        
        // Show toast notification when status changes
        if (status.stripe_account_status === 'active' && status.stripe_charges_enabled && status.stripe_payouts_enabled) {
          toast({
            title: 'Stripe Account Verified!',
            description: 'Your account is now fully verified and ready to receive payments.',
          });
        } else if (status.stripe_account_status === 'pending_verification') {
          toast({
            title: 'Verification In Progress',
            description: 'Stripe is reviewing your account information.',
          });
        }
      }
    );

    return unsubscribe;
  }, [landscaperId, toast]);

  // Memoized collapsed summaries
  const earningsGoalSummary = useMemo(() => {
    if (hasEarningsGoal === null) return null;
    if (!hasEarningsGoal) {
      return (
        <span className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-emerald-400" />
          <span>Set a goal to track your earnings progress</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span>Goal active — expand to view progress</span>
      </span>
    );
  }, [hasEarningsGoal]);

  const performanceCollapsedSummary = useMemo(() => {
    if (!performanceSummary) return null;
    const trendIcon = performanceSummary.trend === 'improving' 
      ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
      : performanceSummary.trend === 'declining'
        ? <TrendingUp className="w-3.5 h-3.5 text-amber-400 rotate-180" />
        : <Star className="w-3.5 h-3.5 text-blue-400" />;

    return (
      <span className="flex items-center gap-2">
        {trendIcon}
        <span>Score: {performanceSummary.overallScore}/100 — {performanceSummary.message}</span>
      </span>
    );
  }, [performanceSummary]);

  const badgesCollapsedSummary = useMemo(() => {
    if (!badgesSummary) return null;
    return (
      <span className="flex items-center gap-2">
        <Award className="w-3.5 h-3.5 text-amber-400" />
        <span>
          {badgesSummary.earned} of {badgesSummary.total} earned
          {badgesSummary.featuredBadges.length > 0 && (
            <span className="text-emerald-300/50 ml-1">
              — {badgesSummary.featuredBadges.join(', ')}
            </span>
          )}
        </span>
      </span>
    );
  }, [badgesSummary]);

  return (
    <div className="py-6 space-y-6">

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: QUICK STATUS SNAPSHOT (Always Visible - Never Collapsible)
          This provides immediate awareness of key metrics at a glance
          ═══════════════════════════════════════════════════════════════════════ */}
      <QuickStatusSnapshot
        totalEarnings={stats.totalEarnings}
        activeJobs={stats.activeJobs}
        completedJobs={stats.completedJobs}
        isAvailable={isAvailable}
        weeklyEarnings={periodEarnings.weekly}
        loading={loading}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: PERFORMANCE PRAISE (Non-Collapsible - Motivational)
          Displays recognition, streaks, and quality feedback immediately after login
          Reinforces good behavior and reliability - VIEW ONLY
          ═══════════════════════════════════════════════════════════════════════ */}
      <PerformancePraiseCard landscaperId={landscaperId} />

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3: STRIPE ONBOARDING (Non-Collapsible - Critical Action Item)
          Only shown when onboarding is needed
          ═══════════════════════════════════════════════════════════════════════ */}
      {landscaperId && profile?.email && (
        <StripeConnectOnboardingCard
          landscaperId={landscaperId}
          email={profile?.email ?? ''}
          businessName={`${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Landscaper'}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 4: TIER PROGRESS (Collapsible - Default Open)
          Primary motivation driver - shows path to unlocking more jobs
          ═══════════════════════════════════════════════════════════════════════ */}
      {landscaperId && (
        <CollapsibleDashboardCard
          title="Tier Progress"
          icon={<Trophy className="w-5 h-5" />}
          defaultOpen={true}
          transparent
          collapsedSummary={
            <span className="flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Higher tiers unlock more job opportunities</span>
            </span>
          }
        >
          <TierEligibilityCard landscaperId={landscaperId} />
        </CollapsibleDashboardCard>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 5: EARNINGS GOALS (Collapsible - Default Open if no goal set)
          Helps landscapers set and track earnings targets
          ═══════════════════════════════════════════════════════════════════════ */}
      <CollapsibleDashboardCard
        title="Earnings Goals"
        icon={<Target className="w-5 h-5" />}
        defaultOpen={hasEarningsGoal === false}
        forceDefaultOpen={hasEarningsGoal === false}
        transparent
        collapsedSummary={earningsGoalSummary}
      >
        <EarningsGoalCard 
          currentEarnings={stats.totalEarnings}
          periodEarnings={periodEarnings}
        />
      </CollapsibleDashboardCard>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 6: PERFORMANCE INSIGHTS (Collapsible - Default Closed)
          Detailed metrics - collapsed shows overall score and message
          ═══════════════════════════════════════════════════════════════════════ */}
      {landscaperId && (
        <CollapsibleDashboardCard
          title="Performance Insights"
          icon={<TrendingUp className="w-5 h-5" />}
          defaultOpen={false}
          transparent
          collapsedSummary={performanceCollapsedSummary}
        >
          <PerformanceInsightsCard landscaperId={landscaperId} />
        </CollapsibleDashboardCard>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 7: BADGES & ACHIEVEMENTS (Collapsible - Default Closed)
          Gamification - collapsed shows badge count and featured badges
          ═══════════════════════════════════════════════════════════════════════ */}
      {landscaperId && (
        <CollapsibleDashboardCard
          title="Badges & Achievements"
          icon={<Award className="w-5 h-5" />}
          defaultOpen={false}
          collapsedSummary={badgesCollapsedSummary}
        >
          <BadgesSection landscaperId={landscaperId} />
        </CollapsibleDashboardCard>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 8: LIVE ACTIVITY (Collapsible - Default Closed)
          Lightweight informational section - no duplication of stats above
          ═══════════════════════════════════════════════════════════════════════ */}
      <CollapsibleDashboardCard
        title="Live Activity"
        icon={<Activity className="w-5 h-5" />}
        defaultOpen={false}
        transparent
        collapsedSummary={
          <span className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Real-time platform activity and updates</span>
          </span>
        }
      >
        <LiveLandscaperStats />
      </CollapsibleDashboardCard>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 9: GPS TRACKING (Non-Collapsible - Operational Control)
          Only shown when there's an active job being tracked
          This is critical for job completion and should never be hidden
          ═══════════════════════════════════════════════════════════════════════ */}
      {landscaperId && activeJobId && (
        <LiveGPSTracker landscaperId={landscaperId} jobId={activeJobId} />
      )}
    </div>
  );
}
