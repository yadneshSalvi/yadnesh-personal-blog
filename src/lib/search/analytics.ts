import { SearchAnalytics } from './types';

class SearchAnalyticsTracker {
  private analytics: SearchAnalytics[] = [];
  private maxEntries = 1000;

  /**
   * Track a search query
   */
  track(query: string, resultCount: number, userAgent?: string): void {
    if (typeof window === 'undefined') return;

    const entry: SearchAnalytics = {
      query: query.toLowerCase().trim(),
      resultCount,
      timestamp: new Date().toISOString(),
      userAgent: userAgent || navigator.userAgent,
    };

    this.analytics.push(entry);

    // Keep only the most recent entries
    if (this.analytics.length > this.maxEntries) {
      this.analytics = this.analytics.slice(-this.maxEntries);
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('search-analytics', JSON.stringify(this.analytics.slice(-100))); // Store last 100
    } catch (error) {
      console.warn('Failed to store search analytics:', error);
    }
  }

  /**
   * Get popular search terms
   */
  getPopularTerms(limit: number = 10): Array<{ term: string; count: number }> {
    const termCounts = new Map<string, number>();

    this.analytics.forEach(({ query }) => {
      if (query.length > 1) { // Ignore very short queries
        termCounts.set(query, (termCounts.get(query) || 0) + 1);
      }
    });

    return Array.from(termCounts.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get queries with no results
   */
  getNoResultQueries(limit: number = 10): Array<{ query: string; count: number }> {
    const noResultCounts = new Map<string, number>();

    this.analytics
      .filter(({ resultCount }) => resultCount === 0)
      .forEach(({ query }) => {
        if (query.length > 1) {
          noResultCounts.set(query, (noResultCounts.get(query) || 0) + 1);
        }
      });

    return Array.from(noResultCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get search statistics
   */
  getStats(): {
    totalSearches: number;
    uniqueQueries: number;
    averageResultCount: number;
    noResultRate: number;
    popularTerms: Array<{ term: string; count: number }>;
    noResultQueries: Array<{ query: string; count: number }>;
  } {
    const totalSearches = this.analytics.length;
    const uniqueQueries = new Set(this.analytics.map(a => a.query)).size;
    const totalResults = this.analytics.reduce((sum, a) => sum + a.resultCount, 0);
    const noResultSearches = this.analytics.filter(a => a.resultCount === 0).length;

    return {
      totalSearches,
      uniqueQueries,
      averageResultCount: totalSearches > 0 ? totalResults / totalSearches : 0,
      noResultRate: totalSearches > 0 ? noResultSearches / totalSearches : 0,
      popularTerms: this.getPopularTerms(5),
      noResultQueries: this.getNoResultQueries(5),
    };
  }

  /**
   * Load analytics from localStorage
   */
  loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('search-analytics');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.analytics = parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load search analytics:', error);
    }
  }

  /**
   * Clear all analytics data
   */
  clear(): void {
    this.analytics = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('search-analytics');
    }
  }
}

// Create singleton instance
export const searchAnalytics = new SearchAnalyticsTracker();

// Load existing data on initialization
if (typeof window !== 'undefined') {
  searchAnalytics.loadFromStorage();
}

export default searchAnalytics;
