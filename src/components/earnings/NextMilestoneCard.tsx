import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, Calendar } from 'lucide-react';

interface NextMilestoneCardProps {
  completedJobs: number;
  jobsThisWeek: number;
}

export default function NextMilestoneCard({ completedJobs, jobsThisWeek }: NextMilestoneCardProps) {
  // Calculate next milestone
  const getNextMilestone = () => {
    if (completedJobs >= 50) {
      return { target: null, remaining: 0, tierName: 'Elite' };
    } else if (completedJobs >= 15) {
      return { target: 50, remaining: 50 - completedJobs, tierName: 'Elite' };
    } else {
      return { target: 15, remaining: 15 - completedJobs, tierName: 'Pro' };
    }
  };

  const milestone = getNextMilestone();
  const hasCompletedJobs = completedJobs > 0;

  // Calculate progress percentage for visual indicator
  const getProgressPercentage = () => {
    if (completedJobs >= 50) return 100;
    if (completedJobs >= 15) {
      return ((completedJobs - 15) / (50 - 15)) * 100;
    }
    return (completedJobs / 15) * 100;
  };

  const progressPercentage = getProgressPercentage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Next Milestone Card */}
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-emerald-900/50">
              <Target className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Next Milestone</h3>
              
              {milestone.target === null ? (
                // Already at Elite tier
                <div>
                  <p className="text-sm text-emerald-400 mb-2">
                    You've reached Elite status!
                  </p>
                  <p className="text-xs text-slate-400">
                    Keep up the excellent work and maintain your priority access.
                  </p>
                </div>
              ) : hasCompletedJobs ? (
                // Has completed jobs, show progress
                <div>
                  <p className="text-sm text-slate-300 mb-3">
                    Complete <span className="text-emerald-400 font-semibold">{milestone.remaining} more job{milestone.remaining !== 1 ? 's' : ''}</span> to unlock <span className="text-emerald-400 font-semibold">{milestone.tierName}</span> tier
                  </p>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                    <div 
                      className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {completedJobs} of {milestone.target} jobs completed
                  </p>
                </div>
              ) : (
                // Zero jobs - show encouragement
                <div>
                  <p className="text-sm text-slate-300 mb-2">
                    Complete your first job to start building your progress
                  </p>
                  <p className="text-xs text-slate-400">
                    Every completed job brings you closer to unlocking higher tiers and benefits.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Activity Card */}
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-900/50">
              <Calendar className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">This Week</h3>
              
              {jobsThisWeek > 0 ? (
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-blue-400">{jobsThisWeek}</span>
                    <span className="text-sm text-slate-400">job{jobsThisWeek !== 1 ? 's' : ''} completed</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>Keep the momentum going!</span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-300 mb-2">
                    No jobs completed yet this week
                  </p>
                  <p className="text-xs text-slate-400">
                    Check available jobs to find opportunities in your area.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
