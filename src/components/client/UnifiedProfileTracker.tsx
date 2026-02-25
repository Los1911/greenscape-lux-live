import React, { useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, User, MapPin, CreditCard, RefreshCw } from 'lucide-react';
import { StandardizedButton } from '@/components/ui/standardized-button';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

interface UnifiedProfileTrackerProps {
  onEditProfile?: () => void;
  onAddAddress?: () => void;
  onAddPayment?: () => void;
}

export const UnifiedProfileTracker: React.FC<UnifiedProfileTrackerProps> = ({
  onEditProfile,
  onAddAddress,
  onAddPayment
}) => {
  const { percentage, items, completedCount, totalCount, loading, refresh, markPaymentMethodAdded } = useProfileCompletion();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Listen for payment method events
  useEffect(() => {
    const handlePaymentMethodAdded = () => {
      console.log('[UNIFIED_PROFILE_TRACKER] Received paymentMethodAdded event');
      markPaymentMethodAdded?.();
      setIsRefreshing(true);
      setTimeout(() => {
        refresh();
        setIsRefreshing(false);
      }, 1500);
    };

    const handleProfileUpdated = () => {
      console.log('[UNIFIED_PROFILE_TRACKER] Received profileUpdated event');
      setIsRefreshing(true);
      setTimeout(() => {
        refresh();
        setIsRefreshing(false);
      }, 1000);
    };

    window.addEventListener('paymentMethodAdded', handlePaymentMethodAdded);
    window.addEventListener('profileUpdated', handleProfileUpdated);
    
    return () => {
      window.removeEventListener('paymentMethodAdded', handlePaymentMethodAdded);
      window.removeEventListener('profileUpdated', handleProfileUpdated);
    };
  }, [refresh, markPaymentMethodAdded]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => setIsRefreshing(false), 2000);
  }, [refresh]);

  const getActionIcon = (actionId: string) => {
    switch (actionId) {
      case 'edit_profile': return <User className="h-3 w-3" />;
      case 'add_address': return <MapPin className="h-3 w-3" />;
      case 'add_payment': return <CreditCard className="h-3 w-3" />;
      default: return null;
    }
  };

  const handleAction = (actionId: string) => {
    switch (actionId) {
      case 'edit_profile': onEditProfile?.(); break;
      case 'add_address': onAddAddress?.(); break;
      case 'add_payment': onAddPayment?.(); break;
    }
  };

  if (loading && !isRefreshing) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
            <div className="h-2 bg-gray-800 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <User className="h-3 w-3 text-emerald-400" />
            </div>
            My Profile
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-gray-400 hover:text-emerald-400 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
            aria-label="Refresh profile"
            title="Refresh"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-400 font-medium text-sm">C</span>
          </div>
          <div>
            <div className="text-sm text-white font-medium">Client</div>
            <div className="text-xs text-gray-400">Premium Client</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Profile Complete</span>
            <span className="text-emerald-400 font-medium">{percentage}%</span>
          </div>
          <Progress 
            value={percentage} 
            className="h-2 bg-gray-800"
            aria-label={`Profile completion: ${percentage}%`}
          />
        </div>

        <div className="flex items-center gap-2 text-emerald-400 text-xs">
          <CheckCircle className="h-3 w-3" />
          Account Verified
        </div>

        {/* Show completion status */}
        {percentage === 100 ? (
          <div className="text-xs text-emerald-400 bg-emerald-500/10 rounded-lg p-2 text-center">
            Profile complete! Enjoy all premium benefits.
          </div>
        ) : (
          <div className="text-xs text-gray-400">
            {completedCount} of {totalCount} steps completed
          </div>
        )}
      </CardContent>
    </Card>
  );
};
