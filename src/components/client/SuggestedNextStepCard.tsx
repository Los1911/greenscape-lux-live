import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowRight } from 'lucide-react';

interface SuggestedNextStepCardProps {
  /** Number of active jobs - card only shows when this is 0 */
  activeJobs: number;
}

/**
 * A subtle, premium suggestion card that appears when the client has no active jobs.
 * Designed to feel like gentle guidance, not marketing or pressure.
 * 
 * Design principles:
 * - Smaller than primary action cards
 * - Soft emerald accent
 * - Calm, reassuring language
 * - Single optional action
 * - Disappears naturally once jobs exist
 */
export function SuggestedNextStepCard({ activeJobs }: SuggestedNextStepCardProps) {
  const navigate = useNavigate();

  // Only show when there are no active jobs
  if (activeJobs > 0) {
    return null;
  }

  const handleRequestService = () => {
    // Navigate to client quote form for authenticated clients
    navigate('/client-quote');
  };


  return (
    <div className="bg-gradient-to-br from-emerald-950/40 to-black/60 backdrop-blur border border-emerald-500/15 rounded-xl p-4 sm:p-5">
      <div className="flex items-start gap-3">
        {/* Subtle icon */}
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
          <Leaf className="w-4 h-4 text-emerald-500/70" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Calm headline */}
          <h4 className="text-sm font-medium text-white/90 mb-1">
            Your yard is quiet
          </h4>
          
          {/* Reassuring subtext */}
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            Request your next service whenever you're ready.
          </p>
          
          {/* Single optional action - smaller, softer than primary CTAs */}
          <button
            onClick={handleRequestService}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-500/30 rounded-lg transition-all duration-200 group"
          >
            <span>Request Service</span>
            <ArrowRight className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SuggestedNextStepCard;
