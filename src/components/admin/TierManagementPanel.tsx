import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Star, Award, Crown, User, Search, RefreshCw, 
  TrendingUp, TrendingDown, Shield, CheckCircle,
  AlertTriangle, FileText, Briefcase
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LandscaperTier, TIER_REQUIREMENTS } from '@/types/job';
import TierBadge from '@/components/landscaper/TierBadge';
import { useToast } from '@/hooks/use-toast';

interface LandscaperWithTier {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  tier: LandscaperTier;
  tier_updated_at?: string;
  tier_override_by_admin: boolean;
  completed_jobs_count: number;
  average_rating: number;
  reliability_score: number;
  approved: boolean;
  insurance_file?: string;
}

export default function TierManagementPanel() {
  const [landscapers, setLandscapers] = useState<LandscaperWithTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedLandscaper, setSelectedLandscaper] = useState<LandscaperWithTier | null>(null);
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [newTier, setNewTier] = useState<LandscaperTier>('starter');
  const [tierNotes, setTierNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLandscapers();
  }, []);

  const loadLandscapers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('landscapers')
        .select('*')
        .order('tier', { ascending: false })
        .order('completed_jobs_count', { ascending: false });

      if (error) throw error;
      setLandscapers(data || []);
    } catch (err) {
      console.error('Error loading landscapers:', err);
      toast({
        title: 'Error',
        description: 'Failed to load landscapers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLandscapers = landscapers.filter(l => {
    const matchesSearch = 
      l.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTier = tierFilter === 'all' || l.tier === tierFilter;
    
    return matchesSearch && matchesTier;
  });

  const getTierStats = () => {
    const stats = { starter: 0, pro: 0, elite: 0 };
    landscapers.forEach(l => {
      if (l.tier && stats[l.tier as keyof typeof stats] !== undefined) {
        stats[l.tier as keyof typeof stats]++;
      }
    });
    return stats;
  };

  const tierStats = getTierStats();

  const checkEligibility = (landscaper: LandscaperWithTier, tier: LandscaperTier): {
    eligible: boolean;
    missing: string[];
  } => {
    const requirements = TIER_REQUIREMENTS[tier];
    const missing: string[] = [];

    if (landscaper.completed_jobs_count < requirements.minJobs) {
      missing.push(`${requirements.minJobs} completed jobs (has ${landscaper.completed_jobs_count})`);
    }
    if (landscaper.average_rating < requirements.minRating) {
      missing.push(`${requirements.minRating}+ rating (has ${landscaper.average_rating.toFixed(1)})`);
    }
    if (requirements.requiresInsurance && !landscaper.insurance_file) {
      missing.push('Verified insurance');
    }

    return { eligible: missing.length === 0, missing };
  };

  const handleTierChange = async () => {
    if (!selectedLandscaper) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('landscapers')
        .update({
          tier: newTier,
          tier_updated_at: new Date().toISOString(),
          tier_override_by_admin: true
        })
        .eq('id', selectedLandscaper.id);

      if (error) throw error;

      // Log the tier change to promotion_history
      await supabase.from('promotion_history').insert({
        landscaper_id: selectedLandscaper.id,
        from_tier: selectedLandscaper.tier || 'starter',
        to_tier: newTier,
        action: 'promoted',
        action_by_type: 'admin',
        notes: tierNotes || 'Manual tier change by admin'
      });

      // Also log to remediation_logs for backwards compatibility
      await supabase.from('remediation_logs').insert({
        landscaper_id: selectedLandscaper.id,
        action: `Tier changed: ${selectedLandscaper.tier} → ${newTier}`,
        action_by: 'admin',
        notes: tierNotes
      });

      // Create notification for landscaper
      await supabase.from('notifications').insert({
        user_id: selectedLandscaper.user_id,
        type: 'tier_update',
        title: `Tier Updated to ${newTier.toUpperCase()}`,
        message: `Your tier has been updated to ${newTier.toUpperCase()} by an administrator.`,
        read: false
      });

      toast({
        title: 'Tier Updated',
        description: `${selectedLandscaper.first_name} ${selectedLandscaper.last_name} is now ${newTier.toUpperCase()}`
      });

      setTierModalOpen(false);
      setSelectedLandscaper(null);
      setTierNotes('');
      loadLandscapers();
    } catch (err) {
      console.error('Error updating tier:', err);
      toast({
        title: 'Error',
        description: 'Failed to update tier',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };


  const openTierModal = (landscaper: LandscaperWithTier) => {
    setSelectedLandscaper(landscaper);
    setNewTier(landscaper.tier || 'starter');
    setTierNotes('');
    setTierModalOpen(true);
  };

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin" />
          <span className="ml-2 text-slate-300">Loading landscapers...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700 md:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Star className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-300">{tierStats.starter}</p>
              <p className="text-xs text-slate-500">Starter</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-700 md:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-900/40 rounded-lg">
              <Award className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-300">{tierStats.pro}</p>
              <p className="text-xs text-slate-500">Pro</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-700 md:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-900/40 rounded-lg">
              <Crown className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-300">{tierStats.elite}</p>
              <p className="text-xs text-slate-500">Elite</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700 md:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{landscapers.length}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search landscapers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-slate-800 border-slate-600">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="elite">Elite</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={loadLandscapers}
              className="border-emerald-500/30 text-emerald-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Landscapers List */}
      <div className="space-y-3">
        {filteredLandscapers.map((landscaper) => {
          const proEligibility = checkEligibility(landscaper, 'pro');
          const eliteEligibility = checkEligibility(landscaper, 'elite');
          
          return (
            <Card key={landscaper.id} className="bg-slate-900 border-slate-700">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white truncate">
                        {landscaper.first_name} {landscaper.last_name}
                      </h3>
                      <TierBadge tier={landscaper.tier || 'starter'} size="sm" />
                      {landscaper.tier_override_by_admin && (
                        <Badge className="bg-purple-900/40 text-purple-300 border-purple-500/40 text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Override
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 truncate">{landscaper.email}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-300">{landscaper.completed_jobs_count || 0} jobs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-400" />
                      <span className="text-slate-300">{(landscaper.average_rating || 0).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {landscaper.insurance_file ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                      )}
                      <span className="text-slate-300">
                        {landscaper.insurance_file ? 'Insured' : 'No Insurance'}
                      </span>
                    </div>
                  </div>

                  {/* Eligibility Indicators */}
                  <div className="flex items-center gap-2">
                    {landscaper.tier === 'starter' && (
                      <Badge 
                        className={`text-xs ${
                          proEligibility.eligible 
                            ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500/40' 
                            : 'bg-slate-800 text-slate-400 border-slate-600'
                        }`}
                      >
                        {proEligibility.eligible ? (
                          <><TrendingUp className="h-3 w-3 mr-1" /> Pro Ready</>
                        ) : (
                          <><TrendingDown className="h-3 w-3 mr-1" /> Pro: {proEligibility.missing.length} missing</>
                        )}
                      </Badge>
                    )}
                    {landscaper.tier === 'pro' && (
                      <Badge 
                        className={`text-xs ${
                          eliteEligibility.eligible 
                            ? 'bg-amber-900/40 text-amber-300 border-amber-500/40' 
                            : 'bg-slate-800 text-slate-400 border-slate-600'
                        }`}
                      >
                        {eliteEligibility.eligible ? (
                          <><TrendingUp className="h-3 w-3 mr-1" /> Elite Ready</>
                        ) : (
                          <><TrendingDown className="h-3 w-3 mr-1" /> Elite: {eliteEligibility.missing.length} missing</>
                        )}
                      </Badge>
                    )}
                  </div>

                  {/* Action */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTierModal(landscaper)}
                    className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/30"
                  >
                    Manage Tier
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredLandscapers.length === 0 && (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Landscapers Found</h3>
              <p className="text-slate-400">Try adjusting your search or filters.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tier Change Modal */}
      <Dialog open={tierModalOpen} onOpenChange={setTierModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-emerald-300">
              Manage Tier: {selectedLandscaper?.first_name} {selectedLandscaper?.last_name}
            </DialogTitle>
          </DialogHeader>

          {selectedLandscaper && (
            <div className="space-y-4 py-4">
              {/* Current Status */}
              <div className="p-4 bg-slate-800/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Tier</span>
                  <TierBadge tier={selectedLandscaper.tier || 'starter'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Completed Jobs</span>
                  <span className="text-white">{selectedLandscaper.completed_jobs_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Average Rating</span>
                  <span className="text-white">{(selectedLandscaper.average_rating || 0).toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Insurance</span>
                  <span className={selectedLandscaper.insurance_file ? 'text-emerald-400' : 'text-amber-400'}>
                    {selectedLandscaper.insurance_file ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
              </div>

              {/* New Tier Selection */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300">New Tier</label>
                <Select value={newTier} onValueChange={(v) => setNewTier(v as LandscaperTier)}>
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="starter">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-slate-400" />
                        <span>Starter</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pro">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-emerald-400" />
                        <span>Pro</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="elite">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-400" />
                        <span>Elite</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tier Description */}
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <p className="text-sm text-slate-400">
                  {TIER_REQUIREMENTS[newTier].description}
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Admin Notes (Optional)</label>
                <Textarea
                  value={tierNotes}
                  onChange={(e) => setTierNotes(e.target.value)}
                  placeholder="Reason for tier change..."
                  className="bg-slate-800 border-slate-600 text-white min-h-[80px]"
                />
              </div>

              {/* Warning for promotion without eligibility */}
              {newTier !== selectedLandscaper.tier && (
                (() => {
                  const eligibility = checkEligibility(selectedLandscaper, newTier);
                  if (!eligibility.eligible && (
                    (newTier === 'pro' && selectedLandscaper.tier === 'starter') ||
                    (newTier === 'elite')
                  )) {
                    return (
                      <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-300">Missing Requirements</p>
                            <ul className="text-xs text-slate-400 mt-1 list-disc list-inside">
                              {eligibility.missing.map((m, i) => (
                                <li key={i}>{m}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTierModalOpen(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTierChange}
              disabled={processing || newTier === selectedLandscaper?.tier}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {processing ? 'Updating...' : 'Update Tier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
