import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import { SearchResults } from '@/components/search/SearchResults';
import { useSearch, SearchFilters } from '@/hooks/useSearch';
import { SearchUtils } from '@/utils/searchUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, DollarSign, Calendar } from 'lucide-react';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  
  const initialFilters = SearchUtils.parseSearchUrl(searchParams);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  const { data, total, loading, error } = useSearch('jobs', filters, true);

  useEffect(() => {
    const newUrl = SearchUtils.buildSearchUrl(filters, '/search');
    const newSearchParams = new URL(newUrl, window.location.origin).searchParams;
    setSearchParams(newSearchParams);
  }, [filters, setSearchParams]);

  const handleSearch = () => {
    const newFilters = { ...filters, query: searchQuery };
    setFilters(newFilters);
    SearchUtils.saveRecentSearch(searchQuery);
  };

  const renderJobItem = (job: any) => (
    <Card key={job.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-2">{job.title || 'Landscaping Job'}</h3>
        <p className="text-gray-600 mb-3">{job.description || 'Professional landscaping service'}</p>
        <Button size="sm">View Details</Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Jobs</h1>
        
        <div className="space-y-4 mb-8">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder="Search for landscaping jobs..."
            showFilters={true}
            onToggleFilters={() => setShowFilters(!showFilters)}
            activeFilters={0}
            suggestions={[]}
            onClear={() => setSearchQuery('')}
          />
          
          {showFilters && (
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setShowFilters(false)}
            />
          )}
        </div>

        <SearchResults
          data={data}
          total={total}
          loading={loading}
          error={error}
          query={searchQuery}
          renderItem={renderJobItem}
        />
      </div>
    </div>
  );
}

export default SearchPage;