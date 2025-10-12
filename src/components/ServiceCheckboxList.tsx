import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ServiceCheckboxListProps {
  selectedServices: string[];
  otherService: string;
  onServiceChange: (service: string, checked: boolean) => void;
  onOtherServiceChange: (value: string) => void;
}

const serviceCategories = {
  'CORE LANDSCAPING SERVICES': [
    'Lawn Mowing',
    'Lawn Care and Maintenance',
    'Hedge and Shrub Trimming',
    'Edging and Borders',
    'Mulch Installation',
    'Rock Installation',
    'Sod Installation',
    'Seasonal Cleanups (Fall/Spring)',
    'Hardscaping and Custom Features',
    'Flower Bed Installation and Design',
    'Weed Control'
  ],
  'WINTER SERVICES': [
    'Snow Removal',
    'Salting / De-icing',
    'Winter Yard Prep'
  ],
  'ADD-ON / PARTNERED SERVICES': [
    'Pressure Washing',
    'Gutter Cleaning',
    'Pest Control (via partners)',
    'Leaf Removal',
    'Yard Waste Disposal'
  ],
  'PREMIUM SERVICES': [
    'Full Landscape Renovation',
    'Weekly or Biweekly Recurring Maintenance',
    'Property Flip Cleanups (Real Estate Ready)',
    'Airbnb / Rental Property Lawn Services',
    'HOA or Multi-Property Contracts'
  ]
};

export default function ServiceCheckboxList({ 
  selectedServices, 
  otherService, 
  onServiceChange, 
  onOtherServiceChange 
}: ServiceCheckboxListProps) {
  return (
    <div className="space-y-6">
      {Object.entries(serviceCategories).map(([category, services]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-green-400 font-bold text-sm uppercase tracking-wide">
            {category}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
            {services.map((service) => (
              <div key={service} className="flex items-center space-x-2">
                <Checkbox
                  id={service}
                  checked={selectedServices.includes(service)}
                  onCheckedChange={(checked) => onServiceChange(service, checked as boolean)}
                  className="border-green-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                <Label 
                  htmlFor={service} 
                  className="text-sm text-gray-300 hover:text-green-400 cursor-pointer transition-colors"
                >
                  {service}
                </Label>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="space-y-3 pt-2 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="other"
            checked={otherService.length > 0}
            onCheckedChange={(checked) => {
              if (!checked) onOtherServiceChange('');
            }}
            className="border-green-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
          />
          <Label htmlFor="other" className="text-sm text-gray-300 font-semibold">Other</Label>
        </div>
        {otherService.length > 0 && (
          <Input
            placeholder="Please specify..."
            value={otherService}
            onChange={(e) => onOtherServiceChange(e.target.value)}
            className="bg-gray-900 border-green-500 text-white text-sm ml-6"
          />
        )}
      </div>
    </div>
  );
}