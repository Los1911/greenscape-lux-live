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
    <div className="border border-green-500/30 rounded-lg overflow-hidden bg-gray-900/30">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-green-400 font-bold text-sm uppercase tracking-wide">
            {title}
          </h3>
          {selectedCount > 0 && (
            <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
              {selectedCount} selected
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-green-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-green-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-green-500/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map((service) => {
              const requiresEvaluation = EVALUATION_REQUIRED_SERVICES.includes(service);
              const serviceDescription = SERVICE_DESCRIPTIONS[service];
              return (
                <div key={service} className="flex flex-col">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id={service}
                      checked={selectedServices.includes(service)}
                      onCheckedChange={(checked) => onServiceChange(service, checked as boolean)}
                      className="border-green-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 mt-0.5"
                    />
                    <div className="flex flex-col">
                      <Label 
                        htmlFor={service} 
                        className="text-sm text-gray-300 hover:text-green-400 cursor-pointer transition-colors leading-tight"
                      >
                        {service}
                      </Label>
                      {serviceDescription && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Info className="w-3 h-3" />
                          {serviceDescription}
                        </span>
                      )}
                      {requiresEvaluation && (
                        <span className="flex items-center gap-1 text-xs text-amber-400/80 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          Requires site evaluation before pricing
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
    <div className="space-y-4">
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
      <div className="border border-green-500/30 rounded-lg p-4 bg-gray-900/30">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="other"
            checked={otherService.length > 0}
            onCheckedChange={(checked) => {
              if (!checked) onOtherServiceChange('');
            }}
            className="border-green-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
          />
          <Label htmlFor="other" className="text-sm text-gray-300 font-semibold">
            Other Service Not Listed
          </Label>
        </div>
        {(otherService.length > 0 || true) && (
          <Input
            placeholder="Describe your service needs..."
            value={otherService}
            onChange={(e) => onOtherServiceChange(e.target.value)}
            className="bg-gray-900 border-green-500/50 text-white text-sm mt-3 focus:border-green-500"
          />
        )}
        <p className="text-xs text-gray-500 mt-2">
          Custom requests will be reviewed by our team during site evaluation.
        </p>
      </div>
    </div>
  );
}
