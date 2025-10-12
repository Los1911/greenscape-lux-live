import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Percent, TrendingUp, Award, Target } from 'lucide-react';

interface CommissionTier {
  name: string;
  rate: number;
  minJobs: number;
  color: string;
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
    color: 'bg-amber-100 text-amber-800',
    benefits: ['Basic commission rate', 'Standard support']
  },
  {
    name: 'Silver',
    rate: 18,
    minJobs: 10,
    color: 'bg-gray-100 text-gray-800',
    benefits: ['Higher commission rate', 'Priority support', 'Marketing materials']
  },
  {
    name: 'Gold',
    rate: 22,
    minJobs: 25,
    color: 'bg-yellow-100 text-yellow-800',
    benefits: ['Premium commission rate', 'Dedicated account manager', 'Featured listing']
  },
  {
    name: 'Platinum',
    rate: 25,
    minJobs: 50,
    color: 'bg-purple-100 text-purple-800',
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

export default function CommissionTracker() {
  const currentTierIndex = commissionTiers.findIndex(tier => tier.name === mockCommissionData.currentTier);
  const nextTier = commissionTiers[currentTierIndex + 1];
  const progressToNextTier = nextTier 
    ? Math.min((mockCommissionData.jobsCompleted / nextTier.minJobs) * 100, 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Award className="h-5 w-5" />
            Commission Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{mockCommissionData.currentRate}%</div>
              <p className="text-sm text-blue-600">Current Rate</p>
              <Badge className={commissionTiers[currentTierIndex]?.color || 'bg-gray-100'}>
                {mockCommissionData.currentTier} Tier
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">${mockCommissionData.monthlyCommission}</div>
              <p className="text-sm text-blue-600">This Month</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">${mockCommissionData.totalCommission}</div>
              <p className="text-sm text-blue-600">Total Earned</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress to Next Tier */}
      {nextTier && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progress to {nextTier.name} Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Jobs Completed</span>
                <span className="text-sm text-gray-600">{mockCommissionData.jobsCompleted} / {nextTier.minJobs}</span>
              </div>
              <Progress value={progressToNextTier} className="h-3" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {nextTier.minJobs - mockCommissionData.jobsCompleted} more jobs to unlock {nextTier.rate}% commission
                </span>
                <Badge className={nextTier.color}>
                  +{nextTier.rate - mockCommissionData.currentRate}% rate increase
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commission Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Commission Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commissionTiers.map((tier, index) => (
              <div 
                key={tier.name}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tier.name === mockCommissionData.currentTier 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Badge className={tier.color}>{tier.name}</Badge>
                    <div className="text-2xl font-bold mt-1">{tier.rate}%</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {tier.minJobs === 0 ? 'Starting tier' : `${tier.minJobs}+ jobs`}
                  </div>
                </div>
                <ul className="space-y-1">
                  {tier.benefits.map((benefit, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-center gap-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
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