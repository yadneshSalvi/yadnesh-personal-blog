import { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchResponse, SearchOptions, SearchablePost } from '@/lib/search/types';
import { searchCache } from '@/lib/search/cache';
import { searchAnalytics } from '@/lib/search/analytics';

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  autoSearch?: boolean;
}

interface UseSearchReturn {
  searchResults: SearchResponse | null;
  isLoading: boolean;
  error: string | null;
  search: (query: string, options?: Partial<SearchOptions>) => Promise<void>;
  clearResults: () => void;
  suggestions: string[];
  isLoadingSuggestions: boolean;
  getSuggestions: (query: string) => Promise<void>;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceMs = 300,
    minQueryLength = 2,
  } = options;

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  // Debounced search function
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;

    return (query: string, searchOptions?: Partial<SearchOptions>) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        if (query.length < minQueryLength) {
          setSearchResults(null);
          setError(null);
          return;
        }

        if (query === lastQuery) {
          return; // Avoid duplicate searches
        }

        setIsLoading(true);
        setError(null);
        setLastQuery(query);

        try {
          // Check cache first
          const cachedResult = searchCache.get(query, searchOptions);
          
          if (cachedResult) {
            setSearchResults(cachedResult);
            setIsLoading(false);
            
            // Track analytics for cached results too
            searchAnalytics.track(query, cachedResult.total);
            return;
          }
          const searchParams = new URLSearchParams({
            q: query,
            limit: String(searchOptions?.limit || 10),
            sortBy: searchOptions?.sortBy || 'relevance',
          });

          if (searchOptions?.tags?.length) {
            searchParams.set('tags', searchOptions.tags.join(','));
          }

          if (searchOptions?.dateRange?.from) {
            searchParams.set('from', searchOptions.dateRange.from);
          }

          if (searchOptions?.dateRange?.to) {
            searchParams.set('to', searchOptions.dateRange.to);
          }

          const response = await fetch(`/api/search?${searchParams}`);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Search failed');
          }

          const results: SearchResponse = await response.json();
          
          // Cache the results
          searchCache.set(query, results, searchOptions);
          
          // Track analytics
          searchAnalytics.track(query, results.total);
          
          setSearchResults(results);
        } catch (err) {
          console.error('Search error:', err);
          setError(err instanceof Error ? err.message : 'Search failed');
          setSearchResults(null);
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    };
  }, [debounceMs, minQueryLength, lastQuery]);

  // Search function for manual triggering
  const search = useCallback(async (query: string, searchOptions?: Partial<SearchOptions>) => {
    debouncedSearch(query, searchOptions);
  }, [debouncedSearch]);

  // Get autocomplete suggestions
  const getSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      const response = await fetch(`/api/search?action=autocomplete&q=${encodeURIComponent(query)}&limit=5`);
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Autocomplete error:', err);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setSearchResults(null);
    setError(null);
    setSuggestions([]);
    setLastQuery('');
  }, []);

  return {
    searchResults,
    isLoading,
    error,
    search,
    clearResults,
    suggestions,
    isLoadingSuggestions,
    getSuggestions,
  };
}

// Hook for getting popular tags
export function usePopularTags() {
  const [tags, setTags] = useState<Array<{ tag: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/search?action=popular-tags&limit=10');
        
        if (response.ok) {
          const data = await response.json();
          setTags(data.tags || []);
        } else {
          throw new Error('Failed to fetch tags');
        }
      } catch (err) {
        console.error('Error fetching popular tags:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tags');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  return { tags, isLoading, error };
}

// Hook for getting recent posts
export function useRecentPosts(limit: number = 5) {
  const [posts, setPosts] = useState<SearchablePost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentPosts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/search?action=recent&limit=${limit}`);
        
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        } else {
          throw new Error('Failed to fetch recent posts');
        }
      } catch (err) {
        console.error('Error fetching recent posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch recent posts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentPosts();
  }, [limit]);

  return { posts, isLoading, error };
}
