import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/lib/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  DollarSign,
  Edit3,
  X,
  Check,
  Sparkles,
  Clock,
  Zap,
  Trophy,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface EarningsGoal {
  id: string;
  landscaper_id: string;
  goal_amount: number;
  goal_period: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EarningsGoalCardProps {
  currentEarnings?: number;
  periodEarnings?: {
    weekly: number;
    monthly: number;
  };
  compact?: boolean;
}

type PaceStatus = 'ahead' | 'on_track' | 'behind';

const MOTIVATIONAL_MESSAGES: Record<PaceStatus, string[]> = {
  ahead: [
    "You're crushing it! Keep up the amazing work!",
    "Ahead of schedule — you're on fire!",
    "Outstanding pace! Your goal is within reach!",
    "Excellent progress! You're exceeding expectations!",
  ],
  on_track: [
    "You're on track to hit your goal!",
    "Great progress — stay consistent!",
    "Right on pace — keep it going!",
    "Steady progress toward your target!",
  ],
  behind: [
    "A few more jobs could get you back on track!",
    "Keep pushing — you've got this!",
    "Every job counts toward your goal!",
    "Stay focused — there's still time!",
  ],
};

const GOAL_ACHIEVED_MESSAGES = [
  "Goal achieved — outstanding work!",
  "You did it! Congratulations!",
  "Target reached — you're a star!",
  "Mission accomplished! Time for a new goal?",
];

export default function EarningsGoalCard({ 
  currentEarnings = 0, 
  periodEarnings,
  compact = false 
}: EarningsGoalCardProps) {
  const supabase = useSupabaseClient();
  const { user } = useAuth();
  const [goal, setGoal] = useState<EarningsGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editPeriod, setEditPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadGoal();
    }
  }, [user?.id]);

  const loadGoal = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('earnings_goals')
        .select('*')
        .eq('landscaper_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Check if goal period has expired
        const periodEnd = new Date(data.period_end);
        const now = new Date();
        
        if (periodEnd < now) {
          // Goal period expired, deactivate it
          await supabase
            .from('earnings_goals')
            .update({ is_active: false })
            .eq('id', data.id);
          setGoal(null);
        } else {
          setGoal(data);
        }
      } else {
        setGoal(null);
      }
    } catch (error) {
      console.error('Error loading earnings goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePeriodDates = (period: 'weekly' | 'monthly') => {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (period === 'weekly') {
      // Start from Monday of current week
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - diff);
      periodStart.setHours(0, 0, 0, 0);
      
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
    } else {
      // Start from first day of current month
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      periodEnd.setHours(23, 59, 59, 999);
    }

    return { periodStart, periodEnd };
  };

  const saveGoal = async () => {
    if (!user?.id || !editAmount) return;

    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      setSaving(true);

      // Deactivate existing goals for this period
      await supabase
        .from('earnings_goals')
        .update({ is_active: false })
        .eq('landscaper_id', user.id)
        .eq('goal_period', editPeriod)
        .eq('is_active', true);

      const { periodStart, periodEnd } = calculatePeriodDates(editPeriod);

      const { data, error } = await supabase
        .from('earnings_goals')
        .insert({
          landscaper_id: user.id,
          goal_amount: amount,
          goal_period: editPeriod,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setGoal(data);
      setIsEditing(false);
      setEditAmount('');
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetGoal = async () => {
    if (!goal?.id) return;

    try {
      setSaving(true);
      await supabase
        .from('earnings_goals')
        .update({ is_active: false })
        .eq('id', goal.id);

      setGoal(null);
    } catch (error) {
      console.error('Error resetting goal:', error);
    } finally {
      setSaving(false);
    }
  };

  const getCurrentPeriodEarnings = () => {
    if (!goal) return 0;
    
    if (periodEarnings) {
      return goal.goal_period === 'weekly' 
        ? periodEarnings.weekly 
        : periodEarnings.monthly;
    }
    
    return currentEarnings;
  };

  const calculateProgress = () => {
    if (!goal) return { percentage: 0, paceStatus: 'on_track' as PaceStatus, projectedEarnings: 0 };

    const earnings = getCurrentPeriodEarnings();
    const percentage = Math.min((earnings / goal.goal_amount) * 100, 100);

    // Calculate time progress
    const periodStart = new Date(goal.period_start);
    const periodEnd = new Date(goal.period_end);
    const now = new Date();
    
    const totalDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = Math.max(0, (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const timeProgress = Math.min((elapsedDays / totalDays) * 100, 100);

    // Calculate projected earnings
    const dailyRate = elapsedDays > 0 ? earnings / elapsedDays : 0;
    const remainingDays = Math.max(0, totalDays - elapsedDays);
    const projectedEarnings = earnings + (dailyRate * remainingDays);

    // Determine pace status
    let paceStatus: PaceStatus;
    if (percentage >= 100) {
      paceStatus = 'ahead';
    } else if (percentage >= timeProgress - 5) {
      paceStatus = percentage > timeProgress + 10 ? 'ahead' : 'on_track';
    } else {
      paceStatus = 'behind';
    }

    return { percentage, paceStatus, projectedEarnings, timeProgress, remainingDays };
  };

  const getTimeRemaining = () => {
    if (!goal) return '';

    const periodEnd = new Date(goal.period_end);
    const now = new Date();
    const diffMs = periodEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Period ended';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  const getMotivationalMessage = (paceStatus: PaceStatus, isAchieved: boolean) => {
    if (isAchieved) {
      return GOAL_ACHIEVED_MESSAGES[Math.floor(Math.random() * GOAL_ACHIEVED_MESSAGES.length)];
    }
    const messages = MOTIVATIONAL_MESSAGES[paceStatus];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getPaceIcon = (paceStatus: PaceStatus) => {
    switch (paceStatus) {
      case 'ahead':
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case 'behind':
        return <TrendingDown className="h-4 w-4 text-amber-400" />;
      default:
        return <Minus className="h-4 w-4 text-blue-400" />;
    }
  };

  const getPaceColor = (paceStatus: PaceStatus) => {
    switch (paceStatus) {
      case 'ahead':
        return 'text-emerald-400';
      case 'behind':
        return 'text-amber-400';
      default:
        return 'text-blue-400';
    }
  };

  const getPaceLabel = (paceStatus: PaceStatus) => {
    switch (paceStatus) {
      case 'ahead':
        return 'Ahead of pace';
      case 'behind':
        return 'Behind pace';
      default:
        return 'On track';
    }
  };

  if (loading) {
    return (
      <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-emerald-500/20 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-emerald-500/10 rounded w-full mb-2"></div>
        <div className="h-8 bg-emerald-500/10 rounded w-2/3"></div>
      </div>
    );
  }

  // No goal set - show setup prompt
  if (!goal && !isEditing) {
    return (
      <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900/50 backdrop-blur border border-emerald-500/25 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-xl">
            <Target className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-emerald-300 mb-1">Set an Earnings Goal</h3>
            <p className="text-sm text-emerald-300/70 mb-4">
              Track your progress and stay motivated with a weekly or monthly earnings target.
            </p>
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Target className="h-4 w-4 mr-2" />
              Set Goal
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900/50 backdrop-blur border border-emerald-500/25 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-emerald-300 flex items-center gap-2">
            <Target className="h-5 w-5" />
            {goal ? 'Update Goal' : 'Set Earnings Goal'}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsEditing(false);
              setEditAmount('');
            }}
            className="text-emerald-300/70 hover:text-emerald-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Period Selection */}
          <div>
            <label className="text-sm text-emerald-300/70 mb-2 block">Goal Period</label>
            <div className="flex gap-2">
              <button
                onClick={() => setEditPeriod('weekly')}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  editPeriod === 'weekly'
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50'
                    : 'bg-black/40 text-emerald-300/70 border border-emerald-500/25 hover:border-emerald-500/40'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-2" />
                Weekly
              </button>
              <button
                onClick={() => setEditPeriod('monthly')}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  editPeriod === 'monthly'
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50'
                    : 'bg-black/40 text-emerald-300/70 border border-emerald-500/25 hover:border-emerald-500/40'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-2" />
                Monthly
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-sm text-emerald-300/70 mb-2 block">Target Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
              <Input
                type="number"
                placeholder="1000"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="pl-10 bg-black/40 border-emerald-500/25 text-emerald-100 placeholder:text-emerald-300/40 focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-sm text-emerald-300/70 mb-2 block">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              {(editPeriod === 'weekly' ? [500, 750, 1000, 1500] : [2000, 3000, 4000, 5000]).map((amount) => (
                <button
                  key={amount}
                  onClick={() => setEditAmount(amount.toString())}
                  className="px-3 py-1.5 rounded-lg text-sm bg-black/40 text-emerald-300/70 border border-emerald-500/25 hover:border-emerald-500/40 hover:text-emerald-300 transition-all"
                >
                  ${amount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={saveGoal}
            disabled={saving || !editAmount || parseFloat(editAmount) <= 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
          >
            {saving ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {goal ? 'Update Goal' : 'Set Goal'}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Goal display
  const { percentage, paceStatus, projectedEarnings, remainingDays } = calculateProgress();
  const earnings = getCurrentPeriodEarnings();
  const isAchieved = percentage >= 100;
  const timeRemaining = getTimeRemaining();

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900/50 backdrop-blur border border-emerald-500/25 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isAchieved ? (
              <Trophy className="h-5 w-5 text-yellow-400" />
            ) : (
              <Target className="h-5 w-5 text-emerald-400" />
            )}
            <span className="text-sm font-medium text-emerald-300">
              {goal.goal_period === 'weekly' ? 'Weekly' : 'Monthly'} Goal
            </span>
          </div>
          <span className="text-xs text-emerald-300/60">{timeRemaining}</span>
        </div>
        
        <div className="mb-2">
          <Progress 
            value={percentage} 
            className="h-2 bg-black/40"
          />
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-emerald-100 font-semibold">
            ${earnings.toLocaleString()} / ${goal.goal_amount.toLocaleString()}
          </span>
          <span className={`flex items-center gap-1 ${getPaceColor(paceStatus)}`}>
            {getPaceIcon(paceStatus)}
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900/50 backdrop-blur border border-emerald-500/25 rounded-2xl p-6 ring-1 ring-emerald-500/20 shadow-[0_0_25px_-10px_rgba(52,211,153,0.25)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isAchieved ? 'bg-yellow-500/20' : 'bg-emerald-500/20'}`}>
            {isAchieved ? (
              <Trophy className="h-6 w-6 text-yellow-400" />
            ) : (
              <Target className="h-6 w-6 text-emerald-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-emerald-300">
              {goal.goal_period === 'weekly' ? 'Weekly' : 'Monthly'} Earnings Goal
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-3.5 w-3.5 text-emerald-300/60" />
              <span className="text-sm text-emerald-300/60">{timeRemaining}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditAmount(goal.goal_amount.toString());
              setEditPeriod(goal.goal_period);
              setIsEditing(true);
            }}
            className="text-emerald-300/70 hover:text-emerald-300 hover:bg-emerald-500/10"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetGoal}
            disabled={saving}
            className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-4">
        {/* Main Progress */}
        <div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-3xl font-bold text-emerald-100">
                ${earnings.toLocaleString()}
              </span>
              <span className="text-emerald-300/60 ml-2">
                of ${goal.goal_amount.toLocaleString()}
              </span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
              isAchieved 
                ? 'bg-yellow-500/20 text-yellow-400' 
                : paceStatus === 'ahead' 
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : paceStatus === 'behind'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-blue-500/20 text-blue-400'
            }`}>
              {isAchieved ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                getPaceIcon(paceStatus)
              )}
              <span className="text-sm font-medium">
                {isAchieved ? 'Achieved!' : getPaceLabel(paceStatus)}
              </span>
            </div>
          </div>
          
          <div className="relative">
            <Progress 
              value={percentage} 
              className="h-4 bg-black/40"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-white drop-shadow-md">
                {Math.round(percentage)}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/40 border border-emerald-500/25 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-300/70 text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Projected
            </div>
            <div className="text-xl font-bold text-emerald-100">
              ${Math.round(projectedEarnings).toLocaleString()}
            </div>
            <div className="text-xs text-emerald-300/50 mt-1">
              Based on current pace
            </div>
          </div>
          
          <div className="bg-black/40 border border-emerald-500/25 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-300/70 text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Remaining
            </div>
            <div className="text-xl font-bold text-emerald-100">
              ${Math.max(0, goal.goal_amount - earnings).toLocaleString()}
            </div>
            <div className="text-xs text-emerald-300/50 mt-1">
              {remainingDays !== undefined && remainingDays > 0 
                ? `~$${Math.round((goal.goal_amount - earnings) / remainingDays).toLocaleString()}/day needed`
                : 'Period ending soon'
              }
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          isAchieved 
            ? 'bg-yellow-500/10 border border-yellow-500/25' 
            : 'bg-emerald-500/10 border border-emerald-500/25'
        }`}>
          {isAchieved ? (
            <Sparkles className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          ) : (
            <Zap className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          )}
          <p className={`text-sm font-medium ${isAchieved ? 'text-yellow-300' : 'text-emerald-300'}`}>
            {getMotivationalMessage(paceStatus, isAchieved)}
          </p>
        </div>
      </div>
    </div>
  );
}
