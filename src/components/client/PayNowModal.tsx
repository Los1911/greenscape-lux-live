import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield
} from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
);

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

interface PayNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: ApprovedQuote;
  onSuccess: () => void;
}

// Payment Form Component (uses Stripe hooks)
function PaymentForm({
  quote,
  clientSecret,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing
}: {
  quote: ApprovedQuote;
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const submitAttemptedRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (!stripe || !elements || isProcessing || submitAttemptedRef.current) {
      return;
    }

    submitAttemptedRef.current = true;
    setIsProcessing(true);
    setError(null);

    try {
      // Double-check for existing payment before confirming
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id, status')
        .eq('job_id', quote.job_id)
        .eq('status', 'succeeded')
        .maybeSingle();

      if (existingPayment) {
        setError('Payment already completed for this job.');
        onError('Payment already completed for this job.');
        setIsProcessing(false);
        submitAttemptedRef.current = false;
        return;
      }

      // Confirm the payment
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/client-dashboard',
        },
        redirect: 'if_required'
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        onError(stripeError.message || 'Payment failed');
        setIsProcessing(false);
        submitAttemptedRef.current = false;
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Update payment record status
        await supabase
          .from('payments')
          .update({
            status: 'succeeded',
            paid_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        // Update job status to scheduled
        if (quote.job_id) {
          await supabase
            .from('jobs')
            .update({
              status: 'scheduled',
              updated_at: new Date().toISOString()
            })
            .eq('id', quote.job_id);
        }

        // Update quote status to paid
        await supabase
          .from('quotes')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', quote.id);

        onSuccess();
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        // Payment is processing, will be confirmed via webhook
        onSuccess();
      }
    } catch (err: any) {
      console.error('[PaymentForm] Error:', err);
      setError(err.message || 'An unexpected error occurred');
      onError(err.message || 'An unexpected error occurred');
      submitAttemptedRef.current = false;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Payment Element */}
      <div className="bg-white rounded-xl p-4">
        <PaymentElement
          options={{
            layout: 'tabs'
          }}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-black disabled:text-slate-400 font-semibold shadow-lg shadow-emerald-500/20 transition-all duration-200"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay ${quote.approved_amount.toFixed(2)}
          </>
        )}
      </button>

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <Shield className="w-3 h-3" />
        <span>Secured by Stripe</span>
      </div>
    </form>
  );
}

