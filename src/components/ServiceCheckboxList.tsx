import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, AlertCircle, Info } from 'lucide-react';

interface ServiceCheckboxListProps {
  selectedServices: string[];
  otherService: string;
  onServiceChange: (service: string, checked: boolean) => void;
  onOtherServiceChange: (value: string) => void;
}

// Services that require site evaluation before pricing
const EVALUATION_REQUIRED_SERVICES = [
  'Tree Removal',
  'Tree Trimming & Pruning',
  'Stump Grinding',
  'Land Clearing',
  'Full Landscape Renovation',
  'Hardscaping and Custom Features',
  'Drainage Solutions',
  'Retaining Walls',
  'Irrigation System Installation',
  'Property Flip Cleanups (Real Estate Ready)',
  'HOA or Multi-Property Contracts'
];

// Service descriptions/helper text
const SERVICE_DESCRIPTIONS: Record<string, string> = {
  'Lawn Maintenance': 'Includes mowing, trimming, edging, borders, blowing, and general lawn upkeep',
  'Yard Waste Disposal': 'Offsite disposal of organic debris generated during service'
};

// Reorganized service categories per requirements
// Consolidated: Lawn Mowing, Lawn Care and Maintenance, Edging and Borders → Lawn Maintenance
const serviceCategories = {
  'Lawn & Landscape Services': [
    'Lawn Maintenance',
    'Hedge and Shrub Trimming',
    'Mulch Installation',
    'Rock Installation',
    'Sod Installation',
    'Flower Bed Installation and Design',
    'Weed Control',
    'Full Landscape Renovation',
    'Hardscaping and Custom Features',
    'Drainage Solutions',
    'Retaining Walls',
    'Irrigation System Installation'
  ],
  'Tree & Property Care': [
    'Tree Removal',
    'Tree Trimming & Pruning',
    'Stump Grinding',
    'Land Clearing',
    'Property Flip Cleanups (Real Estate Ready)',
    'Airbnb / Rental Property Lawn Services',
    'HOA or Multi-Property Contracts',
    'Weekly or Biweekly Recurring Maintenance'
  ],
  'Seasonal & Exterior Services': [
    'Seasonal Cleanups (Fall/Spring)',
    'Leaf Removal',
    'Snow Removal',
    'Salting / De-icing',
    'Winter Yard Prep',
    'Pressure Washing',
    'Gutter Cleaning',
    'Pest Control (via partners)',
    'Yard Waste Disposal'
  ]
};


interface CollapsibleSectionProps {
  title: string;
  services: string[];
  selectedServices: string[];
  onServiceChange: (service: string, checked: boolean) => void;
  defaultOpen?: boolean;
}

function CollapsibleSection({ 
  title, 
  services, 
  selectedServices, 
  onServiceChange,
  defaultOpen = true 
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const selectedCount = services.filter(s => selectedServices.includes(s)).length;

  return (
    <div className="border border-green-400/20 rounded-2xl overflow-hidden bg-white/[0.02] hover:border-green-400/30 transition-colors duration-150">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-all duration-150 active:scale-[0.99] active:bg-white/10"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-emerald-400 font-semibold text-sm uppercase tracking-wide">
            {title}
          </h3>
          {selectedCount > 0 && (
            <span className="bg-emerald-500/15 text-emerald-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {selectedCount} selected
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-white/40" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white/40" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-white/[0.04]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {services.map((service) => {
              const requiresEvaluation = EVALUATION_REQUIRED_SERVICES.includes(service);
              const serviceDescription = SERVICE_DESCRIPTIONS[service];
              const isSelected = selectedServices.includes(service);
              return (
                <div 
                  key={service} 
                  className={`flex flex-col p-3 rounded-xl border transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                    isSelected 
                      ? 'border-green-400/40 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.25)]' 
                      : 'border-transparent hover:bg-white/5 active:bg-white/10'
                  }`}
                  onClick={() => onServiceChange(service, !isSelected)}
                >
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={service}
                      checked={isSelected}
                      onCheckedChange={(checked) => onServiceChange(service, checked as boolean)}
                      className="mt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex flex-col">
                      <Label 
                        htmlFor={service} 
                        className={`text-sm cursor-pointer transition-colors leading-tight ${
                          isSelected ? 'text-white font-medium' : 'text-white/70 hover:text-white/90'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {service}
                      </Label>
                      {serviceDescription && (
                        <span className="flex items-center gap-1.5 text-xs text-white/40 mt-1.5">
                          <Info className="w-3 h-3 flex-shrink-0" />
                          {serviceDescription}
                        </span>
                      )}
                      {requiresEvaluation && (
                        <span className="flex items-center gap-1.5 text-xs text-amber-400/70 mt-1.5">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          Requires site evaluation
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


export default function ServiceCheckboxList({ 
  selectedServices, 
  otherService, 
  onServiceChange, 
  onOtherServiceChange 
}: ServiceCheckboxListProps) {
  return (
    <div className="space-y-3">
      {Object.entries(serviceCategories).map(([category, services], index) => (
        <CollapsibleSection
          key={category}
          title={category}
          services={services}
          selectedServices={selectedServices}
          onServiceChange={onServiceChange}
          defaultOpen={index === 0}
        />
      ))}
      
      {/* Other service input */}
      <div className="border border-green-400/20 rounded-2xl p-5 bg-white/[0.02] hover:border-green-400/30 transition-colors duration-150">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="other"
            checked={otherService.length > 0}
            onCheckedChange={(checked) => {
              if (!checked) onOtherServiceChange('');
            }}
          />
          <Label htmlFor="other" className="text-sm text-white/70 font-semibold">
            Other Service Not Listed
          </Label>
        </div>
        {(otherService.length > 0 || true) && (
          <Input
            placeholder="Describe your service needs..."
            value={otherService}
            onChange={(e) => onOtherServiceChange(e.target.value)}
            className="bg-white/[0.04] border-white/[0.08] text-white text-sm mt-3 focus:border-emerald-500/50 rounded-xl transition-all duration-200 placeholder:text-white/30"
          />
        )}
        <p className="text-xs text-white/40 mt-2.5">
          Custom requests will be reviewed during site evaluation.
        </p>
      </div>
    </div>
  );
}

