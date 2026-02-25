import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Plus, CheckCircle, Circle, RefreshCw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { UnifiedProfileManager } from './UnifiedProfileManager';
import { PaymentMethodModal } from './PaymentMethodModal';

export const ProfileStatusCard: React.FC = () => {
  const navigate = useNavigate();
  const { percentage, items, loading, refresh, markPaymentMethodAdded } = useProfileCompletion();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAddName = () => setShowProfileModal(true);
  const handleAddPhone = () => setShowProfileModal(true);
  const handleAddAddress = () => setShowProfileModal(true);
  const handleAddPayment = () => setShowPaymentModal(true);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const handlePaymentSuccess = useCallback(() => {
    markPaymentMethodAdded?.();
    setTimeout(() => refresh(), 1000);
    setTimeout(() => refresh(), 3000);
  }, [refresh, markPaymentMethodAdded]);

  useEffect(() => {
    const handlePaymentMethodAdded = () => {
      markPaymentMethodAdded?.();
      setTimeout(() => refresh(), 1500);
    };

    window.addEventListener('paymentMethodAdded', handlePaymentMethodAdded);
    return () => {
      window.removeEventListener('paymentMethodAdded', handlePaymentMethodAdded);
    };
  }, [refresh, markPaymentMethodAdded]);

  const getActionHandler = (action?: string) => {
    switch (action) {
      case 'edit_profile': return handleAddName;
      case 'add_address': return handleAddAddress;
      case 'add_payment': return handleAddPayment;
      default: return () => {};
    }
  };

  const getActionLabel = (item: any) => {
    if (item.completed) return '';
    switch (item.action) {
      case 'edit_profile': return item.id === 'full_name' ? 'Add' : 'Add';
      case 'add_address': return 'Add';
      case 'add_payment': return 'Add';
      default: return 'Add';
    }
  };

  if (loading && !isRefreshing) {
    return (
      <Card className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl">
        <CardContent className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
            <div className="h-2 bg-slate-800 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Profile complete state - calm, confident, minimal
  if (percentage === 100) {
    return (
      <Card className="bg-black/60 backdrop-blur border border-emerald-500/25 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="font-medium">Profile</span>
            </div>
            <span className="text-xs text-emerald-400 font-medium">Complete</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1">
              <div className="w-full bg-emerald-500/20 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full w-full" />
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            All set. You have access to priority booking and premium benefits.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Incomplete profile state - clean, actionable
  return (
    <>
      <Card className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <User className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="font-medium">Profile</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-slate-500 hover:text-emerald-400 transition-colors p-1 rounded disabled:opacity-50 border-0 outline-none focus:outline-none"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  border: 'none',
                  background: 'transparent'
                }}
                aria-label="Refresh"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <span className="text-xs text-slate-500">{percentage}%</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 space-y-4">
          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Completion items - compact list */}
          <div className="space-y-2">
            {items.map((item) => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                  item.completed 
                    ? 'bg-emerald-500/5' 
                    : 'bg-slate-800/50 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-600 shrink-0" />
                  )}
                  <span className={`text-sm ${item.completed ? 'text-slate-300' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </div>
                {!item.completed && item.action && (
                  <button 
                    onClick={getActionHandler(item.action)}
                    className="text-emerald-400 hover:text-emerald-300 text-xs font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-emerald-500/10 border-0 outline-none focus:outline-none"
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      border: 'none',
                      background: 'transparent'
                    }}
                  >
                    {getActionLabel(item)}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
              <h3 className="text-base font-medium text-white">Edit Profile</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 border-0 outline-none focus:outline-none"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  border: 'none'
                }}
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <UnifiedProfileManager 
                profile={{
                  firstName: '',
                  lastName: '',
                  phone: '',
                  address: '',
                  paymentMethod: false
                }} 
                onProfileUpdate={() => {
                  setShowProfileModal(false);
                  setTimeout(() => refresh(), 500);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      <PaymentMethodModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
};
