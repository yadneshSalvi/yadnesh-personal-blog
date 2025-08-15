import Fuse from 'fuse.js';
import type { IFuseOptions } from 'fuse.js';
import { SearchablePost, SearchResult, SearchOptions, SearchResponse } from './types';

/**
 * Fuse.js configuration for fuzzy search
 */
const fuseOptions: IFuseOptions<SearchablePost> = {
  // Search keys with weights (higher weight = more important)
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'subtitle', weight: 0.3 },
    { name: 'tags', weight: 0.2 },
    { name: 'excerpt', weight: 0.1 },
    { name: 'content', weight: 0.05 },
  ],
  
  // Search options
  includeScore: true,
  includeMatches: true,
  
  // Fuzzy search settings
  threshold: 0.4, // 0.0 = exact match, 1.0 = match anything
  distance: 100, // Maximum distance for fuzzy matching
  minMatchCharLength: 2, // Minimum character length for matching
  
  // Result settings
  findAllMatches: true,
  ignoreLocation: true, // Don't consider position of match in string
  useExtendedSearch: true, // Enable extended search syntax
};

/**
 * Creates a new Fuse instance with the given posts
 */
export function createSearchEngine(posts: SearchablePost[]): Fuse<SearchablePost> {
  return new Fuse(posts, fuseOptions);
}

/**
 * Performs fuzzy search with advanced options
 */
export function performSearch(
  fuse: Fuse<SearchablePost>,
  options: SearchOptions
): SearchResponse {
  const startTime = Date.now();
  const { query, limit = 10, tags, sortBy = 'relevance', dateRange } = options;

  // Prepare search query
  const searchQuery = query.trim();
  
  // Handle empty query
  if (!searchQuery) {
    return {
      results: [],
      total: 0,
      query: searchQuery,
      suggestions: [],
      hasMore: false,
      executionTime: Date.now() - startTime,
    };
  }

  // Perform the search
  const fuseResults = fuse.search(searchQuery, { limit: limit * 2 }); // Get more results for filtering

  // Convert Fuse results to our SearchResult format
  let results: SearchResult[] = fuseResults.map(fr => ({
    item: fr.item,
    score: fr.score,
    matches: fr.matches
      ? fr.matches.map(m => ({
          indices: m.indices.map(([start, end]) => [start, end]),
          value: m.value ?? '',
          key: m.key ?? '',
        }))
      : undefined,
  }));

  // Apply tag filtering
  if (tags && tags.length > 0) {
    results = results.filter(result => 
      tags.some(tag => 
        result.item.tags.some(postTag => 
          postTag.toLowerCase().includes(tag.toLowerCase())
        )
      )
    );
  }

  // Apply date range filtering
  if (dateRange) {
    results = results.filter(result => {
      const postDate = new Date(result.item.createdAt);
      const fromDate = dateRange.from ? new Date(dateRange.from) : null;
      const toDate = dateRange.to ? new Date(dateRange.to) : null;

      if (fromDate && postDate < fromDate) return false;
      if (toDate && postDate > toDate) return false;
      return true;
    });
  }

  // Apply sorting
  if (sortBy === 'date') {
    results.sort((a, b) => 
      new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime()
    );
  } else if (sortBy === 'title') {
    results.sort((a, b) => a.item.title.localeCompare(b.item.title));
  }
  // 'relevance' sorting is already done by Fuse.js

  const total = results.length;
  const paginatedResults = results.slice(0, limit);
  const hasMore = total > limit;

  // Generate suggestions for better search experience
  const suggestions = generateSearchSuggestions(searchQuery, results);

  return {
    results: paginatedResults,
    total,
    query: searchQuery,
    suggestions,
    hasMore,
    executionTime: Date.now() - startTime,
  };
}

/**
 * Generates search suggestions based on query and results
 */
function generateSearchSuggestions(query: string, results: SearchResult[]): string[] {
  const suggestions: string[] = [];
  
  // If no results, suggest similar terms
  if (results.length === 0) {
    // Common typo corrections
    const typoCorrections = getTypoCorrections(query);
    suggestions.push(...typoCorrections);
  }

  // Suggest popular tags from results
  if (results.length > 0) {
    const tagFrequency = new Map<string, number>();
    
    results.forEach(result => {
      result.item.tags.forEach(tag => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    });

    const popularTags = Array.from(tagFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);

    suggestions.push(...popularTags);
  }

  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

/**
 * Simple typo correction suggestions
 */
function getTypoCorrections(query: string): string[] {
  const corrections: string[] = [];
  
  // Common programming/tech term corrections
  const commonCorrections: Record<string, string> = {
    'reactjs': 'react',
    'nodejs': 'node',
    'javascript': 'js',
    'typescript': 'ts',
    'nextjs': 'next',
    'tailwindcss': 'tailwind',
    'ai': 'artificial intelligence',
    'ml': 'machine learning',
    'api': 'application programming interface',
  };

  const lowerQuery = query.toLowerCase();
  
  // Check for exact matches in corrections
  if (commonCorrections[lowerQuery]) {
    corrections.push(commonCorrections[lowerQuery]);
  }

  // Check for partial matches
  Object.entries(commonCorrections).forEach(([key, value]) => {
    if (key.includes(lowerQuery) || lowerQuery.includes(key)) {
      corrections.push(value);
    }
  });

  return corrections;
}

/**
 * Highlights search terms in text
 */
export function highlightSearchTerms(text: string, searchTerms: string[]): string {
  if (!searchTerms.length) return text;

  let highlightedText = text;
  
  searchTerms.forEach(term => {
    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    highlightedText = highlightedText.replace(
      regex, 
      '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>'
    );
  });

  return highlightedText;
}

/**
 * Escapes special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts search terms from a query
 */
export function extractSearchTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 1)
    .map(term => term.replace(/[^\w]/g, ''))
    .filter(Boolean);
}

/**
 * Gets autocomplete suggestions based on partial query
 */
export function getAutocompleteSuggestions(
  posts: SearchablePost[],
  partialQuery: string,
  limit: number = 5
): string[] {
  if (partialQuery.length < 2) return [];

  const suggestions = new Set<string>();
  const lowerQuery = partialQuery.toLowerCase();

  // Collect suggestions from titles, tags, and content
  posts.forEach(post => {
    // Title suggestions
    if (post.title.toLowerCase().includes(lowerQuery)) {
      suggestions.add(post.title);
    }

    // Tag suggestions
    post.tags.forEach(tag => {
      if (tag.toLowerCase().includes(lowerQuery)) {
        suggestions.add(tag);
      }
    });

    // Content word suggestions
    const words = post.content.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3 && word.startsWith(lowerQuery)) {
        suggestions.add(word);
      }
    });
  });

  return Array.from(suggestions).slice(0, limit);
}