// Main Modal Component
export function PayNowModal({ isOpen, onClose, quote, onSuccess }: PayNowModalProps) {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const initializingRef = useRef(false);

  useEffect(() => {
    if (isOpen && quote && !initializingRef.current) {
      initializePayment();
    }
    return () => {
      if (!isOpen) {
        setClientSecret(null);
        setError(null);
        setPaymentSuccess(false);
        setAlreadyPaid(false);
        setIsProcessing(false);
        initializingRef.current = false;
      }
    };
  }, [isOpen, quote?.id]);

  const initializePayment = async () => {
    // Prevent duplicate initialization
    if (initializingRef.current) return;
    initializingRef.current = true;

    setLoading(true);
    setError(null);
    setAlreadyPaid(false);

    try {
      // IDEMPOTENCY CHECK: Check for existing succeeded payment
      const { data: existingPayment, error: checkError } = await supabase
        .from('payments')
        .select('id, status, stripe_payment_intent_id')
        .eq('job_id', quote.job_id)
        .eq('status', 'succeeded')
        .maybeSingle();

      if (checkError) {
        console.error('[PayNowModal] Error checking existing payment:', checkError);
      }

      if (existingPayment) {
        // Payment already exists - show already paid state
        setAlreadyPaid(true);
        setLoading(false);
        initializingRef.current = false;
        return;
      }

      // Also check if quote is already marked as paid
      if (quote.status === 'paid') {
        setAlreadyPaid(true);
        setLoading(false);
        initializingRef.current = false;
        return;
      }

      // Get or create Stripe customer
      let customerId: string | null = null;

      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('stripe_customer_id')
          .eq('id', user.id)
          .single();

        if (profile?.stripe_customer_id) {
          customerId = profile.stripe_customer_id;
        } else {
          // Create a new Stripe customer
          const { data: customerData, error: customerError } = await supabase.functions.invoke(
            'create-stripe-customer',
            {
              body: {
                email: user.email,
                name: quote.customer_name || user.user_metadata?.name || user.email,
                userId: user.id
              }
            }
          );

          if (customerError) {
            console.error('[PayNowModal] Error creating customer:', customerError);
          } else if (customerData?.customerId) {
            customerId = customerData.customerId;
            // Save customer ID to profile
            await supabase
              .from('profiles')
              .update({ stripe_customer_id: customerId })
              .eq('id', user.id);
          }
        }
      }

      // Create payment intent with job_id for server-side idempotency check
      const { data: intentData, error: intentError } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            amount: quote.approved_amount,
            currency: 'usd',
            customerId: customerId,
            jobId: quote.job_id, // Pass job_id for server-side idempotency check
            quoteId: quote.id,
            description: `GreenScape Lux - ${quote.service_type} - Quote #${quote.id.slice(0, 8)}`
          }
        }
      );

      if (intentError || !intentData?.success) {
        // Check if error is due to already paid
        if (intentData?.alreadyPaid) {
          setAlreadyPaid(true);
          setLoading(false);
          initializingRef.current = false;
          return;
        }
        throw new Error(intentData?.error || intentError?.message || 'Failed to create payment');
      }

      // Insert payment record (only if we got a new payment intent)
      const paymentRecord = {
        job_id: quote.job_id,
        client_id: user?.id,
        stripe_payment_intent_id: intentData.payment_intent.id,
        amount: quote.approved_amount,
        status: 'pending',
        currency: 'usd',
        description: `${quote.service_type} - Quote #${quote.id.slice(0, 8)}`,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('payments')
        .insert(paymentRecord);

      if (insertError) {
        console.error('[PayNowModal] Error inserting payment record:', insertError);
        // Continue anyway - payment can still proceed
      }

      setClientSecret(intentData.client_secret);
    } catch (err: any) {
      console.error('[PayNowModal] Initialization error:', err);
      setError(err.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
      initializingRef.current = false;
    }
  };

  const handleSuccess = () => {
    setPaymentSuccess(true);
    setIsProcessing(false);
    setTimeout(() => {
      onSuccess();
    }, 2000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {alreadyPaid || paymentSuccess ? 'Payment Complete' : 'Complete Payment'}
              </h2>
              <p className="text-xs text-slate-400">
                {alreadyPaid || paymentSuccess ? 'Thank you!' : 'Secure checkout'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Order Summary */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Order Summary</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{quote.service_type}</p>
                {quote.service_address && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">
                    {quote.service_address}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-emerald-400">
                  ${quote.approved_amount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Already Paid State */}
          {alreadyPaid && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white">Payment Already Completed</p>
                <p className="text-sm text-slate-400 mt-1">This job has already been paid for.</p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* Payment Success State */}
          {paymentSuccess && !alreadyPaid && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white">Payment Successful!</p>
                <p className="text-sm text-slate-400 mt-1">Your service has been scheduled.</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && !paymentSuccess && !alreadyPaid && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-sm text-slate-400">Preparing secure checkout...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && !paymentSuccess && !alreadyPaid && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
              <button
                onClick={() => {
                  initializingRef.current = false;
                  initializePayment();
                }}
                disabled={isProcessing}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Payment Form */}
          {clientSecret && !loading && !error && !paymentSuccess && !alreadyPaid && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#10b981',
                    colorBackground: '#1e293b',
                    colorText: '#f8fafc',
                    colorDanger: '#ef4444',
                    fontFamily: 'system-ui, sans-serif',
                    borderRadius: '12px'
                  }
                }
              }}
            >
              <PaymentForm
                quote={quote}
                clientSecret={clientSecret}
                onSuccess={handleSuccess}
                onError={handleError}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}

export default PayNowModal;
