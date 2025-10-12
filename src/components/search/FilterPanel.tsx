import React from 'react';
import { X, Calendar, DollarSign, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { SearchFilters } from '@/hooks/useSearch';

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClose: () => void;
  categories?: string[];
  serviceTypes?: string[];
  locations?: string[];
}

export function FilterPanel({
  filters,
  onFiltersChange,
  onClose,
  categories = ['Lawn Care', 'Landscaping', 'Tree Service', 'Hardscaping'],
  serviceTypes = ['Mowing', 'Trimming', 'Planting', 'Irrigation', 'Cleanup'],
  locations = ['Downtown', 'Suburbs', 'North Side', 'South Side']
}: FilterPanelProps) {
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.values(filters).filter(v => 
    v !== undefined && v !== null && v !== '' && 
    (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <div className="bg-white border rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All ({activeFilterCount})
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Category
        </Label>
        <Select value={filters.category || ''} onValueChange={(value) => updateFilter('category', value || undefined)}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location Filter */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location
        </Label>
        <Input
          value={filters.location || ''}
          onChange={(e) => updateFilter('location', e.target.value || undefined)}
          placeholder="Enter location"
        />
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Price Range
        </Label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.priceMin || ''}
              onChange={(e) => updateFilter('priceMin', e.target.value ? Number(e.target.value) : undefined)}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.priceMax || ''}
              onChange={(e) => updateFilter('priceMax', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>
      </div>

      {/* Rating Filter */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          Minimum Rating
        </Label>
        <Select value={filters.rating?.toString() || ''} onValueChange={(value) => updateFilter('rating', value ? Number(value) : undefined)}>
          <SelectTrigger>
            <SelectValue placeholder="Any rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Rating</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="3">3+ Stars</SelectItem>
            <SelectItem value="2">2+ Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Service Types */}
      <div className="space-y-3">
        <Label>Service Types</Label>
        <div className="grid grid-cols-2 gap-2">
          {serviceTypes.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={type}
                checked={filters.serviceType?.includes(type) || false}
                onCheckedChange={(checked) => {
                  const current = filters.serviceType || [];
                  const updated = checked 
                    ? [...current, type]
                    : current.filter(t => t !== type);
                  updateFilter('serviceType', updated.length > 0 ? updated : undefined);
                }}
              />
              <Label htmlFor={type} className="text-sm">{type}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div className="space-y-2">
        <Label>Sort By</Label>
        <div className="flex gap-2">
          <Select value={filters.sortBy || 'relevance'} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="date">Date</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.sortOrder || 'desc'} onValueChange={(value) => updateFilter('sortOrder', value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">↑</SelectItem>
              <SelectItem value="desc">↓</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}