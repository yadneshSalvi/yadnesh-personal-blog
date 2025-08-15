export interface SearchablePost {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string; // stripped of MDX syntax
  tags: string[];
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  readingTime: number;
  url: string;
}

export interface SearchResult {
  item: SearchablePost;
  score?: number;
  matches?: Array<{
    indices: number[][];
    value: string;
    key: string;
  }>;
}

export interface SearchOptions {
  query: string;
  limit?: number;
  tags?: string[];
  sortBy?: 'relevance' | 'date' | 'title';
  dateRange?: {
    from?: string;
    to?: string;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  suggestions?: string[];
  hasMore: boolean;
  executionTime: number;
}

export interface SearchIndex {
  posts: SearchablePost[];
  lastUpdated: string;
  version: string;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'tag' | 'title';
  count?: number;
}

export interface SearchAnalytics {
  query: string;
  resultCount: number;
  timestamp: string;
  userAgent?: string;
}
