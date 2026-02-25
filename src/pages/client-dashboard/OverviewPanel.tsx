import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, CalendarClock, RotateCcw, Calendar } from 'lucide-react';
import { NotificationSystem } from '@/components/client/NotificationSystem';
import { SuggestedNextStepCard } from '@/components/client/SuggestedNextStepCard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface UpcomingService {
  id: string;
  service_name: string;
  preferred_date: string;
  status: string;
}

export const OverviewPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasPastJobs, setHasPastJobs] = useState(false);
  const [activeJobCount, setActiveJobCount] = useState(0);
  const [upcomingService, setUpcomingService] = useState<UpcomingService | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userEmail = user.email || '';
        
        // Build OR conditions for client job visibility
        const orConditions: string[] = [`user_id.eq.${user.id}`];
        if (userEmail) {
          orConditions.push(`client_email.eq.${userEmail}`);
        }

        // Fetch jobs to determine past jobs and active jobs
        const { data: jobs, error } = await supabase
          .from('jobs')
          .select('id, status, service_name, preferred_date')
          .or(orConditions.join(','))
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[OverviewPanel] Error fetching jobs:', error.message);
          setLoading(false);
          return;
        }

        const jobsList = jobs || [];
        
        // Check for completed jobs (past jobs)
        const completedJobs = jobsList.filter(j => j.status === 'completed');
        setHasPastJobs(completedJobs.length > 0);

        // Count active jobs
        const activeStatuses = ['pending', 'available', 'active', 'assigned', 'scheduled'];


        const activeJobs = jobsList.filter(j => activeStatuses.includes(j.status));
        setActiveJobCount(activeJobs.length);

        // Find upcoming scheduled service (next scheduled job)
        const scheduledJobs = jobsList.filter(j => 
          j.status === 'scheduled' && j.preferred_date
        );
        
        if (scheduledJobs.length > 0) {
          // Sort by preferred_date to get the soonest
          scheduledJobs.sort((a, b) => 
            new Date(a.preferred_date).getTime() - new Date(b.preferred_date).getTime()
          );
          
          const nextJob = scheduledJobs[0];
          const jobDate = new Date(nextJob.preferred_date);
          
          // Only show if it's in the future
          if (jobDate > new Date()) {
            setUpcomingService({
              id: nextJob.id,
              service_name: nextJob.service_name || 'Service',
              preferred_date: nextJob.preferred_date,
              status: nextJob.status
            });
          }
        }

      } catch (err) {
        console.error('[OverviewPanel] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [user]);

  const handleRequestService = () => {
    // Navigate to client quote form for authenticated clients
    // This provides a streamlined experience with auto-filled profile data
    navigate('/client-quote');
  };

  const handleRescheduleService = () => {
    navigate('/client-dashboard/jobs');
  };

  const handleRepeatLastService = () => {
    // Navigate to client quote form for repeat service
    navigate('/client-quote');
  };


  const formatUpcomingDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-slate-800/50 rounded-2xl"></div>
          <div className="h-32 bg-slate-800/50 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 1: Quick Actions - Primary Visual Anchor
          The first thing a client sees - clear, confident actions
      ───────────────────────────────────────────────────────────────────── */}
      <section aria-label="Quick Actions">
        <div className="bg-gradient-to-br from-emerald-950/30 via-black/60 to-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl p-6 sm:p-8 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              <p className="text-sm text-slate-400">What would you like to do?</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Primary Action: Request Service */}
            <button 
              onClick={handleRequestService} 
              className="w-full flex items-center justify-between px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/35 transition-all duration-200 group"
            >
              <span className="text-base">Request Service</span>
              <ArrowRight className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
            
            {/* Secondary Action: Reschedule Service */}
            <button 
              onClick={handleRescheduleService} 
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-800 text-white font-medium transition-all duration-200 group"
            >
              <span className="flex items-center gap-2.5">
                <CalendarClock className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                Reschedule Service
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Conditional Secondary Action: Repeat Last Service */}
            {hasPastJobs && (
              <button 
                onClick={handleRepeatLastService} 
                className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-800 text-white font-medium transition-all duration-200 group"
              >
                <span className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                  Repeat Last Service
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 2: Upcoming Service Reminder
          Only shown when there's a scheduled service
      ───────────────────────────────────────────────────────────────────── */}
      {upcomingService && (
        <section aria-label="Upcoming Service">
          <div className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-medium text-white">Upcoming Service</h4>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {formatUpcomingDate(upcomingService.preferred_date)}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {upcomingService.service_name}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 3: Notifications
          Shows any pending notifications
      ───────────────────────────────────────────────────────────────────── */}
      <section aria-label="Notifications">
        <NotificationSystem />
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 4: Suggested Next Step
          Subtle guidance when no active jobs - feels optional, not pushy
          Only appears when activeJobs === 0
      ───────────────────────────────────────────────────────────────────── */}
      <SuggestedNextStepCard activeJobs={activeJobCount} />

      {/* Bottom spacing for comfortable scrolling */}
      <div className="h-4" aria-hidden="true" />
    </div>
  );
};

export default OverviewPanel;
