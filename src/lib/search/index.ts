import Fuse from 'fuse.js';
import { SearchablePost, SearchOptions, SearchResponse, SearchIndex } from './types';
import { createSearchEngine, performSearch, getAutocompleteSuggestions } from './fuzzy';
import { loadSearchIndex, generateSearchIndex } from './indexer';

let searchEngine: Fuse<SearchablePost> | null = null;
let searchIndex: SearchIndex | null = null;
let lastIndexLoad: number = 0;

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Initializes the search engine with the latest index
 */
async function initializeSearchEngine(): Promise<Fuse<SearchablePost>> {
  const now = Date.now();
  
  // Return cached engine if still valid
  if (searchEngine && searchIndex && (now - lastIndexLoad) < CACHE_DURATION) {
    return searchEngine;
  }

  try {
    // Try to load existing index
    let index = loadSearchIndex();
    
    // If no index exists or it's too old, generate a new one
    if (!index) {
      console.log('No search index found, generating new one...');
      index = generateSearchIndex();
    }

    // Update cache
    searchIndex = index;
    searchEngine = createSearchEngine(index.posts);
    lastIndexLoad = now;

    console.log(`Search engine initialized with ${index.posts.length} posts`);
    return searchEngine;
  } catch (error) {
    console.error('Failed to initialize search engine:', error);
    throw new Error('Search service unavailable');
  }
}

/**
 * Performs a search with the given options
 */
export async function search(options: SearchOptions): Promise<SearchResponse> {
  try {
    const fuse = await initializeSearchEngine();
    return performSearch(fuse, options);
  } catch (error) {
    console.error('Search error:', error);
    return {
      results: [],
      total: 0,
      query: options.query,
      suggestions: [],
      hasMore: false,
      executionTime: 0,
    };
  }
}

/**
 * Gets autocomplete suggestions for a partial query
 */
export async function getAutocomplete(
  partialQuery: string,
  limit: number = 5
): Promise<string[]> {
  try {
    await initializeSearchEngine();
    
    if (!searchIndex) {
      return [];
    }

    return getAutocompleteSuggestions(searchIndex.posts, partialQuery, limit);
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
}

/**
 * Gets all available tags from the search index
 */
export async function getAllTags(): Promise<string[]> {
  try {
    await initializeSearchEngine();
    
    if (!searchIndex) {
      return [];
    }

    const tagSet = new Set<string>();
    searchIndex.posts.forEach(post => {
      post.tags.forEach(tag => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  } catch (error) {
    console.error('Error getting tags:', error);
    return [];
  }
}

/**
 * Gets search statistics
 */
export async function getSearchStats(): Promise<{
  totalPosts: number;
  totalTags: number;
  lastUpdated: string;
  averageWordCount: number;
  averageReadingTime: number;
}> {
  try {
    await initializeSearchEngine();
    
    if (!searchIndex) {
      return {
        totalPosts: 0,
        totalTags: 0,
        lastUpdated: new Date().toISOString(),
        averageWordCount: 0,
        averageReadingTime: 0,
      };
    }

    const posts = searchIndex.posts;
    const allTags = await getAllTags();
    
    const totalWordCount = posts.reduce((sum, post) => sum + post.wordCount, 0);
    const totalReadingTime = posts.reduce((sum, post) => sum + post.readingTime, 0);

    return {
      totalPosts: posts.length,
      totalTags: allTags.length,
      lastUpdated: searchIndex.lastUpdated,
      averageWordCount: posts.length > 0 ? Math.round(totalWordCount / posts.length) : 0,
      averageReadingTime: posts.length > 0 ? Math.round(totalReadingTime / posts.length) : 0,
    };
  } catch (error) {
    console.error('Error getting search stats:', error);
    return {
      totalPosts: 0,
      totalTags: 0,
      lastUpdated: new Date().toISOString(),
      averageWordCount: 0,
      averageReadingTime: 0,
    };
  }
}

/**
 * Forces a refresh of the search index
 */
export async function refreshSearchIndex(): Promise<void> {
  try {
    console.log('Refreshing search index...');
    const newIndex = generateSearchIndex();
    
    searchIndex = newIndex;
    searchEngine = createSearchEngine(newIndex.posts);
    lastIndexLoad = Date.now();
    
    console.log('Search index refreshed successfully');
  } catch (error) {
    console.error('Error refreshing search index:', error);
    throw error;
  }
}

/**
 * Gets recent posts for fallback when search returns no results
 */
export async function getRecentPosts(limit: number = 5): Promise<SearchablePost[]> {
  try {
    await initializeSearchEngine();
    
    if (!searchIndex) {
      return [];
    }

    return searchIndex.posts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recent posts:', error);
    return [];
  }
}

/**
 * Gets popular tags based on usage frequency
 */
export async function getPopularTags(limit: number = 10): Promise<Array<{ tag: string; count: number }>> {
  try {
    await initializeSearchEngine();
    
    if (!searchIndex) {
      return [];
    }

    const tagFrequency = new Map<string, number>();
    
    searchIndex.posts.forEach(post => {
      post.tags.forEach(tag => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagFrequency.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting popular tags:', error);
    return [];
  }
}

// Export types for use in other modules
export type { SearchablePost, SearchOptions, SearchResponse, SearchIndex } from './types';
