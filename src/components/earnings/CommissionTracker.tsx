import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Percent, Award, Target, Briefcase } from 'lucide-react';

interface CommissionTier {
  name: string;
  rate: number;
  minJobs: number;
  color: string;
  bgColor: string;
  benefits: string[];
}

interface CommissionData {
  currentTier: string;
  currentRate: number;
  jobsCompleted: number;
  nextTierJobs: number;
  monthlyCommission: number;
  totalCommission: number;
}

const commissionTiers: CommissionTier[] = [
  {
    name: 'Bronze',
    rate: 15,
    minJobs: 0,
    color: 'bg-amber-900/50 text-amber-400 border-amber-700',
    bgColor: 'bg-amber-900/20 border-amber-700/50',
    benefits: ['Basic commission rate', 'Standard support']
  },
  {
    name: 'Silver',
    rate: 18,
    minJobs: 10,
    color: 'bg-slate-700 text-slate-300 border-slate-600',
    bgColor: 'bg-slate-800/50 border-slate-600/50',
    benefits: ['Higher commission rate', 'Priority support', 'Marketing materials']
  },
  {
    name: 'Gold',
    rate: 22,
    minJobs: 25,
    color: 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
    bgColor: 'bg-yellow-900/20 border-yellow-700/50',
    benefits: ['Premium commission rate', 'Dedicated account manager', 'Featured listing']
  },
  {
    name: 'Platinum',
    rate: 25,
    minJobs: 50,
    color: 'bg-purple-900/50 text-purple-400 border-purple-700',
    bgColor: 'bg-purple-900/20 border-purple-700/50',
    benefits: ['Maximum commission rate', 'VIP support', 'Exclusive opportunities']
  }
];

const mockCommissionData: CommissionData = {
  currentTier: 'Silver',
  currentRate: 18,
  jobsCompleted: 47,
  nextTierJobs: 25,
  monthlyCommission: 585.00,
  totalCommission: 2835.00
};

interface CommissionTrackerProps {
  data?: CommissionData;
}

export default function CommissionTracker({ data }: CommissionTrackerProps) {
  const commissionData = data || mockCommissionData;
  const hasJobs = commissionData.jobsCompleted > 0;
  
  const currentTierIndex = commissionTiers.findIndex(tier => tier.name === commissionData.currentTier);
  const nextTier = commissionTiers[currentTierIndex + 1];
  const progressToNextTier = nextTier 
    ? Math.min((commissionData.jobsCompleted / nextTier.minJobs) * 100, 100)
    : 100;

  // Empty state
  if (!hasJobs) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Percent className="h-5 w-5 text-slate-400" />
            Commission Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
              <Briefcase className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-slate-400">
              Complete your first job to start earning and unlock higher tiers.
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Your commission progress will be tracked here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card className="bg-gradient-to-r from-emerald-900/30 to-emerald-950/30 border-emerald-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-300">
            <Award className="h-5 w-5" />
            Commission Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{commissionData.currentRate}%</div>
              <p className="text-sm text-emerald-400/80">Current Rate</p>
              <Badge className={commissionTiers[currentTierIndex]?.color || 'bg-slate-800 text-slate-400'}>
                {commissionData.currentTier} Tier
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">${commissionData.monthlyCommission}</div>
              <p className="text-sm text-emerald-400/80">This Month</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">${commissionData.totalCommission}</div>
              <p className="text-sm text-emerald-400/80">Total Earned</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress to Next Tier */}
      {nextTier && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="h-5 w-5 text-slate-400" />
              Progress to {nextTier.name} Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-300">Jobs Completed</span>
                <span className="text-sm text-slate-400">{commissionData.jobsCompleted} / {nextTier.minJobs}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressToNextTier}%` }}
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm">
                <span className="text-slate-400">
                  {nextTier.minJobs - commissionData.jobsCompleted} more jobs to unlock {nextTier.rate}% commission
                </span>
                <Badge className={nextTier.color}>
                  +{nextTier.rate - commissionData.currentRate}% rate increase
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commission Tiers */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Percent className="h-5 w-5 text-slate-400" />
            Commission Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commissionTiers.map((tier) => (
              <div 
                key={tier.name}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tier.name === commissionData.currentTier 
                    ? `${tier.bgColor} ring-2 ring-offset-2 ring-offset-slate-900 ${tier.color.includes('emerald') ? 'ring-emerald-500' : tier.color.includes('amber') ? 'ring-amber-500' : tier.color.includes('yellow') ? 'ring-yellow-500' : tier.color.includes('purple') ? 'ring-purple-500' : 'ring-slate-500'}` 
                    : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Badge className={tier.color}>{tier.name}</Badge>
                    <div className="text-2xl font-bold mt-1 text-white">{tier.rate}%</div>
                  </div>
                  <div className="text-sm text-slate-400">
                    {tier.minJobs === 0 ? 'Starting tier' : `${tier.minJobs}+ jobs`}
                  </div>
                </div>
                <ul className="space-y-1">
                  {tier.benefits.map((benefit, idx) => (
                    <li key={idx} className="text-sm text-slate-400 flex items-center gap-2">
                      <div className="w-1 h-1 bg-slate-500 rounded-full flex-shrink-0"></div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
