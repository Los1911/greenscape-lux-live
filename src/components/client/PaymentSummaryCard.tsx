import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Wallet, TrendingUp, Calendar, Clock } from 'lucide-react';
import { PaymentMethodModal } from './PaymentMethodModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface BillingSummary {
  totalSpent: number;
  pendingAmount: number;
  lastPaymentDate: string | null;
  paymentMethodReady: boolean;
}

interface PaymentSummaryCardProps {
  variant?: 'default' | 'compact' | 'hero';
  showManageButton?: boolean;
}

export const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({ 
  variant = 'default',
  showManageButton = true 
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [billingSummary, setBillingSummary] = useState<BillingSummary>({
    totalSpent: 0,
    pendingAmount: 0,
    lastPaymentDate: null,
    paymentMethodReady: false,
  });
  const [loading, setLoading] = useState(true);
  const { user, session, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!session || !user) {
      setLoading(false);
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchBillingSummary();
    }, 200);

    return () => clearTimeout(timer);
  }, [user, session, authLoading]);

  const fetchBillingSummary = async () => {
    try {
      setLoading(true);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email, first_name, last_name')
        .eq('id', user?.id)
        .single();

      if (profileError) {
        throw new Error('Failed to load user profile');
      }

      let stripeCustomerId = profile?.stripe_customer_id;

      if (!stripeCustomerId) {
        const createPayload = {
          userId: user?.id,
          email: profile?.email || user?.email,
          name: profile?.first_name && profile?.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : profile?.first_name || profile?.last_name || '',
          firstName: profile?.first_name || '',
          lastName: profile?.last_name || ''
        };
        
        const { data: createResult, error: createError } = await supabase.functions.invoke('create-stripe-customer', {
          body: createPayload
        });

        if (createError || !createResult?.success) {
          setBillingSummary({
            totalSpent: 0,
            pendingAmount: 0,
            lastPaymentDate: null,
            paymentMethodReady: true,
          });
          setLoading(false);
          return;
        }

        stripeCustomerId = createResult.stripe_customer_id;
      }

      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status, created_at')
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      const completedPayments = (payments || []).filter((p: any) => 
        ['succeeded', 'completed', 'paid'].includes(p.status?.toLowerCase())
      );
      const pendingPayments = (payments || []).filter((p: any) => 
        ['pending', 'processing'].includes(p.status?.toLowerCase())
      );

      setBillingSummary({
        totalSpent: completedPayments.reduce((sum: number, p: any) => sum + ((p.amount || 0) / 100), 0),
        pendingAmount: pendingPayments.reduce((sum: number, p: any) => sum + ((p.amount || 0) / 100), 0),
        lastPaymentDate: completedPayments.length > 0 ? completedPayments[0].created_at : null,
        paymentMethodReady: true,
      });

    } catch (err: any) {
      console.error('Payment summary error:', err);
      setBillingSummary({
        totalSpent: 0,
        pendingAmount: 0,
        lastPaymentDate: null,
        paymentMethodReady: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading State - consistent with other cards
  if (loading) {
    return (
      <div className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl p-5 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-slate-800 rounded-lg" />
            <div className="h-4 w-28 bg-slate-800 rounded" />
          </div>
          <div className="h-8 w-32 bg-slate-800 rounded" />
          <div className="h-3 w-24 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  // Hero Variant - Full featured card
  if (variant === 'hero') {
    return (
      <>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/30 via-black/60 to-emerald-950/30 border border-emerald-500/20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-slate-400">Payment Overview</span>
            </div>
            
            <div className="mb-5">
              <p className="text-xs text-slate-500 mb-1">Total Spent This Year</p>
              <span className="text-3xl font-semibold text-white">
                ${billingSummary.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs text-slate-500">Pending</span>
                </div>
                <p className="text-base font-medium text-white">
                  ${billingSummary.pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs text-slate-500">Status</span>
                </div>
                <p className="text-base font-medium text-emerald-400">
                  {billingSummary.paymentMethodReady ? 'Active' : 'Setup'}
                </p>
              </div>
            </div>

            {billingSummary.lastPaymentDate && (
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Last payment: {new Date(billingSummary.lastPaymentDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}</span>
              </div>
            )}

            {showManageButton && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/30 transition-all duration-200"
              >
                <CreditCard className="h-4 w-4" />
                Manage Payment Methods
              </button>
            )}
          </div>
        </div>

        {showPaymentModal && (
          <PaymentMethodModal 
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
          />
        )}
      </>
    );
  }

  // Compact Variant
  if (variant === 'compact') {
    return (
      <>
        <div className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Spent</p>
                <p className="text-lg font-semibold text-white">
                  ${billingSummary.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            {showManageButton && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors text-sm font-medium"
              >
                Manage
              </button>
            )}
          </div>
        </div>

        {showPaymentModal && (
          <PaymentMethodModal 
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
          />
        )}
      </>
    );
  }

  // Default Variant - refined for dashboard grid
  return (
    <>
      <div className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <h3 className="text-sm font-medium text-slate-400">Spending</h3>
        </div>
        
        <div className="text-2xl font-semibold text-white mb-1">
          ${billingSummary.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Total this year
        </p>
        
        {billingSummary.pendingAmount > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-400 mb-4 py-2 px-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Clock className="h-3.5 w-3.5" />
            <span>${billingSummary.pendingAmount.toFixed(2)} pending</span>
          </div>
        )}
        
        {showManageButton && (
          <button 
            onClick={() => setShowPaymentModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-800 text-white font-medium transition-all duration-200"
          >
            <CreditCard className="h-4 w-4 text-slate-400" />
            View Details
          </button>
        )}
      </div>

      {showPaymentModal && (
        <PaymentMethodModal 
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
};

export default PaymentSummaryCard;
