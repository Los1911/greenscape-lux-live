/**
 * BadgeManagementPanel Component
 * Admin panel for viewing and managing landscaper badges
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge, LandscaperBadge, BADGE_CATEGORIES } from '@/types/job';
import { BadgeIcon } from '@/components/landscaper/BadgeIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Award,
  Search,
  User,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  Trophy,
  Sparkles,
  Zap,
  AlertTriangle
} from 'lucide-react';

interface LandscaperWithBadges {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  completed_jobs_count: number;
  average_rating: number;
  tier: string;
  badges: LandscaperBadge[];
}

export function BadgeManagementPanel() {
  const { toast } = useToast();
  const [landscapers, setLandscapers] = useState<LandscaperWithBadges[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLandscaper, setSelectedLandscaper] = useState<LandscaperWithBadges | null>(null);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<string>('');
  const [revokeReason, setRevokeReason] = useState('');
  const [badgeToRevoke, setBadgeToRevoke] = useState<LandscaperBadge | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Load all badges
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('sort_order');

      if (badgesError) throw badgesError;
      setAllBadges(badges || []);

      // Load landscapers with their badges
      const { data: landscaperData, error: landscaperError } = await supabase
        .from('landscapers')
        .select(`
          id,
          first_name,
          last_name,
          email,
          completed_jobs_count,
          average_rating,
          tier
        `)
        .order('last_name');

      if (landscaperError) throw landscaperError;

      // Load all earned badges
      const { data: earnedBadges, error: earnedError } = await supabase
        .from('landscaper_badges')
        .select(`
          id,
          landscaper_id,
          badge_id,
          earned_at,
          granted_by,
          revoked_at,
          revoked_by,
          revoke_reason,
          badges (
            id,
            slug,
            name,
            description,
            icon,
            category
          )
        `)
        .is('revoked_at', null);

      if (earnedError) throw earnedError;

      // Combine landscapers with their badges
      const landscapersWithBadges = (landscaperData || []).map(ls => ({
        ...ls,
        badges: (earnedBadges || [])
          .filter(eb => eb.landscaper_id === ls.id)
          .map(eb => ({
            ...eb,
            name: (eb.badges as any)?.name,
            icon: (eb.badges as any)?.icon,
            category: (eb.badges as any)?.category,
            slug: (eb.badges as any)?.slug
          }))
      }));

      setLandscapers(landscapersWithBadges);
    } catch (error) {
      console.error('Error loading badge data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load badge data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGrantBadge() {
    if (!selectedLandscaper || !selectedBadge) return;

    try {
      setProcessing(true);

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('landscaper_badges')
        .insert({
          landscaper_id: selectedLandscaper.id,
          badge_id: selectedBadge,
          granted_by: user?.id
        });

      if (error) throw error;

      toast({
        title: 'Badge Granted',
        description: 'Badge has been manually awarded to the landscaper.'
      });

      setShowGrantModal(false);
      setSelectedBadge('');
      loadData();
    } catch (error: any) {
      console.error('Error granting badge:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to grant badge',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleRevokeBadge() {
    if (!badgeToRevoke) return;

    try {
      setProcessing(true);

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('landscaper_badges')
        .update({
          revoked_at: new Date().toISOString(),
          revoked_by: user?.id,
          revoke_reason: revokeReason || 'Revoked by admin'
        })
        .eq('id', badgeToRevoke.id);

      if (error) throw error;

      toast({
        title: 'Badge Revoked',
        description: 'Badge has been revoked from the landscaper.'
      });

      setShowRevokeModal(false);
      setBadgeToRevoke(null);
      setRevokeReason('');
      loadData();
    } catch (error: any) {
      console.error('Error revoking badge:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke badge',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleEvaluateBadges(landscaperId: string) {
    try {
      setProcessing(true);

      const { error } = await supabase.rpc('evaluate_landscaper_badges', {
        p_landscaper_id: landscaperId
      });

      if (error) throw error;

      toast({
        title: 'Badges Evaluated',
        description: 'Badge eligibility has been recalculated.'
      });

      loadData();
    } catch (error: any) {
      console.error('Error evaluating badges:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to evaluate badges',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  }

  // Filter landscapers by search
  const filteredLandscapers = landscapers.filter(ls => {
    const searchLower = searchQuery.toLowerCase();
    return (
      ls.first_name?.toLowerCase().includes(searchLower) ||
      ls.last_name?.toLowerCase().includes(searchLower) ||
      ls.email?.toLowerCase().includes(searchLower)
    );
  });

  // Get badges not yet earned by selected landscaper
  const availableBadges = selectedLandscaper
    ? allBadges.filter(b => !selectedLandscaper.badges.some(eb => eb.badge_id === b.id))
    : [];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Badge Management
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search landscapers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Badge Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <Trophy className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-amber-700">
                {allBadges.filter(b => b.category === 'milestone').length}
              </div>
              <div className="text-sm text-amber-600">Milestone Badges</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 text-center">
              <Sparkles className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-700">
                {allBadges.filter(b => b.category === 'quality').length}
              </div>
              <div className="text-sm text-emerald-600">Quality Badges</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Zap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">
                {allBadges.filter(b => b.category === 'engagement').length}
              </div>
              <div className="text-sm text-blue-600">Engagement Badges</div>
            </div>
          </div>

          {/* Landscaper List */}
          <div className="space-y-3">
            {filteredLandscapers.map(landscaper => (
              <div
                key={landscaper.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {landscaper.first_name} {landscaper.last_name}
                      </h4>
                      <p className="text-sm text-gray-500">{landscaper.email}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{landscaper.completed_jobs_count || 0} jobs</span>
                        <span>•</span>
                        <span>{(landscaper.average_rating || 0).toFixed(1)} rating</span>
                        <span>•</span>
                        <span className="capitalize">{landscaper.tier || 'starter'} tier</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEvaluateBadges(landscaper.id)}
                      disabled={processing}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Evaluate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLandscaper(landscaper);
                        setShowGrantModal(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Grant Badge
                    </Button>
                  </div>
                </div>

                {/* Earned Badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {landscaper.badges.length > 0 ? (
                    landscaper.badges.map(badge => (
                      <div
                        key={badge.id}
                        className={`
                          flex items-center gap-1.5 px-2 py-1 rounded-full text-xs
                          ${BADGE_CATEGORIES[badge.category as keyof typeof BADGE_CATEGORIES]?.bgColor || 'bg-gray-100'}
                          ${BADGE_CATEGORIES[badge.category as keyof typeof BADGE_CATEGORIES]?.color || 'text-gray-600'}
                        `}
                      >
                        <BadgeIcon icon={badge.icon || 'award'} size="sm" />
                        <span>{badge.name}</span>
                        <button
                          onClick={() => {
                            setBadgeToRevoke(badge);
                            setShowRevokeModal(true);
                          }}
                          className="ml-1 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">No badges earned yet</span>
                  )}
                </div>
              </div>
            ))}

            {filteredLandscapers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No landscapers found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grant Badge Modal */}
      <Dialog open={showGrantModal} onOpenChange={setShowGrantModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              Grant Badge
            </DialogTitle>
          </DialogHeader>

          {selectedLandscaper && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium">
                  {selectedLandscaper.first_name} {selectedLandscaper.last_name}
                </p>
                <p className="text-sm text-gray-500">{selectedLandscaper.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Select Badge</label>
                <Select value={selectedBadge} onValueChange={setSelectedBadge}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a badge to grant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBadges.map(badge => (
                      <SelectItem key={badge.id} value={badge.id}>
                        <div className="flex items-center gap-2">
                          <BadgeIcon icon={badge.icon} size="sm" />
                          <span>{badge.name}</span>
                          <span className="text-xs text-gray-400">({badge.category})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {availableBadges.length === 0 && (
                <div className="text-center py-4 text-amber-600 bg-amber-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-sm">This landscaper has earned all available badges!</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGrantModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGrantBadge}
              disabled={!selectedBadge || processing}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Grant Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Badge Modal */}
      <Dialog open={showRevokeModal} onOpenChange={setShowRevokeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Revoke Badge
            </DialogTitle>
          </DialogHeader>

          {badgeToRevoke && (
            <div className="space-y-4">
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <p className="text-sm text-red-800">
                  Are you sure you want to revoke the <strong>{badgeToRevoke.name}</strong> badge?
                  This action can be undone by re-granting the badge.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Reason (optional)</label>
                <Textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Enter reason for revoking this badge..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeBadge}
              disabled={processing}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Revoke Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BadgeManagementPanel;
