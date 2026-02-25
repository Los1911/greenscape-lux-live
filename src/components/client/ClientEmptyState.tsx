import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  ClipboardList, 
  Users, 
  CalendarCheck,
  Leaf
} from 'lucide-react';

// =============================================================================
// HOW IT WORKS STEP COMPONENT
// =============================================================================

interface HowItWorksStepProps {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function HowItWorksStep({ step, icon, title, description }: HowItWorksStepProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-emerald-500/30 transition-all duration-300">
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 text-black text-xs font-bold flex items-center justify-center">
          {step}
        </div>
      </div>
      <div>
        <h4 className="text-white font-medium text-sm sm:text-base">{title}</h4>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">{description}</p>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN EMPTY STATE COMPONENT
// =============================================================================

interface ClientEmptyStateProps {
  userName?: string;
}

export function ClientEmptyState({ userName }: ClientEmptyStateProps) {
  const navigate = useNavigate();
  
  const handleRequestService = () => {
    navigate('/client-quote');
  };

  const displayName = userName || 'there';

  return (
    <div className="space-y-6">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900/40 via-black/60 to-black/60 backdrop-blur border border-emerald-500/30 rounded-2xl p-6 sm:p-8">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          {/* Welcome Icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Welcome, {displayName}!
              </h2>
              <p className="text-emerald-400/80 text-sm">Ready to transform your outdoor space?</p>
            </div>
          </div>

          {/* Main Message */}
          <p className="text-slate-300 text-sm sm:text-base mb-6 max-w-lg">
            Your dashboard will come alive once you request your first service. 
            Get started with a free, personalized estimate from our professional landscaping team.
          </p>

          {/* Primary CTA */}
          <button 
            onClick={handleRequestService}
            className="group w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-semibold text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40 transition-all duration-300 hover:scale-[1.02]"
          >
            <Sparkles className="w-5 h-5" />
            <span>Request Your First Estimate</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-black/60 backdrop-blur border border-emerald-500/20 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-base font-medium text-white">How It Works</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <HowItWorksStep
            step={1}
            icon={<ClipboardList className="w-5 h-5 text-emerald-400" />}
            title="Request an Estimate"
            description="Tell us about your property and the services you need."
          />
          
          <HowItWorksStep
            step={2}
            icon={<Users className="w-5 h-5 text-emerald-400" />}
            title="Get Matched"
            description="We'll connect you with a vetted professional landscaper."
          />
          
          <HowItWorksStep
            step={3}
            icon={<CalendarCheck className="w-5 h-5 text-emerald-400" />}
            title="Book & Relax"
            description="Schedule your service and enjoy your beautiful yard."
          />
        </div>

        {/* Trust indicators */}
        <div className="mt-6 pt-5 border-t border-slate-800/50">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Free estimates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Vetted professionals</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>24-48 hour response</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientEmptyState;
