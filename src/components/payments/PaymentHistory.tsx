import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  Receipt, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Filter,
  ChevronDown
} from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  status: string;
  description: string;
  paid_at: string;
  created_at: string;
  payment_method: string;
  job_id: string;
}

interface PaymentHistoryProps {
  customerId?: string;
  landscaperId?: string;
  compact?: boolean;
}

// Status configuration for consistent styling
const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  succeeded: {
    label: 'Completed',
    icon: CheckCircle,
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    bgColor: 'bg-amber-500/15',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
  },
  processing: {
    label: 'Processing',
    icon: RefreshCw,
    bgColor: 'bg-blue-500/15',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    bgColor: 'bg-red-500/15',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
  },
  refunded: {
    label: 'Refunded',
    icon: RefreshCw,
    bgColor: 'bg-gray-500/15',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-500/30',
  },
};

const getStatusConfig = (status: string) => {
  return STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending;
};

export default function PaymentHistory({ customerId, landscaperId, compact = false }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    if (customerId || landscaperId) {
      fetchPayments();
    } else {
      setLoading(false);
    }
  }, [customerId, landscaperId]);

  const fetchPayments = async () => {
    if (!customerId && !landscaperId) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      let query = supabase
        .from('payments')
        .select('id, amount, status, description, paid_at, created_at, payment_method, job_id, customer_id, landscaper_id')
        .order('created_at', { ascending: false });
      
      if (customerId) query = query.eq('customer_id', customerId);
      else if (landscaperId) query = query.eq('landscaper_id', landscaperId);
      
      const { data, error: fetchError } = await query;
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      setPayments(data || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Unable to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = (paymentId: string) => {
    console.log('View receipt:', paymentId);
  };

  const handleDownload = (paymentId: string) => {
    console.log('Download receipt:', paymentId);
  };

  // Filter payments
  const filteredPayments = filter === 'all' 
    ? payments 
    : payments.filter(p => p.status?.toLowerCase() === filter);

  // No IDs provided
  if (!customerId && !landscaperId) {
    return (
      <div className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-amber-400" />
          </div>
          <p className="text-gray-400 text-center">Please sign in to view payment history</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Payment History</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-black/40 border border-emerald-500/10 rounded-xl p-4 animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-emerald-500/20 rounded" />
                  <div className="h-3 w-24 bg-emerald-500/10 rounded" />
                </div>
                <div className="h-5 w-20 bg-emerald-500/15 rounded-full" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-6 w-24 bg-emerald-500/20 rounded" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-emerald-500/10 rounded-lg" />
                  <div className="h-8 w-8 bg-emerald-500/10 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => { setLoading(true); fetchPayments(); }} 
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-emerald-500/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Payment History</h3>
          </div>
          
          {/* Filter Dropdown */}
          {!compact && (
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-emerald-500/20 text-sm text-gray-300 hover:border-emerald-500/40 transition-colors"
              >
                <Filter className="h-4 w-4 text-emerald-400" />
                <span className="capitalize">{filter === 'all' ? 'All' : filter}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showFilterDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilterDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-40 bg-black/95 border border-emerald-500/20 rounded-xl shadow-xl z-50 overflow-hidden">
                    {['all', 'succeeded', 'pending', 'failed', 'refunded'].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setFilter(option);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm capitalize transition-colors ${
                          filter === option
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'text-gray-300 hover:bg-emerald-500/10'
                        }`}
                      >
                        {option === 'all' ? 'All Payments' : option}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {filteredPayments.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-emerald-500/50" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">
              {filter !== 'all' ? 'No Matching Payments' : 'No Payments Yet'}
            </h4>
            <p className="text-gray-400 text-center text-sm max-w-xs">
              {filter !== 'all' 
                ? 'Try adjusting your filter to see more results.'
                : 'Your payment history will appear here once you complete a transaction.'
              }
            </p>
            {filter === 'all' && (
              <div className="flex items-center gap-2 text-sm text-emerald-400/70 mt-4">
                <TrendingUp className="h-4 w-4" />
                <span>Payments will show up automatically</span>
              </div>
            )}
          </div>
        ) : (
          // Payment Cards
          <div className="space-y-3">
            {filteredPayments.map((payment) => {
              const status = getStatusConfig(payment.status);
              const StatusIcon = status.icon;
              const amount = (payment.amount || 0) / 100;

              return (
                <div 
                  key={payment.id} 
                  className="bg-black/40 border border-emerald-500/15 rounded-xl p-4 hover:border-emerald-500/30 transition-all duration-200"
                >
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">
                        {payment.description || 'Payment'}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>
                          {payment.created_at 
                            ? new Date(payment.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : 'Unknown date'
                          }
                        </span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${status.bgColor} ${status.textColor} border ${status.borderColor} flex-shrink-0`}>
                      <StatusIcon className="h-3 w-3" />
                      <span className="text-xs font-medium">{status.label}</span>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-white">
                        ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm text-gray-500">
                        {payment.payment_method || 'Card'}
                      </span>
                    </div>
                    
                    {!compact && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewReceipt(payment.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors text-sm"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Receipt</span>
                        </button>
                        <button
                          onClick={() => handleDownload(payment.id)}
                          className="flex items-center justify-center p-1.5 rounded-lg bg-black/40 text-gray-400 hover:text-white hover:bg-black/60 border border-emerald-500/10 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Count Footer */}
        {filteredPayments.length > 0 && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Showing {filteredPayments.length} {filteredPayments.length === 1 ? 'payment' : 'payments'}
            {filter !== 'all' && ` (${filter})`}
          </p>
        )}
      </div>
    </div>
  );
}
