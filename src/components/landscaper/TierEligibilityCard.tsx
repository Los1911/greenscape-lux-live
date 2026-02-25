import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Award, Crown, Star, CheckCircle, Clock, 
  TrendingUp, Briefcase, Shield, ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TierPromotion, 
  LandscaperEligibilityStatus,
  TierProgress,
  calculateTierProgress,
  getEligibilityStatusMessage,
  QualificationMetrics
} from '@/types/tierPromotion';
import { LandscaperTier, TIER_REQUIREMENTS } from '@/types/job';
import TierBadge from './TierBadge';

interface TierEligibilityCardProps {
  landscaperId: string;
  compact?: boolean;
}

export function TierEligibilityCard({ landscaperId, compact = false }: TierEligibilityCardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [eligibilityStatus, setEligibilityStatus] = useState<LandscaperEligibilityStatus | null>(null);

  useEffect(() => {
    if (landscaperId) {
      loadEligibilityStatus();
    }
  }, [landscaperId]);

  const loadEligibilityStatus = async () => {
    try {
      // Get landscaper data
      const { data: landscaper, error: landscaperError } = await supabase
        .from('landscapers')
        .select('id, tier, completed_jobs_count, average_rating, reliability_score, insurance_file')
        .eq('id', landscaperId)
        .single();

      if (landscaperError) throw landscaperError;

      const currentTier = (landscaper.tier || 'starter') as LandscaperTier;

      // Check for pending promotion
      const { data: promotion, error: promotionError } = await supabase
        .from('tier_promotions')
        .select('*')
        .eq('landscaper_id', landscaperId)
        .eq('status', 'pending')
        .maybeSingle();

      // Build metrics
      const metrics: QualificationMetrics = {
        completed_jobs_count: landscaper.completed_jobs_count || 0,
        average_rating: landscaper.average_rating || 0,
        on_time_percentage: null, // Would need to calculate from jobs
        flagged_jobs_count: 0,
        insurance_verified: !!landscaper.insurance_file,
        reliability_score: landscaper.reliability_score
      };

      // Calculate progress
      const progress = calculateTierProgress(currentTier, metrics);

      // Determine status
      let status: LandscaperEligibilityStatus['status'];
      let eligibleTier: LandscaperTier | null = null;

      if (currentTier === 'elite') {
        status = 'at_max_tier';
      } else if (promotion) {
        status = promotion.status as any;
        eligibleTier = promotion.eligible_tier as LandscaperTier;
      } else if (progress.nextTier && progress.overallProgress >= 100) {
        status = 'not_eligible'; // Eligible but no promotion record yet
        eligibleTier = progress.nextTier;
      } else {
        status = 'not_eligible';
      }

      const eligibilityData: LandscaperEligibilityStatus = {
        hasPromotion: !!promotion,
        promotion: promotion as TierPromotion | null,
        currentTier,
        eligibleTier,
        status,
        statusMessage: '',
        progress
      };

      eligibilityData.statusMessage = getEligibilityStatusMessage(eligibilityData);
      setEligibilityStatus(eligibilityData);

    } catch (err) {
      console.error('Error loading eligibility status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/60 backdrop-blur border border-emerald-500/25">
        <CardContent className="py-6 text-center">
          <div className="animate-pulse text-emerald-300/50">Loading tier status...</div>
        </CardContent>
      </Card>
    );
  }

  if (!eligibilityStatus) {
    return null;
  }

  const { currentTier, progress, status, statusMessage, hasPromotion, eligibleTier } = eligibilityStatus;

  // Compact version for overview
  if (compact) {
    return (
      <div className="p-4 bg-black/40 rounded-xl border border-emerald-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TierBadge tier={currentTier} size="sm" />
            {status === 'pending' && (
              <Badge className="bg-amber-900/40 text-amber-300 border-amber-500/40 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Promotion Pending
              </Badge>
            )}
          </div>
          {progress.nextTier && status !== 'at_max_tier' && (
            <span className="text-xs text-slate-400">
              {progress.overallProgress}% to {progress.nextTier}
            </span>
          )}
        </div>
        
        {progress.nextTier && status !== 'at_max_tier' && (
          <Progress value={progress.overallProgress} className="h-1.5 bg-slate-700" />
        )}
        
        {status === 'at_max_tier' && (
          <p className="text-xs text-amber-300/70 mt-1">You've reached the highest tier!</p>
        )}
      </div>
    );
  }

  // Full version
  return (
    <Card className="bg-black/60 backdrop-blur border border-emerald-500/25">
      <CardHeader className="pb-3">
        <CardTitle className="text-emerald-300 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Tier Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Tier & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TierBadge tier={currentTier} size="md" />
            {eligibleTier && (
              <>
                <ChevronRight className="h-4 w-4 text-slate-500" />
                <TierBadge tier={eligibleTier} size="md" />
              </>
            )}
          </div>
          {status === 'pending' && (
            <Badge className="bg-amber-900/40 text-amber-300 border-amber-500/40">
              <Clock className="h-3 w-3 mr-1" />
              Pending Review
            </Badge>
          )}
          {status === 'at_max_tier' && (
            <Badge className="bg-amber-900/40 text-amber-300 border-amber-500/40">
              <Crown className="h-3 w-3 mr-1" />
              Max Tier
            </Badge>
          )}
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-3 rounded-lg ${
            status === 'pending' ? 'bg-amber-900/20 border border-amber-500/30' :
            status === 'at_max_tier' ? 'bg-amber-900/20 border border-amber-500/30' :
            'bg-slate-800/50'
          }`}>
            <p className={`text-sm ${
              status === 'pending' ? 'text-amber-300' :
              status === 'at_max_tier' ? 'text-amber-300' :
              'text-slate-300'
            }`}>
              {statusMessage}
            </p>
          </div>
        )}

        {/* Progress to Next Tier */}
        {progress.nextTier && status !== 'at_max_tier' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Progress to {progress.nextTier.toUpperCase()}</span>
              <span className="text-emerald-300 font-medium">{progress.overallProgress}%</span>
            </div>
            <Progress value={progress.overallProgress} className="h-2 bg-slate-700" />

            {/* Requirements Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {/* Jobs */}
              <div className={`p-3 rounded-lg ${
                progress.requirements.jobs.met 
                  ? 'bg-emerald-900/20 border border-emerald-500/30' 
                  : 'bg-slate-800/50 border border-slate-700'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className={`h-4 w-4 ${progress.requirements.jobs.met ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-xs text-slate-400">Completed Jobs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-bold ${progress.requirements.jobs.met ? 'text-emerald-300' : 'text-white'}`}>
                    {progress.requirements.jobs.current}
                  </span>
                  <span className="text-xs text-slate-500">/ {progress.requirements.jobs.required}</span>
                </div>
                {progress.requirements.jobs.met && (
                  <CheckCircle className="h-4 w-4 text-emerald-400 mt-1" />
                )}
              </div>

              {/* Rating */}
              <div className={`p-3 rounded-lg ${
                progress.requirements.rating.met 
                  ? 'bg-emerald-900/20 border border-emerald-500/30' 
                  : 'bg-slate-800/50 border border-slate-700'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <Star className={`h-4 w-4 ${progress.requirements.rating.met ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="text-xs text-slate-400">Average Rating</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-bold ${progress.requirements.rating.met ? 'text-emerald-300' : 'text-white'}`}>
                    {progress.requirements.rating.current.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-500">/ {progress.requirements.rating.required}+</span>
                </div>
                {progress.requirements.rating.met && (
                  <CheckCircle className="h-4 w-4 text-emerald-400 mt-1" />
                )}
              </div>

              {/* Insurance */}
              <div className={`p-3 rounded-lg ${
                progress.requirements.insurance.met 
                  ? 'bg-emerald-900/20 border border-emerald-500/30' 
                  : 'bg-slate-800/50 border border-slate-700'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className={`h-4 w-4 ${progress.requirements.insurance.met ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-xs text-slate-400">Insurance</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${progress.requirements.insurance.met ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {progress.requirements.insurance.verified ? 'Verified' : 'Required'}
                  </span>
                </div>
                {progress.requirements.insurance.met && (
                  <CheckCircle className="h-4 w-4 text-emerald-400 mt-1" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tier Benefits Preview */}
        {progress.nextTier && status !== 'at_max_tier' && (
          <div className="pt-3 border-t border-slate-700/50">
            <p className="text-xs text-slate-400 mb-2">
              {progress.nextTier.toUpperCase()} tier benefits:
            </p>
            <p className="text-xs text-slate-300">
              {TIER_REQUIREMENTS[progress.nextTier].description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TierEligibilityCard;
