import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Upload, Brain, MapPin, DollarSign } from 'lucide-react';
import { aiQuoteService, QuoteRequest, QuoteEstimate } from '@/services/AIQuoteService';
import { logger } from '@/utils/logger';

const SERVICES = [
  { id: 'lawn-mowing', label: 'Lawn Mowing', price: '$0.15/sqft' },
  { id: 'hedge-trimming', label: 'Hedge Trimming', price: '$25/hour' },
  { id: 'garden-maintenance', label: 'Garden Maintenance', price: '$0.25/sqft' },
  { id: 'tree-pruning', label: 'Tree Pruning', price: '$75/tree' },
  { id: 'landscape-design', label: 'Landscape Design', price: '$2.50/sqft' }
];

export const AIQuoteEstimator: React.FC = () => {
  const [formData, setFormData] = useState({
    address: '',
    squareFootage: '',
    propertyType: 'residential',
    services: [] as string[]
  });
  const [images, setImages] = useState<string[]>([]);
  const [estimate, setEstimate] = useState<QuoteEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualOverride, setManualOverride] = useState<number | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const generateQuote = async () => {
    if (!formData.address || !formData.squareFootage || formData.services.length === 0) {
      logger.warn('Incomplete quote form data');
      return;
    }

    setLoading(true);
    try {
      const request: QuoteRequest = {
        images,
        address: formData.address,
        squareFootage: parseInt(formData.squareFootage),
        services: formData.services,
        propertyType: formData.propertyType
      };

      const result = await aiQuoteService.generateQuote(request);
      setEstimate(result);
      logger.info('Quote generated successfully');
    } catch (error) {
      logger.error('Quote generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyManualOverride = () => {
    if (manualOverride && estimate) {
      setEstimate({
        ...estimate,
        estimatedPrice: manualOverride,
        confidence: 0.9 // High confidence for manual override
      });
      setManualOverride(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI-Powered Quote Estimation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Property Address</Label>
            <div className="flex">
              <MapPin className="h-4 w-4 mt-3 mr-2 text-gray-400" />
              <Input
                id="address"
                placeholder="123 Main St, City, State"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="squareFootage">Square Footage</Label>
            <Input
              id="squareFootage"
              type="number"
              placeholder="5000"
              value={formData.squareFootage}
              onChange={(e) => setFormData(prev => ({ ...prev, squareFootage: e.target.value }))}
            />
          </div>

          <div>
            <Label>Services Required</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {SERVICES.map(service => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={service.id}
                    checked={formData.services.includes(service.id)}
                    onCheckedChange={() => handleServiceToggle(service.id)}
                  />
                  <Label htmlFor={service.id} className="text-sm">
                    {service.label} <span className="text-gray-500">({service.price})</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="images">Property Images</Label>
            <div className="mt-2">
              <input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('images')?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Property Images ({images.length} selected)
              </Button>
            </div>
          </div>

          <Button onClick={generateQuote} disabled={loading} className="w-full">
            {loading ? 'Analyzing...' : 'Generate AI Quote'}
          </Button>
        </CardContent>
      </Card>

      {estimate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Quote Estimate
              </span>
              <Badge variant={estimate.confidence > 0.8 ? 'default' : 'secondary'}>
                {Math.round(estimate.confidence * 100)}% Confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-green-600">
              ${estimate.estimatedPrice.toFixed(2)}
            </div>

            <div>
              <h4 className="font-semibold mb-2">Price Breakdown</h4>
              {Object.entries(estimate.breakdown).map(([service, price]) => (
                <div key={service} className="flex justify-between">
                  <span className="capitalize">{service.replace('-', ' ')}</span>
                  <span>${price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {estimate.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">AI Recommendations</h4>
                <ul className="list-disc list-inside space-y-1">
                  {estimate.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-600">{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Manual Override</h4>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter custom price"
                  value={manualOverride || ''}
                  onChange={(e) => setManualOverride(parseFloat(e.target.value))}
                />
                <Button onClick={applyManualOverride} variant="outline">
                  Apply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};