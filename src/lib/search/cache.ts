import { SearchResponse } from './types';

interface CacheEntry {
  data: SearchResponse;
  timestamp: number;
  expiresAt: number;
}

class SearchCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 50; // Maximum number of cached entries
  private defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Creates a cache key from search parameters
   */
  private createKey(query: string, options?: any): string {
    const normalizedQuery = query.toLowerCase().trim();
    const optionsStr = options ? JSON.stringify(options) : '';
    return `${normalizedQuery}:${optionsStr}`;
  }

  /**
   * Gets cached search results
   */
  get(query: string, options?: any): SearchResponse | null {
    const key = this.createKey(query, options);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Sets cached search results
   */
  set(query: string, data: SearchResponse, options?: any, ttl?: number): void {
    const key = this.createKey(query, options);
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    // If cache is at max size, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });
  }

  /**
   * Clears all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Removes expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Gets cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; expiresIn: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      expiresIn: entry.expiresAt - now,
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses for this
      entries,
    };
  }
}

// Create singleton instance
export const searchCache = new SearchCache();

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    searchCache.cleanup();
  }, 5 * 60 * 1000);
}

export default searchCache;
