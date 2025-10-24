import { SearchFilters } from '@/hooks/useSearch';

export interface SearchSuggestion {
  text: string;
  category: string;
  count?: number;
}

export class SearchUtils {
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  static highlightText(text: string, query: string): string {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  }

  static generateSuggestions(
    recentSearches: string[] = [],
    popularTerms: string[] = [],
    query: string = ''
  ): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    
    // Add recent searches
    recentSearches
      .filter(term => term.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .forEach(term => {
        suggestions.push({ text: term, category: 'recent' });
      });

    // Add popular terms
    popularTerms
      .filter(term => 
        term.toLowerCase().includes(query.toLowerCase()) && 
        !recentSearches.includes(term)
      )
      .slice(0, 5)
      .forEach(term => {
        suggestions.push({ text: term, category: 'popular' });
      });

    return suggestions;
  }

  static buildSearchUrl(filters: SearchFilters, baseUrl: string = '/search'): string {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(','));
          }
        } else if (typeof value === 'object' && value.start && value.end) {
          // Date range
          params.set(`${key}Start`, value.start.toISOString());
          params.set(`${key}End`, value.end.toISOString());
        } else {
          params.set(key, value.toString());
        }
      }
    });

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  static parseSearchUrl(searchParams: URLSearchParams): SearchFilters {
    const filters: SearchFilters = {};

    // Basic filters
    const query = searchParams.get('query');
    if (query) filters.query = query;

    const category = searchParams.get('category');
    if (category) filters.category = category;

    const location = searchParams.get('location');
    if (location) filters.location = location;

    // Numeric filters
    const priceMin = searchParams.get('priceMin');
    if (priceMin) filters.priceMin = Number(priceMin);

    const priceMax = searchParams.get('priceMax');
    if (priceMax) filters.priceMax = Number(priceMax);

    const rating = searchParams.get('rating');
    if (rating) filters.rating = Number(rating);

    // Array filters
    const serviceType = searchParams.get('serviceType');
    if (serviceType) filters.serviceType = serviceType.split(',');

    // Date range
    const dateRangeStart = searchParams.get('dateRangeStart');
    const dateRangeEnd = searchParams.get('dateRangeEnd');
    if (dateRangeStart && dateRangeEnd) {
      filters.dateRange = {
        start: new Date(dateRangeStart),
        end: new Date(dateRangeEnd)
      };
    }

    // Sort options
    const sortBy = searchParams.get('sortBy') as SearchFilters['sortBy'];
    if (sortBy) filters.sortBy = sortBy;

    const sortOrder = searchParams.get('sortOrder') as SearchFilters['sortOrder'];
    if (sortOrder) filters.sortOrder = sortOrder;

    return filters;
  }

  static formatResultsCount(count: number): string {
    if (count === 0) return 'No results';
    if (count === 1) return '1 result';
    if (count < 1000) return `${count} results`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K results`;
    return `${(count / 1000000).toFixed(1)}M results`;
  }

  static saveRecentSearch(query: string, maxRecent: number = 10): void {
    if (!query.trim()) return;

    const key = 'recentSearches';
    const existing = JSON.parse(localStorage.getItem(key) || '[]') as string[];
    
    // Remove if already exists
    const filtered = existing.filter(term => term !== query);
    
    // Add to beginning
    const updated = [query, ...filtered].slice(0, maxRecent);
    
    localStorage.setItem(key, JSON.stringify(updated));
  }

  static getRecentSearches(): string[] {
    try {
      return JSON.parse(localStorage.getItem('recentSearches') || '[]');
    } catch {
      return [];
    }
  }

  static clearRecentSearches(): void {
    localStorage.removeItem('recentSearches');
  }
}

export default SearchUtils;