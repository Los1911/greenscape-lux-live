import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Download, 
  Receipt, 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle, 
  RefreshCw,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description?: string;
  invoice_url?: string;
}

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Status configuration
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

export function PaymentHistoryModal({ isOpen, onClose }: PaymentHistoryModalProps) {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchPayments();
    }
  }, [isOpen, user?.id]);

  const fetchPayments = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select('id, amount, status, description, created_at, payment_method')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching payments:', error);
      }

      const transformedPayments: Payment[] = (data || []).map((p: any) => ({
        id: p.id,
        date: p.created_at,
        amount: (p.amount || 0) / 100,
        method: p.payment_method || 'Card',
        status: mapStatus(p.status),
        description: p.description,
      }));

      setPayments(transformedPayments);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const mapStatus = (status: string): Payment['status'] => {
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

  const handleViewReceipt = (paymentId: string) => {
    console.log('View receipt:', paymentId);
    // TODO: Implement receipt viewing
  };

  const handleDownload = (paymentId: string) => {
    console.log('Download receipt:', paymentId);
    // TODO: Implement receipt download
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border border-emerald-500/20 text-white max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 border-b border-emerald-500/20">
          <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-400" />
            Payment History
          </DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            // Loading State
            <div className="p-4 sm:p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-black/40 border border-emerald-500/10 rounded-xl p-4 animate-pulse">
                  <div className="flex justify-between mb-3">
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-emerald-500/20 rounded" />
                      <div className="h-3 w-32 bg-emerald-500/10 rounded" />
                    </div>
                    <div className="h-5 w-16 bg-emerald-500/15 rounded-full" />
                  </div>
                  <div className="h-6 w-20 bg-emerald-500/20 rounded" />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <Receipt className="h-8 w-8 text-emerald-500/50" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Payments Yet</h3>
              <p className="text-gray-400 text-center text-sm max-w-xs">
                Your payment history will appear here once you complete your first service.
              </p>
              <div className="flex items-center gap-2 text-sm text-emerald-400/70 mt-4">
                <TrendingUp className="h-4 w-4" />
                <span>Book a service to get started</span>
              </div>
            </div>
          ) : (
            // Payment List
            <div className="p-4 sm:p-6 space-y-3">
              {payments.map((payment) => {
                const status = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
                const StatusIcon = status.icon;

                return (
                  <div 
                    key={payment.id} 
                    className="bg-black/40 border border-emerald-500/15 rounded-xl p-4 hover:border-emerald-500/30 transition-all duration-200"
                  >
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                          <span className="font-medium text-white truncate">
                            {payment.description || 'Service Payment'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(payment.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="mx-1">•</span>
                          <span>{payment.method}</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
                        <StatusIcon className="h-3 w-3" />
                        <span className="text-xs font-medium">{status.label}</span>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-white">
                        ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewReceipt(payment.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors text-sm"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          <span>Receipt</span>
                        </button>
                        <button
                          onClick={() => handleDownload(payment.id)}
                          className="flex items-center justify-center p-1.5 rounded-lg bg-black/40 text-gray-400 hover:text-white hover:bg-black/60 border border-emerald-500/10 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {payments.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-emerald-500/20">
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors font-medium"
            >
              <span>View All Transactions</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PaymentHistoryModal;
