import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Star, Crown, ChevronRight } from 'lucide-react';

interface TierInfo {
  name: string;
  description: string;
  minJobs: number;
  icon: React.ReactNode;
  bgClass: string;
  borderClass: string;
  textClass: string;
  iconBgClass: string;
}

const tiers: TierInfo[] = [
  {
    name: 'Starter',
    description: 'Getting started',
    minJobs: 0,
    icon: <Star className="h-5 w-5" />,
    bgClass: 'bg-slate-800/50',
    borderClass: 'border-slate-600',
    textClass: 'text-slate-300',
    iconBgClass: 'bg-slate-700'
  },
  {
    name: 'Pro',
    description: 'Consistent work',
    minJobs: 15,
    icon: <Award className="h-5 w-5" />,
    bgClass: 'bg-emerald-900/30',
    borderClass: 'border-emerald-600',
    textClass: 'text-emerald-400',
    iconBgClass: 'bg-emerald-800'
  },
  {
    name: 'Elite',
    description: 'Priority access and higher volume',
    minJobs: 50,
    icon: <Crown className="h-5 w-5" />,
    bgClass: 'bg-amber-900/30',
    borderClass: 'border-amber-500',
    textClass: 'text-amber-400',
    iconBgClass: 'bg-amber-800'
  }
];

interface EarningsProgressTiersProps {
  completedJobs: number;
}

export default function EarningsProgressTiers({ completedJobs }: EarningsProgressTiersProps) {
  // Determine current tier based on completed jobs
  const getCurrentTier = (): number => {
    if (completedJobs >= 50) return 2; // Elite
    if (completedJobs >= 15) return 1; // Pro
    return 0; // Starter
  };

  const currentTierIndex = getCurrentTier();

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Award className="h-5 w-5 text-emerald-400" />
          Earnings Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier, index) => {
            const isCurrentTier = index === currentTierIndex;
            const isUnlocked = index <= currentTierIndex;
            
            return (
              <div
                key={tier.name}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-300
                  ${isCurrentTier 
                    ? `${tier.bgClass} ${tier.borderClass} ring-2 ring-offset-2 ring-offset-slate-900 ${tier.borderClass.replace('border-', 'ring-')}` 
                    : isUnlocked 
                      ? `${tier.bgClass} ${tier.borderClass} opacity-80`
                      : 'bg-slate-800/30 border-slate-700 opacity-50'
                  }
                `}
              >
                {isCurrentTier && (
                  <div className="absolute -top-2 -right-2">
                    <span className="flex h-5 w-5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${tier.iconBgClass} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-5 w-5 ${tier.iconBgClass} items-center justify-center`}>
                        <ChevronRight className="h-3 w-3 text-white" />
                      </span>
                    </span>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className={`
                    p-2 rounded-lg
                    ${isUnlocked ? tier.iconBgClass : 'bg-slate-700'}
                  `}>
                    <span className={isUnlocked ? tier.textClass : 'text-slate-500'}>
                      {tier.icon}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${isUnlocked ? tier.textClass : 'text-slate-500'}`}>
                        {tier.name}
                      </h3>
                      {isCurrentTier && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${tier.iconBgClass} ${tier.textClass}`}>
                          Current
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${isUnlocked ? 'text-slate-400' : 'text-slate-600'}`}>
                      {tier.description}
                    </p>
                    {index > 0 && (
                      <p className={`text-xs mt-2 ${isUnlocked ? 'text-slate-500' : 'text-slate-600'}`}>
                        {tier.minJobs}+ jobs completed
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
