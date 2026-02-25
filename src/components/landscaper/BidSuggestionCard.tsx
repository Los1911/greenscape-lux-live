import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/lib/ConfigContext';

interface BidSuggestionCardProps {
  jobId: string;
  quoteRequestId?: string;
  currentPrice?: number;
  onBidAccept: (bidAmount: number) => void;
}

export function BidSuggestionCard({ jobId, quoteRequestId, currentPrice, onBidAccept }: BidSuggestionCardProps) {
  const supabase = useSupabaseClient();
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [manualBid, setManualBid] = useState<number>(0);
  const [winRate, setWinRate] = useState<number>(0);

  useEffect(() => {
    loadPricingData();
  }, [jobId, quoteRequestId]);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      console.log('[BID_SUGGESTIONS] Loading pricing data for job:', jobId);

      // Skip if no valid quote reference
      if (!quoteRequestId && !jobId) {
        console.log('[BID_SUGGESTIONS] No quote reference, skipping pricing lookup');
        setLoading(false);
        return;
      }

      // Fetch pricing_history for this quote - use maybeSingle() to avoid 406 errors
      // This is optional data - jobs can exist without pricing_history
      const { data: pricingData, error: pricingError } = await supabase
        .from('pricing_history')
        .select('*')
        .eq('quote_id', quoteRequestId || jobId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406 errors

      // Only log actual errors, not "no rows returned" (PGRST116)
      if (pricingError && pricingError.code !== 'PGRST116') {
        console.error('[BID_SUGGESTIONS] Error fetching pricing:', pricingError);
      }

      if (pricingData) {
        console.log('[BID_SUGGESTIONS] Found pricing estimate:', pricingData);
        setEstimate(pricingData);
        const suggested = Math.round((pricingData.estimated_min + pricingData.estimated_max) / 2);
        setManualBid(currentPrice || suggested);

        // Calculate win rate based on historical data - non-blocking
        try {
          const { data: historicalData } = await supabase
            .from('pricing_history')
            .select('final_price, estimated_min, estimated_max')
            .not('final_price', 'is', null)
            .gte('final_price', pricingData.estimated_min * 0.9)
            .lte('final_price', pricingData.estimated_max * 1.1)
            .limit(100); // Limit for performance

          if (historicalData && historicalData.length > 0) {
            const wins = historicalData.filter(h => h.final_price).length;
            const rate = Math.round((wins / historicalData.length) * 100);
            setWinRate(rate);
            console.log('[BID_SUGGESTIONS] Win rate:', rate, '%');
          }
        } catch (winRateError) {
          // Win rate calculation is non-critical, don't block on errors
          console.warn('[BID_SUGGESTIONS] Win rate calculation failed:', winRateError);
        }
      } else {
        // No pricing data found - use current price as fallback
        console.log('[BID_SUGGESTIONS] No pricing history found, using current price');
        if (currentPrice && currentPrice > 0) {
          setManualBid(currentPrice);
        }
      }
    } catch (error) {
      // Non-blocking error handling - pricing suggestions are optional
      console.warn('[BID_SUGGESTIONS] Error loading pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
        <p className="text-emerald-300/50 text-sm">Loading AI bid suggestions...</p>
      </div>
    );
  }

  // If no estimate data, don't render the card (graceful degradation)
  if (!estimate) return null;

  const suggestedBid = Math.round((estimate.estimated_min + estimate.estimated_max) / 2);
  const minBid = estimate.estimated_min;
  const maxBid = estimate.estimated_max;

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 rounded-xl p-5 space-y-4 shadow-lg shadow-emerald-500/10">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-emerald-300">AI Bid Suggestions</h4>
        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-200 text-xs rounded-lg font-medium">
          {winRate > 0 ? `${winRate}% Win Rate` : 'New'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xs text-emerald-300/60 mb-1">Min</p>
          <p className="text-lg font-bold text-emerald-400">${minBid}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-emerald-300/60 mb-1">Suggested</p>
          <p className="text-xl font-bold text-emerald-300">${suggestedBid}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-emerald-300/60 mb-1">Max</p>
          <p className="text-lg font-bold text-emerald-400">${maxBid}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-emerald-300/70 font-medium">Your Bid: ${manualBid}</label>
        <input
          type="range"
          min={minBid * 0.8}
          max={maxBid * 1.2}
          value={manualBid}
          onChange={(e) => setManualBid(Number(e.target.value))}
          className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-emerald-300/50">
          <span>${Math.round(minBid * 0.8)}</span>
          <span>${Math.round(maxBid * 1.2)}</span>
        </div>
      </div>

      <button
        onClick={() => onBidAccept(manualBid)}
        className="w-full px-4 py-2.5 bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 rounded-xl hover:bg-emerald-500/30 transition-all duration-200 font-medium text-sm shadow-lg shadow-emerald-500/10"
      >
        Accept with ${manualBid} Bid
      </button>
    </div>
  );
}
