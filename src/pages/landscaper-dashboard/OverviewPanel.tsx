import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Star,
  Sun,
  Sunrise,
  Moon,
  MapPin,
  Calendar,
  Clock,
  Play,
  Navigation,
  DollarSign,
  Briefcase,
  Loader2,
  Route,
  Car,
  ArrowRight,
  ChevronRight,
  CircleDot
} from 'lucide-react';



interface OverviewPanelProps {
  profile: any;
  isAvailable: boolean;
}

// ── Haversine distance calculation (miles) ──
function haversineDistanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


export default function OverviewPanel({ profile, isAvailable }: OverviewPanelProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [landscaperId, setLandscaperId] = useState<string>('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasEarningsGoal, setHasEarningsGoal] = useState<boolean | null>(null);
  const [startingJobId, setStartingJobId] = useState<string | null>(null);

  // ── GPS position state for distance calculation ──
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  
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

  // ── Geolocation: watch the landscaper's current position ──
useEffect(() => {
  if (!navigator.geolocation) return

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      setUserPosition({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      })
    },
    (error) => {
      setGpsError(error.message)
    },
    {
      enableHighAccuracy: false,
      maximumAge: 15000,
      timeout: 20000
    }
  )

  watchIdRef.current = watchId

  return () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }
}, [])

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

  // ── Today's stats ──
  const todayStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Jobs scheduled for today (by preferred_date) or active today
    const todayJobs = jobs.filter(j => {
      // Active jobs count as today's jobs
      if (j.status === 'active') return true;
      // Jobs started today
      if (j.started_at) {
        const started = new Date(j.started_at);
        if (started >= todayStart && started < todayEnd) return true;
      }
      // Jobs scheduled for today
      if (j.preferred_date) {
        const preferred = new Date(j.preferred_date);
        if (preferred >= todayStart && preferred < todayEnd) return true;
      }
      // Jobs completed today
      if (j.completed_at) {
        const completed = new Date(j.completed_at);
        if (completed >= todayStart && completed < todayEnd) return true;
      }
      return false;
    });

    // Earnings from jobs completed today
    const todayEarnings = jobs
      .filter(j => {
        if (j.status !== 'completed' || !j.completed_at) return false;
        const completed = new Date(j.completed_at);
        return completed >= todayStart && completed < todayEnd;
      })
      .reduce((sum: number, j: any) => sum + (j.price || 0), 0);

    return {
      jobCount: todayJobs.length,
      earnings: todayEarnings,
    };
  }, [jobs]);

  // ── Next Job: earliest upcoming assigned/scheduled job ──
  const nextJob = useMemo(() => {
    const upcomingJobs = jobs.filter(j => 
      ['assigned', 'scheduled'].includes(j.status)
    );

    if (upcomingJobs.length === 0) return null;

    // Sort by preferred_date (earliest first), then by created_at
    upcomingJobs.sort((a, b) => {
      const dateA = a.preferred_date ? new Date(a.preferred_date).getTime() : Infinity;
      const dateB = b.preferred_date ? new Date(b.preferred_date).getTime() : Infinity;
      if (dateA !== dateB) return dateA - dateB;
      // Fallback to created_at
      const createdA = a.created_at ? new Date(a.created_at).getTime() : Infinity;
      const createdB = b.created_at ? new Date(b.created_at).getTime() : Infinity;
      return createdA - createdB;
    });

    return upcomingJobs[0];
  }, [jobs]);

  // ── Next Stop: earliest assigned job specifically for navigation card ──
  const nextStopJob = useMemo(() => {
    const assignedJobs = jobs.filter(j => j.status === 'assigned');

    if (assignedJobs.length === 0) return null;

    // Sort by preferred_date (earliest first), then by created_at
    assignedJobs.sort((a, b) => {
      const dateA = a.preferred_date ? new Date(a.preferred_date).getTime() : Infinity;
      const dateB = b.preferred_date ? new Date(b.preferred_date).getTime() : Infinity;
      if (dateA !== dateB) return dateA - dateB;
      const createdA = a.created_at ? new Date(a.created_at).getTime() : Infinity;
      const createdB = b.created_at ? new Date(b.created_at).getTime() : Infinity;
      return createdA - createdB;
    });

    return assignedJobs[0];
  }, [jobs]);

  // ── Distance to next stop ──
  const nextStopDistance = useMemo(() => {
    if (!nextStopJob || !userPosition) return null;

    const jobLat = nextStopJob.location_lat;
    const jobLng = nextStopJob.location_lng;

    if (typeof jobLat !== 'number' || typeof jobLng !== 'number') return null;
    if (jobLat === 0 && jobLng === 0) return null;

    const dist = haversineDistanceMiles(
      userPosition.lat, userPosition.lng,
      jobLat, jobLng
    );

    return dist;
  }, [nextStopJob, userPosition]);


  // ═══════════════════════════════════════════════════════════════════════
  // TODAY'S ROUTE: Step 1 — Build today's job list
  // Includes jobs assigned to this landscaper with status 'assigned' or 'active'
  // AND scheduled for today (if preferred_date exists)
  // ═══════════════════════════════════════════════════════════════════════
  const todaysJobs = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    return jobs.filter(j => {
      // Must be assigned or active
      if (!['assigned', 'active'].includes(j.status)) return false;

      // Active jobs always count as today's work
      if (j.status === 'active') return true;

      // For assigned jobs: include if scheduled for today OR if no preferred_date
      // (jobs without a date are assumed to be available now)
      if (j.preferred_date) {
        const preferred = new Date(j.preferred_date);
        return preferred >= todayStart && preferred < todayEnd;
      }

      // No preferred_date — include it (available now)
      return true;
    });
  }, [jobs]);

  // ═══════════════════════════════════════════════════════════════════════
  // TODAY'S ROUTE: Step 2 — Sort jobs by distance from current GPS position
  // If GPS is available, sort nearest-first. Otherwise, return unsorted.
  // Each job gets a computed `distance` field for display.
  // ═══════════════════════════════════════════════════════════════════════
  const routeJobs = useMemo(() => {
    // Build enriched list with distance
    const enriched = todaysJobs.map(job => {
      let distance: number | null = null;

      if (
        userPosition &&
        typeof job.location_lat === 'number' &&
        typeof job.location_lng === 'number' &&
        !(job.location_lat === 0 && job.location_lng === 0)
      ) {
        distance = haversineDistanceMiles(
          userPosition.lat, userPosition.lng,
          job.location_lat, job.location_lng
        );
      }

      return { ...job, _distance: distance };
    });

    // Sort by distance if GPS is available, otherwise keep original order
    if (userPosition) {
      enriched.sort((a, b) => {
        // Jobs with distance come first, sorted ascending
        if (a._distance !== null && b._distance !== null) return a._distance - b._distance;
        if (a._distance !== null) return -1;
        if (b._distance !== null) return 1;
        return 0;
      });
    }

    // Return first 5 stops
    return enriched.slice(0, 5);
  }, [todaysJobs, userPosition]);


  // ── Time-of-day greeting ──
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Good Morning', Icon: Sunrise };
    if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', Icon: Sun };
    if (hour >= 17 && hour < 21) return { text: 'Good Evening', Icon: Sun };
    return { text: 'Good Evening', Icon: Moon };
  }, []);

  // ── Start Job handler (mirrors JobsPanel.handleStartJob exactly) ──
  const handleStartJob = useCallback(async (jobId: string) => {
    try {
      setStartingJobId(jobId);

      const startedAt = new Date().toISOString();

      // Use .or() to match EITHER assignment path:
      //   Case A (self-accepted):  assigned_to = uid AND status = 'assigned'
      //   Case B (admin-assigned): landscaper_id = uid AND status = 'scheduled'
      const { data, error } = await supabase
        .from('jobs')
        .update({
          status: 'active',
          started_at: startedAt,
          start_method: 'manual_override'
        })
        .eq('id', jobId)
        .or(`and(assigned_to.eq.${user?.id},status.eq.assigned),and(landscaper_id.eq.${user?.id},status.eq.scheduled)`);

      if (error) throw error;

      // OPTIMISTIC UI UPDATE: Move job from Assigned → Active instantly
      setJobs(prev => prev.map(job =>
        job.id === jobId
          ? {
              ...job,
              status: 'active',
              started_at: startedAt,
              start_method: 'manual_override'
            }
          : job
      ));

      toast({
        title: "Job Started!",
        description: "You can now work on this job. Mark as complete when finished.",
      });

    } catch (error) {
      console.error('Error starting job:', error);
      toast({
        title: "Error",
        description: "Failed to start job",
        variant: "destructive"
      });
    } finally {
      setStartingJobId(null);
    }
  }, [user?.id, toast]);

  // ── Navigate to address ──
  const handleNavigate = useCallback((address: string) => {
    if (!address) return;
    const encoded = encodeURIComponent(address);
    // Try native maps first (works on mobile), fallback to Google Maps web
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${encoded}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
    }
  }, []);

  // ── Navigate with coordinates (more precise) ──
  const handleNavigateCoords = useCallback((lat: number, lng: number, address?: string) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${lat},${lng}`, '_blank');
    } else {
      // Prefer address for better Google Maps label, fallback to coords
      if (address) {
        const encoded = encodeURIComponent(address);
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
      } else {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
      }
    }
  }, []);


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

  // Format scheduled time for Next Job card
  const formatScheduledTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);

      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateFormatted = date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

      if (date >= todayStart && date < tomorrowStart) {
        return { label: 'Today', time: timeStr, full: `Today at ${timeStr}` };
      }
      const dayAfterTomorrow = new Date(tomorrowStart);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      if (date >= tomorrowStart && date < dayAfterTomorrow) {
        return { label: 'Tomorrow', time: timeStr, full: `Tomorrow at ${timeStr}` };
      }
      return { label: dateFormatted, time: timeStr, full: `${dateFormatted} at ${timeStr}` };
    } catch {
      return null;
    }
  };

  // Format distance for display
  const formatDistance = (miles: number): string => {
    if (miles < 0.1) return 'Very close';
    if (miles < 10) return `${miles.toFixed(1)} mi away`;
    return `${Math.round(miles)} mi away`;
  };

  // Estimated drive time (rough: avg 25 mph for local driving)
  const estimateDriveTime = (miles: number): string => {
    const minutes = Math.round((miles / 25) * 60);
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `~${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMin = minutes % 60;
    return remainingMin > 0 ? `~${hours}h ${remainingMin}m` : `~${hours}h`;
  };

  const displayName = profile?.first_name || user?.email?.split('@')[0] || 'Pro';

  return (
    <div className="py-6 space-y-6">

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 0: GREETING + TODAY'S SUMMARY
          Immediate awareness: time-of-day greeting, today's job count, today's earnings
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-emerald-900/50 via-emerald-900/30 to-black/60 backdrop-blur border border-emerald-500/30 rounded-2xl overflow-hidden shadow-lg shadow-emerald-900/20">
        {/* Greeting Row */}
        <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
          <div className="flex items-center gap-3 mb-1">
            <greeting.Icon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {greeting.text}, {displayName}
            </h2>
          </div>
          <p className="text-sm text-emerald-300/60 ml-8 sm:ml-9">
            {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Today Stats Row */}
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Today's Jobs */}
            <div className="bg-black/40 rounded-xl p-4 border border-emerald-500/20 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Briefcase className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs font-medium text-emerald-300/60 uppercase tracking-wider">Today's Jobs</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
                {loading ? (
                  <span className="inline-block w-8 h-8 bg-emerald-500/20 rounded animate-pulse" />
                ) : (
                  todayStats.jobCount
                )}
              </p>
              <p className="text-xs text-emerald-300/50 mt-1">
                {todayStats.jobCount === 0 ? 'No jobs scheduled' : 
                 todayStats.jobCount === 1 ? '1 job on your plate' : 
                 `${todayStats.jobCount} jobs on your plate`}
              </p>
            </div>

            {/* Today's Earnings */}
            <div className="bg-black/40 rounded-xl p-4 border border-emerald-500/20 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-emerald-300/60 uppercase tracking-wider">Today's Earnings</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-emerald-400 tabular-nums">
                {loading ? (
                  <span className="inline-block w-16 h-8 bg-emerald-500/20 rounded animate-pulse" />
                ) : (
                  `$${todayStats.earnings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                )}
              </p>
              <p className="text-xs text-emerald-300/50 mt-1">
                {todayStats.earnings === 0 ? 'Complete jobs to earn' : 'Earned today'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 0.1: TODAY'S ROUTE
          Optimal route for today's jobs sorted by distance from current GPS.
          Shows up to 5 stops with numbered route order, distance, and actions.
          Only displayed when there are 2+ jobs for today.
          ═══════════════════════════════════════════════════════════════════════ */}
      {!loading && routeJobs.length >= 2 && (
        <div className="bg-gradient-to-br from-slate-900/60 via-cyan-900/20 to-slate-900/60 backdrop-blur border border-cyan-500/25 rounded-2xl overflow-hidden shadow-xl shadow-cyan-900/15">
          {/* Header */}
           <div className="px-5 py-3.5 sm:px-6 bg-cyan-500/10 border-b border-cyan-500/15 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-500/15">
                <Route className="w-5 h-5 text-cyan-400" />

              </div>
              <div>
                <h3 className="text-sm font-bold text-cyan-100 uppercase tracking-wider">Today's Route</h3>
                <p className="text-[11px] text-cyan-300/50 mt-0.5">
                  {routeJobs.length} stop{routeJobs.length !== 1 ? 's' : ''}{userPosition ? ' — sorted by distance' : ''}
                </p>
              </div>
            </div>
            {/* Total distance badge */}
            {userPosition && (() => {
              const totalDist = routeJobs.reduce((sum, j) => sum + (j._distance || 0), 0);
              return totalDist > 0 ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <Car className="w-3.5 h-3.5 text-cyan-300/70" />
                  <span className="text-xs font-semibold text-cyan-200 tabular-nums">
                    {totalDist < 10 ? totalDist.toFixed(1) : Math.round(totalDist)} mi total
                  </span>
                </div>
              ) : null;
            })()}
          </div>

          {/* Route Stops List */}
          <div className="px-5 py-4 sm:px-6 sm:py-5 space-y-0">
            {routeJobs.map((job, index) => {
              const isFirst = index === 0;
              const isLast = index === routeJobs.length - 1;
              const isActive = job.status === 'active';

              return (
                <div key={job.id} className="relative">
                  {/* Vertical connector line between stops */}
                  {!isLast && (
                    <div className="absolute left-[19px] sm:left-[21px] top-[44px] bottom-0 w-px bg-gradient-to-b from-cyan-500/30 to-cyan-500/10 z-0" />
                  )}

                  <div className={`relative z-10 flex gap-3.5 sm:gap-4 py-3 ${isFirst ? 'pt-1' : ''} ${isLast ? 'pb-1' : ''}`}>
                    {/* Stop Number Circle */}
                    <div className="flex-shrink-0 pt-0.5">
                      {isFirst ? (
                        <div className="w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/30">
                          <span className="text-sm sm:text-base font-black text-white">1</span>
                        </div>
                      ) : isActive ? (
                        <div className="w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border-2 border-yellow-400/50 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                        </div>
                      ) : (
                        <div className="w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] rounded-full bg-slate-800/80 border border-cyan-500/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-cyan-300/70">{index + 1}</span>
                        </div>
                      )}
                    </div>

                    {/* Stop Content */}
                    <div className={`flex-1 min-w-0 rounded-xl p-3.5 sm:p-4 transition-all ${
                      isFirst
                        ? 'bg-cyan-500/10 border border-cyan-400/25 shadow-md shadow-cyan-900/20'
                        : isActive
                          ? 'bg-yellow-500/10 border border-yellow-500/20'

                          : 'bg-black/25 border border-white/5 hover:border-cyan-500/15'
                    }`}>
                      {/* NEXT STOP label for first item */}
                      {isFirst && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <CircleDot className="w-3 h-3 text-cyan-400" />
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.15em]">Next Stop</span>
                        </div>
                      )}
                      {isActive && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                          <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-[0.15em]">In Progress</span>
                        </div>
                      )}

                      {/* Service Type */}
                      <h4 className={`font-semibold leading-snug truncate ${
                        isFirst ? 'text-base sm:text-lg text-white' : 'text-sm sm:text-base text-white/90'
                      }`}>
                        {job.service_type || job.service_name || 'Service'}
                      </h4>

                      {/* Address */}
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <MapPin className={`flex-shrink-0 mt-0.5 ${isFirst ? 'w-3.5 h-3.5 text-cyan-400/70' : 'w-3 h-3 text-slate-400/50'}`} />
                        <p className={`leading-snug truncate ${
                          isFirst ? 'text-sm text-cyan-100/70' : 'text-xs text-slate-300/50'
                        }`}>
                          {job.service_address || 'No address'}
                        </p>
                      </div>

                      {/* Distance */}
                      <div className="flex items-center gap-3 mt-2.5">
                        {job._distance !== null ? (
                          <div className="flex items-center gap-1.5">
                            <Navigation className={`${isFirst ? 'w-3.5 h-3.5 text-cyan-400' : 'w-3 h-3 text-slate-400/60'}`} />
                            <span className={`tabular-nums font-semibold ${
                              isFirst ? 'text-sm text-cyan-300' : 'text-xs text-slate-300/60'
                            }`}>
                              {formatDistance(job._distance)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500/50">Distance unavailable</span>
                        )}

                        {/* Payout inline */}
                        {typeof job.price === 'number' && job.price > 0 && (
                          <>
                            <span className="text-slate-600">|</span>
                            <span className={`font-semibold ${isFirst ? 'text-sm text-emerald-400' : 'text-xs text-emerald-400/70'}`}>
                              ${job.price.toFixed(0)}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Action Buttons — only for first stop or compact for others */}
                      {isFirst && !isActive ? (
                        <div className="flex gap-2.5 mt-4">
                          {job.service_address && (
                            <button
                              onClick={() => {
                                if (typeof job.location_lat === 'number' && typeof job.location_lng === 'number' && job.location_lat !== 0) {
                                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${job.location_lat},${job.location_lng}`, '_blank');
                                } else {
                                  handleNavigate(job.service_address);
                                }
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/25 hover:border-cyan-400/40 text-cyan-100 text-sm font-semibold transition-all active:scale-[0.97]"
                            >
                              <Navigation className="w-4 h-4 text-cyan-300" />
                              <span>Start Navigation</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleStartJob(job.id)}
                            disabled={startingJobId === job.id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition-all disabled:opacity-60 active:scale-[0.97] shadow-lg shadow-emerald-500/20"
                          >
                            {startingJobId === job.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            <span>Start Job</span>
                          </button>
                        </div>
                      ) : !isActive && (
                        <div className="flex gap-2 mt-3">
                          {job.service_address && (
                            <button
                              onClick={() => {
                                if (typeof job.location_lat === 'number' && typeof job.location_lng === 'number' && job.location_lat !== 0) {
                                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${job.location_lat},${job.location_lng}`, '_blank');
                                } else {
                                  handleNavigate(job.service_address);
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-medium transition-all active:scale-[0.97]"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Navigate</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleStartJob(job.id)}
                            disabled={startingJobId === job.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-300 text-xs font-medium transition-all disabled:opacity-60 active:scale-[0.97]"
                          >
                            {startingJobId === job.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                            <span>Start</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* "More jobs" indicator if todaysJobs exceeds 5 */}
            {todaysJobs.length > 5 && (
              <div className="flex items-center gap-2 pt-3 pl-[54px] sm:pl-[58px]">
                <ChevronRight className="w-3.5 h-3.5 text-cyan-400/40" />
                <span className="text-xs text-cyan-300/40">
                  +{todaysJobs.length - 5} more stop{todaysJobs.length - 5 !== 1 ? 's' : ''} today
                </span>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 0.3: NEXT STOP — NAVIGATION CARD
          Large, prominent card showing the next assigned job with travel distance
          and one-tap navigation. Placed ABOVE the general Next Job card.
          ═══════════════════════════════════════════════════════════════════════ */}
      {!loading && nextStopJob && (
        <div className="relative bg-gradient-to-br from-violet-900/40 via-indigo-900/30 to-slate-900/50 backdrop-blur border border-violet-500/30 rounded-2xl overflow-hidden shadow-xl shadow-violet-900/20">
          {/* Decorative route line */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.06] pointer-events-none">
            <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 118 C 30 90, 50 40, 64 30 S 100 10, 118 10" stroke="currentColor" strokeWidth="3" strokeDasharray="6 4" className="text-violet-300" />
              <circle cx="10" cy="118" r="5" className="fill-violet-400" />
              <circle cx="118" cy="10" r="5" className="fill-violet-400" />
            </svg>
          </div>

          {/* Header strip */}
          <div className="px-5 py-3.5 sm:px-6 bg-violet-500/10 border-b border-violet-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Route className="w-5 h-5 text-violet-400" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-violet-400 rounded-full animate-ping" />
              </div>
              <span className="text-sm font-bold text-violet-200 uppercase tracking-wider">Next Stop</span>
            </div>
            {nextStopDistance !== null && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-500/15 border border-violet-500/25">
                <Car className="w-3.5 h-3.5 text-violet-300" />
                <span className="text-xs font-semibold text-violet-200 tabular-nums">
                  {estimateDriveTime(nextStopDistance)}
                </span>
              </div>
            )}
          </div>

          {/* Card Body */}
          <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-5">
            {/* Service Type — Large and prominent */}
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {nextStopJob.service_type || nextStopJob.service_name || 'Service'}
              </h3>
              {nextStopJob.preferred_date && (() => {
                const timeInfo = formatScheduledTime(nextStopJob.preferred_date);
                return timeInfo ? (
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3.5 h-3.5 text-violet-400/70" />
                    <span className="text-sm text-violet-200/70">{timeInfo.full}</span>
                    {timeInfo.label === 'Today' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
                        Today
                      </span>
                    )}
                  </div>
                ) : null;
              })()}
            </div>

            {/* Address Row */}
            <div className="flex items-start gap-3 bg-black/30 rounded-xl p-4 border border-violet-500/15">
              <div className="p-2 rounded-lg bg-violet-500/20 flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-violet-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white leading-snug">
                  {nextStopJob.service_address || 'No address provided'}
                </p>
                {/* Distance Display */}
                <div className="mt-2">
                  {nextStopDistance !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-lg font-bold text-violet-300 tabular-nums">
                          {formatDistance(nextStopDistance)}
                        </span>
                      </div>
                      <span className="text-xs text-violet-300/40">|</span>
                      <span className="text-xs text-violet-300/60">
                        {estimateDriveTime(nextStopDistance)} drive
                      </span>
                    </div>
                  ) : userPosition === null && !gpsError ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-violet-400/60 animate-spin" />
                      <span className="text-xs text-violet-300/50">Getting your location...</span>
                    </div>
                  ) : gpsError ? (
                    <span className="text-xs text-violet-300/40">Enable location for distance</span>
                  ) : (
                    <span className="text-xs text-violet-300/40">Distance unavailable</span>
                  )}
                </div>
              </div>
            </div>

            {/* Payout */}
            {(typeof nextStopJob.price === 'number' && nextStopJob.price > 0) && (
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-emerald-400">
                  ${nextStopJob.price.toFixed(2)}
                  <span className="text-emerald-300/50 font-normal ml-1">payout</span>
                </span>
              </div>
            )}

            {/* Action Buttons — Large, touch-friendly */}
            <div className="flex gap-3 pt-1">
              {/* Start Navigation Button */}
              {nextStopJob.service_address && (
                <button
                  onClick={() => {
                    if (typeof nextStopJob.location_lat === 'number' && typeof nextStopJob.location_lng === 'number' && nextStopJob.location_lat !== 0) {
                      handleNavigateCoords(nextStopJob.location_lat, nextStopJob.location_lng, nextStopJob.service_address);
                    } else {
                      handleNavigate(nextStopJob.service_address);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/30 hover:border-violet-400/50 text-violet-100 font-semibold transition-all active:scale-[0.97] group"
                >
                  <Navigation className="w-5 h-5 text-violet-300 group-hover:text-violet-200 transition-colors" />
                  <span>Start Navigation</span>
                  <ArrowRight className="w-4 h-4 text-violet-400/60 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* Start Job Button */}
              <button
                onClick={() => handleStartJob(nextStopJob.id)}
                disabled={startingJobId === nextStopJob.id}
                className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.97] shadow-lg shadow-emerald-500/25"
              >
                {startingJobId === nextStopJob.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                <span>Start Job</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 0.5: NEXT JOB CARD
          The most important actionable item — what to do next
          Only shown if the next job differs from the Next Stop job
          (e.g., if there's a 'scheduled' job that isn't 'assigned')
          ═══════════════════════════════════════════════════════════════════════ */}
      {!loading && nextJob && nextJob.id !== nextStopJob?.id && (
        <div className="bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-blue-900/30 backdrop-blur border border-blue-500/30 rounded-2xl overflow-hidden shadow-lg shadow-blue-900/20">
          {/* Header strip */}
          <div className="px-5 py-3 sm:px-6 bg-blue-500/10 border-b border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-blue-300 uppercase tracking-wider">Next Job</span>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              nextJob.status === 'assigned' 
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            }`}>
              {nextJob.status === 'assigned' ? 'Assigned' : 'Scheduled'}
            </span>
          </div>

          {/* Job Details */}
          <div className="px-5 py-4 sm:px-6 sm:py-5 space-y-4">
            {/* Service Type */}
            <h3 className="text-lg sm:text-xl font-bold text-white">
              {nextJob.service_type || nextJob.service_name || 'Service'}
            </h3>

            {/* Address */}
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-blue-200/80 leading-snug">
                {nextJob.service_address || 'No address provided'}
              </span>
            </div>

            {/* Scheduled Time */}
            {nextJob.preferred_date && (() => {
              const timeInfo = formatScheduledTime(nextJob.preferred_date);
              return timeInfo ? (
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-200/80">{timeInfo.full}</span>
                    {timeInfo.label === 'Today' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
                        Today
                      </span>
                    )}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Payout */}
            <div className="flex items-center gap-2.5">
              <DollarSign className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              {typeof nextJob.payout_amount === 'number' && nextJob.payout_amount > 0 ? (
                <span className="text-sm font-semibold text-emerald-400">${nextJob.payout_amount.toFixed(2)} <span className="text-emerald-300/50 font-normal">your earnings</span></span>
              ) : (
                <span className="text-sm text-gray-500 italic">Earnings pending</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {/* Navigate Button */}
              {nextJob.service_address && (
                <button
                  onClick={() => handleNavigate(nextJob.service_address)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium transition-all active:scale-[0.98]"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Navigate</span>
                </button>
              )}

              {/* Start Job Button */}
              <button
                onClick={() => handleStartJob(nextJob.id)}
                disabled={startingJobId === nextJob.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-emerald-500/20"
              >
                {startingJobId === nextJob.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>Start Job</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No upcoming jobs message */}
      {!loading && !nextJob && !nextStopJob && stats.activeJobs === 0 && (
        <div className="bg-black/40 backdrop-blur border border-emerald-500/20 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-emerald-400/50" />
          </div>
          <h3 className="text-base font-semibold text-emerald-300 mb-1">No Upcoming Jobs</h3>
          <p className="text-sm text-emerald-300/50 max-w-sm mx-auto">
            Check the Jobs tab for available work in your area.
          </p>
        </div>
      )}

      {/* Active job indicator (if there's an active job, show it instead of "next job") */}
      {!loading && activeJobId && (() => {
        const activeJob = jobs.find(j => j.id === activeJobId);
        if (!activeJob) return null;
        return (
          <div className="bg-gradient-to-r from-yellow-900/30 via-amber-900/20 to-yellow-900/30 backdrop-blur border border-yellow-500/40 rounded-2xl overflow-hidden shadow-lg shadow-yellow-900/20 ring-1 ring-yellow-500/20">
            {/* Header strip */}
            <div className="px-5 py-3 sm:px-6 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                <span className="text-sm font-bold text-yellow-200 uppercase tracking-wider">Job In Progress</span>
              </div>
              {activeJob.started_at && (
                <span className="text-xs text-yellow-300/60">
                  Started {new Date(activeJob.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <div className="px-5 py-4 sm:px-6 sm:py-5 space-y-3">
              <h3 className="text-lg font-bold text-white">
                {activeJob.service_type || activeJob.service_name || 'Service'}
              </h3>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-yellow-200/80">
                  {activeJob.service_address || 'No address'}
                </span>
              </div>
              <p className="text-xs text-yellow-300/60">
                Go to the Jobs tab to upload photos and mark as complete.
              </p>
            </div>
          </div>
        );
      })()}

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

