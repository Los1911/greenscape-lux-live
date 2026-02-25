/**
 * BadgesSection Component
 * Displays badges and achievements for landscaper dashboard
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge, BadgeWithProgress, BADGE_CATEGORIES, BadgeCategory } from '@/types/job';
import { getBadgesWithProgress, LandscaperStats } from '@/utils/badgeEvaluator';
import { BadgeCard, BadgeIconOnly } from './BadgeCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Trophy, Sparkles, Zap, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BadgesSectionProps {
  landscaperId: string;
  compact?: boolean;
}

export function BadgesSection({ landscaperId, compact = false }: BadgesSectionProps) {
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<{ badge_id: string; earned_at: string }[]>([]);
  const [stats, setStats] = useState<LandscaperStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | BadgeCategory>('all');

  useEffect(() => {
    loadBadgeData();
  }, [landscaperId]);

  async function loadBadgeData() {
    try {
      setLoading(true);

      // Load all active badges
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (badgesError) throw badgesError;

      // Load earned badges for this landscaper
      const { data: earned, error: earnedError } = await supabase
        .from('landscaper_badges')
        .select('badge_id, earned_at')
        .eq('landscaper_id', landscaperId)
        .is('revoked_at', null);

      if (earnedError) throw earnedError;

      // Load landscaper stats
      const { data: landscaper, error: statsError } = await supabase
        .from('landscapers')
        .select('completed_jobs_count, average_rating, created_at')
        .eq('id', landscaperId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') throw statsError;

      // Count flagged jobs in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: flaggedCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('landscaper_id', landscaperId)
        .eq('status', 'flagged_review')
        .gte('updated_at', thirtyDaysAgo.toISOString());

      setAllBadges(badges || []);
      setEarnedBadges(earned || []);
      setStats({
        completed_jobs_count: landscaper?.completed_jobs_count || 0,
        average_rating: landscaper?.average_rating || 0,
        created_at: landscaper?.created_at,
        flagged_jobs_last_30_days: flaggedCount || 0
      });
    } catch (error) {
      console.error('Error loading badge data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </CardContent>
      </Card>
    );
  }

  const earnedBadgeIds = new Set(earnedBadges.map(eb => eb.badge_id));
  const badgesWithProgress = stats 
    ? getBadgesWithProgress(allBadges, earnedBadgeIds, earnedBadges, stats)
    : [];

  const earnedCount = badgesWithProgress.filter(b => b.earned).length;
  const totalCount = badgesWithProgress.length;

  // Filter badges by category
  const filteredBadges = selectedCategory === 'all' 
    ? badgesWithProgress 
    : badgesWithProgress.filter(b => b.category === selectedCategory);

  // Compact view for profile cards
  if (compact) {
    const displayBadges = badgesWithProgress.filter(b => b.earned).slice(0, 5);
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Award className="w-4 h-4" />
            Badges ({earnedCount})
          </h4>
          {earnedCount > 5 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-6 px-2"
              onClick={() => setShowAllBadges(true)}
            >
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
        
        <div className="flex gap-1 flex-wrap">
          {displayBadges.length > 0 ? (
            displayBadges.map(badge => (
              <BadgeIconOnly key={badge.id} badge={badge} />
            ))
          ) : (
            <p className="text-xs text-gray-500">No badges earned yet</p>
          )}
        </div>

        {/* Full badges modal */}
        <Dialog open={showAllBadges} onOpenChange={setShowAllBadges}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Badges & Achievements
              </DialogTitle>
            </DialogHeader>
            <BadgeCollectionGrid badges={badgesWithProgress} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full section view for dashboard
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-amber-500" />
            Badges & Achievements
          </CardTitle>
          <span className="text-sm text-gray-500">
            {earnedCount} of {totalCount} earned
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Category tabs */}
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="milestone" className="text-xs flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Milestones
            </TabsTrigger>
            <TabsTrigger value="quality" className="text-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Quality
            </TabsTrigger>
            <TabsTrigger value="engagement" className="text-xs flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Engagement
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredBadges.map(badge => (
                <BadgeCard 
                  key={badge.id} 
                  badge={badge} 
                  size="md"
                  showProgress={true}
                />
              ))}
            </div>
            
            {filteredBadges.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No badges in this category yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Progress summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-medium text-emerald-600">
              {Math.round((earnedCount / totalCount) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${(earnedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Grid view of all badges for modal/full page
 */
function BadgeCollectionGrid({ badges }: { badges: BadgeWithProgress[] }) {
  const categories: { key: BadgeCategory; label: string; icon: React.ReactNode }[] = [
    { key: 'milestone', label: 'Milestones', icon: <Trophy className="w-4 h-4" /> },
    { key: 'quality', label: 'Quality', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'engagement', label: 'Engagement', icon: <Zap className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {categories.map(category => {
        const categoryBadges = badges.filter(b => b.category === category.key);
        const earnedInCategory = categoryBadges.filter(b => b.earned).length;
        
        return (
          <div key={category.key}>
            <div className="flex items-center gap-2 mb-3">
              <span className={BADGE_CATEGORIES[category.key].color}>
                {category.icon}
              </span>
              <h3 className="font-semibold">{category.label}</h3>
              <span className="text-xs text-gray-500">
                ({earnedInCategory}/{categoryBadges.length})
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categoryBadges.map(badge => (
                <BadgeCard 
                  key={badge.id} 
                  badge={badge} 
                  size="md"
                  showProgress={true}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BadgesSection;
