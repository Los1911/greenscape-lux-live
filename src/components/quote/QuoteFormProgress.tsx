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
        <span className="text-gray-500">of</span>
        <span className="text-gray-400">{totalSteps}</span>
      </div>
    );
  }

  // Compact variant - dots only
  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center justify-center gap-2",
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
                "w-2.5 h-2.5 rounded-full transition-all duration-300",
                isCompleted && "bg-emerald-500",
                isCurrent && "bg-emerald-400 ring-2 ring-emerald-400/30 ring-offset-1 ring-offset-black",
                !isCompleted && !isCurrent && "bg-gray-700"
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
          <span className="text-xs text-gray-500 uppercase tracking-wide">Progress</span>
          <span className="text-sm">
            <span className="text-emerald-400 font-semibold">Step {currentStep}</span>
            <span className="text-gray-500"> of {totalSteps}</span>
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        
        {/* Current step label */}
        <div className="mt-2 text-center">
          <span className="text-sm text-white font-medium">
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
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                      isCompleted && "bg-emerald-500 text-white",
                      isCurrent && "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500",
                      !isCompleted && !isCurrent && "bg-gray-800 text-gray-500"
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
                      "mt-2 text-xs font-medium transition-colors",
                      isCompleted && "text-emerald-400",
                      isCurrent && "text-white",
                      !isCompleted && !isCurrent && "text-gray-500"
                    )}
                  >
                    {step.shortLabel}
                  </span>
                </div>
                
                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 mx-2 h-0.5 bg-gray-800 relative">
                    <div 
                      className={cn(
                        "absolute inset-y-0 left-0 bg-emerald-500 transition-all duration-500",
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
    <div className="fixed top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-sm border-b border-gray-800 safe-area-top sm:hidden">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">
            {steps[currentStep - 1]?.label || 'Step'}
          </span>
          <span className="text-xs">
            <span className="text-emerald-400 font-medium">{currentStep}</span>
            <span className="text-gray-500"> / {totalSteps}</span>
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-1 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default QuoteFormProgress;
