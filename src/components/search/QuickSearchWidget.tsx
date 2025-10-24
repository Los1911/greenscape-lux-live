import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QuickSearchWidgetProps {
  className?: string;
  placeholder?: string;
  showFilters?: boolean;
}

export function QuickSearchWidget({ 
  className = '', 
  placeholder = "Search landscaping jobs...",
  showFilters = true 
}: QuickSearchWidgetProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (location) params.set('location', location);
    if (category) params.set('category', category);
    
    const searchUrl = `/search${params.toString() ? `?${params.toString()}` : ''}`;
    navigate(searchUrl);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 ${className}`}>
      <div className="space-y-4">
        <h3 className="text-white text-lg font-semibold mb-4">Find Your Perfect Landscaper</h3>
        
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="pl-10 bg-white/90 border-white/30 text-gray-900 placeholder-gray-500"
            />
          </div>

          {showFilters && (
            <>
              {/* Location Filter */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Location"
                  className="pl-10 bg-white/90 border-white/30 text-gray-900 placeholder-gray-500 w-full md:w-40"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="pl-10 bg-white/90 border-white/30 text-gray-900 w-full md:w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="lawn-care">Lawn Care</SelectItem>
                    <SelectItem value="landscaping">Landscaping</SelectItem>
                    <SelectItem value="tree-service">Tree Service</SelectItem>
                    <SelectItem value="hardscaping">Hardscaping</SelectItem>
                    <SelectItem value="irrigation">Irrigation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Search Button */}
          <Button 
            onClick={handleSearch}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 whitespace-nowrap"
          >
            Search Jobs
          </Button>
        </div>

        {/* Popular Searches */}
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-white/70 text-sm">Popular:</span>
          {['Lawn Mowing', 'Garden Design', 'Tree Trimming', 'Irrigation'].map((term) => (
            <button
              key={term}
              onClick={() => {
                setQuery(term);
                setTimeout(handleSearch, 100);
              }}
              className="text-green-300 hover:text-green-200 text-sm underline"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}