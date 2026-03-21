import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface QuoteFormStep {
  id: string;
  label: string;
  shortLabel: string;
}

export const QUOTE_FORM_STEPS: QuoteFormStep[] = [
  { id: 'contact', label: 'Contact Info', shortLabel: 'Contact' },
  { id: 'service-type', label: 'Service Type', shortLabel: 'Type' },
  { id: 'services', label: 'Services', shortLabel: 'Services' },
  { id: 'property', label: 'Property', shortLabel: 'Property' },
];

// =============================================================================
// PROGRESS INDICATOR COMPONENT
// =============================================================================

interface QuoteFormProgressProps {
  currentStep: number;
  totalSteps?: number;
  steps?: QuoteFormStep[];
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
}

export function QuoteFormProgress({ 
  currentStep, 
  totalSteps = 4,
  steps = QUOTE_FORM_STEPS,
  className,
  variant = 'default'
}: QuoteFormProgressProps) {
  
  // Minimal variant - just shows "Step X of Y"
  if (variant === 'minimal') {
    return (
      <div className={cn(
        "flex items-center justify-center gap-2 text-sm",
        className
      )}>
        <span className="text-emerald-400 font-medium">Step {currentStep}</span>
        <span className="text-white/30">of</span>
        <span className="text-white/50">{totalSteps}</span>
      </div>
    );
  }

  // Compact variant - dots only
  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center justify-center gap-2.5",
        className
      )}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div
              key={step.id}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-500 ease-out",
                isCompleted && "bg-emerald-400",
                isCurrent && "bg-emerald-400 w-6 rounded-full",
                !isCompleted && !isCurrent && "bg-white/15"
              )}
              aria-label={`Step ${stepNumber}: ${step.label}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
            />
          );
        })}
      </div>
    );
  }

  // Default variant - full progress bar with labels
  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: Compact view with step counter */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/40 uppercase tracking-wider font-medium">Progress</span>
          <span className="text-xs">
            <span className="text-emerald-400 font-semibold">{currentStep}</span>
            <span className="text-white/30"> / {totalSteps}</span>
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-1 bg-white/[0.08] rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        
        {/* Current step label */}
        <div className="mt-2.5 text-center">
          <span className="text-xs text-white/60 font-medium">
            {steps[currentStep - 1]?.label || 'Step'}
          </span>
        </div>
      </div>

      {/* Desktop: Full step indicator */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isLast = index === steps.length - 1;
            
            return (
              <React.Fragment key={step.id}>
                {/* Step circle and label */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500 ease-out",
                      isCompleted && "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20",
                      isCurrent && "bg-emerald-500/15 text-emerald-400 ring-2 ring-emerald-500/40",
                      !isCompleted && !isCurrent && "bg-white/[0.06] text-white/30"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <span 
                    className={cn(
                      "mt-2 text-xs font-medium transition-colors duration-300",
                      isCompleted && "text-emerald-400/80",
                      isCurrent && "text-white/90",
                      !isCompleted && !isCurrent && "text-white/30"
                    )}
                  >
                    {step.shortLabel}
                  </span>
                </div>
                
                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 mx-3 h-[1px] bg-white/[0.06] relative">
                    <div 
                      className={cn(
                        "absolute inset-y-0 left-0 bg-emerald-500/60 transition-all duration-700 ease-out",
                        isCompleted ? "w-full" : "w-0"
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// STICKY PROGRESS BAR (for mobile)
// =============================================================================

interface StickyProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  steps?: QuoteFormStep[];
}

export function StickyProgressBar({ 
  currentStep, 
  totalSteps = 4,
  steps = QUOTE_FORM_STEPS 
}: StickyProgressBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/[0.06] safe-area-top sm:hidden">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/50 font-medium">
            {steps[currentStep - 1]?.label || 'Step'}
          </span>
          <span className="text-xs">
            <span className="text-emerald-400 font-medium">{currentStep}</span>
            <span className="text-white/30"> / {totalSteps}</span>
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-[3px] bg-white/[0.08] rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default QuoteFormProgress;
