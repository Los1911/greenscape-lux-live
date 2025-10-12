import React from 'react';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SearchResultsProps<T = any> {
  data: T[];
  total: number;
  loading: boolean;
  error: string | null;
  query?: string;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
  loadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export function SearchResults<T = any>({
  data,
  total,
  loading,
  error,
  query,
  renderItem,
  emptyState,
  loadMore,
  hasMore = false,
  className = ''
}: SearchResultsProps<T>) {
  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Searching...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-red-800 font-semibold mb-2">Search Error</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        {emptyState || (
          <div className="max-w-md mx-auto">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {query ? 'No results found' : 'Start your search'}
            </h3>
            <p className="text-gray-600">
              {query 
                ? `No results found for "${query}". Try adjusting your search terms or filters.`
                : 'Enter a search term to find what you\'re looking for.'
              }
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600">
            {total > 0 && (
              <>
                Showing {data.length} of {total} results
                {query && <span> for "<strong>{query}</strong>"</span>}
              </>
            )}
          </p>
          {loading && data.length > 0 && (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          )}
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid gap-4 md:gap-6">
        {data.map((item, index) => (
          <div key={index} className="animate-in fade-in duration-200">
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && loadMore && (
        <div className="text-center pt-6">
          <Button 
            onClick={loadMore} 
            disabled={loading}
            variant="outline"
            className="px-8"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}