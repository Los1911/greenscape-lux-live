import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Calendar, CreditCard } from 'lucide-react';

export interface ServiceType {
  id: 'one-time' | 'monthly';
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  features: string[];
  badge?: string;
  popular?: boolean;
}

interface ServiceTypeSelectorProps {
  selectedType: 'one-time' | 'monthly' | null;
  onSelect: (type: 'one-time' | 'monthly') => void;
  serviceTypes: ServiceType[];
  className?: string;
}

export default function ServiceTypeSelector({ 
  selectedType, 
  onSelect, 
  serviceTypes,
  className = '' 
}: ServiceTypeSelectorProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-green-400 mb-2">
          Choose Your Service Plan
        </h3>
        <p className="text-gray-400">
          Select between one-time service or monthly recurring maintenance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {serviceTypes.map((service) => (
          <Card
            key={service.id}
            className={`relative cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              selectedType === service.id
                ? 'border-2 border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
                : 'border border-gray-600 bg-gray-900/50 hover:border-green-400/50'
            }`}
            onClick={() => onSelect(service.id)}
          >
            {service.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-500 text-white px-3 py-1 text-xs font-semibold">
                  Most Popular
                </Badge>
              </div>
            )}

            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {service.id === 'monthly' ? (
                    <Calendar className="h-5 w-5 text-green-400" />
                  ) : (
                    <CreditCard className="h-5 w-5 text-blue-400" />
                  )}
                  <h4 className="text-lg font-semibold text-white">
                    {service.title}
                  </h4>
                </div>
                
                {selectedType === service.id && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              <p className="text-gray-300 text-sm mb-4">
                {service.description}
              </p>

              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-green-400">
                    ${service.price}
                  </span>
                  {service.originalPrice && (
                    <span className="text-lg text-gray-500 line-through">
                      ${service.originalPrice}
                    </span>
                  )}
                  <span className="text-gray-400 text-sm">
                    {service.id === 'monthly' ? '/month' : 'one-time'}
                  </span>
                </div>
                {service.badge && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {service.badge}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                {service.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedType && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-green-400">
            <Check className="h-5 w-5" />
            <span className="font-medium">
              {selectedType === 'monthly' ? 'Monthly Recurring Service' : 'One-Time Service'} Selected
            </span>
          </div>
          <p className="text-sm text-gray-300 mt-1">
            {selectedType === 'monthly' 
              ? 'You can cancel or modify your subscription anytime from your dashboard.'
              : 'Perfect for one-off projects or seasonal maintenance needs.'
            }
          </p>
        </div>
      )}
    </div>
  );
}