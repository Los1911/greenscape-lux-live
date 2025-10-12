import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export interface SearchFilters {
  query?: string;
  category?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  availability?: string;
  serviceType?: string[];
  dateRange?: { start: Date; end: Date };
  sortBy?: 'relevance' | 'price' | 'rating' | 'date';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T = any> {
  data: T[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useSearch<T = any>(
  table: string,
  filters: SearchFilters = {},
  enabled: boolean = true
): SearchResult<T> & {
  setFilters: (filters: SearchFilters) => void;
  clearFilters: () => void;
  refetch: () => void;
} {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>(filters);

  const searchQuery = useMemo(() => {
    let query = supabase.from(table).select('*', { count: 'exact' });

    // Text search
    if (currentFilters.query) {
      const searchTerm = `%${currentFilters.query}%`;
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},name.ilike.${searchTerm}`);
    }

    // Category filter
    if (currentFilters.category) {
      query = query.eq('category', currentFilters.category);
    }

    // Location filter
    if (currentFilters.location) {
      query = query.ilike('location', `%${currentFilters.location}%`);
    }

    // Price range
    if (currentFilters.priceMin !== undefined) {
      query = query.gte('price', currentFilters.priceMin);
    }
    if (currentFilters.priceMax !== undefined) {
      query = query.lte('price', currentFilters.priceMax);
    }

    // Rating filter
    if (currentFilters.rating) {
      query = query.gte('rating', currentFilters.rating);
    }

    // Service types
    if (currentFilters.serviceType?.length) {
      query = query.in('service_type', currentFilters.serviceType);
    }

    // Date range
    if (currentFilters.dateRange) {
      query = query.gte('created_at', currentFilters.dateRange.start.toISOString())
                  .lte('created_at', currentFilters.dateRange.end.toISOString());
    }

    // Sorting
    const sortField = currentFilters.sortBy === 'relevance' ? 'created_at' : currentFilters.sortBy || 'created_at';
    const ascending = currentFilters.sortOrder === 'asc';
    query = query.order(sortField, { ascending });

    return query;
  }, [table, currentFilters]);

  const fetchData = async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data: results, count, error: queryError } = await searchQuery;
      
      if (queryError) throw queryError;
      
      setData(results || []);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, enabled]);

  return {
    data,
    total,
    loading,
    error,
    setFilters: setCurrentFilters,
    clearFilters: () => setCurrentFilters({}),
    refetch: fetchData
  };
}