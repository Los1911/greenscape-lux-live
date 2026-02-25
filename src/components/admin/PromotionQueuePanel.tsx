import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Award, Crown, Star, CheckCircle, XCircle, Clock, 
  RefreshCw, User, Briefcase, Shield, TrendingUp,
  AlertTriangle, History, ChevronRight, Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TierPromotion, 
  PromotionHistory, 
  PromotionQueueStats,
  PromotionStatus,
  TIER_DISPLAY
} from '@/types/tierPromotion';
import { LandscaperTier } from '@/types/job';
import TierBadge from '@/components/landscaper/TierBadge';
import { Input } from '@/components/ui/input';

interface PromotionWithLandscaper extends TierPromotion {
  landscaper: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    tier: LandscaperTier;
    insurance_file?: string | null;
  };
}

export default function PromotionQueuePanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<PromotionWithLandscaper[]>([]);
  const [history, setHistory] = useState<PromotionHistory[]>([]);
  const [stats, setStats] = useState<PromotionQueueStats>({
    pending: 0, approved: 0, deferred: 0, denied: 0,
    byTier: { pro: 0, elite: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionWithLandscaper | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'defer' | 'deny'>('approve');
  const [actionNotes, setActionNotes] = useState('');
  const [denialReason, setDenialReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load pending promotions with landscaper info
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('tier_promotions')
        .select(`
          *,
          landscaper:landscapers(
            id, user_id, first_name, last_name, email, tier, insurance_file
          )
        `)
        .order('eligible_at', { ascending: false });

      if (promotionsError) throw promotionsError;
      setPromotions(promotionsData || []);

      // Calculate stats
      const pending = promotionsData?.filter(p => p.status === 'pending') || [];
      const approved = promotionsData?.filter(p => p.status === 'approved') || [];
      const deferred = promotionsData?.filter(p => p.status === 'deferred') || [];
      const denied = promotionsData?.filter(p => p.status === 'denied') || [];

      setStats({
        pending: pending.length,
        approved: approved.length,
        deferred: deferred.length,
        denied: denied.length,
        byTier: {
          pro: pending.filter(p => p.eligible_tier === 'pro').length,
          elite: pending.filter(p => p.eligible_tier === 'elite').length
        }
      });

      // Load promotion history
      const { data: historyData, error: historyError } = await supabase
        .from('promotion_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (historyError) throw historyError;
      setHistory(historyData || []);

    } catch (err) {
      console.error('Error loading promotion data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load promotion queue',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedPromotion || !user) return;

    setProcessing(true);
    try {
      const newStatus: PromotionStatus = 
        actionType === 'approve' ? 'approved' : 
        actionType === 'defer' ? 'deferred' : 'denied';

      // Update promotion record
      const { error: updateError } = await supabase
        .from('tier_promotions')
        .update({
          status: newStatus,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: actionNotes || null,
          denial_reason: actionType === 'deny' ? denialReason : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPromotion.id);

      if (updateError) throw updateError;

      // If approved, update landscaper tier
      if (actionType === 'approve') {
        const { error: tierError } = await supabase
          .from('landscapers')
          .update({
            tier: selectedPromotion.eligible_tier,
            tier_updated_at: new Date().toISOString(),
            tier_override_by_admin: false
          })
          .eq('id', selectedPromotion.landscaper_id);

        if (tierError) throw tierError;
      }

      // Log to promotion history
      await supabase.from('promotion_history').insert({
        landscaper_id: selectedPromotion.landscaper_id,
        promotion_id: selectedPromotion.id,
        from_tier: selectedPromotion.current_tier,
        to_tier: selectedPromotion.eligible_tier,
        action: actionType === 'approve' ? 'promoted' : actionType,
        action_by: user.id,
        action_by_type: 'admin',
        notes: actionNotes || null,
        metrics_snapshot: {
          completed_jobs_count: selectedPromotion.completed_jobs_count,
          average_rating: selectedPromotion.average_rating,
          on_time_percentage: selectedPromotion.on_time_percentage,
          flagged_jobs_count: selectedPromotion.flagged_jobs_count,
          insurance_verified: selectedPromotion.insurance_verified
        }
      });

      // Create notification for landscaper
      const notificationTitle = actionType === 'approve' 
        ? `Promoted to ${selectedPromotion.eligible_tier.toUpperCase()} Tier!`
        : actionType === 'defer'
        ? 'Tier Promotion Deferred'
        : 'Tier Promotion Update';

      const notificationMessage = actionType === 'approve'
        ? `Congratulations! You've been promoted to ${selectedPromotion.eligible_tier.toUpperCase()} tier. Enjoy your new benefits!`
        : actionType === 'defer'
        ? 'Your tier promotion has been deferred. Keep up the great work and we\'ll review again soon.'
        : `Your tier promotion was not approved at this time. ${denialReason || ''}`;

      await supabase.from('notifications').insert({
        user_id: selectedPromotion.landscaper.user_id,
        type: actionType === 'approve' ? 'tier_promoted' : 'tier_update',
        title: notificationTitle,
        message: notificationMessage,
        read: false
      });

      toast({
        title: 'Action Completed',
        description: `Promotion ${actionType === 'approve' ? 'approved' : actionType === 'defer' ? 'deferred' : 'denied'} successfully`
      });

      setActionModalOpen(false);
      setSelectedPromotion(null);
      setActionNotes('');
      setDenialReason('');
      loadData();

    } catch (err) {
      console.error('Error processing action:', err);
      toast({
        title: 'Error',
        description: 'Failed to process action',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const openActionModal = (promotion: PromotionWithLandscaper, action: 'approve' | 'defer' | 'deny') => {
    setSelectedPromotion(promotion);
    setActionType(action);
    setActionNotes('');
    setDenialReason('');
    setActionModalOpen(true);
  };

  const runQualificationCheck = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tier-qualification-check');
      
      if (error) throw error;
      
      toast({
        title: 'Qualification Check Complete',
        description: `Evaluated ${data.results?.evaluated || 0} landscapers, ${data.results?.newlyEligible || 0} newly eligible`
      });
      
      loadData();
    } catch (err) {
      console.error('Error running qualification check:', err);
      toast({
        title: 'Error',
        description: 'Failed to run qualification check',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPromotions = promotions.filter(p => {
    const matchesSearch = 
      p.landscaper?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.landscaper?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.landscaper?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const getTierIcon = (tier: LandscaperTier) => {
    switch (tier) {
      case 'elite': return <Crown className="h-4 w-4 text-amber-400" />;
      case 'pro': return <Award className="h-4 w-4 text-emerald-400" />;
      default: return <Star className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: PromotionStatus) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-900/40 text-amber-300 border-amber-500/40"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-900/40 text-emerald-300 border-emerald-500/40"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'deferred':
        return <Badge className="bg-blue-900/40 text-blue-300 border-blue-500/40"><Clock className="h-3 w-3 mr-1" />Deferred</Badge>;
      case 'denied':
        return <Badge className="bg-red-900/40 text-red-300 border-red-500/40"><XCircle className="h-3 w-3 mr-1" />Denied</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin" />
          <span className="ml-2 text-slate-300">Loading promotion queue...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-900/40 rounded-lg">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-300">{stats.pending}</p>
              <p className="text-xs text-slate-500">Pending Review</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-900/40 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-300">{stats.approved}</p>
              <p className="text-xs text-slate-500">Approved</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-900/40 rounded-lg">
              <Award className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-300">{stats.byTier.pro}</p>
              <p className="text-xs text-slate-500">Pro Eligible</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-900/40 rounded-lg">
              <Crown className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-300">{stats.byTier.elite}</p>
              <p className="text-xs text-slate-500">Elite Eligible</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search landscapers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadData}
                className="border-emerald-500/30 text-emerald-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={runQualificationCheck}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Run Check
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="pending" className="data-[state=active]:bg-amber-900/40">
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-emerald-900/40">
            Approved ({stats.approved})
          </TabsTrigger>
          <TabsTrigger value="deferred" className="data-[state=active]:bg-blue-900/40">
            Deferred ({stats.deferred})
          </TabsTrigger>
          <TabsTrigger value="denied" className="data-[state=active]:bg-red-900/40">
            Denied ({stats.denied})
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="space-y-3">
            {filteredPromotions.length === 0 ? (
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="py-12 text-center">
                  <User className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Promotions Found</h3>
                  <p className="text-slate-400">
                    {activeTab === 'pending' 
                      ? 'No landscapers are currently pending promotion review.'
                      : 'No promotions match your search criteria.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredPromotions.map((promotion) => (
                <Card key={promotion.id} className="bg-slate-900 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Landscaper Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white truncate">
                            {promotion.landscaper?.first_name} {promotion.landscaper?.last_name}
                          </h3>
                          {getStatusBadge(promotion.status)}
                        </div>
                        <p className="text-sm text-slate-400 truncate">{promotion.landscaper?.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <TierBadge tier={promotion.current_tier as LandscaperTier} size="sm" />
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                          <TierBadge tier={promotion.eligible_tier as LandscaperTier} size="sm" />
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-slate-500" />
                          <span className="text-slate-300">{promotion.completed_jobs_count} jobs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-amber-400" />
                          <span className="text-slate-300">{promotion.average_rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        {promotion.on_time_percentage !== null && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-emerald-400" />
                            <span className="text-slate-300">{promotion.on_time_percentage?.toFixed(0)}% on-time</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {promotion.insurance_verified ? (
                            <Shield className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                          )}
                          <span className="text-slate-300">
                            {promotion.insurance_verified ? 'Insured' : 'No Insurance'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      {promotion.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => openActionModal(promotion, 'approve')}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionModal(promotion, 'defer')}
                            className="border-blue-500/30 text-blue-300"
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Defer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionModal(promotion, 'deny')}
                            className="border-red-500/30 text-red-300"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Deny
                          </Button>
                        </div>
                      )}

                      {promotion.status !== 'pending' && promotion.admin_notes && (
                        <div className="text-sm text-slate-400 italic">
                          "{promotion.admin_notes}"
                        </div>
                      )}
                    </div>

                    {/* Eligible date */}
                    <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-500">
                      Eligible since: {new Date(promotion.eligible_at).toLocaleDateString()}
                      {promotion.reviewed_at && (
                        <span className="ml-4">
                          Reviewed: {new Date(promotion.reviewed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Promotion History */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-emerald-300 flex items-center gap-2">
            <History className="h-5 w-5" />
            Promotion History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No promotion history yet</p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded ${
                      entry.action === 'promoted' ? 'bg-emerald-900/40' :
                      entry.action === 'auto_eligible' ? 'bg-amber-900/40' :
                      entry.action === 'deferred' ? 'bg-blue-900/40' :
                      'bg-red-900/40'
                    }`}>
                      {entry.action === 'promoted' ? <CheckCircle className="h-4 w-4 text-emerald-400" /> :
                       entry.action === 'auto_eligible' ? <TrendingUp className="h-4 w-4 text-amber-400" /> :
                       entry.action === 'deferred' ? <Clock className="h-4 w-4 text-blue-400" /> :
                       <XCircle className="h-4 w-4 text-red-400" />}
                    </div>
                    <div>
                      <p className="text-sm text-white">
                        {entry.from_tier} → {entry.to_tier}
                      </p>
                      <p className="text-xs text-slate-400">
                        {entry.action_by_type === 'system' ? 'Auto-detected' : 'Admin action'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-emerald-300">
              {actionType === 'approve' ? 'Approve Promotion' :
               actionType === 'defer' ? 'Defer Promotion' : 'Deny Promotion'}
            </DialogTitle>
          </DialogHeader>

          {selectedPromotion && (
            <div className="space-y-4 py-4">
              {/* Landscaper Info */}
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <User className="h-5 w-5 text-slate-400" />
                  <span className="font-medium text-white">
                    {selectedPromotion.landscaper?.first_name} {selectedPromotion.landscaper?.last_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TierBadge tier={selectedPromotion.current_tier as LandscaperTier} size="sm" />
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                  <TierBadge tier={selectedPromotion.eligible_tier as LandscaperTier} size="sm" />
                </div>
              </div>

              {/* Metrics Summary */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <p className="text-slate-400">Completed Jobs</p>
                  <p className="text-lg font-semibold text-white">{selectedPromotion.completed_jobs_count}</p>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <p className="text-slate-400">Average Rating</p>
                  <p className="text-lg font-semibold text-white">{selectedPromotion.average_rating?.toFixed(1)}</p>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <p className="text-slate-400">On-Time Rate</p>
                  <p className="text-lg font-semibold text-white">
                    {selectedPromotion.on_time_percentage !== null 
                      ? `${selectedPromotion.on_time_percentage.toFixed(0)}%` 
                      : 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <p className="text-slate-400">Insurance</p>
                  <p className={`text-lg font-semibold ${selectedPromotion.insurance_verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedPromotion.insurance_verified ? 'Verified' : 'Not Verified'}
                  </p>
                </div>
              </div>

              {/* Action-specific content */}
              {actionType === 'approve' && (
                <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                  <p className="text-sm text-emerald-300">
                    This will promote the landscaper to <strong>{selectedPromotion.eligible_tier.toUpperCase()}</strong> tier immediately.
                  </p>
                </div>
              )}

              {actionType === 'defer' && (
                <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    The promotion will be deferred. The landscaper will remain eligible and can be reviewed again later.
                  </p>
                </div>
              )}

              {actionType === 'deny' && (
                <div className="space-y-3">
                  <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-300">
                      The promotion will be denied. Please provide a reason.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Denial Reason *</label>
                    <Textarea
                      value={denialReason}
                      onChange={(e) => setDenialReason(e.target.value)}
                      placeholder="Reason for denial..."
                      className="mt-1 bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm text-slate-300">Admin Notes (Optional)</label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Additional notes..."
                  className="mt-1 bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionModalOpen(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing || (actionType === 'deny' && !denialReason.trim())}
              className={
                actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                actionType === 'defer' ? 'bg-blue-600 hover:bg-blue-700' :
                'bg-red-600 hover:bg-red-700'
              }
            >
              {processing ? 'Processing...' : 
               actionType === 'approve' ? 'Approve Promotion' :
               actionType === 'defer' ? 'Defer Promotion' : 'Deny Promotion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
