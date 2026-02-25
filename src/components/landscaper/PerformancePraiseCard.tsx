/**
 * Performance Praise Card
 * 
 * A motivational module that displays recognition, reliability streaks,
 * and positive quality feedback to reinforce good behavior and reliability.
 * 
 * This component is VIEW-ONLY - landscapers cannot edit praise content.
 * Praise content is admin-controlled or AI-assisted with admin authority.
 * 
 * GreenScape Lux Style: Dark theme, premium, trust-first, clean.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sparkles,
  Flame,
  Trophy,
  ThumbsUp,
  Star,
  Calendar,
  CheckCircle2,
  Award,
  Heart,
  Zap
} from 'lucide-react';

interface PraiseItem {
  id: string;
  type: 'streak' | 'quality' | 'milestone' | 'recognition';
  title: string;
  message: string;
  icon: 'flame' | 'trophy' | 'thumbsUp' | 'star' | 'checkCircle' | 'award' | 'heart' | 'zap';
  accentColor: 'emerald' | 'amber' | 'blue' | 'purple';
  timestamp?: string;
}

interface PerformancePraiseCardProps {
  landscaperId?: string;
}

const PraiseIcon: React.FC<{ icon: PraiseItem['icon']; className?: string }> = ({ icon, className = "h-5 w-5" }) => {
  switch (icon) {
    case 'flame':
      return <Flame className={className} />;
    case 'trophy':
      return <Trophy className={className} />;
    case 'thumbsUp':
      return <ThumbsUp className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'checkCircle':
      return <CheckCircle2 className={className} />;
    case 'award':
      return <Award className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'zap':
      return <Zap className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};

const getAccentClasses = (color: PraiseItem['accentColor']) => {
  switch (color) {
    case 'amber':
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        glow: 'shadow-amber-500/20'
      };
    case 'blue':
      return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        glow: 'shadow-blue-500/20'
      };
    case 'purple':
      return {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        glow: 'shadow-purple-500/20'
      };
    case 'emerald':
    default:
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        glow: 'shadow-emerald-500/20'
      };
  }
};

const PraiseItemCard: React.FC<{ item: PraiseItem }> = ({ item }) => {
  const accent = getAccentClasses(item.accentColor);
  
  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl p-4
        bg-black/40 border ${accent.border}
        hover:border-opacity-60 transition-all duration-300
        group
      `}
    >
      {/* Subtle glow effect on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${accent.bg}`} />
      
      <div className="relative z-10 flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2.5 rounded-lg ${accent.bg} ${accent.border} border`}>
          <PraiseIcon icon={item.icon} className={`h-5 w-5 ${accent.text}`} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${accent.text} mb-1`}>
            {item.title}
          </h4>
          <p className="text-sm text-slate-300/90 leading-relaxed">
            {item.message}
          </p>
          {item.timestamp && (
            <div className="flex items-center gap-1.5 mt-2">
              <Calendar className="h-3 w-3 text-slate-500" />
              <span className="text-xs text-slate-500">{item.timestamp}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function PerformancePraiseCard({ landscaperId }: PerformancePraiseCardProps) {
  const { user } = useAuth();
  const [praiseItems, setPraiseItems] = useState<PraiseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    if (landscaperId || user?.id) {
      loadPraiseData();
    }
  }, [landscaperId, user?.id]);

  const loadPraiseData = async () => {
    try {
      setLoading(true);
      
      // Get landscaper ID if not provided
      let lsId = landscaperId;
      if (!lsId && user?.id) {
        const { data: ls } = await supabase
          .from('landscapers')
          .select('id, first_name, completed_jobs_count, average_rating, created_at')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (ls) {
          lsId = ls.id;
          generatePraiseFromStats(ls);
        }
      } else if (lsId) {
        const { data: ls } = await supabase
          .from('landscapers')
          .select('id, first_name, completed_jobs_count, average_rating, created_at')
          .eq('id', lsId)
          .maybeSingle();
        
        if (ls) {
          generatePraiseFromStats(ls);
        }
      }

      if (!lsId) {
        // Show default welcome praise for new users
        setPraiseItems([{
          id: 'welcome',
          type: 'recognition',
          title: 'Welcome to GreenScape Lux!',
          message: 'We\'re excited to have you on the team. Complete your profile and start accepting jobs to build your reputation.',
          icon: 'sparkles' as any,
          accentColor: 'emerald'
        }]);
        setLoading(false);
        return;
      }

      // Calculate streak from recent completed jobs
      await calculateStreak(lsId);

    } catch (error) {
      console.error('[PerformancePraise] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = async (lsId: string) => {
    try {
      // Get completed jobs ordered by completion date
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, completed_at, status')
        .eq('landscaper_id', lsId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(30);

      if (!jobs || jobs.length === 0) {
        setStreakCount(0);
        return;
      }

      // Calculate consecutive days with completed jobs
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const completionDates = new Set(
        jobs
          .filter(j => j.completed_at)
          .map(j => {
            const d = new Date(j.completed_at);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
          })
      );

      // Check consecutive days going backwards
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        checkDate.setHours(0, 0, 0, 0);
        
        if (completionDates.has(checkDate.getTime())) {
          streak++;
        } else if (streak > 0) {
          break; // Streak broken
        }
      }

      setStreakCount(streak);
    } catch (error) {
      console.error('[PerformancePraise] Error calculating streak:', error);
    }
  };

  const generatePraiseFromStats = (landscaper: any) => {
    const items: PraiseItem[] = [];
    const completedJobs = landscaper.completed_jobs_count || 0;
    const rating = landscaper.average_rating || 0;
    const firstName = landscaper.first_name || 'Pro';

    // Reliability streak praise
    if (streakCount >= 7) {
      items.push({
        id: 'streak-week',
        type: 'streak',
        title: `${streakCount}-Day Streak!`,
        message: `Outstanding dedication, ${firstName}! You've completed jobs for ${streakCount} consecutive days. Your reliability sets you apart.`,
        icon: 'flame',
        accentColor: 'amber'
      });
    } else if (streakCount >= 3) {
      items.push({
        id: 'streak-building',
        type: 'streak',
        title: `${streakCount}-Day Streak Building`,
        message: `Great momentum! Keep it up and you'll hit a week-long streak soon.`,
        icon: 'zap',
        accentColor: 'emerald'
      });
    }

    // Quality feedback based on rating
    if (rating >= 4.8) {
      items.push({
        id: 'quality-exceptional',
        type: 'quality',
        title: 'Exceptional Quality',
        message: `Your ${rating.toFixed(1)}-star rating reflects the premium service you deliver. Clients consistently praise your attention to detail.`,
        icon: 'star',
        accentColor: 'amber'
      });
    } else if (rating >= 4.5) {
      items.push({
        id: 'quality-excellent',
        type: 'quality',
        title: 'Excellent Service',
        message: `A ${rating.toFixed(1)}-star rating shows your commitment to quality. Keep delivering great results!`,
        icon: 'thumbsUp',
        accentColor: 'emerald'
      });
    } else if (rating >= 4.0) {
      items.push({
        id: 'quality-good',
        type: 'quality',
        title: 'Solid Performance',
        message: `Your ${rating.toFixed(1)}-star rating demonstrates consistent service. Small improvements can take you to the next level.`,
        icon: 'checkCircle',
        accentColor: 'blue'
      });
    }

    // Milestone recognition
    if (completedJobs >= 100) {
      items.push({
        id: 'milestone-100',
        type: 'milestone',
        title: 'Century Club Member',
        message: `100+ jobs completed! You're a cornerstone of the GreenScape Lux network. Your experience and reliability are invaluable.`,
        icon: 'trophy',
        accentColor: 'amber'
      });
    } else if (completedJobs >= 50) {
      items.push({
        id: 'milestone-50',
        type: 'milestone',
        title: 'Trusted Professional',
        message: `50+ jobs completed! You've proven yourself as a dependable member of our team. Clients can count on you.`,
        icon: 'award',
        accentColor: 'purple'
      });
    } else if (completedJobs >= 25) {
      items.push({
        id: 'milestone-25',
        type: 'milestone',
        title: 'Rising Star',
        message: `25+ jobs completed! You're building a strong track record. Keep up the excellent work.`,
        icon: 'star',
        accentColor: 'emerald'
      });
    } else if (completedJobs >= 10) {
      items.push({
        id: 'milestone-10',
        type: 'milestone',
        title: 'Getting Started Strong',
        message: `10+ jobs completed! You're off to a great start. Each job builds your reputation.`,
        icon: 'zap',
        accentColor: 'blue'
      });
    } else if (completedJobs >= 1) {
      items.push({
        id: 'milestone-first',
        type: 'milestone',
        title: 'First Steps',
        message: `Congratulations on completing your first ${completedJobs === 1 ? 'job' : 'jobs'}! Every journey begins with a single step.`,
        icon: 'heart',
        accentColor: 'emerald'
      });
    }

    // General recognition for active landscapers
    if (completedJobs > 0 && items.length < 3) {
      items.push({
        id: 'recognition-valued',
        type: 'recognition',
        title: 'Valued Team Member',
        message: 'Your dedication to quality landscaping makes a real difference for our clients. Thank you for being part of GreenScape Lux.',
        icon: 'heart',
        accentColor: 'emerald'
      });
    }

    // Welcome message for new landscapers with no jobs
    if (completedJobs === 0) {
      items.push({
        id: 'welcome-new',
        type: 'recognition',
        title: 'Ready to Shine',
        message: 'Your profile is set up and you\'re ready to accept jobs. Each completed job builds your reputation and unlocks new opportunities.',
        icon: 'sparkles' as any,
        accentColor: 'emerald'
      });
    }

    setPraiseItems(items.slice(0, 3)); // Show max 3 items
  };

  // Re-generate praise when streak count updates
  useEffect(() => {
    if (!loading && (landscaperId || user?.id)) {
      const fetchAndGenerate = async () => {
        let lsId = landscaperId;
        if (!lsId && user?.id) {
          const { data: ls } = await supabase
            .from('landscapers')
            .select('id, first_name, completed_jobs_count, average_rating, created_at')
            .eq('user_id', user.id)
            .maybeSingle();
          if (ls) {
            generatePraiseFromStats(ls);
          }
        } else if (lsId) {
          const { data: ls } = await supabase
            .from('landscapers')
            .select('id, first_name, completed_jobs_count, average_rating, created_at')
            .eq('id', lsId)
            .maybeSingle();
          if (ls) {
            generatePraiseFromStats(ls);
          }
        }
      };
      fetchAndGenerate();
    }
  }, [streakCount]);

  if (loading) {
    return (
      <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-500/20 rounded-xl"></div>
            <div className="h-6 bg-emerald-500/20 rounded w-1/3"></div>
          </div>
          <div className="space-y-3">
            <div className="h-20 bg-emerald-500/10 rounded-xl"></div>
            <div className="h-20 bg-emerald-500/10 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (praiseItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 rounded-xl border border-emerald-500/30">
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-emerald-300">Your Recognition</h2>
            <p className="text-xs text-emerald-300/60">Celebrating your achievements</p>
          </div>
        </div>
      </div>

      {/* Praise Items */}
      <div className="p-5 space-y-3">
        {praiseItems.map((item) => (
          <PraiseItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Footer - Trust Message */}
      <div className="px-5 pb-4">
        <p className="text-xs text-slate-500 text-center">
          Your hard work and dedication are recognized and appreciated.
        </p>
      </div>
    </div>
  );
}

export { PerformancePraiseCard };
