import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  landscaper?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface GoalStats {
  totalActiveGoals: number;
  weeklyGoals: number;
  monthlyGoals: number;
  averageGoalAmount: number;
  totalGoalValue: number;
}

export default function EarningsGoalsAnalytics() {
  const [goals, setGoals] = useState<EarningsGoal[]>([]);
  const [stats, setStats] = useState<GoalStats>({
    totalActiveGoals: 0,
    weeklyGoals: 0,
    monthlyGoals: 0,
    averageGoalAmount: 0,
    totalGoalValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);

      // Load all active goals with landscaper info
      const { data: goalsData, error } = await supabase
        .from('earnings_goals')
        .select(`
          *,
          landscaper:users!landscaper_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const goalsList = goalsData || [];
      setGoals(goalsList);

      // Calculate stats
      const weeklyGoals = goalsList.filter(g => g.goal_period === 'weekly');
      const monthlyGoals = goalsList.filter(g => g.goal_period === 'monthly');
      const totalGoalValue = goalsList.reduce((sum, g) => sum + g.goal_amount, 0);
      const averageGoalAmount = goalsList.length > 0 ? totalGoalValue / goalsList.length : 0;

      setStats({
        totalActiveGoals: goalsList.length,
        weeklyGoals: weeklyGoals.length,
        monthlyGoals: monthlyGoals.length,
        averageGoalAmount,
        totalGoalValue
      });
    } catch (error) {
      console.error('Error loading earnings goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (goalId: string) => {
    setExpandedGoals(prev => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const getTimeRemaining = (periodEnd: string) => {
    const end = new Date(periodEnd);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Expired';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  if (loading) {
    return (
      <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin" />
          <span className="ml-2 text-emerald-300">Loading earnings goals...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl">
            <Target className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-emerald-300">Earnings Goals Analytics</h2>
            <p className="text-sm text-emerald-300/70">View landscaper goal setting activity (read-only)</p>
          </div>
        </div>
        <Button
          onClick={loadGoals}
          variant="outline"
          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-300/70 text-sm mb-2">
            <Users className="h-4 w-4" />
            Active Goals
          </div>
          <div className="text-2xl font-bold text-emerald-300">{stats.totalActiveGoals}</div>
        </div>

        <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-300/70 text-sm mb-2">
            <Calendar className="h-4 w-4" />
            Weekly Goals
          </div>
          <div className="text-2xl font-bold text-blue-400">{stats.weeklyGoals}</div>
        </div>

        <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-300/70 text-sm mb-2">
            <Calendar className="h-4 w-4" />
            Monthly Goals
          </div>
          <div className="text-2xl font-bold text-purple-400">{stats.monthlyGoals}</div>
        </div>

        <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-300/70 text-sm mb-2">
            <DollarSign className="h-4 w-4" />
            Avg Goal
          </div>
          <div className="text-2xl font-bold text-emerald-300">
            ${stats.averageGoalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-300/70 text-sm mb-2">
            <TrendingUp className="h-4 w-4" />
            Total Goal Value
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            ${stats.totalGoalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Goals List */}
      <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-emerald-500/25">
          <h3 className="text-lg font-semibold text-emerald-300 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Active Goals ({goals.length})
          </h3>
        </div>

        {goals.length === 0 ? (
          <div className="p-8 text-center text-emerald-300/70">
            No active earnings goals found.
          </div>
        ) : (
          <div className="divide-y divide-emerald-500/25">
            {goals.map((goal) => (
              <div key={goal.id} className="p-4 hover:bg-emerald-500/5 transition-colors">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpanded(goal.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      goal.goal_period === 'weekly' 
                        ? 'bg-blue-500/20' 
                        : 'bg-purple-500/20'
                    }`}>
                      <Target className={`h-5 w-5 ${
                        goal.goal_period === 'weekly' 
                          ? 'text-blue-400' 
                          : 'text-purple-400'
                      }`} />
                    </div>
                    <div>
                      <div className="font-medium text-emerald-200">
                        {goal.landscaper?.first_name} {goal.landscaper?.last_name}
                      </div>
                      <div className="text-sm text-emerald-300/60">
                        {goal.landscaper?.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-300">
                        ${goal.goal_amount.toLocaleString()}
                      </div>
                      <div className={`text-xs ${
                        goal.goal_period === 'weekly' 
                          ? 'text-blue-400' 
                          : 'text-purple-400'
                      }`}>
                        {goal.goal_period === 'weekly' ? 'Weekly' : 'Monthly'}
                      </div>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <div className="text-sm text-emerald-300/70">
                        {getTimeRemaining(goal.period_end)}
                      </div>
                    </div>

                    {expandedGoals.has(goal.id) ? (
                      <ChevronUp className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-emerald-400" />
                    )}
                  </div>
                </div>

                {expandedGoals.has(goal.id) && (
                  <div className="mt-4 pt-4 border-t border-emerald-500/25 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-emerald-300/60 mb-1">Period Start</div>
                      <div className="text-sm text-emerald-200">
                        {new Date(goal.period_start).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-emerald-300/60 mb-1">Period End</div>
                      <div className="text-sm text-emerald-200">
                        {new Date(goal.period_end).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-emerald-300/60 mb-1">Created</div>
                      <div className="text-sm text-emerald-200">
                        {new Date(goal.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-emerald-300/60 mb-1">Goal ID</div>
                      <div className="text-sm text-emerald-200 font-mono truncate">
                        {goal.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Target className="h-5 w-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-300">Analytics Only</h4>
            <p className="text-sm text-blue-300/70 mt-1">
              Earnings goals are set by landscapers for their own motivation. 
              Admins can view goal activity for analytics purposes but cannot set or enforce goals.
              Goals do not affect payouts, job assignments, or tier logic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
