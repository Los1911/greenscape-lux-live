import React, { useState, useEffect } from 'react';
import { CreditCard, Receipt, Download, Filter, Calendar, ChevronDown, Wallet, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Sparkles, Plus, Trash2, Star, Shield, Lock } from 'lucide-react';
import { supabase, getSupabaseAnonKeyForFetch } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise, isStripeConfigured } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';

// Types
interface Transaction {
  id: string;
  date: string;
  amount: number;
  service: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  method: string;
  description?: string;
}

interface PaymentSummary {
  totalSpent: number;
  pendingAmount: number;
  lastPaymentDate: string | null;
  paymentMethodCount: number;
}

interface PaymentMethod {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  is_default?: boolean;
}

// Status configuration for consistent styling
const STATUS_CONFIG = {
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

// Stripe CardElement styling options
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': {
        color: '#6b7280',
      },
      iconColor: '#10b981',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: false,
};

// Payment Summary Hero Card Component
const PaymentSummaryHero: React.FC<{
  summary: PaymentSummary;
  loading: boolean;
  onManagePayments: () => void;
}> = ({ summary, loading, onManagePayments }) => {
  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/40 via-black/60 to-emerald-950/40 border border-emerald-500/20 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-emerald-500/20 rounded" />
          <div className="h-10 w-48 bg-emerald-500/20 rounded" />
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="h-16 bg-emerald-500/10 rounded-xl" />
            <div className="h-16 bg-emerald-500/10 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/40 via-black/60 to-emerald-950/40 border border-emerald-500/20">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400/80 uppercase tracking-wider">Account Billing Status</span>
        </div>
        
        {/* Account Status - Replaces Total Spent */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              <span className="text-xl font-bold text-emerald-400">Active</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2">Ready for service</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">

          <div className="bg-black/30 rounded-xl p-4 border border-emerald-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-gray-400">Outstanding Charges</span>
            </div>
            <p className="text-lg font-semibold text-white">
              {summary.pendingAmount > 0 
                ? `$${summary.pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : 'None'
              }
            </p>
          </div>
          
          <div className="bg-black/30 rounded-xl p-4 border border-emerald-500/10">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-gray-400">Payment Method on File</span>
            </div>
            <p className="text-lg font-semibold text-white">
              {summary.paymentMethodCount} {summary.paymentMethodCount === 1 ? 'Card' : 'Cards'}
            </p>
          </div>
        </div>

        {/* Last Payment */}
        {summary.lastPaymentDate && (
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Calendar className="h-4 w-4" />
            <span>Last payment: {new Date(summary.lastPaymentDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}</span>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={onManagePayments}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40 transition-all duration-300"
        >
          <CreditCard className="h-5 w-5" />
          Manage Billing Methods
        </button>
      </div>
    </div>
  );
};

// Transaction Card Component
const TransactionCard: React.FC<{
  transaction: Transaction;
  onViewReceipt: (id: string) => void;
  onDownload: (id: string) => void;
}> = ({ transaction, onViewReceipt, onDownload }) => {
  const status = STATUS_CONFIG[transaction.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  return (
    <div className="bg-black/40 backdrop-blur border border-emerald-500/15 rounded-xl p-4 hover:border-emerald-500/30 transition-all duration-200">
      {/* Top Row: Service & Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{transaction.service}</h3>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date(transaction.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
          <StatusIcon className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{status.label}</span>
        </div>
      </div>

      {/* Middle Row: Amount & Payment Method */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white">
            ${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <CreditCard className="h-4 w-4" />
          <span>{transaction.method}</span>
        </div>
      </div>

      {/* Description if available */}
      {transaction.description && (
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{transaction.description}</p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewReceipt(transaction.id)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200 text-sm font-medium"
        >
          <Receipt className="h-4 w-4" />
          View Receipt
        </button>
        <button
          onClick={() => onDownload(transaction.id)}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-black/40 text-gray-300 hover:text-white hover:bg-black/60 border border-emerald-500/10 hover:border-emerald-500/20 transition-all duration-200 text-sm font-medium"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<{ filterActive: boolean; onRequestService: () => void }> = ({ filterActive, onRequestService }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
        <Receipt className="h-10 w-10 text-emerald-500/50" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {filterActive ? 'No Matching Transactions' : 'No Charges on File'}
      </h3>
      <p className="text-gray-400 text-center max-w-sm mb-6">
        {filterActive 
          ? 'Try adjusting your filters to see more results.'
          : 'Billing details will appear here after your first completed service.'
        }
      </p>
      {!filterActive && (
        <button
          onClick={onRequestService}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40 transition-all duration-300"
        >
          <Sparkles className="h-5 w-5" />
          Request a Service
        </button>
      )}
    </div>
  );
};

// Filter Dropdown Component
const FilterDropdown: React.FC<{
  selected: string;
  onChange: (value: string) => void;
}> = ({ selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = [
    { value: 'all', label: 'All Transactions' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
  ];

  const selectedOption = options.find(o => o.value === selected) || options[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/40 border border-emerald-500/20 text-white hover:border-emerald-500/40 transition-all duration-200"
      >
        <Filter className="h-4 w-4 text-emerald-400" />
        <span className="text-sm font-medium">{selectedOption.label}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-48 bg-black/95 backdrop-blur border border-emerald-500/20 rounded-xl shadow-xl shadow-black/50 z-50 overflow-hidden">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm transition-colors duration-150 ${
                  selected === option.value
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-gray-300 hover:bg-emerald-500/10 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Loading State Component
const LoadingState: React.FC = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-black/40 border border-emerald-500/15 rounded-xl p-4 animate-pulse">
          <div className="flex justify-between mb-3">
            <div className="space-y-2">
              <div className="h-5 w-32 bg-emerald-500/20 rounded" />
              <div className="h-4 w-24 bg-emerald-500/10 rounded" />
            </div>
            <div className="h-6 w-20 bg-emerald-500/15 rounded-full" />
          </div>
          <div className="flex justify-between items-center mb-4">
            <div className="h-8 w-24 bg-emerald-500/20 rounded" />
            <div className="h-4 w-28 bg-emerald-500/10 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-10 bg-emerald-500/10 rounded-lg" />
            <div className="h-10 w-12 bg-emerald-500/10 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Stripe Add Card Form Component (inner form that uses Stripe hooks)
const AddCardFormInner: React.FC<{
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !user) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card input not found. Please refresh and try again.');
      setLoading(false);
      return;
    }

    try {
      // Create payment method with Stripe
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      // Attach payment method to customer via edge function
      const { error: attachError } = await supabase.functions.invoke('attach-payment-method', {
        body: { 
          paymentMethodId: paymentMethod.id, 
          userId: user.id 
        }
      });

      if (attachError) {
        throw new Error('Failed to save billing method. Please try again.');
      }

      toast({
        title: "Success",
        description: "Billing method added successfully",
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error adding payment method:', err);
      setError(err.message || 'Failed to add billing method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Security Badge */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Lock className="h-4 w-4 text-emerald-400" />
        <span>Your card details are encrypted and secure</span>
      </div>

      {/* Card Element Container */}
      <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/20 focus-within:border-emerald-500/50 transition-colors">
        <CardElement 
          options={cardElementOptions}
          onChange={(e) => setCardComplete(e.complete)}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={!stripe || loading || !cardComplete}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-emerald-500 disabled:hover:to-emerald-600"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              <span>Save Billing Method</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-3 rounded-xl bg-black/40 border border-emerald-500/20 text-gray-300 hover:text-white hover:border-emerald-500/40 font-medium transition-all duration-200 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      {/* Stripe Badge */}
      <div className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-500">
        <Lock className="h-3 w-3" />
        <span>Secured by Stripe</span>
      </div>
    </form>
  );
};

// Wrapper component that provides Stripe Elements context
const AddCardForm: React.FC<{
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ onSuccess, onCancel }) => {
  const stripeReady = isStripeConfigured();

  if (!stripeReady) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
        <p className="text-gray-400 mb-2">Payment system is not available</p>
        <p className="text-sm text-gray-500">Please try again later or contact support.</p>
        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 rounded-lg bg-black/40 border border-emerald-500/20 text-gray-300 hover:text-white transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <AddCardFormInner onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
};

// Payment Method Card Component
const PaymentMethodCard: React.FC<{
  method: PaymentMethod;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}> = ({ method, onSetDefault, onDelete, isDeleting }) => {
  const brandIcons: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'Amex',
    discover: 'Discover',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-black/40 border border-emerald-500/15 rounded-xl hover:border-emerald-500/30 transition-all duration-200">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
          <CreditCard className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white truncate">
              {brandIcons[method.card.brand.toLowerCase()] || method.card.brand} •••• {method.card.last4}
            </span>
            {method.is_default && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium border border-amber-500/30">
                <Star className="h-3 w-3" />
                Default
              </span>
            )}
          </div>
          <span className="text-sm text-gray-400 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Expires {method.card.exp_month}/{method.card.exp_year}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {!method.is_default && (
          <button
            onClick={() => onSetDefault(method.id)}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-sm font-medium transition-colors"
          >
            Set Default
          </button>
        )}
        <button
          onClick={() => onDelete(method.id)}
          disabled={isDeleting}
          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};


// Main Component
export const PaymentHistoryPanel: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger = 0 }) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalSpent: 0,
    pendingAmount: 0,
    lastPaymentDate: null,
    paymentMethodCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [seedingTransaction, setSeedingTransaction] = useState(false);


  // ── Fetch on mount and when refreshTrigger changes (realtime) ──
  useEffect(() => {
    if (!authLoading && user) {
      fetchPaymentData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, refreshTrigger]);


  const fetchPaymentData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch payments from database
      const { data: payments, error } = await supabase
        .from('payments')
        .select('id, amount, status, description, created_at, payment_method, job_id')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching payments:', error);
      }

      // Transform payments to transactions
      const transformedTransactions: Transaction[] = (payments || []).map((p: any) => ({
        id: p.id,
        date: p.created_at,
        amount: (p.amount || 0) / 100, // Convert cents to dollars
        service: p.description || 'Service Payment',
        status: mapPaymentStatus(p.status),
        method: p.payment_method || 'Card',
        description: p.description,
      }));

      setTransactions(transformedTransactions);

      // Calculate summary
      const completedPayments = transformedTransactions.filter(t => t.status === 'completed');
      const pendingPayments = transformedTransactions.filter(t => t.status === 'pending');
      
      const paymentMethodCount = await getPaymentMethodCount();
      
      setSummary({
        totalSpent: completedPayments.reduce((sum, t) => sum + t.amount, 0),
        pendingAmount: pendingPayments.reduce((sum, t) => sum + t.amount, 0),
        lastPaymentDate: completedPayments.length > 0 ? completedPayments[0].date : null,
        paymentMethodCount,
      });

    } catch (err) {
      console.error('Error fetching payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  const mapPaymentStatus = (status: string): Transaction['status'] => {
    switch (status?.toLowerCase()) {
      case 'succeeded':
      case 'completed':
      case 'paid':
        return 'completed';
      case 'pending':
      case 'processing':
        return 'pending';
      case 'failed':
      case 'canceled':
        return 'failed';
      case 'refunded':
        return 'refunded';
      default:
        return 'pending';
    }
  };

  const getPaymentMethodCount = async (): Promise<number> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-methods', {
        body: { userId: user?.id }
      });

      if (error) {
        console.error('Error fetching payment methods:', error);
        return 0;
      }

      const methods = data?.paymentMethods || data?.payment_methods || [];
      return methods.length;
    } catch {
      return 0;
    }
  };

  const handleViewReceipt = (transactionId: string) => {
    console.log('View receipt for transaction:', transactionId);
    toast({
      title: "Receipt",
      description: "Receipt viewer coming soon",
    });
  };

  const handleDownload = (transactionId: string) => {
    console.log('Download receipt for transaction:', transactionId);
    toast({
      title: "Download",
      description: "Receipt download coming soon",
    });
  };

  const handleManagePayments = () => {
    setShowPaymentModal(true);
  };

  const handleRequestService = () => {
    // Navigate to client quote form for authenticated clients
    navigate('/client-quote');
  };


  const handlePaymentMethodAdded = async (newCount?: number) => {
    // If we have a direct count from the modal, update immediately
    if (typeof newCount === 'number') {
      setSummary(prev => ({ ...prev, paymentMethodCount: newCount }));
    }
    // Also refresh full payment data for consistency
    await fetchPaymentData();
  };


  // ============================================
  // DEV/TEST ONLY: Seed Test Billing Transaction
  // Remove this function and button before production
  // ============================================
  const handleSeedTestTransaction = async () => {
    if (!user) {
      console.error('[DEV] No user logged in - cannot seed transaction');
      toast({
        title: "Error",
        description: "You must be logged in to seed a test transaction",
        variant: "destructive",
      });
      return;
    }

    setSeedingTransaction(true);
    console.log('[DEV] Starting seed-billing-transaction call for user:', user.id);

    try {
      // Get the current session to retrieve the access token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error('Failed to get session access token');
      }

      const accessToken = sessionData.session.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mwvcbedvnimabfwubazz.supabase.co';

      console.log('[DEV] Calling seed-billing-transaction edge function...');

      // Get the anon key for the apikey header (required for Supabase edge functions)
      const anonKey = getSupabaseAnonKeyForFetch();

      const response = await fetch(`${supabaseUrl}/functions/v1/seed-billing-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });


      const result = await response.json();

      if (!response.ok) {
        console.error('[DEV] seed-billing-transaction error:', result);
        throw new Error(result.error || result.message || 'Failed to seed transaction');
      }

      console.log('[DEV] seed-billing-transaction success:', result);
      
      toast({
        title: "Test Transaction Seeded",
        description: "A test billing transaction has been created. Refreshing data...",
      });

      // Refresh the payment data to show the new transaction
      await fetchPaymentData();

    } catch (error: any) {
      console.error('[DEV] Error seeding test transaction:', error);
      toast({
        title: "Seed Failed",
        description: error.message || 'Failed to seed test transaction',
        variant: "destructive",
      });
    } finally {
      setSeedingTransaction(false);
    }
  };

  // Filter transactions
  const filteredTransactions = selectedFilter === 'all'
    ? transactions
    : transactions.filter(t => t.status === selectedFilter);

  return (
    <div className="w-full overflow-x-hidden min-h-screen bg-gradient-to-b from-black via-emerald-950/10 to-black">
      <div className="w-full px-4 sm:px-6 py-6 space-y-6 max-w-2xl mx-auto">

        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Billing & Payments</h1>
          <p className="text-gray-400 text-sm">Manage payment methods and review service charges</p>
        </div>

        {/* Payment Summary Hero Card */}
        <PaymentSummaryHero
          summary={summary}
          loading={loading}
          onManagePayments={handleManagePayments}
        />

        {/* Transaction History Section */}
        <div className="space-y-4">
          {/* Section Header with Filter */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Transactions</h2>
            <FilterDropdown
              selected={selectedFilter}
              onChange={setSelectedFilter}
            />
          </div>

          {/* Transaction List */}
          {loading ? (
            <LoadingState />
          ) : filteredTransactions.length === 0 ? (
            <EmptyState filterActive={selectedFilter !== 'all'} onRequestService={handleRequestService} />
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onViewReceipt={handleViewReceipt}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}

          {/* Transaction Count */}
          {!loading && filteredTransactions.length > 0 && (
            <p className="text-center text-sm text-gray-500 pt-4">
              Showing {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
              {selectedFilter !== 'all' && ` (${selectedFilter})`}
            </p>
          )}
        </div>

        {/* ============================================ */}
        {/* DEV/TEST ONLY: Seed Test Transaction Button */}
        {/* Hidden in production via environment check  */}
        {/* ============================================ */}
        {import.meta.env.DEV && (
          <div className="mt-8 p-4 rounded-xl border-2 border-dashed border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Dev/Test Only</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Click the button below to seed a test billing transaction for the current user. 
              This calls the <code className="text-amber-300 bg-black/40 px-1 rounded">seed-billing-transaction</code> edge function.
            </p>
            <button
              onClick={handleSeedTestTransaction}
              disabled={seedingTransaction || !user}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {seedingTransaction ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Seeding Transaction...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Seed Test Billing Transaction</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <PaymentMethodModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentMethodAdded={handlePaymentMethodAdded}
        />
      )}
    </div>
  );
};


// Enhanced Payment Method Modal Component with Stripe Integration
const PaymentMethodModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPaymentMethodAdded: (count?: number) => void;
}> = ({ isOpen, onClose, onPaymentMethodAdded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchPaymentMethods();
    }
  }, [isOpen, user]);

  const fetchPaymentMethods = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-payment-methods', {
        body: { userId: user.id }
      });

      if (error) {
        console.error('Error fetching payment methods:', error);
        return;
      }

      const methods = data?.paymentMethods || data?.payment_methods || [];
      setPaymentMethods(methods);
      return methods.length;
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const { error } = await supabase.functions.invoke('set-default-payment-method', {
        body: { userId: user?.id, paymentMethodId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Default billing method updated",
      });

      fetchPaymentMethods();
    } catch (err) {
      console.error('Error setting default:', err);
      toast({
        title: "Error",
        description: "Failed to update default billing method",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    try {
      setDeletingId(paymentMethodId);
      const { error } = await supabase.functions.invoke('delete-payment-method', {
        body: { paymentMethodId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Billing method removed",
      });

      const newCount = await fetchPaymentMethods();
      onPaymentMethodAdded(newCount); // Pass the new count to parent for immediate UI update
    } catch (err) {
      console.error('Error deleting payment method:', err);
      toast({
        title: "Error",
        description: "Failed to remove billing method",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddSuccess = async () => {
    setShowAddForm(false);
    // Fetch updated payment methods from Stripe (source of truth)
    const newCount = await fetchPaymentMethods();
    // Pass the count directly to parent for immediate UI update
    onPaymentMethodAdded(newCount);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-black/95 border border-emerald-500/20 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-emerald-500/10 max-h-[85vh] overflow-hidden">
        {/* Handle bar for mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-emerald-500/20">
          <h3 className="text-lg font-semibold text-white">
            {showAddForm ? 'Add Billing Method' : 'Billing Methods'}
          </h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {showAddForm ? (
            <AddCardForm
              onSuccess={handleAddSuccess}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 bg-emerald-500/10 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-emerald-500/50" />
                  </div>
                  <h4 className="text-white font-medium mb-2">No billing methods on file</h4>
                  <p className="text-gray-400 text-sm mb-6">Add a card to enable seamless payments for your services.</p>
                  <button 
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-semibold transition-all duration-200 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Add Billing Method
                  </button>
                </div>
              ) : (
                <>
                  {/* Payment Methods List */}
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <PaymentMethodCard
                        key={method.id}
                        method={method}
                        onSetDefault={handleSetDefault}
                        onDelete={handleDelete}
                        isDeleting={deletingId === method.id}
                      />
                    ))}
                  </div>

                  {/* Add New Button */}
                  <button 
                    onClick={() => setShowAddForm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 font-medium transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    Add Billing Method
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryPanel;
