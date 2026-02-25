import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, 
  MapPin, 
  CreditCard,
  RefreshCw,
  Sparkles,
  Loader2
} from 'lucide-react';
import { PayNowModal } from './PayNowModal';


interface ApprovedQuote {
  id: string;
  job_id: string;
  service_type: string;
  service_address: string;
  approved_amount: number;
  approved_at: string;
  status: string;
  preferred_date?: string;
  customer_name?: string;
}

export function ApprovedQuotesSection() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<ApprovedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<ApprovedQuote | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [processingQuoteId, setProcessingQuoteId] = useState<string | null>(null);

  const fetchApprovedQuotes = useCallback(async () => {
    if (!user?.id && !user?.email) return;

    try {
      setLoading(true);

      // Build query to find approved quotes for this client
      // Match by user_id OR customer_email
      const orConditions: string[] = [];
      if (user.id) {
        orConditions.push(`user_id.eq.${user.id}`);
      }
      if (user.email) {
        orConditions.push(`customer_email.eq.${user.email}`);
      }

      const { data, error } = await supabase
        .from('quotes')
        .select(`
          id,
          job_id,
          service_type,
          address,
          approved_amount,
          approved_at,
          status,
          preferred_date,
          customer_name
        `)
        .eq('status', 'approved')
        .not('approved_amount', 'is', null)
        .or(orConditions.join(','))
        .order('approved_at', { ascending: false });

      if (error) {
        console.error('[ApprovedQuotesSection] Error fetching quotes:', error);
        setQuotes([]);
        return;
      }

      // Transform data to match interface
      const transformedQuotes: ApprovedQuote[] = (data || []).map(q => ({
        id: String(q.id),
        job_id: q.job_id || '',
        service_type: q.service_type || 'Landscaping Service',
        service_address: q.address || '',
        approved_amount: Number(q.approved_amount) || 0,
        approved_at: q.approved_at || '',
        status: q.status || 'approved',
        preferred_date: q.preferred_date,
        customer_name: q.customer_name
      }));

      setQuotes(transformedQuotes);
    } catch (err) {
      console.error('[ApprovedQuotesSection] Unexpected error:', err);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    fetchApprovedQuotes();

    // Set up realtime subscription for quote updates
    const channel = supabase
      .channel('approved-quotes-realtime-' + (user?.id || 'anon'))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes',
          filter: `status=eq.approved`
        },
        () => {
          console.log('[ApprovedQuotesSection] Quote update detected, refreshing...');
          fetchApprovedQuotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchApprovedQuotes]);

  const handlePayNow = (quote: ApprovedQuote) => {
    // Prevent opening modal if already processing
    if (processingQuoteId) return;
    
    setProcessingQuoteId(quote.id);
    setSelectedQuote(quote);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    setSelectedQuote(null);
    setProcessingQuoteId(null);
    // Refresh quotes to remove the paid one
    fetchApprovedQuotes();
  };

  const handleModalClose = () => {
    setPaymentModalOpen(false);
    setSelectedQuote(null);
    setProcessingQuoteId(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl">
        <div className="p-5 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-base font-medium text-white">Ready to Pay</h3>
          </div>
        </div>
        <div className="p-5 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
        </div>
      </div>
    );
  }

  // No approved quotes - don't render anything
  if (quotes.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-black/60 backdrop-blur border border-emerald-500/30 rounded-2xl">
        <div className="p-5 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white">Quotes Ready for Payment</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {quotes.length} approved quote{quotes.length !== 1 ? 's' : ''} awaiting payment
              </p>
            </div>
          </div>
        </div>

        <div className="p-3">
          <div className="space-y-2">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 space-y-3"
              >
                {/* Service Info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {quote.service_type}
                    </p>
                    {quote.service_address && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{quote.service_address}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-emerald-400">
                      ${quote.approved_amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">Approved</p>
                  </div>
                </div>

                {/* Date Info */}
                {quote.preferred_date && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>Scheduled: {formatDate(quote.preferred_date)}</span>
                  </div>
                )}

                {/* Pay Now Button */}
                <button
                  onClick={() => handlePayNow(quote)}
                  disabled={processingQuoteId === quote.id}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-black disabled:text-slate-400 font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/30 disabled:shadow-none transition-all duration-200"
                >
                  {processingQuoteId === quote.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Pay Now - ${quote.approved_amount.toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedQuote && (
        <PayNowModal
          isOpen={paymentModalOpen}
          onClose={handleModalClose}
          quote={selectedQuote}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}

export default ApprovedQuotesSection;
